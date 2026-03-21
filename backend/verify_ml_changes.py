import asyncio
import os
from app.db import contracts_collection, ml_results_collection

async def verify_ml_results():
    print("🔍 Verifying ML Results Schema and Data...")
    
    # 1. Check ml_results_collection
    ml_result = await ml_results_collection.find_one({"explainatory_result": {"$exists": True, "$not": {"$size": 0}}})
    
    if not ml_result:
        print("❌ Error: No ML result found with non-empty explainatory_result.")
        # Check why
        count = await ml_results_collection.count_documents({})
        print(f"Total ML results: {count}")
    else:
        print("✅ Found ML result with XAI data.")
        print(f"Sample Result ID: {ml_result.get('result_id')}")
        print(f"Sample Schema Keys: {list(ml_result.keys())}")
        print(f"XAI Sample: {ml_result.get('explainatory_result')[:2]}")
        
        # Verify required fields from walkthrough
        required_fields = ["result_id", "contract_id", "best_prediction", "best_model", "model_predictions", "explainatory_result"]
        missing = [f for f in required_fields if f not in ml_result]
        if missing:
            print(f"❌ Missing fields in ml_results: {missing}")
        else:
            print("✅ All required fields present in ml_results.")

    # 2. Check contracts_collection
    contract = await contracts_collection.find_one({"best_result_id": {"$exists": True}})
    if not contract:
        print("❌ Error: No contract found with best_result_id.")
    else:
        print("✅ Found contract with ML integration.")
        print(f"Contract ID: {contract.get('id')}")
        print(f"Contract Type: {contract.get('contract_type')}")
        print(f"Confidence: {contract.get('type_confidence')}")
        print(f"Best Result ID: {contract.get('best_result_id')}")
        
    print("\n🏁 Verification completed.")

if __name__ == "__main__":
    asyncio.run(verify_ml_results())
