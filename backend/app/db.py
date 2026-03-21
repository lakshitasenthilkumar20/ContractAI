import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URL, tlsCAFile=certifi.where(), tlsAllowInvalidCertificates=True)
db = client[settings.DB_NAME]

# Collections
users_collection = db["users"]
contracts_collection = db["contracts"]
results_collection = db["contract_results"]
comments_collection = db["comments"]
audit_logs_collection = db["audit_logs"]
registrations_collection = db["registrations"]
contract_assignments_collection = db["contract_assignments"]
ml_results_collection = db["ml_results"]

async def create_indexes():
    # User indexes
    await users_collection.create_index("email", unique=True)
    
    # Registration indexes
    await registrations_collection.create_index("email", unique=True)
    
    # Contract indexes
    await contracts_collection.create_index("uploader_id")
    
    # Assignment indexes
    await contract_assignments_collection.create_index("contract_id")
    await contract_assignments_collection.create_index("client_id")
    await contract_assignments_collection.create_index("lawyer_id")
    await contract_assignments_collection.create_index("paralegal_id")
    
    # Result indexes
    await results_collection.create_index("contract_id")
    
    # Comment indexes
    await comments_collection.create_index("contract_id")
    await comments_collection.create_index("reply_comment_id")
    
    print("Indexes created successfully.")
