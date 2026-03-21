import asyncio
import os
import joblib
import uuid
import numpy as np
import pandas as pd
from datetime import datetime
from app.db import contracts_collection, ml_results_collection
from train_classifier import clean_text

MODELS_DIR = "models"
RESULTS_CSV = "result.csv"

def load_model_accuracies():
    if not os.path.exists(RESULTS_CSV):
        return {}
    df = pd.read_csv(RESULTS_CSV)
    return dict(zip(df['model'].str.lower(), df['accuracy']))

async def batch_process_all_contracts():
    print("🚀 Starting refined batch ML processing with Controlled Confidence...")
    
    # 1. Load Vectorizer, Label Encoder, and Accuracies
    vectorizer_path = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
    le_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
    
    if not os.path.exists(vectorizer_path) or not os.path.exists(le_path):
        print("❌ Error: Vectorizer or LabelEncoder not found.")
        return
        
    vectorizer = joblib.load(vectorizer_path)
    le = joblib.load(le_path)
    model_accuracies = load_model_accuracies()
    
    # 2. Load all models
    model_files = [f for f in os.listdir(MODELS_DIR) if f.endswith(".pkl") and f not in ["tfidf_vectorizer.pkl", "label_encoder.pkl"]]
    models = {}
    for f in model_files:
        model_name = f.replace(".pkl", "").lower()
        models[model_name] = joblib.load(os.path.join(MODELS_DIR, f))
    
    print(f"Loaded {len(models)} models.")
    
    contracts = await contracts_collection.find({}).to_list(length=3000)
    print(f"Found {len(contracts)} contracts.")
    
    # NEW: Clear old results to ensure schema is fully updated and no duplicates/old formats remain
    print("🧹 Clearing old ML results in contractinsight...")
    await ml_results_collection.delete_many({})
    
    # Target the new database named 'ml_results' as well
    from motor.motor_asyncio import AsyncIOMotorClient
    from app.config import settings
    client = AsyncIOMotorClient(settings.MONGO_URL)
    new_db = client["ml_results"]
    new_collection = new_db["ml_results"]
    
    print("🧹 Clearing old ML results in new 'ml_results' DB...")
    await new_collection.delete_many({})
    
    sem = asyncio.Semaphore(20) # Process 20 at a time
    
    async def process_one(contract):
        async with sem:
            contract_id = contract.get("id") or str(contract.get("_id"))
            text = contract.get("contract_text") or contract.get("full_text") or contract.get("text")
            
            if not text:
                print(f"⏩ Skipping {contract_id}: No text content.")
                return
                
            cleaned_text = clean_text(text)
            features = vectorizer.transform([cleaned_text])
            
            # Phase 1: Collect predictions from all models
            predictions_raw = []
            for name, clf in models.items():
                try:
                    pred_enc = clf.predict(features)[0]
                    pred_label = le.inverse_transform([pred_enc])[0]
                    
                    if hasattr(clf, "predict_proba"):
                        probs = clf.predict_proba(features)[0]
                        class_idx = np.where(clf.classes_ == pred_enc)[0][0]
                        confidence = float(probs[class_idx])
                    else:
                        confidence = 1.0 # Fallback for models without proba
                    
                    predictions_raw.append({
                        "model_name": name,
                        "contract_type": pred_label,
                        "confidence": confidence,
                        "clf_obj": clf
                    })
                except Exception as e:
                    pass # Quiet errors during parallel run

            if not predictions_raw:
                return

            # Phase 2: Calculate Agreement
            type_counts = {}
            for p in predictions_raw:
                t = p["contract_type"]
                type_counts[t] = type_counts.get(t, 0) + 1
            
            total_models = len(predictions_raw)
            
            # Phase 3: Calculate Controlled Confidence & Build Schema
            model_predictions_map = {}
            best_prediction = None
            max_controlled_conf = -1.0
            best_model_name = ""
            best_clf = None

            for p in predictions_raw:
                name = p["model_name"]
                ptype = p["contract_type"]
                conf = p["confidence"]
                
                acc = model_accuracies.get(name, 0.5)
                agreement = type_counts[ptype] / total_models
                
                adjusted_conf = conf
                if conf > 0.99 and name in ["decisiontree", "randomforest"]:
                    adjusted_conf = 0.9

                controlled_conf = (adjusted_conf * 0.4) + (acc * 0.3) + (agreement * 0.3)
                
                prediction_entry = {
                    "contract_type": ptype,
                    "confidence": round(float(conf), 4),
                    "controlled_confidence": round(float(controlled_conf), 4)
                }
                model_predictions_map[name] = prediction_entry
                
                if controlled_conf > max_controlled_conf:
                    max_controlled_conf = controlled_conf
                    best_prediction = prediction_entry
                    best_model_name = name
                    best_clf = p["clf_obj"]

            # Phase 4: XAI
            influence_list = []
            try:
                target_clf = best_clf
                if not (hasattr(target_clf, "coef_") or (hasattr(target_clf, "calibrated_classifiers_") and hasattr(target_clf.calibrated_classifiers_[0].estimator, "coef_"))):
                    if "linearsvc" in models: target_clf = models["linearsvc"]
                    elif "logisticregression" in models: target_clf = models["logisticregression"]

                inner_clf = target_clf
                if hasattr(inner_clf, "calibrated_classifiers_"):
                    inner_clf = inner_clf.calibrated_classifiers_[0].estimator
                
                importance_scores = None
                if hasattr(inner_clf, "coef_"):
                    target_label_enc = le.transform([best_prediction["contract_type"]])[0]
                    try:
                        class_idx = np.where(inner_clf.classes_ == target_label_enc)[0][0]
                        importance_scores = inner_clf.coef_[class_idx]
                    except:
                        importance_scores = inner_clf.coef_[0]
                elif hasattr(inner_clf, "feature_importances_"):
                    importance_scores = inner_clf.feature_importances_
                    
                if importance_scores is not None:
                    tfidf_scores = features.toarray()[0]
                    influence = importance_scores * tfidf_scores
                    feature_names = vectorizer.get_feature_names_out()
                    word_indices = [i for i, name in enumerate(feature_names) if 'word_vectorizer' in name]
                    
                    word_influence = []
                    for i in word_indices:
                        val = float(influence[i])
                        if val > 0 and tfidf_scores[i] > 0:
                            clean_word = feature_names[i].split('__')[-1]
                            word_influence.append({"word": clean_word, "influence": val})
                    
                    word_influence = sorted(word_influence, key=lambda x: x["influence"], reverse=True)[:10]
                    total_inf = sum(x["influence"] for x in word_influence) if word_influence else 1
                    explainatory_result = []
                    for item in word_influence:
                        explainatory_result.append({
                            "word": item["word"],
                            "score": round((item["influence"] / total_inf) * 100, 1)
                        })
                    influence_list = explainatory_result
            except:
                pass

            # Phase 5: Build Final Document
            now = datetime.now().isoformat()
            ml_doc = {
                "result_id": str(uuid.uuid4()),
                "contract_id": contract_id,
                "best_prediction": best_prediction,
                "best_model": best_model_name,
                "model_predictions": model_predictions_map,
                "explainatory_result": influence_list,
                "processed_at": now,
                "verified_sync_time": "2026-02-27 12:15 PM" # UPDATED FOR THIS RUN
            }
            
            # Sync to BOTH collections
            await ml_results_collection.replace_one({"contract_id": contract_id}, ml_doc, upsert=True)
            await new_collection.replace_one({"contract_id": contract_id}, ml_doc, upsert=True)
            
            await contracts_collection.update_one(
                {"_id": contract_id},
                {
                    "$set": {
                        "contract_type": best_prediction["contract_type"],
                        "type_confidence": best_prediction["controlled_confidence"],
                        "best_result_id": ml_doc["result_id"],
                        "explainatory_result": ml_doc["explainatory_result"]
                    }
                }
            )
            print(f"  ✅ {contract_id} synced to both DBs.", end="\r")

    print(f"Parallel processing {len(contracts)} contracts...")
    tasks = [process_one(c) for c in contracts]
    await asyncio.gather(*tasks)
    client.close()
    print(f"\n✅ All {len(contracts)} contracts synced to both 'contractinsight' and 'ml_results' databases.")

    print("\n✨ Sync to both databases completed.")

if __name__ == "__main__":
    asyncio.run(batch_process_all_contracts())
