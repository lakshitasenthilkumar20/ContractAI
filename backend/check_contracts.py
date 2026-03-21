import asyncio
from app.db import contracts_collection, results_collection, users_collection, client

async def check_data():
    print("--- Contracts ---")
    async for c in contracts_collection.find({}).limit(10):
        print(f"ID: {c['_id']}, Uploader: {c.get('uploader_id')}, Title: {c.get('title')}")
    
    print("\n--- Results ---")
    count = await results_collection.count_documents({})
    print(f"Total Results: {count}")
    
    one_result = await results_collection.find_one({})
    if one_result:
        print(f"Sample Result Contract ID: {one_result.get('contract_id')}")

    print("\n--- Clients sample ---")
    async for u in users_collection.find({"role": "client"}).limit(5):
        print(f"Client ID: {u['_id']}, Email: {u['email']}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
