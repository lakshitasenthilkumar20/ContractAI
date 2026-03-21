import csv
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import create_indexes
from app.auth import router as auth_router
from app.users import router as users_router
from app.contracts import router as contracts_router
from app.results import router as results_router
from app.comments import router as comments_router
from app.registrations import router as registrations_router

app = FastAPI(title="ContractInsight AI Backend")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event Handlers
@app.on_event("startup")
async def startup_event():
    await create_indexes()

@app.get("/ml-metrics")
async def get_ml_metrics():
    results = []
    csv_path = "result.csv"
    if os.path.exists(csv_path):
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert numeric strings to floats/ints where possible
                for key in ['accuracy', 'f1_score', 'precision', 'recall', 'roc_auc']:
                    try:
                        row[key] = float(row[key])
                    except (ValueError, KeyError):
                        pass
                results.append(row)
    return results

# Include Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(contracts_router)
app.include_router(results_router)
app.include_router(comments_router)
app.include_router(registrations_router, prefix="/registrations", tags=["registrations"])

@app.on_event("startup")
async def on_startup():
    await create_indexes()

@app.get("/trigger-batch-now")
async def trigger_batch_now():
    print("🚩 Triggering database-driven batch summary update...")
    from app.db import contracts_collection, results_collection
    from app.ai_service import generate_summary_and_metrics
    
    # 1. Iterate through contract_results to find contracts that need processing
    results_cursor = results_collection.find({})
    processed = 0
    errors = []
    
    async for result_doc in results_cursor:
        contract_id = result_doc.get("contract_id")
        if not contract_id:
            continue
            
        # 2. Fetch the corresponding contract text
        contract = await contracts_collection.find_one({"_id": contract_id})
        if not contract:
            errors.append(f"{contract_id}: Contract not found in database")
            continue
            
        contract_text = contract.get("contract_text")
        if not contract_text:
            # Fallback check if text is stored in different field or try processing from file if exists
            errors.append(f"{contract_id}: No contract_text found in database")
            continue
            
        # 3. Process AI using text directly
        print(f"🤖 Batch Processing {contract_id} from DB text...")
        try:
            await generate_summary_and_metrics(contract_id, contract_text)
            processed += 1
        except Exception as e:
            print(f"  ❌ Error: {e}")
            errors.append(f"{contract_id}: {str(e)}")
    
    return {
        "msg": "Database-driven batch update complete", 
        "processed": processed,
        "errors_count": len(errors),
        "errors_sample": errors[:5]
    }

@app.get("/")
def read_root():
    return {"message": "Welcome to ContractInsight AI API"}
