import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import uuid

# Import app components - ensuring path is correct
import sys
sys.path.append(os.getcwd())

from app.config import settings
from app.utils import get_password_hash, generate_uuid, get_current_time

async def seed_comprehensive_data():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    
    # Collections
    users_coll = db["users"]
    contracts_coll = db["contracts"]
    results_coll = db["contract_results"]
    comments_coll = db["comments"]

    print("Cleaning existing data...")
    await users_coll.delete_many({})
    await contracts_coll.delete_many({})
    await results_coll.delete_many({})
    await comments_coll.delete_many({})

    print("Seeding Users...")
    users = [
        {"_id": generate_uuid(), "full_name": "Admin User", "email": "admin@example.com", "password": "1234", "role": "admin"},
        {"_id": generate_uuid(), "full_name": "Sarah Lawyer", "email": "lawyer1@example.com", "password": "1234", "role": "lawyer"},
        {"_id": generate_uuid(), "full_name": "Mike Lawyer", "email": "lawyer2@example.com", "password": "1234", "role": "lawyer"},
        {"_id": generate_uuid(), "full_name": "John Paralegal", "email": "paralegal1@example.com", "password": "1234", "role": "paralegal"},
        {"_id": generate_uuid(), "full_name": "Acme Corp (Client)", "email": "client1@example.com", "password": "1234", "role": "client"},
        {"_id": generate_uuid(), "full_name": "Global Tech (Client)", "email": "client2@example.com", "password": "1234", "role": "client"},
    ]

    user_map = {}
    for u in users:
        doc = {
            "_id": u["_id"],
            "full_name": u["full_name"],
            "email": u["email"],
            "password_hash": get_password_hash(u["password"]),
            "role": u["role"],
            "is_active": True,
            "created_at": get_current_time()
        }
        await users_coll.insert_one(doc)
        user_map[u["email"]] = doc
        print(f"  Created user: {u['email']}")

    print("Seeding Contracts...")
    contracts = [
        {
            "_id": generate_uuid(),
            "uploader_id": user_map["lawyer1@example.com"]["_id"],
            "client_id": user_map["client1@example.com"]["_id"],
            "title": "Master Service Agreement - Acme Corp",
            "filename": "msa_acme.pdf",
            "status": "analyzed",
        },
        {
            "_id": generate_uuid(),
            "uploader_id": user_map["lawyer2@example.com"]["_id"],
            "client_id": user_map["client2@example.com"]["_id"],
            "title": "Non-Disclosure Agreement - Global Tech",
            "filename": "nda_global.pdf",
            "status": "reviewed",
        },
        {
            "_id": generate_uuid(),
            "uploader_id": user_map["paralegal1@example.com"]["_id"],
            "client_id": user_map["client1@example.com"]["_id"],
            "title": "Employment Offer - John Doe",
            "filename": "offer_letter.pdf",
            "status": "uploaded",
        }
    ]

    for c in contracts:
        c["uploaded_at"] = get_current_time() - timedelta(days=2)
        c["updated_at"] = get_current_time() - timedelta(hours=5)
        await contracts_coll.insert_one(c)
        print(f"  Created contract: {c['title']}")

    print("Seeding AI Results...")
    results = [
        {
            "_id": generate_uuid(),
            "contract_id": contracts[0]["_id"],
            "classification": "Service Agreement",
            "summary": "This Master Service Agreement outlines the terms of service between Acme Corp and the provider. Key clauses include a 30-day termination notice, limited liability capped at $1M, and standard IP ownership transfer to the client upon payment.",
            "risk_score": 0.2,
            "entities": [{"label": "ORG", "text": "Acme Corp"}, {"label": "MONEY", "text": "$1M"}],
        },
        {
            "_id": generate_uuid(),
            "contract_id": contracts[1]["_id"],
            "classification": "Non-Disclosure Agreement",
            "summary": "Standard mutual NDA. Duration is 3 years from the date of disclosure. Governing law is set to the State of Delaware. No unusual non-compete clauses found.",
            "risk_score": 0.1,
            "entities": [{"label": "GPE", "text": "Delaware"}],
        }
    ]

    for r in results:
        r["created_at"] = get_current_time() - timedelta(days=1)
        await results_coll.insert_one(r)
        print(f"  Created result for: {r['contract_id']}")

    print("Seeding Comments...")
    comments = [
        {
            "_id": generate_uuid(),
            "contract_id": contracts[0]["_id"],
            "user_id": user_map["lawyer1@example.com"]["_id"],
            "user_name": user_map["lawyer1@example.com"]["full_name"],
            "comment_text": "Risk score is low, looks good for approval.",
            "comment_type": "internal",
        },
        {
            "_id": generate_uuid(),
            "contract_id": contracts[0]["_id"],
            "user_id": user_map["admin@example.com"]["_id"],
            "user_name": user_map["admin@example.com"]["full_name"],
            "comment_text": "Please double check the liability cap.",
            "comment_type": "internal",
        },
        {
            "_id": generate_uuid(),
            "contract_id": contracts[0]["_id"],
            "user_id": user_map["lawyer1@example.com"]["_id"],
            "user_name": user_map["lawyer1@example.com"]["full_name"],
            "comment_text": "Hi Acme Team, we have reviewed the MSA and it is ready for your signature.",
            "comment_type": "external",
        }
    ]

    for com in comments:
        com["created_at"] = get_current_time() - timedelta(hours=2)
        await comments_coll.insert_one(com)
        print(f"  Created comment: {com['comment_text'][:20]}...")

    print("\nSeeding Complete! You can now log in with password '1234' for any of these users.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_comprehensive_data())
