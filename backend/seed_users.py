import asyncio
from app.db import users_collection, client
from app.utils import get_password_hash, generate_uuid, get_current_time

async def seed_users():
    users_to_create = [
        {"email": "admin@example.com", "password": "adminpassword", "role": "admin", "name": "Admin User"},
        {"email": "lawyer@example.com", "password": "lawyerpassword", "role": "lawyer", "name": "Lawyer User"},
        {"email": "paralegal@example.com", "password": "paralegalpassword", "role": "paralegal", "name": "Paralegal User"},
        {"email": "client@example.com", "password": "clientpassword", "role": "client", "name": "Client User"},
    ]

    print("Seeding users...")
    for u in users_to_create:
        existing = await users_collection.find_one({"email": u["email"]})
        if not existing:
            user_doc = {
                "_id": generate_uuid(),
                "full_name": u["name"],
                "email": u["email"],
                "password_hash": get_password_hash(u["password"]),
                "role": u["role"],
                "is_active": True,
                "created_at": get_current_time()
            }
            await users_collection.insert_one(user_doc)
            print(f"Created user: {u['email']} ({u['role']})")
        else:
            print(f"User already exists: {u['email']}")
    
    print("Seeding complete.")
    client.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(seed_users())
