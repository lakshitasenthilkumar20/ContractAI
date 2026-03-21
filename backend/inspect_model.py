import joblib
import os

CLASSIFIER_PATH = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend/contract_classifier.pkl"

if os.path.exists(CLASSIFIER_PATH):
    model = joblib.load(CLASSIFIER_PATH)
    print(f"Model type: {type(model)}")
    
    if hasattr(model, 'classes_'):
        print(f"Classes: {model.classes_}")
    elif hasattr(model, 'named_steps'):
        # Check if it's a pipeline
        if 'classifier' in model.named_steps and hasattr(model.named_steps['classifier'], 'classes_'):
            print(f"Pipeline Classes: {model.named_steps['classifier'].classes_}")
        else:
            print("Model is a pipeline but classes_ not found in 'classifier' step.")
            print(f"Steps: {model.named_steps.keys()}")
    else:
        print("Classes not found directly on model.")
else:
    print("Model file not found.")
