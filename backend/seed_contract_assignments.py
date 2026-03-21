import asyncio
from app.db import contracts_collection, results_collection, users_collection, contract_assignments_collection, client
from app.utils import generate_uuid, get_current_time

async def seed_contract_assignments():
    print("🚀 Wiping existing contract assignments...")
    await contract_assignments_collection.delete_many({})

    # 1. Get all contract results (to get processed contract IDs)
    cursor = results_collection.find({})
    results = await cursor.to_list(length=1000)
    contract_ids = [r["contract_id"] for r in results]
    print(f"📦 Found {len(contract_ids)} processed contracts.")

    # 2. Get all clients (100 clients)
    cursor = users_collection.find({"role": "client"})
    clients_list = await cursor.to_list(length=200)
    print(f"👥 Found {len(clients_list)} clients.")

    if not clients_list:
        print("❌ No clients found. Aborting.")
        client.close()
        return

    # 3. Distribute contracts among clients (approx 5 per client)
    batch_size = len(contract_ids) // len(clients_list)
    if batch_size == 0: batch_size = 1

    count = 0
    for i, client_doc in enumerate(clients_list):
        # Slice the contract_ids for this client
        start = i * batch_size
        end = start + batch_size
        if i == len(clients_list) - 1: # Last client gets the rest
            end = len(contract_ids)
        
        client_contracts = contract_ids[start:end]
        
        assigned_lawyer_id = client_doc.get("assigned_lawyer_id")
        assigned_paralegal_id = client_doc.get("assigned_paralegal_id")

        for cid in client_contracts:
            assignment_doc = {
                "_id": generate_uuid(),
                "contract_id": cid,
                "client_id": client_doc["_id"],
                "lawyer_id": assigned_lawyer_id,
                "paralegal_id": assigned_paralegal_id,
                "created_at": get_current_time()
            }
            await contract_assignments_collection.insert_one(assignment_doc)
            count += 1

    print(f"✨ Successfully created {count} hierarchical contract assignments.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_contract_assignments())
