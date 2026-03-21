import asyncio
from app.db import contracts_collection, contract_assignments_collection, users_collection, client

async def verify_seeding():
    print("--- Verifying Seeding ---")
    
    contract_count = await contracts_collection.count_documents({})
    print(f"Contracts in DB: {contract_count}")
    
    assignment_count = await contract_assignments_collection.count_documents({})
    print(f"Assignments in DB: {assignment_count}")
    
    if contract_count > 0:
        sample_contract = await contracts_collection.find_one({})
        print(f"Sample Contract Title: {sample_contract['title']}")
        print(f"Sample Contract Type: {sample_contract.get('contract_type')}")
        print(f"Sample Uploader ID: {sample_contract['uploader_id']}")
        print(f"Contract Text Length: {len(sample_contract.get('contract_text', ''))}")
        if sample_contract.get('contract_text'):
            print(f"Contract Text Preview: {sample_contract['contract_text'][:100]}...")
        
        sample_assignment = await contract_assignments_collection.find_one({"contract_id": sample_contract["_id"]})
        if sample_assignment:
            print(f"Assignment found for contract: {sample_assignment['contract_id']}")
            print(f"Assigned Client ID: {sample_assignment['client_id']}")
        else:
            print("❌ No assignment found for sample contract.")
            
    print("--- RBAC Check (Simulated) ---")
    # Get a client
    client_user = await users_collection.find_one({"role": "client"})
    if client_user:
        print(f"Testing RBAC for client: {client_user['email']}")
        # Find assignments for this client
        cursor = contract_assignments_collection.find({"client_id": client_user["_id"]})
        assigned_ids = []
        async for a in cursor:
            assigned_ids.append(a["contract_id"])
        print(f"Client has {len(assigned_ids)} assigned contracts.")
        
        # Verify contracts exist
        contracts = await contracts_collection.find({"_id": {"$in": assigned_ids}}).to_list(length=100)
        print(f"Successfully retrieved {len(contracts)} contracts for the client.")
    
    print("✅ Verification complete.")
    client.close()

if __name__ == "__main__":
    asyncio.run(verify_seeding())
