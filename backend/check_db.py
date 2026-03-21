import asyncio
from app.db import users_collection, registrations_collection

async def check_users():
    print("--- Users ---")
    async for user in users_collection.find({}):
        print(f"ID: {user['_id']}, Name: {user['full_name']}, Email: {user['email']}, Role: {user['role']}, Active: {user['is_active']}")
    
    print("\n--- Registrations ---")
    async for reg in registrations_collection.find({}):
        print(f"ID: {reg['_id']}, Name: {reg['full_name']}, Email: {reg['email']}, Status: {reg['status']}, Role: {reg['role']}")

if __name__ == "__main__":
    asyncio.run(check_users())
