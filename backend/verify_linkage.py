import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from bson import ObjectId

class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)

async def verify_linkage():
    print(f"Connecting to: {settings.MONGO_URL}")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client["contractinsight"]
    
    contract_id = "56cbace8-3569-432c-916f-5095dcbcb94f"
    contract_doc = await db.contracts.find_one({"_id": contract_id})
    ml_doc = await db.ml_results.find_one({"contract_id": contract_id})
    
    if contract_doc and ml_doc:
        print("\n--- CONTRACT DOCUMENT ---")
        print(json.dumps(contract_doc, indent=2, cls=DateTimeEncoder))
        
        print("\n--- ML RESULT DOCUMENT ---")
        print(json.dumps(ml_doc, indent=2, cls=DateTimeEncoder))
        
        match = contract_doc.get("best_result_id") == ml_doc.get("result_id")
        print(f"\n✅ Linkage Check: {'MATCH' if match else 'FAIL'}")
        print(f"Contract best_result_id: {contract_doc.get('best_result_id')}")
        print(f"ML result_id:          {ml_doc.get('result_id')}")
    else:
        print(f"❌ Could not find documents for contract {contract_id}")
        if not contract_doc: print(f"  - No contract with _id: {contract_id}")
        if not ml_doc: print(f"  - No ml_result with contract_id: {contract_id}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_linkage())
