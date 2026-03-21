import asyncio
import os
from app.db import contracts_collection
from app.ai_service import process_contract_ai

async def batch_process_summaries():
    print("🚀 Starting batch processing of contract summaries...")
    
    # Fetch all contracts
    contracts = await contracts_collection.find({}).to_list(length=1000)
    print(f"Found {len(contracts)} contracts to process.")
    
    # Process in sequence to avoid OOM with large models
    for i, contract in enumerate(contracts):
        contract_id = contract.get("_id")
        filepath = contract.get("filepath")
        
        if not filepath or not os.path.exists(filepath):
            print(f"[{i+1}/{len(contracts)}] ⏩ Skipping {contract_id}: File not found at {filepath}")
            continue
            
        print(f"[{i+1}/{len(contracts)}] 🤖 Processing {contract_id}...")
        try:
            result = await process_contract_ai(contract_id, filepath)
            if "error" in result:
                print(f"  ❌ Error: {result['error']}")
            else:
                print(f"  ✅ Summary generated with ROUGE-1: {result['metrics']['rouge1']:.4f}")
        except Exception as e:
            print(f"  ❌ Exception processing {contract_id}: {e}")
            
    print("\n✨ Batch processing completed!")

if __name__ == "__main__":
    asyncio.run(batch_process_summaries())
