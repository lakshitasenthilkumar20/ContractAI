import asyncio
import json
from app.db import ml_results_collection, client

async def verify_schema():
    contract_id = "537f1e0d-d97c-45be-9e83-ae139e918d42"
    doc = await ml_results_collection.find_one({"contract_id": contract_id})
    
    if doc:
        print("--- Final Document Verification ---")
        if "_id" in doc: del doc["_id"]
        print(json.dumps(doc, indent=2))
        
        if "explainatory_result" in doc and doc["explainatory_result"]:
            print("\n✅ XAI Results Found!")
        else:
            print("\n❌ XAI Results STILL EMPTY")
            
        if "best_prediction" in doc and "controlled_confidence" in doc["best_prediction"]:
            print("✅ Controlled Confidence Found!")
    else:
        print(f"Document {contract_id} not found.")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify_schema())
