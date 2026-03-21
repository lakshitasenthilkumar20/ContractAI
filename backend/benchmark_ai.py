import asyncio
import time
from app.ai_service import process_contract_ai
from app.db import contracts_collection
from app.utils import generate_uuid

async def test_full_pipeline():
    contract_id = generate_uuid()
    filepath = "/Users/lakshitasenthikumar/Downloads/software 2/Contract_AI/backend/uploads/a7f887b7-8cf8-43eb-9cbe-caf76f3ce25d.pdf"
    
    print(f"Testing full pipeline for: {contract_id}")
    start_time = time.time()
    
    # We need to mock the DB or ensure it's running
    # For a benchmark, we just want to see how long process_contract_ai takes
    try:
        await process_contract_ai(contract_id, filepath)
    except Exception as e:
        print(f"Error during processing: {e}")
        
    end_time = time.time()
    print(f"Total processing time: {end_time - start_time:.2f} seconds")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
