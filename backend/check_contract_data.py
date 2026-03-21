from app.db import contracts_collection, client
import asyncio

async def check_data():
    contracts = await contracts_collection.find({}).to_list(length=100)
    print(f"Total contracts checked: {len(contracts)}")
    for c in contracts:
        fields = list(c.keys())
        has_text = any(f in fields for f in ["contract_text", "full_text", "text", "content"])
        text_val = c.get("contract_text") or c.get("full_text") or c.get("text") or c.get("content")
        print(f"ID: {c.get('id')} | Fields: {fields} | Has Text: {has_text} | Text Length: {len(str(text_val)) if text_val else 0}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_data())
