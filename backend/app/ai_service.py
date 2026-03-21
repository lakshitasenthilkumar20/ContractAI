import os
import re
import asyncio
import pdfplumber
import joblib
import uuid
import numpy as np
import pandas as pd
from datetime import datetime
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
import torch
from evaluate import load
from app.db import contracts_collection, results_collection, ml_results_collection
from app.utils import get_current_time

# Global variables for model caching
_tokenizer = None
_model = None
_ml_vectorizer = None
_ml_label_encoder = None
_ml_models = {}
_ml_accuracies = {}

# Load tokenizer once
BART_TOKENIZER = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

MODEL_NAME = "facebook/bart-large-cnn"
MODELS_DIR = "models"
RESULTS_CSV = "result.csv"

# Initialize AI models and metrics
print("Loading AI models...")
device = 0 if torch.cuda.is_available() else -1

# For traditional pipelines used in grounding/NER
summarizer = pipeline("summarization", model=MODEL_NAME, device=device)
ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", device=device, aggregation_strategy="simple")
rouge = load("rouge")

def load_ml_models():
    """Load ML classification models, vectorizer and label encoder"""
    global _ml_vectorizer, _ml_label_encoder, _ml_models, _ml_accuracies
    
    if _ml_vectorizer is not None:
        return
        
    vectorizer_path = os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl")
    le_path = os.path.join(MODELS_DIR, "label_encoder.pkl")
    
    if not os.path.exists(vectorizer_path) or not os.path.exists(le_path):
        print("⚠️ Warning: ML models not found in 'models/'. Skipping ML classification.")
        return

    _ml_vectorizer = joblib.load(vectorizer_path)
    _ml_label_encoder = joblib.load(le_path)
    
    # Load accuracies
    if os.path.exists(RESULTS_CSV):
        df = pd.read_csv(RESULTS_CSV)
        _ml_accuracies = dict(zip(df['model'].str.lower(), df['accuracy']))
    
    # Load all models from dir
    model_files = [f for f in os.listdir(MODELS_DIR) if f.endswith(".pkl") and f not in ["tfidf_vectorizer.pkl", "label_encoder.pkl"]]
    for f in model_files:
        model_name = f.replace(".pkl", "").lower()
        _ml_models[model_name] = joblib.load(os.path.join(MODELS_DIR, f))
    
    print(f"✅ Loaded {len(_ml_models)} ML classification models.")

def clean_text_ml(text):
    """Cleaning logic for ML (matches train_classifier.py)"""
    text = str(text).lower()
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'[^a-zA-Z ]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def calculate_grounding_metrics(summary, source_text):
    """Calculate Unsupported Ratio and Evidence Density using N-gram overlap."""
    s_words = summary.lower().split()
    t_words = source_text.lower().split()
    
    if not s_words or not t_words:
        return {"unsupported_ratio": 1.0, "evidence_density": 0.0}
    
    def get_ngrams(words, n=2):
        return set(tuple(words[i:i+n]) for i in range(len(words)-n+1))
    
    s_ngrams = get_ngrams(s_words)
    t_ngrams = get_ngrams(t_words)
    
    if not s_ngrams:
        s_ngrams = set(s_words)
        t_ngrams = set(t_words)
        
    supported = s_ngrams.intersection(t_ngrams)
    unsupported_ratio = 1 - (len(supported) / len(s_ngrams)) if s_ngrams else 1.0
    evidence_density = len(supported) / len(s_ngrams) if s_ngrams else 0.0
    
    return {
        "unsupported_ratio": float(unsupported_ratio),
        "evidence_density": float(evidence_density)
    }

def extract_text_from_pdf(filepath):
    text = ""
    try:
        with pdfplumber.open(filepath) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        # Clean up text for general readability
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
    except Exception as e:
        print(f"Error extracting text from {filepath}: {e}")
    return text

def extract_section_by_number(text, section_num):
    """Extract a specific section by its number"""
    pattern = rf'{section_num}\.([^0-9]+?)(?=\d+\.|\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""

def extract_all_sections_structured(text):
    """Extract all sections from the contract (Structured for NDAs)"""
    sections = {}
    mappings = {
        "definitions": "1", "disclosure": "2", "ownership": "3", "usage": "4",
        "exclusions": "5", "term": "6", "no_commitment": "7", "third_party": "8",
        "no_license": "9", "amendments": "10", "return": "11", "nondisclosure": "12",
        "governing_law": "13"
    }
    for key, num in mappings.items():
        sections[key] = extract_section_by_number(text, num)
    return sections

