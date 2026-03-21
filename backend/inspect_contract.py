import asyncio
from app.db import contracts_collection

async def inspect():
    c = await contracts_collection.find_one({})
    if c:
        print(f"Contract document keys: {list(c.keys())}")
        print(f"id: {c.get('id')}")
        print(f"_id: {c.get('_id')}")
    else:
        print("No contracts found.")

if __name__ == "__main__":
    asyncio.run(inspect())
