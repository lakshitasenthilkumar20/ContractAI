import asyncio
import os
import sys
import shutil

# Ensure app is in path
sys.path.append(os.getcwd())

from app.db import contracts_collection, ml_results_collection, results_collection
from app.ai_service import process_contract_ai
from app.utils import generate_uuid, get_current_time

async def test_pipeline():
    print("🧪 Testing ML Pipeline Integration...")
    
    contract_id = f"test_{generate_uuid()[:8]}"
    test_filepath = "test_contract.txt"
    
    # Create test file
    with open(test_filepath, "w") as f:
        f.write("This is a Loan and Credit agreement contract. It involves collateral, lenders, and corporation borrowers.")
    
    # Insert contract doc
    contract_doc = {
        "_id": contract_id,
        "uploader_id": "test_admin",
        "title": "Test Pipeline Contract",
        "filename": test_filepath,
        "filepath": test_filepath,
        "status": "uploaded",
        "uploaded_at": get_current_time()
    }
    await contracts_collection.insert_one(contract_doc)
    
    try:
        # Run AI processing
        await process_contract_ai(contract_id, test_filepath)
        
        # Verify Contracts Collection
        updated_contract = await contracts_collection.find_one({"_id": contract_id})
        print(f"Contract Status: {updated_contract['status']}")
        print(f"Contract Type: {updated_contract['contract_type']}")
        print(f"Contract Confidence: {updated_contract.get('type_confidence')}")
        
        # Verify ML Results Collection
        ml_res = await ml_results_collection.find_one({"contract_id": contract_id})
        if ml_res:
            print(f"✅ ML Result document created: {ml_res['result_id']}")
            print(f"✅ Best Model: {ml_res['best_model']}")
            print(f"✅ XAI words found: {len(ml_res.get('explainatory_result', []))}")
        else:
            print("❌ ML Result document NOT found!")

        # Verify Results Collection
        res = await results_collection.find_one({"contract_id": contract_id})
        if res:
            print(f"✅ Summary generated: {len(res['summary'])} chars.")
        else:
            print("❌ Result summary NOT found!")
            
    finally:
        # Cleanup
        await contracts_collection.delete_one({"_id": contract_id})
        await ml_results_collection.delete_one({"contract_id": contract_id})
        await results_collection.delete_one({"contract_id": contract_id})
        if os.path.exists(test_filepath):
            os.remove(test_filepath)

if __name__ == "__main__":
    asyncio.run(test_pipeline())
