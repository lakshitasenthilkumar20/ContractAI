import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from bson import ObjectId

async def inspect_specific_values():
    print(f"Connecting to: {settings.MONGO_URL}")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client["contractinsight"]
    
    target_oid = "69a124c0e03444b189314324"
    doc = await db.ml_results.find_one({"_id": ObjectId(target_oid)})
    
    if doc:
        print(f"\n--- FULL DOCUMENT {target_oid} ---")
        # Convert ObjectId to string for printing
        doc['_id'] = str(doc['_id'])
        print(json.dumps(doc, indent=2))
        print("--- END DOCUMENT ---\n")
    else:
        print(f"❌ Document {target_oid} NOT found.")
        # Try finding by contract_id instead
        contract_id = "56cbace8-3569-432c-916f-5095dcbcb94f"
        doc = await db.ml_results.find_one({"contract_id": contract_id})
        if doc:
            print(f"✅ Found by contract_id {contract_id}:")
            doc['_id'] = str(doc['_id'])
            print(json.dumps(doc, indent=2))
            
    client.close()

if __name__ == "__main__":
    asyncio.run(inspect_specific_values())
