import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def main():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db = client[settings.DB_NAME]
    
    comments = await db.comments.find().to_list(100)
    print(f"\nComments count: {len(comments)}")
    for c in comments:
        print(f"ID: {c['_id']}, ContractID: {c.get('contract_id')}, Type: {c.get('comment_type')}, Text: '{c.get('comment_text')}'")

    client.close()

if __name__ == '__main__':
    asyncio.run(main())
