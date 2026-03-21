import sys
import os
import asyncio
from datetime import datetime
from passlib.context import CryptContext

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "Contract_AI", "backend"))

from app.db import registrations_collection, users_collection
from app.utils import generate_uuid, get_current_time

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

async def seed_registrations():
    print("Clearing registrations collection...")
    await registrations_collection.delete_many({})
    
    registrations = []
    
    # 5 Clients
    for i in range(101, 106):
        registrations.append({
            "_id": generate_uuid(),
            "full_name": f"New Client {i}",
            "email": f"client{i}@example.com",
            "role": "client",
            "message": f"I am client {i} requesting access to manage my legal contracts.",
            "password_hash": get_password_hash("1234"),
            "status": "waiting",
            "created_at": get_current_time()
        })
        
    # 3 Paralegals
    for i in range(31, 34):
        registrations.append({
            "_id": generate_uuid(),
            "full_name": f"New Paralegal {i}",
            "email": f"paralegal{i}@example.com",
            "role": "paralegal",
            "message": f"Assistance for legal team {i}.",
            "password_hash": get_password_hash("1234"),
            "status": "waiting",
            "created_at": get_current_time()
        })
        
    # 2 Lawyers
    for i in range(11, 13):
        registrations.append({
            "_id": generate_uuid(),
            "full_name": f"New Lawyer {i}",
            "email": f"lawyer{i}@example.com",
            "role": "lawyer",
            "message": f"Senior Counsel {i} joining the firm.",
            "password_hash": get_password_hash("1234"),
            "status": "waiting",
            "created_at": get_current_time()
        })
        
    if registrations:
        await registrations_collection.insert_many(registrations)
        print(f"Successfully seeded {len(registrations)} registrations.")
    else:
        print("No registrations to seed.")

if __name__ == "__main__":
    asyncio.run(seed_registrations())
