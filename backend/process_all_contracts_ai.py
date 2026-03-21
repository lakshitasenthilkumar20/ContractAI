import asyncio
import os
import sys

# Path fix to import app modules
sys.path.append(os.getcwd())

from app.db import contracts_collection, results_collection, client
from app.ai_service import process_contract_ai

async def process_all_contracts():
    print("🚀 Starting Batch AI Processing...")
    
    # 1. Clear existing results to avoid duplicates during this batch run
    print("Clearing existing contract results...")
    await results_collection.delete_many({})
    
    # 2. Get all contracts
    cursor = contracts_collection.find({})
    contracts = await cursor.to_list(length=500)
    print(f"Found {len(contracts)} contracts to process.")
    
    # 3. Process each contract
    count = 0
    for contract in contracts:
        contract_id = contract["_id"]
        filepath = contract.get("filepath", "n/a")
        
        try:
            print(f"Processing ({count+1}/{len(contracts)}): {contract_id}")
            # We call the existing background task function
            await process_contract_ai(contract_id, filepath)
            count += 1
            if count % 10 == 0:
                print(f"✅ Processed {count} contracts...")
        except Exception as e:
            print(f"❌ Error processing contract {contract_id}: {e}")
            
    print(f"✅ Batch processing complete. Processed {count} contracts.")
    client.close()

if __name__ == "__main__":
    asyncio.run(process_all_contracts())
