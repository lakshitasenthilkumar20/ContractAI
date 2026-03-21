import joblib
import os
import numpy as np
import pandas as pd
from train_classifier import clean_text

MODELS_DIR = "models"

def debug_xai():
    vectorizer = joblib.load(os.path.join(MODELS_DIR, "tfidf_vectorizer.pkl"))
    le = joblib.load(os.path.join(MODELS_DIR, "label_encoder.pkl"))
    
    # Load models
    model_files = [f for f in os.listdir(MODELS_DIR) if f.endswith(".pkl") and f not in ["tfidf_vectorizer.pkl", "label_encoder.pkl"]]
    models = {f.replace(".pkl", "").lower(): joblib.load(os.path.join(MODELS_DIR, f)) for f in model_files}
    
    # Test text
    sample_text = "This is a loan agreement and credit facility document for bank XYZ."
    cleaned_text = clean_text(sample_text)
    features = vectorizer.transform([cleaned_text])
    
    best_type = "Loan / Credit / Facility"
    print(f"Target Type: {best_type}")
    
    target_clf = models.get("linearsvc")
    if not target_clf:
        print("❌ LinearSVC not found")
        return

    print(f"Target CLF: {type(target_clf)}")
    
    inner_clf = target_clf
    if hasattr(inner_clf, "calibrated_classifiers_"):
        print("  - Is CalibratedClassifierCV")
        inner_clf = inner_clf.calibrated_classifiers_[0].estimator
    
    print(f"Inner CLF: {type(inner_clf)}")
    
    importance_scores = None
    if hasattr(inner_clf, "coef_"):
        print("  - Has coef_")
        try:
            target_label_enc = le.transform([best_type])[0]
            print(f"  - Target Label Enc: {target_label_enc}")
            print(f"  - Inner CLF classes: {inner_clf.classes_}")
            class_idx = np.where(inner_clf.classes_ == target_label_enc)[0][0]
            print(f"  - Class Index: {class_idx}")
            importance_scores = inner_clf.coef_[class_idx]
        except Exception as e:
            print(f"  - Error getting coef_: {e}")
            importance_scores = inner_clf.coef_[0]
            
    if importance_scores is not None:
        print(f"Importance scores shape: {importance_scores.shape}")
        tfidf_scores = features.toarray()[0]
        print(f"TFIDF scores shape: {tfidf_scores.shape}")
        
        influence = importance_scores * tfidf_scores
        feature_names = vectorizer.get_feature_names_out()
        print(f"Total features: {len(feature_names)}")
        
        word_indices = [i for i, name in enumerate(feature_names) if 'word_vectorizer' in name]
        print(f"Word features: {len(word_indices)}")
        
        word_influence = []
        for i in word_indices:
            val = float(influence[i])
            if val > 0 and tfidf_scores[i] > 0:
                clean_word = feature_names[i].split('__')[-1]
                word_influence.append({"word": clean_word, "influence": val})
        
        print(f"Found {len(word_influence)} positive influences")
        word_influence = sorted(word_influence, key=lambda x: x["influence"], reverse=True)[:10]
        for item in word_influence:
            print(f"  - {item['word']}: {item['influence']}")

if __name__ == "__main__":
    debug_xai()
