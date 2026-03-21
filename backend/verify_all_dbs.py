import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def verify_instance(url, db_name, label):
    print(f"\n🔍 Verifying {label} ({url}/{db_name})...")
    client = AsyncIOMotorClient(url)
    db = client[db_name]
    
    contracts_collection = db["contracts"]
    ml_results_collection = db["ml_results"]
    
    # 1. Check ml_results_collection
    ml_result = await ml_results_collection.find_one({"explainatory_result": {"$exists": True, "$not": {"$size": 0}}})
    
    if not ml_result:
        print(f"❌ {label}: No ML result found with non-empty explainatory_result.")
        count = await ml_results_collection.count_documents({})
        print(f"Total ML results: {count}")
    else:
        print(f"✅ {label}: Found ML result with XAI data.")
        
        # Verify required fields
        required_fields = ["result_id", "contract_id", "best_prediction", "best_model", "model_predictions", "explainatory_result"]
        missing = [f for f in required_fields if f not in ml_result]
        if missing:
            print(f"❌ {label}: Missing fields in ml_results: {missing}")
        else:
            print(f"✅ {label}: All required fields present in ml_results.")

    # 2. Check contracts_collection
    c_count = await contracts_collection.count_documents({"best_result_id": {"$exists": True}})
    if c_count == 0:
        print(f"❌ {label}: No contracts found with best_result_id.")
    else:
        print(f"✅ {label}: Found {c_count} contracts with ML integration (best_result_id).")
    
    client.close()

async def main():
    # Verify Cloud
    await verify_instance(settings.MONGO_URL, settings.DB_NAME, "CLOUD")
    
    # Verify Local
    await verify_instance("mongodb://localhost:27017", "ContractAI", "LOCAL")

if __name__ == "__main__":
    asyncio.run(main())
