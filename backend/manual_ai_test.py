import asyncio
import os
import sys

# Path fix
sys.path.append(os.getcwd())

from app.ai_service import process_contract_ai
from app.db import contracts_collection
from app.utils import generate_uuid, get_current_time

async def main():
    contract_id = generate_uuid()
    filepath = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend/uploads/a7f887b7-8cf8-43eb-9cbe-caf76f3ce25d.pdf"
    
    # Insert a dummy contract record
    await contracts_collection.insert_one({
        "_id": contract_id,
        "title": "Manual Test Contract",
        "filename": "a7f887b7-8cf8-43eb-9cbe-caf76f3ce25d.pdf",
        "status": "uploaded",
        "uploaded_at": get_current_time()
    })
    
    print(f"Starting processing for {contract_id}")
    await process_contract_ai(contract_id, filepath)
    
    # Check final status
    contract = await contracts_collection.find_one({"_id": contract_id})
    print(f"Final Contract Status: {contract['status']}")

if __name__ == "__main__":
    asyncio.run(main())
