import asyncio
import os
import sys

# Path fix to import app modules
sys.path.append(os.getcwd())

from app.db import users_collection, client
from app.utils import get_password_hash, generate_uuid, get_current_time

async def seed_advanced_hierarchy():
    print("🚀 Starting Advanced User Hierarchy Seeding...")
    
    # 1. Clear existing non-admin users if needed? 
    # User said "seed more", so we won't delete, but we'll avoid duplicates.
    
    password = "1234"
    password_hash = get_password_hash(password)
    
    # 2. Seed Lawyers (10)
    lawyers = []
    for i in range(1, 11):
        email = f"lawyer{i}@example.com"
        name = f"Lawyer {i}"
        existing = await users_collection.find_one({"email": email})
        if not existing:
            user_doc = {
                "_id": generate_uuid(),
                "full_name": name,
                "email": email,
                "password_hash": password_hash,
                "role": "lawyer",
                "is_active": True,
                "created_at": get_current_time()
            }
            await users_collection.insert_one(user_doc)
            lawyers.append(user_doc)
            print(f"Created Lawyer: {email}")
        else:
            lawyers.append(existing)
            print(f"Lawyer already exists: {email}")

    # 3. Seed Paralegals (30)
    paralegals = []
    for i in range(1, 31):
        email = f"paralegal{i}@example.com"
        name = f"Paralegal {i}"
        # Assign to a lawyer (3 paralegals per lawyer roughly)
        assigned_lawyer = lawyers[(i-1) % len(lawyers)]
        
        existing = await users_collection.find_one({"email": email})
        if not existing:
            user_doc = {
                "_id": generate_uuid(),
                "full_name": name,
                "email": email,
                "password_hash": password_hash,
                "role": "paralegal",
                "assigned_lawyer_id": assigned_lawyer["_id"],
                "is_active": True,
                "created_at": get_current_time()
            }
            await users_collection.insert_one(user_doc)
            paralegals.append(user_doc)
            print(f"Created Paralegal: {email} (Assigned to {assigned_lawyer['email']})")
        else:
            # Update existing to ensure hierarchy
            await users_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {"assigned_lawyer_id": assigned_lawyer["_id"]}}
            )
            paralegals.append(existing)
            print(f"Paralegal exists, updated hierarchy: {email}")

    # 4. Seed Clients (100)
    for i in range(1, 101):
        email = f"client{i}@example.com"
        name = f"Client {i}"
        # Assign to a paralegal
        assigned_paralegal = paralegals[(i-1) % len(paralegals)]
        # Assign to the same lawyer as the paralegal
        assigned_lawyer_id = assigned_paralegal.get("assigned_lawyer_id")
        
        existing = await users_collection.find_one({"email": email})
        if not existing:
            user_doc = {
                "_id": generate_uuid(),
                "full_name": name,
                "email": email,
                "password_hash": password_hash,
                "role": "client",
                "assigned_paralegal_id": assigned_paralegal["_id"],
                "assigned_lawyer_id": assigned_lawyer_id,
                "is_active": True,
                "created_at": get_current_time()
            }
            await users_collection.insert_one(user_doc)
            print(f"Created Client: {email} (Assigned to {assigned_paralegal['email']})")
        else:
            # Update existing to ensure hierarchy
            await users_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": {
                    "assigned_paralegal_id": assigned_paralegal["_id"],
                    "assigned_lawyer_id": assigned_lawyer_id
                }}
            )
            print(f"Client exists, updated hierarchy: {email}")

    print("✅ Advanced Hierarchy Seeding Complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_advanced_hierarchy())
