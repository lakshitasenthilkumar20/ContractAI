import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "contractinsight")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    print(f"Checking DB: {db_name}")
    
    # Check ml_results sample
    ml_doc = await db.ml_results.find_one()
    if ml_doc:
        print("\nSample ML Result:")
        print(f"  contract_id: {ml_doc.get('contract_id')}")
        print(f"  result_id: {ml_doc.get('result_id')}")
        print(f"  best_prediction.contract_type: {ml_doc.get('best_prediction', {}).get('contract_type')}")
    
    # Check contracts sample
    contract_doc = await db.contracts.find_one({"contract_type": {"$exists": True}})
    if not contract_doc:
        contract_doc = await db.contracts.find_one()
        
    if contract_doc:
        print("\nSample Contract:")
        print(f"  _id: {contract_doc.get('_id')}")
        print(f"  contract_type: {contract_doc.get('contract_type')}")
        print(f"  best_result_id: {contract_doc.get('best_result_id')}")
        print(f"  result_id: {contract_doc.get('result_id')}")

if __name__ == "__main__":
    asyncio.run(check())
