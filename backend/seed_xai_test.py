import json
import asyncio
import os
from app.db import contracts_collection, client
from app.utils import generate_uuid, get_current_time

async def seed_test_contract():
    jsonl_path = "dataset_unified_labeled.jsonl"
    if not os.path.exists(jsonl_path):
        print(f"Error: {jsonl_path} not found.")
        return

    with open(jsonl_path, "r", encoding="utf-8") as f:
        first_line = f.readline()
        if not first_line:
            print("Error: JSONL is empty.")
            return
        
        obj = json.loads(first_line)
        text = obj.get("text_clean", obj.get("text", ""))
        
        contract_id = generate_uuid()
        doc = {
            "_id": contract_id,
            "id": contract_id,
            "title": "XAI Influence Test Contract",
            "filename": "test_xai.pdf",
            "contract_text": text,
            "status": "uploaded",
            "uploaded_at": get_current_time(),
            "updated_at": get_current_time()
        }
        
        await contracts_collection.insert_one(doc)
        print(f"✅ Seeded test contract with text: {contract_id}")

    client.close()

if __name__ == "__main__":
    asyncio.run(seed_test_contract())
