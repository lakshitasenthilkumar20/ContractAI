import sys
import os
import asyncio

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.db import contracts_collection, db
from app.ai_service import process_contract_ai

async def batch_process_local():
    print(f"🚀 Starting targeted batch processing for local files (Async optimized)...")
    
    files = [f for f in os.listdir("uploads") if f.endswith(".pdf")]
    print(f"Found {len(files)} PDF files in uploads/")
    
    processed_count = 0
    for f in files:
        file_id = f.replace(".pdf", "")
        filepath = os.path.join("uploads", f)
        
        # Find contract
        contract = await contracts_collection.find_one({"_id": file_id})
        if not contract:
            contract = await contracts_collection.find_one({"filename": f})
            
        if contract:
            contract_id = contract["_id"]
            print(f"\n[{processed_count+1}] 🤖 Processing {contract_id} ({f})...")
            try:
                result = await process_contract_ai(contract_id, filepath)
                if "error" in result:
                    print(f"  ❌ Error: {result['error']}")
                else:
                    print(f"  ✅ Summary & Metrics generated.")
                    print(f"     ROUGE-1: {result['metrics']['rouge1']:.4f}")
                    print(f"     Unsupported: {result['metrics']['unsupported_ratio']:.4f}")
                    processed_count += 1
            except Exception as e:
                print(f"  ❌ Exception processing {contract_id}: {e}")
        else:
            print(f"⏩ Skipping {f}: No database record found.")
    
    print(f"\n✨ Successfully processed {processed_count} contracts.")

if __name__ == "__main__":
    asyncio.run(batch_process_local())
