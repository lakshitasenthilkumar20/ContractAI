import asyncio
import random
from app.db import users_collection, registrations_collection, client
from app.utils import get_password_hash, generate_uuid, get_current_time

async def seed_pattern_users():
    print("🚀 Wiping existing users and registrations for fresh hierarchical seeding...")
    await users_collection.delete_many({})
    await registrations_collection.delete_many({})

    # 1. Create Admin
    admin_id = generate_uuid()
    admin_doc = {
        "_id": admin_id,
        "full_name": "Admin User",
        "email": "admin@example.com",
        "password_hash": get_password_hash("1234"),
        "role": "admin",
        "is_active": True,
        "created_at": get_current_time()
    }
    await users_collection.insert_one(admin_doc)
    print("✅ Created Admin: admin@example.com")

    # 2. Create 10 Lawyers
    lawyers = []
    for i in range(1, 11):
        lawyer_id = generate_uuid()
        name = f"Lawyer_{i}"
        email = f"lawyer{i}@example.com"
        doc = {
            "_id": lawyer_id,
            "full_name": f"Senior Counsel {i}",
            "email": email,
            "password_hash": get_password_hash("1234"),
            "role": "lawyer",
            "is_active": True,
            "created_at": get_current_time()
        }
        await users_collection.insert_one(doc)
        lawyers.append(doc)
    print(f"✅ Created {len(lawyers)} Lawyers.")

    # 3. Create 30 Paralegals (assign each to a lawyer)
    paralegals = []
    for i in range(1, 31):
        paralegal_id = generate_uuid()
        # Round robin assignment of lawyer
        assigned_lawyer = lawyers[(i-1) % len(lawyers)]
        name = f"Paralegal_{i}"
        email = f"paralegal{i}@example.com"
        doc = {
            "_id": paralegal_id,
            "full_name": f"Legal Assistant {i}",
            "email": email,
            "password_hash": get_password_hash("1234"),
            "role": "paralegal",
            "is_active": True,
            "assigned_lawyer_id": assigned_lawyer["_id"],
            "created_at": get_current_time()
        }
        await users_collection.insert_one(doc)
        paralegals.append(doc)
    print(f"✅ Created {len(paralegals)} Paralegals with lawyer assignments.")

    # 4. Create 100 Clients (assign each to a paralegal and their corresponding lawyer)
    for i in range(1, 101):
        client_id = generate_uuid()
        # Round robin assignment of paralegal
        assigned_paralegal = paralegals[(i-1) % len(paralegals)]
        # Use the same lawyer assigned to that paralegal for consistency
        assigned_lawyer_id = assigned_paralegal["assigned_lawyer_id"]
        
        email = f"client{i}@example.com"
        doc = {
            "_id": client_id,
            "full_name": f"Client Corp {i}",
            "email": email,
            "password_hash": get_password_hash("1234"),
            "role": "client",
            "is_active": True,
            "assigned_paralegal_id": assigned_paralegal["_id"],
            "assigned_lawyer_id": assigned_lawyer_id,
            "created_at": get_current_time()
        }
        await users_collection.insert_one(doc)
        if i % 20 == 0:
            print(f"✅ Created {i} Clients...")

    print("\n✨ Seeding complete. All relationships established.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_pattern_users())
