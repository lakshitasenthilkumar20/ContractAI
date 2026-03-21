import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime

from app.db import contracts_collection, contract_assignments_collection, users_collection
from app.auth import get_current_active_user, RoleChecker
from app.utils import generate_uuid, get_current_time
from app.ai_service import process_contract_ai

router = APIRouter(prefix="/contracts", tags=["Contracts"])

class ContractResponse(BaseModel):
    id: str
    uploader_id: str
    title: str
    filename: str
    contract_type: Optional[str] = "Legal Document"
    contract_text: Optional[str] = None
    status: str
    uploaded_at: datetime
    updated_at: Optional[datetime] = None
    client_name: Optional[str] = None
    paralegal_name: Optional[str] = None
    lawyer_name: Optional[str] = None
    client_id: Optional[str] = None
    paralegal_id: Optional[str] = None
    lawyer_id: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str

class AssignmentRequest(BaseModel):
    contract_id: str
    client_id: str

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ContractResponse)
async def upload_contract(
    title: str = Form(...),
    client_id: Optional[str] = Form(None),
    paralegal_id: Optional[str] = Form(None),
    lawyer_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: dict = Depends(RoleChecker(["admin", "lawyer", "paralegal", "client"]))
):
    # If a client is uploading, force their own client_id
    if current_user["role"] == "client":
        client_id = current_user["_id"]

    # --- HIERARCHY VALIDATION ---
    if client_id:
        client_user = await users_collection.find_one({"_id": client_id})
        if not client_user:
            raise HTTPException(status_code=400, detail="Invalid Client selected.")
        
        # Validate Paralegal if provided
        if paralegal_id:
            if client_user.get("assigned_paralegal_id") and client_user["assigned_paralegal_id"] != paralegal_id:
                raise HTTPException(status_code=400, detail="Selected Paralegal does not match Client's assigned Paralegal.")
        
        # Validate Lawyer if provided
        if lawyer_id:
            if client_user.get("assigned_lawyer_id") and client_user["assigned_lawyer_id"] != lawyer_id:
                raise HTTPException(status_code=400, detail="Selected Lawyer does not match Client's assigned Lawyer.")

    if paralegal_id:
        paralegal_user = await users_collection.find_one({"_id": paralegal_id})
        if not paralegal_user:
            raise HTTPException(status_code=400, detail="Invalid Paralegal selected.")
        
        # Validate Lawyer if provided
        if lawyer_id:
            if paralegal_user.get("assigned_lawyer_id") and paralegal_user["assigned_lawyer_id"] != lawyer_id:
                raise HTTPException(status_code=400, detail="Selected Lawyer does not match Paralegal's assigned Lawyer.")
    # --- END HIERARCHY VALIDATION ---

    file_id = generate_uuid()
    # Save file
    file_extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, saved_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    contract_doc = {
        "_id": file_id,
        "uploader_id": current_user["_id"],
        "title": title,
        "filename": file.filename,
        "filepath": file_path,
        "status": "uploaded",
        "contract_type": "Legal Document", # Placeholder
        "uploaded_at": get_current_time(),
        "updated_at": get_current_time()
    }
    
    await contracts_collection.insert_one(contract_doc)

    # Handle assignment
    if client_id:
        target_lawyer_id = lawyer_id
        if not target_lawyer_id:
            if current_user["role"] == "lawyer":
                target_lawyer_id = current_user["_id"]
            else:
                if current_user["role"] == "client" and current_user["_id"] == client_id:
                    target_lawyer_id = current_user.get("assigned_lawyer_id")
                else:
                    client_user = await users_collection.find_one({"_id": client_id})
                    if client_user:
                        target_lawyer_id = client_user.get("assigned_lawyer_id")
            
        target_paralegal_id = paralegal_id
        if not target_paralegal_id:
            if current_user["role"] == "paralegal":
                target_paralegal_id = current_user["_id"]
            else:
                if current_user["role"] == "client" and current_user["_id"] == client_id:
                    target_paralegal_id = current_user.get("assigned_paralegal_id")
                else:
                    client_user = await users_collection.find_one({"_id": client_id})
                    if client_user:
                        target_paralegal_id = client_user.get("assigned_paralegal_id")
            
        assignment_doc = {
            "_id": generate_uuid(),
            "contract_id": file_id,
            "client_id": client_id,
            "lawyer_id": target_lawyer_id,
            "paralegal_id": target_paralegal_id,
            "created_at": get_current_time()
        }
        await contract_assignments_collection.insert_one(assignment_doc)
    
    # Process AI synchronously
    try:
        await process_contract_ai(file_id, file_path)
    except Exception as e:
        await contracts_collection.update_one({"_id": file_id}, {"$set": {"status": "error"}})
        raise HTTPException(status_code=500, detail=f"AI Analysis failed: {str(e)}")
    
    # Fetch final contract data
    updated_contract = await contracts_collection.find_one({"_id": file_id})
    if not updated_contract:
        raise HTTPException(status_code=500, detail="Contract missing after processing.")

    return {
        "id": updated_contract["_id"],
        "uploader_id": updated_contract["uploader_id"],
        "title": updated_contract["title"],
        "filename": updated_contract["filename"],
        "contract_type": updated_contract.get("contract_type", "Legal Document"),
        "contract_text": updated_contract.get("contract_text"),
        "status": updated_contract["status"],
        "uploaded_at": updated_contract["uploaded_at"],
        "updated_at": updated_contract.get("updated_at")
    }

