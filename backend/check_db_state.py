import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def check():
    url = os.getenv("MONGO_URL")
    if not url:
        print("No MONGO_URL found in .env")
        return
        
    client = AsyncIOMotorClient(url)
    dbs = await client.list_database_names()
    print(f"Available DBs: {dbs}")
    
    for db_name in ["contractinsight", "ml_results", "ContractAI"]:
        if db_name in dbs:
            db = client[db_name]
            cols = await db.list_collection_names()
            print(f"\nDB: {db_name}, Collections: {cols}")
            
            if "contracts" in cols:
                doc = await db.contracts.find_one()
                if doc:
                    print(f"  Contract Keys: {list(doc.keys())}")
                    print(f"  Sample Contract - _id: {doc.get('_id')}, contract_type: {doc.get('contract_type')}, best_result_id: {doc.get('best_result_id')}, result_id: {doc.get('result_id')}")
            
            if "ml_results" in cols:
                doc = await db.ml_results.find_one()
                if doc:
                    print(f"  ML Result Keys: {list(doc.keys())}")
                    print(f"  Sample ML Result - contract_id: {doc.get('contract_id')}, result_id: {doc.get('result_id')}")

if __name__ == "__main__":
    asyncio.run(check())
