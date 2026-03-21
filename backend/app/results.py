from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime

from app.db import results_collection, contracts_collection
from app.auth import get_current_active_user, RoleChecker
from app.utils import generate_uuid, get_current_time

router = APIRouter(prefix="/contracts/{contract_id}/results", tags=["AI Results"])

class Entity(BaseModel):
    label: str
    word: str
    score: Optional[float] = 0.0

class ResultCreate(BaseModel):
    summary: str
    classification: Optional[str] = "Legal Document"
    entities: Optional[List[Entity]] = []
    risk_score: Optional[float] = 0.0

class ResultResponse(BaseModel):
    id: str
    contract_id: str
    summary: str
    classification: Optional[str] = None
    entities: Optional[List[dict]] = None
    evaluation_metrics: Optional[dict] = None
    created_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None

@router.post("", response_model=ResultResponse)
async def post_results(
    contract_id: str, 
    result_in: ResultCreate,
    current_user: dict = Depends(RoleChecker(["admin"])) # Simulate ML service posting as Admin
):
    contract = await contracts_collection.find_one({"_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    result_doc = {
        "_id": generate_uuid(),
        "contract_id": contract_id,
        "classification": result_in.classification,
        "summary": result_in.summary,
        "entities": [e.dict() for e in result_in.entities] if result_in.entities else [],
        "risk_score": result_in.risk_score,
        "created_at": get_current_time()
    }
    
    await results_collection.insert_one(result_doc)
    
    # Update contract status to analyzed
    await contracts_collection.update_one(
        {"_id": contract_id},
        {"$set": {"status": "analyzed", "updated_at": get_current_time()}}
    )
    
    return {
        "id": result_doc["_id"],
        "contract_id": result_doc["contract_id"],
        "classification": result_doc["classification"],
        "summary": result_doc["summary"],
        "entities": result_doc["entities"],
        "created_at": result_doc["created_at"]
    }

@router.get("", response_model=List[ResultResponse])
async def get_results(contract_id: str, current_user: dict = Depends(get_current_active_user)):
    contract = await contracts_collection.find_one({"_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # Check access to contract
    if current_user["role"] == "client":
        from app.db import contract_assignments_collection
        assignment = await contract_assignments_collection.find_one({
            "contract_id": contract_id,
            "client_id": current_user["_id"]
        })
        if not assignment:
            raise HTTPException(status_code=403, detail="Access denied")
        
    results_cursor = results_collection.find({"contract_id": contract_id})
    results = []
    async for res in results_cursor:
        # Determine classification
        cls = res.get("classification")
        if not cls and "ml_type" in res:
            cls = res["ml_type"].get("contract_type")

        results.append({
            "id": res.get("_id", res.get("id")),
            "contract_id": res["contract_id"],
            "classification": cls,
            "summary": res["summary"],
            "entities": res.get("entities"), 
            "evaluation_metrics": res.get("evaluation_metrics"),
            "created_at": res.get("created_at"),
            "processed_at": res.get("processed_at")
        })
    return results

@router.get("/ml", response_model=List[dict])
async def get_ml_results(contract_id: str, current_user: dict = Depends(get_current_active_user)):
    from app.db import ml_results_collection
    # Simple check for now
    results = await ml_results_collection.find({"contract_id": contract_id}).to_list(length=10)
    for r in results:
        if "_id" in r: del r["_id"]
    return results

@router.get("/aggregate/xai/{contract_type}")
async def get_aggregate_xai(contract_type: str):
    from app.db import ml_results_collection
    # Fetch a representative contract's XAI for this type to show in the analysis page
    result = await ml_results_collection.find_one({
        "best_prediction.contract_type": contract_type,
        "explainatory_result": {"$exists": True, "$not": {"$size": 0}}
    })
    
    if not result:
        return []
        
    return result["explainatory_result"]