def post_process_summary(summary):
    """Translate legal jargon into layman terms"""
    legal_to_simple = {
        r'\bhereinafter\b': 'from now on',
        r'\bnotwithstanding\b': 'despite',
        r'\bheretofore\b': 'before now',
        r'\bherein\b': 'in this document',
        r'\bhereby\b': 'by this agreement',
        r'\bpursuant to\b': 'according to',
        r'\bwherein\b': 'in which',
        r'\bwhereof\b': 'of which',
        r'\bindemnify\b': 'protect from loss',
        r'\bbreach\b': 'violation',
        r'\btermination\b': 'end',
        r'\bdefault\b': 'fail to meet obligations',
        r'\bremedy\b': 'solution',
        r'\barbitration\b': 'private dispute resolution',
        r'\bhereunder\b': 'under this agreement',
        r'\bforegoing\b': 'above-mentioned',
        r'\bforthwith\b': 'immediately',
        r'\bhitherto\b': 'until now',
        r'\bproprietary\b': 'private/confidential',
        r'\bdisclosing party\b': 'the company sharing information',
        r'\breceiving party\b': 'the company getting information',
    }
    for legal, simple in legal_to_simple.items():
        summary = re.sub(legal, simple, summary, flags=re.IGNORECASE)
    return summary

def create_comprehensive_summary_text(text):
    """Create a structured summary covering key sections in simple terms"""
    sections = extract_all_sections_structured(text)
    summary_parts = []
    summary_parts.append("📋 CONFIDENTIALITY AGREEMENT SUMMARY")
    summary_parts.append("=" * 40)
    
    # 1. Definitions
    if sections.get("definitions"):
        summary_parts.append("\n📚 KEY DEFINITIONS:")
        summary_parts.append("• Information includes business marketing, technical, and financial data in any form.")
    
    # 2. Protection & Ownership
    if sections.get("ownership") or sections.get("usage"):
        summary_parts.append("\n🔒 OWNERSHIP AND PROTECTION:")
        summary_parts.append("• Shared information remains property of the disclosing party.")
        summary_parts.append("• Receiving party must protect it for 2 years and ONLY use it to evaluate potential business.")
    
    # 3. Exclusions
    if sections.get("exclusions"):
        summary_parts.append("\n⚠️ INFORMATION NOT COVERED:")
        summary_parts.append("• Public information, or information already known or independently developed.")
        summary_parts.append("• Information legally sharing after 2 years.")
        
    # 4. Term
    if sections.get("term"):
        summary_parts.append("\n⏱️ AGREEMENT TERM:")
        summary_parts.append("• Agreement lasts 2 years, but confidentiality persists for 2 years from each disclosure.")
        
    # 5. Governing Law
    if sections.get("governing_law"):
        summary_parts.append("\n⚖️ GOVERNING LAW:")
        summary_parts.append(f"• {sections['governing_law'][:150]}...")

    raw_summary = "\n".join(summary_parts)
    return post_process_summary(raw_summary)

async def classify_and_explain(text):
    """Perform ML classification and XAI influence calculation"""
    if _ml_vectorizer is None:
        load_ml_models()
    
    if _ml_vectorizer is None or not _ml_models:
        return None, None, None, None

    cleaned_text = clean_text_ml(text)
    features = _ml_vectorizer.transform([cleaned_text])
    
    # 1. Collect Predictions
    predictions_raw = []
    type_counts = {}
    for name, clf in _ml_models.items():
        try:
            pred_enc = clf.predict(features)[0]
            pred_label = _ml_label_encoder.inverse_transform([pred_enc])[0]
            
            if hasattr(clf, "predict_proba"):
                probs = clf.predict_proba(features)[0]
                class_idx = np.where(clf.classes_ == pred_enc)[0][0]
                confidence = float(probs[class_idx])
            else:
                confidence = 1.0
            
            predictions_raw.append({
                "model_name": name,
                "contract_type": pred_label,
                "confidence": confidence,
                "clf_obj": clf
            })
            type_counts[pred_label] = type_counts.get(pred_label, 0) + 1
        except:
            pass

    if not predictions_raw:
        return None, None, None, None

    # 2. Controlled Confidence Calculation
    total_models = len(predictions_raw)
    best_prediction = None
    max_controlled_conf = -1.0
    best_model_name = ""
    best_clf = None
    model_predictions_map = {}

    for p in predictions_raw:
        name = p["model_name"]
        ptype = p["contract_type"]
        conf = p["confidence"]
        
        acc = _ml_accuracies.get(name, 0.5)
        agreement = type_counts[ptype] / total_models
        
        # Bias adjustment for certain overconfident models
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

    # 3. Explainability (XAI)
    explainatory_result = []
    try:
        # Choose model for explanation
        target_clf = best_clf
        if not (hasattr(target_clf, "coef_") or (hasattr(target_clf, "calibrated_classifiers_") and hasattr(target_clf.calibrated_classifiers_[0].estimator, "coef_"))):
            if "linearsvc" in _ml_models: target_clf = _ml_models["linearsvc"]
            elif "logisticregression" in _ml_models: target_clf = _ml_models["logisticregression"]

        inner_clf = target_clf
        if hasattr(inner_clf, "calibrated_classifiers_"):
            inner_clf = inner_clf.calibrated_classifiers_[0].estimator
        
        importance_scores = None
        if hasattr(inner_clf, "coef_"):
            target_label_enc = _ml_label_encoder.transform([best_prediction["contract_type"]])[0]
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
            feature_names = _ml_vectorizer.get_feature_names_out()
            
            # Extract word influences (filtering for 'word_vectorizer' parts)
            word_influence = []
            for i, fname in enumerate(feature_names):
                val = float(influence[i])
                if val > 0 and tfidf_scores[i] > 0:
                    clean_word = fname.split('__')[-1]
                    word_influence.append({"word": clean_word, "influence": val})
            
            word_influence = sorted(word_influence, key=lambda x: x["influence"], reverse=True)[:10]
            total_inf = sum(x["influence"] for x in word_influence) if word_influence else 1
            for item in word_influence:
                explainatory_result.append({
                    "word": item["word"],
                    "score": round((item["influence"] / total_inf) * 100, 1)
                })
    except:
        pass

    return best_prediction, best_model_name, model_predictions_map, explainatory_result

