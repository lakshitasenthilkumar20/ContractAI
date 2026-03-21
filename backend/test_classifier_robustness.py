import joblib
import os
import re

CLASSIFIER_PATH = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend/contract_classifier.pkl"

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'[^a-zA-Z ]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text

test_cases = {
    "Confidentiality": "NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT. This agreement is made to protect trade secrets and proprietary information. Both parties agree not to disclose confidential data.",
    "Employment": "EMPLOYMENT AGREEMENT. This marks the beginning of your term of employment. The employee shall perform duties as outlined and receive a base salary.",
    "Lease": "RESIDENTIAL LEASE AGREEMENT. This lease is for the property located at 123 Main St. The tenant agrees to pay monthly rent to the landlord.",
    "Loan": "LOAN AGREEMENT and promissory note. The borrower agrees to repay the lender the principal sum plus interest according to the payment schedule.",
    "Service": "MASTER SERVICE AGREEMENT. This MSA governs the professional services provided by the contractor to the client.",
}

if os.path.exists(CLASSIFIER_PATH):
    model = joblib.load(CLASSIFIER_PATH)
    print("--- Classifier Robustness Test ---")
    for name, text in test_cases.items():
        cleaned = clean_text(text)
        prediction = model.predict([cleaned])[0]
        print(f"Input Type: {name:15} | Predicted: {prediction}")
else:
    print("Model file not found.")
