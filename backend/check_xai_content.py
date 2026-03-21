import asyncio
import json
from app.db import ml_results_collection, client

async def check_content():
    # Find any document with non-empty explainatory_result
    doc = await ml_results_collection.find_one({"explainatory_result": {"$ne": []}})
    if doc:
        print(f"--- Document for {doc.get('contract_id')} ---")
        print(json.dumps(doc["explainatory_result"], indent=2))
    else:
        print("No documents found with non-empty explainatory_result.")
        # Let's check why. Print one influence map from memory if possible? No.
        # Let's print one document that IS there.
        doc = await ml_results_collection.find_one({})
        if doc:
            print(f"--- Document keys for {doc.get('contract_id')} ---")
            print(doc.keys())
            print(f"explainatory_result: {doc.get('explainatory_result')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_content())
