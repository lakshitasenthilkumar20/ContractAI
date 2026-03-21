import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_local():
    local_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(local_url)
    db = client["ContractAI"] # From screenshot
    
    print(f"Checking Local Database 'ContractAI'...")
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    if "contracts" in collections:
        count = await db["contracts"].count_documents({})
        print(f"Local contracts: {count}")
    else:
        print("Local contracts collection not found.")
        
    if "ml_results" in collections:
        count = await db["ml_results"].count_documents({})
        print(f"Local ML results: {count}")
    else:
        print("Local ml_results collection not found.")

if __name__ == "__main__":
    asyncio.run(check_local())
