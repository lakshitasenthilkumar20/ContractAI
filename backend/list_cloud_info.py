import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def list_cloud_info():
    print(f"Connecting to Cloud: {settings.MONGO_URL}")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    
    # List all databases
    dbs = await client.list_database_names()
    print(f"Databases on cluster: {dbs}")
    
    for db_name in dbs:
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"  DB: {db_name} -> Collections: {collections}")
        if "ml_results" in collections:
            count = await db["ml_results"].count_documents({})
            print(f"    - ml_results count: {count}")
        if "contracts" in collections:
            count = await db["contracts"].count_documents({})
            print(f"    - contracts count: {count}")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(list_cloud_info())
