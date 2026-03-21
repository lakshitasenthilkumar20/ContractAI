import asyncio
from app.db import users_collection

async def get_test_emails():
    lawyers = await users_collection.find({"role": "lawyer"}).to_list(2)
    paralegals = await users_collection.find({"role": "paralegal"}).to_list(2)
    print("Lawyers:", [u["email"] for u in lawyers])
    print("Paralegals:", [u["email"] for u in paralegals])

if __name__ == "__main__":
    asyncio.run(get_test_emails())
