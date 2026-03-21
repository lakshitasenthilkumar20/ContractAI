from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.db import registrations_collection, users_collection
from app.utils import generate_uuid, get_current_time, get_password_hash
from app.auth import RoleChecker
from pydantic import BaseModel, EmailStr

router = APIRouter()

class RegistrationCreate(BaseModel):
    name: str
    email: EmailStr
    role: str
    message: str
    password: str

class RegistrationResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    message: str
    status: str = "waiting"
    assigned_lawyer_id: Optional[str] = None
    assigned_paralegal_id: Optional[str] = None
    created_at: datetime

@router.post("", response_model=RegistrationResponse)
async def create_registration(reg_data: RegistrationCreate):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": reg_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Check if registration already exists
    existing_reg = await registrations_collection.find_one({"email": reg_data.email})
    if existing_reg:
        raise HTTPException(status_code=400, detail="Registration already pending for this email")

    new_reg = {
        "_id": generate_uuid(),
        "full_name": reg_data.name,
        "email": reg_data.email,
        "role": reg_data.role.lower(),
        "message": reg_data.message,
        "password_hash": get_password_hash(reg_data.password),
        "status": "waiting",
        "created_at": get_current_time()
    }
    
    await registrations_collection.insert_one(new_reg)
    
    return {
        "id": new_reg["_id"],
        "name": new_reg["full_name"],
        "email": new_reg["email"],
        "role": new_reg["role"],
        "message": new_reg["message"],
        "status": new_reg["status"],
        "created_at": new_reg["created_at"]
    }

@router.get("", response_model=List[RegistrationResponse])
async def get_all_registrations(status: Optional[str] = "waiting", current_user: dict = Depends(RoleChecker(["admin"]))):
    query = {}
    if status:
        query["status"] = status
        
    cursor = registrations_collection.find(query).sort("created_at", -1)
    registrations = await cursor.to_list(length=100)
    
    return [
        {
            "id": r["_id"],
            "name": r["full_name"],
            "email": r["email"],
            "role": r["role"],
            "message": r["message"],
            "status": r.get("status", "waiting"),
            "assigned_lawyer_id": r.get("assigned_lawyer_id"),
            "assigned_paralegal_id": r.get("assigned_paralegal_id"),
            "created_at": r["created_at"]
        } for r in registrations
    ]

class ApprovalData(BaseModel):
    lawyer_email: Optional[EmailStr] = None
    paralegal_email: Optional[EmailStr] = None

@router.put("/{reg_id}/approve")
async def approve_registration(reg_id: str, approval: ApprovalData, current_user: dict = Depends(RoleChecker(["admin"]))):
    reg = await registrations_collection.find_one({"_id": reg_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    role = reg["role"]
    assigned_lawyer_id = None
    assigned_paralegal_id = None

    # Role-based assignment logic
    if role == "lawyer":
        pass # No assignment needed
    elif role == "paralegal":
        if not approval.lawyer_email:
            raise HTTPException(status_code=400, detail="Lawyer assignment required for paralegal")
        lawyer = await users_collection.find_one({"email": approval.lawyer_email, "role": "lawyer"})
        if not lawyer:
            raise HTTPException(status_code=400, detail="Lawyer not found")
        assigned_lawyer_id = lawyer["_id"]
    elif role == "client":
        if not approval.lawyer_email or not approval.paralegal_email:
            raise HTTPException(status_code=400, detail="Lawyer and Paralegal assignment required for client")
        lawyer = await users_collection.find_one({"email": approval.lawyer_email, "role": "lawyer"})
        paralegal = await users_collection.find_one({"email": approval.paralegal_email, "role": "paralegal"})
        if not lawyer or not paralegal:
            raise HTTPException(status_code=400, detail="Lawyer or Paralegal not found")
        assigned_lawyer_id = lawyer["_id"]
        assigned_paralegal_id = paralegal["_id"]

    # Create user
    new_user = {
        "_id": reg["_id"],
        "full_name": reg["full_name"],
        "email": reg["email"],
        "password_hash": reg["password_hash"],
        "role": reg["role"],
        "is_active": True,
        "assigned_lawyer_id": assigned_lawyer_id,
        "assigned_paralegal_id": assigned_paralegal_id,
        "created_at": get_current_time()
    }
    
    try:
        await users_collection.insert_one(new_user)
    except Exception as e:
        if "duplicate key error" in str(e).lower():
            raise HTTPException(status_code=400, detail="User already exists")
        raise
        
    await registrations_collection.update_one(
        {"_id": reg_id},
        {"$set": {
            "status": "approved",
            "assigned_lawyer_id": assigned_lawyer_id,
            "assigned_paralegal_id": assigned_paralegal_id,
            "updated_at": get_current_time()
        }}
    )
    
    return {"message": "User approved and created successfully", "status": "approved"}

@router.delete("/{reg_id}")
@router.put("/{reg_id}/reject")
async def reject_registration(reg_id: str, current_user: dict = Depends(RoleChecker(["admin"]))):
    reg = await registrations_collection.find_one({"_id": reg_id})
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    await registrations_collection.update_one(
        {"_id": reg_id},
        {"$set": {"status": "rejected", "updated_at": get_current_time()}}
    )
    return {"message": "Registration rejected successfully", "status": "rejected"}
