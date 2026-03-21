import asyncio
from app.db import users_collection, client

async def verify_counts():
    total = await users_collection.count_documents({})
    admins = await users_collection.count_documents({"role": "admin"})
    lawyers = await users_collection.count_documents({"role": "lawyer"})
    paralegals = await users_collection.count_documents({"role": "paralegal"})
    clients = await users_collection.count_documents({"role": "client"})
    
    print(f"Total Users: {total}")
    print(f"Admins: {admins}")
    print(f"Lawyers: {lawyers}")
    print(f"Paralegals: {paralegals}")
    print(f"Clients: {clients}")
    
    # Check hierarchy for one client
    one_client = await users_collection.find_one({"role": "client"})
    if one_client:
        print(f"Client Sample: {one_client['full_name']}")
        print(f"Assigned Paralegal ID: {one_client.get('assigned_paralegal_id')}")
        print(f"Assigned Lawyer ID: {one_client.get('assigned_lawyer_id')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_counts())
