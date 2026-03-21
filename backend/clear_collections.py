import asyncio
from app.db import contracts_collection, results_collection, contract_assignments_collection, client

async def clear_data():
    print("Clearing contracts collection...")
    await contracts_collection.delete_many({})
    
    print("Clearing results collection...")
    await results_collection.delete_many({})
    
    print("Clearing contract_assignments collection...")
    await contract_assignments_collection.delete_many({})
    
    print("✅ Cleanup complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_data())
