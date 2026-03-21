import asyncio
from app.db import contracts_collection, ml_results_collection

async def check():
    print("Checking Cloud Database...")
    c_count = await contracts_collection.count_documents({"best_result_id": {"$exists": True}})
    m_count = await ml_results_collection.count_documents({})
    print(f"Contracts with best_result_id: {c_count}")
    print(f"Total ML results: {m_count}")
    
    # Check a specific contract from the screenshot
    target_id = "56cbace8-3569-432c-916f-5095dcbcb94f"
    contract = await contracts_collection.find_one({"_id": target_id})
    if contract:
        print(f"\nContract {target_id}:")
        print(f"  best_result_id: {contract.get('best_result_id')}")
        print(f"  contract_type: {contract.get('contract_type')}")
    else:
        print(f"\nContract {target_id} not found.")

if __name__ == "__main__":
    asyncio.run(check())
