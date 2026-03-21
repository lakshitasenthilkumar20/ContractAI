import asyncio
import os
import sys
import random

# Path fix to import app modules
sys.path.append(os.getcwd())

from app.db import contracts_collection, results_collection, users_collection, contract_assignments_collection, client
from app.utils import generate_uuid, get_current_time

async def seed_assignments():
    print("🚀 Starting Hierarchy Assignment for Analyzed Contracts...")
    
    # 1. Get all analyzed results
    results_cursor = results_collection.find({})
    results = await results_cursor.to_list(length=2000)
    print(f"Found {len(results)} analyzed contract results.")
    
    if len(results) < 100:
        print(f"⚠️ Only {len(results)} results found. Need at least 100. Please wait for the AI background task...")
        # Optional: return or wait. Let's just process what we have for now, but inform user.
    
    # 2. Get all clients with their hierarchy
    clients_cursor = users_collection.find({"role": "client"})
    clients = await clients_cursor.to_list(length=200)
    print(f"Found {len(clients)} clients available for assignment.")

    if not clients:
        print("❌ No clients found. Run seed_hierarchy.py first.")
        return

    # 3. Clear existing assignments to re-seed correctly
    print("Clearing existing contract assignments...")
    await contract_assignments_collection.delete_many({})

    # 4. Perform assignments
    count = 0
    # Shuffle results to distribute randomly
    random.shuffle(results)
    
    for i, result in enumerate(results):
        if count >= 500: # Cap at 500 for this batch
            break
            
        contract_id = result["contract_id"]
        # Cycle through clients
        target_client = clients[i % len(clients)]
        
        assignment_doc = {
            "_id": generate_uuid(),
            "contract_id": contract_id,
            "client_id": target_client["_id"],
            "paralegal_id": target_client.get("assigned_paralegal_id"),
            "lawyer_id": target_client.get("assigned_lawyer_id"),
            "created_at": get_current_time()
        }
        
        await contract_assignments_collection.insert_one(assignment_doc)
        
        # Also ensure the contract in contracts_collection reflects correct status
        await contracts_collection.update_one(
            {"_id": contract_id},
            {"$set": {"status": "analyzed"}}
        )
        
        count += 1
        if count % 10 == 0:
            print(f"✅ Assigned {count} contracts...")

    print(f"✅ Finished. Assigned {count} contracts to the user hierarchy.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_assignments())