@router.get("", response_model=List[ContractResponse])
async def list_contracts(current_user: dict = Depends(get_current_active_user)):
    user_role = current_user["role"]
    
    # 1. Get assignments based on role
    assignment_query = {}
    if user_role == "client":
        assignment_query["client_id"] = current_user["_id"]
    elif user_role == "lawyer":
        assignment_query["lawyer_id"] = current_user["_id"]
    elif user_role == "paralegal":
        assignment_query["paralegal_id"] = current_user["_id"]
    elif user_role == "admin":
        assignment_query = {} # Admin sees all assignments
    
    cursor = contract_assignments_collection.find(assignment_query)
    assignments = await cursor.to_list(length=1000)
    
    # 2. Get contract IDs and User IDs
    contract_ids = []
    user_ids = set()
    assignment_map = {} # contract_id -> assignment_doc
    
    for a in assignments:
        cid = a["contract_id"]
        contract_ids.append(cid)
        assignment_map[cid] = a
        if a.get("client_id"): user_ids.add(a["client_id"])
        if a.get("paralegal_id"): user_ids.add(a["paralegal_id"])
        if a.get("lawyer_id"): user_ids.add(a["lawyer_id"])
    
    # 3. Build Name Map
    name_map = {}
    if user_ids:
        users_cursor = users_collection.find({"_id": {"$in": list(user_ids)}})
        async for u in users_cursor:
            name_map[u["_id"]] = u.get("full_name", u.get("email", "Unknown"))
    
    # 4. Fetch Contracts
    if user_role == "admin":
        # Only show contracts that are in assignments
        query = {"_id": {"$in": contract_ids}}
    else:
        # Others see assigned + their own uploads
        query = {
            "$or": [
                {"_id": {"$in": contract_ids}},
                {"uploader_id": current_user["_id"]}
            ]
        }

    cursor = contracts_collection.find(query)
    contracts = []
    async for contract in cursor:
        cid = contract["_id"]
        assign = assignment_map.get(cid, {})
        
        contracts.append({
            "id": cid,
            "uploader_id": contract["uploader_id"],
            "title": contract["title"],
            "filename": contract["filename"],
            "contract_type": contract.get("contract_type", "Legal Document"),
            "contract_text": contract.get("contract_text"),
            "status": contract["status"],
            "uploaded_at": contract["uploaded_at"],
            "updated_at": contract.get("updated_at"),
            "client_name": name_map.get(assign.get("client_id")) if assign.get("client_id") else None,
            "paralegal_name": name_map.get(assign.get("paralegal_id")) if assign.get("paralegal_id") else None,
            "lawyer_name": name_map.get(assign.get("lawyer_id")) if assign.get("lawyer_id") else None,
            "client_id": assign.get("client_id"),
            "paralegal_id": assign.get("paralegal_id"),
            "lawyer_id": assign.get("lawyer_id")
        })
    return contracts

