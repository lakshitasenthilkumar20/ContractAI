import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_db():
    load_dotenv()
    mongo_url = os.getenv("MONGO_URL")
    print(f"Connecting to: {mongo_url}")
    
    if not mongo_url or "<db_username>" in mongo_url:
        print("ERROR: MONGO_URL contains placeholders or is missing.")
        return

    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client.get_database("contract_ai") # Standard DB name used in some places
        # Let's try to list collections
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
        
        contracts_count = await db.contracts.count_documents({})
        print(f"Total contracts: {contracts_count}")
        
        # Check recent contracts
        async for contract in db.contracts.find().sort("uploaded_at", -1).limit(5):
            print(f"Contract: {contract.get('title')} - Status: {contract.get('status')}")
            
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_db())
