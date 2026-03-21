import asyncio
import json
from app.db import ml_results_collection, client

async def verify():
    # Find a document where explainatory_result is not empty if possible
    doc = await ml_results_collection.find_one({"explainatory_result": {"$ne": []}})
    if not doc:
        # Fallback to any document
        doc = await ml_results_collection.find_one({})
    
    if doc:
        print("--- ML Result Document Schema ---")
        # Remove _id for cleaner output
        if "_id" in doc: del doc["_id"]
        print(json.dumps(doc, indent=2))
    else:
        print("No documents found in ml_results_collection.")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify())
