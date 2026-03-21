import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def list_everything():
    print(f"Connecting to: {settings.MONGO_URL}")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    
    dbs = await client.list_database_names()
    print(f"Databases: {dbs}")
    
    for db_name in dbs:
        db = client[db_name]
        collections = await db.list_collection_names()
        print(f"  DB: {db_name} -> Collections: {collections}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(list_everything())