@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str, current_user: dict = Depends(get_current_active_user)):
    contract = await contracts_collection.find_one({"_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # RBAC Check
    user_role = current_user["role"]
    if user_role != "admin":
        # Check if the user is assigned to this contract
        assignment_query = {"contract_id": contract_id}
        if user_role == "client":
            assignment_query["client_id"] = current_user["_id"]
        elif user_role == "lawyer":
            assignment_query["lawyer_id"] = current_user["_id"]
        elif user_role == "paralegal":
            assignment_query["paralegal_id"] = current_user["_id"]
        
        assignment = await contract_assignments_collection.find_one(assignment_query)
        if not assignment and contract["uploader_id"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
    assignment = await contract_assignments_collection.find_one({"contract_id": contract_id})
    user_names = {}
    if assignment:
        user_ids = [assignment.get("client_id"), assignment.get("paralegal_id"), assignment.get("lawyer_id")]
        user_ids = [uid for uid in user_ids if uid]
        if user_ids:
            async for u in users_collection.find({"_id": {"$in": user_ids}}):
                user_names[u["_id"]] = u.get("full_name", u.get("username", "Unknown"))
    
    return {
        "id": contract["_id"],
        "uploader_id": contract["uploader_id"],
        "title": contract["title"],
        "filename": contract["filename"],
        "contract_type": contract.get("contract_type", "Legal Document"),
        "contract_text": contract.get("contract_text"),
        "status": contract["status"],
        "uploaded_at": contract["uploaded_at"],
        "updated_at": contract.get("updated_at"),
        "client_id": assignment.get("client_id") if assignment else None,
        "paralegal_id": assignment.get("paralegal_id") if assignment else None,
        "lawyer_id": assignment.get("lawyer_id") if assignment else None,
        "client_name": user_names.get(assignment.get("client_id")) if assignment else None,
        "paralegal_name": user_names.get(assignment.get("paralegal_id")) if assignment else None,
        "lawyer_name": user_names.get(assignment.get("lawyer_id")) if assignment else None
    }

@router.patch("/{contract_id}/status")
async def update_contract_status(
    contract_id: str, 
    status_update: StatusUpdate,
    current_user: dict = Depends(RoleChecker(["admin", "lawyer", "paralegal"]))
):
    contract = await contracts_collection.find_one({"_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    valid_statuses = ["uploaded", "processing", "analyzed", "reviewed", "approved", "completed", "analysed", "rejected", "accepted"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
    await contracts_collection.update_one(
        {"_id": contract_id},
        {"$set": {"status": status_update.status, "updated_at": get_current_time()}}
    )
    return {"msg": "Status updated successfully", "new_status": status_update.status}

@router.post("/assign")
async def assign_contract(
    req: AssignmentRequest,
    current_user: dict = Depends(RoleChecker(["admin", "lawyer", "paralegal"]))
):
    # Verify contract exists
    contract = await contracts_collection.find_one({"_id": req.contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify client exists
    client = await users_collection.find_one({"_id": req.client_id, "role": "client"})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Check if assignment already exists
    existing = await contract_assignments_collection.find_one({
        "contract_id": req.contract_id,
        "client_id": req.client_id
    })
    
    if existing:
        return {"msg": "Contract already assigned to this client", "assignment_id": existing["_id"]}
    
    assignment_doc = {
        "_id": generate_uuid(),
        "contract_id": req.contract_id,
        "client_id": req.client_id,
        "lawyer_id": current_user["_id"] if current_user["role"] == "lawyer" else None,
        "paralegal_id": current_user["_id"] if current_user["role"] == "paralegal" else None,
        "created_at": get_current_time()
    }
    
    # If a paralegal is assigning, we might also want to link the client's lawyer automatically
    if current_user["role"] == "paralegal":
        if client.get("assigned_lawyer_id"):
            assignment_doc["lawyer_id"] = client["assigned_lawyer_id"]
    
    await contract_assignments_collection.insert_one(assignment_doc)
    return {"msg": "Contract assigned successfully", "assignment_id": assignment_doc["_id"]}
@router.post("/batch-summaries")
async def batch_process_summaries(
    current_user: dict = Depends(RoleChecker(["admin"]))
):
    """Admin-only endpoint to trigger a batch refresh of summaries and metrics."""
    contracts = await contracts_collection.find({}).to_list(length=1000)
    processed = 0
    errors = []
    
    for contract in contracts:
        contract_id = contract["_id"]
        filepath = contract.get("filepath")
        if not filepath or not os.path.exists(filepath):
            continue
            
        try:
            await process_contract_ai(contract_id, filepath)
            processed += 1
        except Exception as e:
            errors.append(f"{contract_id}: {str(e)}")
            
    return {
        "msg": "Batch processing completed",
        "processed": processed,
        "errors": errors
    }
