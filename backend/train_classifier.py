import pandas as pd
import numpy as np
import json
import re
import joblib
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier, 
    AdaBoostClassifier, ExtraTreesClassifier, BaggingClassifier,
    VotingClassifier
)
from sklearn.naive_bayes import MultinomialNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC
from sklearn.preprocessing import LabelBinarizer, LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report, f1_score, 
    precision_score, recall_score, roc_auc_score, confusion_matrix
)

# ============================================================
# 1️⃣ ROBUST JSONL LOADER
# ============================================================
def read_jsonl_robust(file_path):
    records = []
    buffer = ""
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return pd.DataFrame()
        
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            buffer += line.strip()
            try:
                obj = json.loads(buffer)
                records.append({
                    "text": obj.get("text_clean", obj.get("text", "")),
                    "label": obj["meta"]["contract_type"]
                })
                buffer = ""
            except json.JSONDecodeError:
                buffer += " "
                
    return pd.DataFrame(records)

# ============================================================
# 2️⃣ CLEANING LOGIC (Matches ai_service.py)
# ============================================================
def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'[^a-zA-Z ]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text

def train_and_save_model():
    # File Paths
    jsonl_path = "dataset_unified_labeled.jsonl"
    csv_path   = "label_sample_150_test.csv"
    results_csv_path = "result.csv"
    models_dir = "models"

    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    print("Loading datasets...")
    df_json = read_jsonl_robust(jsonl_path)
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        df_csv = pd.DataFrame(columns=["text", "label"])
    else:
        df_csv = pd.read_csv(csv_path)
        df_csv = df_csv.rename(columns={"snippet":"text","contract_type":"label"})
        df_csv = df_csv[["text","label"]]

    if df_json.empty and df_csv.empty:
        print("❌ CRITICAL: No data found to train the model.")
        return

    # Merge
    df = pd.concat([df_json, df_csv], ignore_index=True)
    df.dropna(inplace=True)
    df.drop_duplicates(inplace=True)

    print(f"Merged dataset size: {df.shape[0]}")
    
    # Cleaning
    print("Cleaning text...")
    df["text"] = df["text"].apply(clean_text)

    # Filter rare classes
    label_counts = df["label"].value_counts()
    valid_labels = label_counts[label_counts >= 3].index
    df = df[df["label"].isin(valid_labels)]

    if df.empty:
        print("❌ Error: No valid labels found with at least 3 samples.")
        return

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=0.2,
        random_state=42,
        stratify=df["label"]
    )

    # --- 1. Vectorization & Encoding (Must be BEFORE Tuning) ---
    print("Preparing enhanced vectorizer...")
    vectorizer = FeatureUnion([
        ('word_vectorizer', TfidfVectorizer(
            ngram_range=(1, 3), 
            max_features=10000, 
            stop_words="english",
            sublinear_tf=True
        )),
        ('char_vectorizer', TfidfVectorizer(
            ngram_range=(3, 6), 
            max_features=10000, 
            analyzer='char_wb',
            sublinear_tf=True
        ))
    ])

    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)
    joblib.dump(vectorizer, os.path.join(models_dir, "tfidf_vectorizer.pkl"))

    print("Encoding labels...")
    le = LabelEncoder()
    y_train_enc = le.fit_transform(y_train)
    y_test_enc = le.transform(y_test)
    joblib.dump(le, os.path.join(models_dir, "label_encoder.pkl"))

    # Binarize labels for ROC AUC
    lb = LabelBinarizer()
    lb.fit(y_train_enc)
    y_test_bin = lb.transform(y_test_enc)

    results = []

    # --- 2. Base Models ---
    base_models = {
        "LogisticRegression": LogisticRegression(max_iter=2000, class_weight='balanced'),
        "RandomForest": RandomForestClassifier(n_estimators=100, class_weight='balanced'),
        "MultinomialNB": MultinomialNB(alpha=0.1),
        "NeuralNetwork": MLPClassifier(hidden_layer_sizes=(100,), max_iter=1000, early_stopping=True),
        "LinearSVC": CalibratedClassifierCV(LinearSVC(dual=False, class_weight='balanced', max_iter=2000))
    }

    # --- 2. Hyperparameter Tuning for Top Candidates ---
    print("Tuning top models...")
    tuned_models = {}
    cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)

    # Tune LinearSVC
    print("  Tuning LinearSVC...")
    svc_param_grid = {'estimator__C': [0.1, 1, 10]}
    svc_gs = GridSearchCV(CalibratedClassifierCV(LinearSVC(dual=False, class_weight='balanced')), svc_param_grid, cv=cv, scoring='f1_weighted')
    svc_gs.fit(X_train_vec, y_train_enc)
    tuned_models["LinearSVC"] = svc_gs.best_estimator_

    # Tune NeuralNetwork
    print("  Tuning NeuralNetwork...")
    mlp_param_grid = {'hidden_layer_sizes': [(100,), (100, 50)]}
    mlp_gs = GridSearchCV(MLPClassifier(max_iter=1000, early_stopping=True), mlp_param_grid, cv=cv, scoring='f1_weighted')
    mlp_gs.fit(X_train_vec, y_train_enc)
    tuned_models["NeuralNetwork"] = mlp_gs.best_estimator_

    # --- 3. Ensemble (Voting Classifier) ---
    print("Building Ensemble (VotingClassifier)...")
    ensemble = VotingClassifier(
        estimators=[
            ('svc', tuned_models["LinearSVC"]),
            ('mlp', tuned_models["NeuralNetwork"]),
            ('lr', base_models["LogisticRegression"])
        ],
        voting='soft'
    )
    ensemble.fit(X_train_vec, y_train_enc)
    
    # Add ensemble and other base models to the assessment list
    eval_list = {**base_models, **tuned_models, "Ensemble": ensemble}
    
    # Add the remaining 10 requested models for evaluation/metrics
    eval_list["GradientBoosting"] = GradientBoostingClassifier()
    eval_list["AdaBoost"] = AdaBoostClassifier()
    eval_list["DecisionTree"] = DecisionTreeClassifier()
    eval_list["KNeighbors"] = KNeighborsClassifier()
    eval_list["SGDClassifier"] = CalibratedClassifierCV(SGDClassifier(loss='modified_huber'))
    eval_list["ExtraTrees"] = ExtraTreesClassifier()
    eval_list["Bagging"] = BaggingClassifier()

    best_acc = -1
    best_model_obj = None
    best_model_name = ""

    for name, clf in eval_list.items():
        print(f"Assessing {name}...")
        if name not in ["LinearSVC", "NeuralNetwork", "Ensemble"]:
            clf.fit(X_train_vec, y_train_enc)
        
        preds_enc = clf.predict(X_test_vec)
        preds = le.inverse_transform(preds_enc)
        
        acc = accuracy_score(y_test_enc, preds_enc)
        f1 = f1_score(y_test_enc, preds_enc, average='weighted', zero_division=0)
        
        # Save results metadata
        results.append({
            "model": name,
            "accuracy": acc,
            "f1_score": f1,
            "precision": precision_score(y_test_enc, preds_enc, average='weighted', zero_division=0),
            "recall": recall_score(y_test_enc, preds_enc, average='weighted', zero_division=0),
            "confusion_matrix": confusion_matrix(y_test_enc, preds_enc).tolist()
        })

        if acc > best_acc:
            best_acc = acc
            best_model_obj = clf
            best_model_name = name

        # Save model
        joblib.dump(clf, os.path.join(models_dir, f"{name.lower()}.pkl"))
        print(f"  {name} -> Accuracy: {acc:.4f} | F1: {f1:.4f}")

    # Generate visual metrics for best model
    if best_model_obj:
        print(f"\n🏆 Generating Visual Metrics for Best Model: {best_model_name}")
        y_pred = best_model_obj.predict(X_test_vec)
        cm = confusion_matrix(y_test_enc, y_pred)
        
        plt.figure(figsize=(12, 10))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=le.classes_, yticklabels=le.classes_)
        plt.title(f'Confusion Matrix - {best_model_name}')
        plt.xlabel('Predicted')
        plt.ylabel('Actual')
        plt.savefig(os.path.join(models_dir, 'confusion_matrix.png'))
        plt.close()

        # Model Comparison Graph
        results_df = pd.DataFrame(results)
        plt.figure(figsize=(14, 8))
        sns.barplot(x='accuracy', y='model', data=results_df.sort_values('accuracy', ascending=False))
        plt.title('Model Accuracy Comparison')
        plt.savefig(os.path.join(models_dir, 'model_comparison.png'))
        plt.close()

    # Save results to CSV
    results_df = pd.DataFrame(results)
    results_df.to_csv(results_csv_path, index=False)
    print(f"\n✅ All results saved to: {results_csv_path}")
    print(f"✅ All models saved to: {models_dir}/")
    print(f"✅ Visualization saved to: {models_dir}/")

if __name__ == "__main__":
    train_and_save_model()
