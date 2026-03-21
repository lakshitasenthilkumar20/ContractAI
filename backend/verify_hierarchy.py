import asyncio
import os
import sys

# Path fix to import app modules
sys.path.append(os.getcwd())

from app.db import users_collection, client

async def verify_hierarchy():
    print("--- Verifying User Hierarchy ---")
    
    total_users = await users_collection.count_documents({})
    print(f"Total Users in DB: {total_users}")
    
    roles = ["admin", "lawyer", "paralegal", "client"]
    for role in roles:
        count = await users_collection.count_documents({"role": role})
        print(f"Total {role}s: {count}")
        
    # Check a sample client
    sample_client = await users_collection.find_one({"role": "client", "email": "client50@example.com"})
    if sample_client:
        print(f"\nSample Client: {sample_client['email']}")
        print(f"Assigned Paralegal ID: {sample_client.get('assigned_paralegal_id')}")
        print(f"Assigned Lawyer ID: {sample_client.get('assigned_lawyer_id')}")
        
        # Verify paralegal
        if sample_client.get('assigned_paralegal_id'):
            p = await users_collection.find_one({"_id": sample_client['assigned_paralegal_id']})
            print(f"Assigned Paralegal Email: {p['email']}")
            print(f"Paralegal's Lawyer ID: {p.get('assigned_lawyer_id')}")
            
            # Verify consistency
            if p.get('assigned_lawyer_id') == sample_client.get('assigned_lawyer_id'):
                print("✅ Hierarchy Consistency Check: Client and Paralegal share the same lawyer.")
            else:
                print("❌ Hierarchy Consistency Check Failed.")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify_hierarchy())
