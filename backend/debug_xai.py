import joblib
import os
import numpy as np
from app.db import contracts_collection, client
from train_classifier import clean_text

async def debug_xai():
    MODELS_DIR = "models"
    vectorizer = joblib.load(os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl"))
    le = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
    
    # Load LinearSVC (good for coefficients)
    clf = joblib.load(os.path.join(MODELS_DIR, "linearsvc.pkl"))
    print(f"Loaded classifier: {type(clf)}")
    
    contract = await contracts_collection.find_one({"title": "XAI Influence Test Contract"})
    if not contract:
        print("Contract not found.")
        return
        
    text = contract.get("contract_text")
    cleaned = clean_text(text)
    features = vectorizer.transform([cleaned])
    
    target_clf = clf
    if hasattr(target_clf, "calibrated_classifiers_"):
        target_clf = target_clf.calibrated_classifiers_[0].estimator
    
    if hasattr(target_clf, "coef_"):
        print("Model has coefficients.")
        pred_enc = clf.predict(features)[0]
        # Find index of pred_enc in target_clf.classes_
        class_idx = np.where(clf.classes_ == pred_enc)[0][0]
        coeffs = target_clf.coef_[class_idx]
        
        tfidf_scores = features.toarray()[0]
        influence = coeffs * tfidf_scores
        
        feature_names = vectorizer.get_feature_names_out()
        
        # Print some feature names to see the format
        print(f"Sample feature names: {list(feature_names[:5])}")
        
        word_influence = []
        for i, name in enumerate(feature_names):
            # The name usually looks like 'word_vectorizer__word' or similar
            if 'word_vectorizer__' in name:
                word = name.split('__')[-1]
                if influence[i] > 0:
                    word_influence.append((word, float(influence[i])))
        
        word_influence = sorted(word_influence, key=lambda x: x[1], reverse=True)[:10]
        print(f"Top 10 word influences: {word_influence}")
    else:
        print("Model does NOT have coefficients.")

    client.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(debug_xai())
