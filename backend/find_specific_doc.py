import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from bson import ObjectId

async def find_doc():
    print(f"Connecting to: {settings.MONGO_URL}")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client["contractinsight"]
    
    # 1. Look for the specific document from user's screenshot
    target_oid = "69a11ef0e03444b1893135c4"
    doc = await db.ml_results.find_one({"_id": ObjectId(target_oid)})
    
    if doc:
        print(f"✅ Found document {target_oid} in ml_results!")
        print(f"   contract_id: {doc.get('contract_id')}")
        print(f"   result_id: {doc.get('result_id')}")
    else:
        print(f"❌ Document {target_oid} NOT found in ml_results.")
        
    # 2. Check total counts again
    ml_count = await db.ml_results.count_documents({})
    c_count = await db.contracts.count_documents({})
    print(f"Total ml_results: {ml_count}")
    print(f"Total contracts: {c_count}")
    
    # 3. Print first 5 contract_ids from ml_results
    cursor = db.ml_results.find({}, {"contract_id": 1}).limit(5)
    ids = [d.get("contract_id") for d in await cursor.to_list(length=5)]
    print(f"Sample contract_ids in ml_results: {ids}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(find_doc())
