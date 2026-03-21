import asyncio
import os
import sys

# Path fix to import app modules
sys.path.append(os.getcwd())

from app.db import contract_assignments_collection, client

async def verify_assignments():
    print("--- Verifying Contract Assignments ---")
    
    total = await contract_assignments_collection.count_documents({})
    print(f"Total Assignments in DB: {total}")
    
    sample = await contract_assignments_collection.find_one({})
    if sample:
        print(f"\nSample Assignment Details:")
        print(f"Contract ID: {sample.get('contract_id')}")
        print(f"Client ID: {sample.get('client_id')}")
        print(f"Paralegal ID: {sample.get('paralegal_id')}")
        print(f"Lawyer ID: {sample.get('lawyer_id')}")
        
        if sample.get('client_id') and sample.get('paralegal_id') and sample.get('lawyer_id'):
            print("✅ Verified: All hierarchical columns are populated.")
        else:
            print("❌ Warning: Some hierarchical columns are missing.")
    else:
        print("❌ No assignments found.")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify_assignments())
