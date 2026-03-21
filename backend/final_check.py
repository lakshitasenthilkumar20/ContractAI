import asyncio
import json
from app.db import ml_results_collection, client

async def final_check():
    # Fetch the specific test contract
    contract_id = "537f1e0d-d97c-45be-9e83-ae139e918d42"
    doc = await ml_results_collection.find_one({"contract_id": contract_id})
    
    if doc:
        print(f"--- Document for {contract_id} ---")
        print(f"Keys: {list(doc.keys())}")
        if "explainatory_result" in doc:
            print(f"explainatory_result type: {type(doc['explainatory_result'])}")
            print(f"explainatory_result: {doc['explainatory_result']}")
        else:
            print("ERROR: explainatory_result KEY MISSING!")
    else:
        print(f"Document for {contract_id} not found.")
        # Try finding ANY document
        doc = await ml_results_collection.find_one({})
        if doc:
            print(f"--- Random Document ID: {doc.get('contract_id')} ---")
            print(f"Keys: {list(doc.keys())}")

    client.close()

if __name__ == "__main__":
    asyncio.run(final_check())
