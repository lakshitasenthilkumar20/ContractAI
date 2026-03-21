import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def diagnostic():
    print(f"--- DATABASE DIAGNOSTIC ---")
    print(f"Configured MONGO_URL: {settings.MONGO_URL}")
    print(f"Configured DB_NAME: {settings.DB_NAME}")
    
    client = AsyncIOMotorClient(settings.MONGO_URL)
    
    # 1. List all databases to check for naming variants (case sensitivity, etc.)
    dbs = await client.list_database_names()
    print(f"All Databases on Cluster: {dbs}")
    
    # 2. Inspect the target database
    db = client[settings.DB_NAME]
    collections = await db.list_collection_names()
    print(f"Collections in '{settings.DB_NAME}': {collections}")
    
    # 3. Check counts in relevant collections
    if "ml_results" in collections:
        ml_count = await db["ml_results"].count_documents({})
        print(f"  Count of 'ml_results': {ml_count}")
        
        sample = await db["ml_results"].find_one({})
        if sample:
            print(f"  Sample Document ID: {sample.get('_id')}")
            print(f"  Sample result_id: {sample.get('result_id')}")
            print(f"  Sample schema keys: {list(sample.keys())}")
    else:
        print(f"  ❌ 'ml_results' collection NOT FOUND in '{settings.DB_NAME}'")

    if "contracts" in collections:
        c_count = await db["contracts"].count_documents({})
        print(f"  Count of 'contracts': {c_count}")
        with_result = await db["contracts"].count_documents({"best_result_id": {"$exists": True}})
        print(f"  Contracts with best_result_id: {with_result}")
    
    client.close()
    print(f"--- END DIAGNOSTIC ---")

if __name__ == "__main__":
    asyncio.run(diagnostic())
