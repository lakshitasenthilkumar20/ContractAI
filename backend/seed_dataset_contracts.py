import asyncio
import json
import os
import sys
import joblib
import random
import pandas as pd
import re

# Path fix to import app modules
sys.path.append(os.getcwd())

from app.db import contracts_collection, contract_assignments_collection, users_collection, results_collection, client
from app.utils import generate_uuid, get_current_time

ADMIN_ID = "b85cd72d-c95e-43da-87a7-15aad41b1190"
DATASET_PATH = "dataset_unified_labeled.jsonl"
CLASSIFIER_PATH = "contract_classifier.pkl"

def clean_text(text):
    text = str(text).lower()
    text = re.sub(r'\n', ' ', text)
    text = re.sub(r'[^a-zA-Z ]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text

async def seed_dataset_contracts():
    print("🚀 Starting Dataset Seeding...")

    # 1. Clear existing data
    print("Clearing existing contracts and results...")
    await contracts_collection.delete_many({})
    await results_collection.delete_many({})
    await contract_assignments_collection.delete_many({})

    # 2. Get Admin for uploader_id
    admin_user = await users_collection.find_one({"role": "admin"})
    if not admin_user:
        print("❌ Error: Admin user not found. Please run seed_users.py first.")
        return
    admin_id = admin_user["_id"]

    # 3. Load Classifier
    if not os.path.exists(CLASSIFIER_PATH):
        print(f"❌ Error: Classifier model not found at {CLASSIFIER_PATH}")
        return
    
    print("Loading classifier...")
    classifier = joblib.load(CLASSIFIER_PATH)

    # 4. Get some clients for assignment
    clients_cursor = users_collection.find({"role": "client"})
    clients = await clients_cursor.to_list(length=100)
    
    # 5. Read Dataset and Process
    if not os.path.exists(DATASET_PATH):
        print(f"❌ Error: Dataset file not found at {DATASET_PATH}")
        return

    print("Reading dataset and seeding contracts...")
    count = 0
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for i, line in enumerate(f):
            # Seed all 2000 contracts
            
            try:
                obj = json.loads(line)
                text = obj.get("text_clean", obj.get("text", ""))
                if not text:
                    continue
                
                # Predict type
                cleaned = clean_text(text)
                prediction = classifier.predict([cleaned])
                contract_type = str(prediction[0])

                contract_id = generate_uuid()
                title = f"Contract {i+1}"
                
                # Insert into contracts (uploader_id is Admin)
                contract_doc = {
                    "_id": contract_id,
                    "uploader_id": admin_id,
                    "title": title,
                    "filename": f"contract_{i+1}.txt",
                    "filepath": "n/a",
                    "status": "analyzed",
                    "contract_type": contract_type,
                    "contract_text": text, # Added contract_text from dataset
                    "uploaded_at": get_current_time(),
                    "updated_at": get_current_time()
                }
                await contracts_collection.insert_one(contract_doc)

                # Assignment (Randomly assign to a client)
                if clients:
                    target_client = random.choice(clients)
                    assignment_doc = {
                        "_id": generate_uuid(),
                        "contract_id": contract_id,
                        "client_id": target_client["_id"],
                        "lawyer_id": target_client.get("assigned_lawyer_id"),
                        "paralegal_id": target_client.get("assigned_paralegal_id"),
                        "created_at": get_current_time()
                    }
                    await contract_assignments_collection.insert_one(assignment_doc)

                count += 1
                if count % 10 == 0:
                    print(f"Seeded {count} contracts...")

            except Exception as e:
                print(f"Error processing line {i}: {e}")
                continue

    print(f"✅ Seeding complete. Processed {count} contracts.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_dataset_contracts())