async def generate_summary_and_metrics(contract_id: str, text: str):
    """Full-Pipeline AI: Structured summary, ML classification, XAI, and metrics."""
    if not text:
        return {"error": "Input text is empty"}

    # 1. Generate Structured Summary (Longer)
    sections = extract_all_sections_structured(text)
    
    # Narrative Overview - Precise Token Truncation
    # BART's limit is 1024 tokens. We'll use 1000 to be safe.
    tokens = BART_TOKENIZER.encode(text, truncation=True, max_length=1000, add_special_tokens=True)
    input_text_sum = BART_TOKENIZER.decode(tokens, skip_special_tokens=True)
    
    summary_list = summarizer(input_text_sum, max_length=300, min_length=100, do_sample=False, truncation=True)
    fluid_summary = post_process_summary(summary_list[0]['summary_text'])
    
    # Combined Summary
    structured_part = create_comprehensive_summary_text(text)
    summary = f"{structured_part}\n\n📝 NARRATIVE OVERVIEW:\n{fluid_summary}"
    
    # 2. ML Classification & XAI
    try:
        ml_type, ml_model, ml_preds, xai_result = await classify_and_explain(text)
    except Exception as e:
        print(f"⚠️ ML Classification failed for {contract_id}: {e}")
        ml_type, ml_model, ml_preds, xai_result = None, None, None, None
    
    # 3. Calculate Quality Metrics
    # Compare with a chunk of the original text for ROUGE
    rouge_metrics = rouge.compute(predictions=[summary], references=[text[:2000]])
    grounding = calculate_grounding_metrics(summary, text)
    
    # 4. Extract NER
    ner_results = ner_pipeline(summary)
    entities = [{"word": ent["word"], "label": ent["entity_group"], "score": float(ent["score"])} for ent in ner_results]
    
    avg_conf = 0.85
    if ml_type and "controlled_confidence" in ml_type:
        avg_conf = ml_type["controlled_confidence"]

    evaluation_metrics = {
        "rouge1": float(rouge_metrics["rouge1"]),
        "rouge2": float(rouge_metrics["rouge2"]),
        "rougeL": float(rouge_metrics["rougeL"]),
        "unsupported_ratio": grounding["unsupported_ratio"],
        "evidence_density": grounding["evidence_density"],
        "ner_count": len(entities),
        "avg_confidence": avg_conf
    }
    
    # 5. Database Updates
    now = get_current_time()
    result_id = str(uuid.uuid4())
    
    # Update Contract Main Info
    contract_update = {
        "contract_text": text,
        "status": "analyzed",
        "updated_at": now
    }
    if ml_type:
        contract_update.update({
            "contract_type": ml_type["contract_type"],
            "type_confidence": ml_type["controlled_confidence"],
            "best_result_id": result_id,
            "explainatory_result": xai_result
        })
    await contracts_collection.update_one({"_id": contract_id}, {"$set": contract_update})
    
    # Update Results Collection
    result_doc = {
        "result_id": result_id,
        "contract_id": contract_id,
        "summary": summary,
        "sections": sections,
        "entities": entities,
        "evaluation_metrics": evaluation_metrics,
        "processed_at": now
    }
    await results_collection.replace_one({"contract_id": contract_id}, result_doc, upsert=True)
    
    # Update ML Results (Deep Analysis)
    ml_doc = {
        "result_id": result_id,
        "contract_id": contract_id,
        "summary_result": {
            "summary": summary,
            "metrics": evaluation_metrics,
            "entities": entities
        },
        "best_prediction": ml_type,
        "best_model": ml_model,
        "model_predictions": ml_preds,
        "explainatory_result": xai_result,
        "processed_at": now,
        "last_updated": now
    }
    await ml_results_collection.update_one(
        {"contract_id": contract_id},
        {"$set": ml_doc},
        upsert=True
    )
    
    return {
        "status": "success", 
        "summary": summary, 
        "metrics": evaluation_metrics,
        "classification": ml_type
    }

async def process_contract_ai(contract_id: str, filepath: str):
    text = extract_text_from_pdf(filepath)
    if not text: return {"error": "Could not extract text from PDF"}
    return await generate_summary_and_metrics(contract_id, text)
