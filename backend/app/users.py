from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from pydantic import BaseModel

from app.db import users_collection
from app.auth import get_current_active_user, RoleChecker
from app.utils import get_current_time

router = APIRouter(prefix="/users", tags=["Users"])

class UserUpdate(BaseModel):
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserListResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    is_active: bool
    assigned_lawyer_id: Optional[str] = None
    assigned_paralegal_id: Optional[str] = None
    assigned_lawyer_name: Optional[str] = None
    assigned_paralegal_name: Optional[str] = None

@router.get("", response_model=List[UserListResponse])
async def get_all_users(current_user: dict = Depends(RoleChecker(["admin", "lawyer", "paralegal", "client"]))):
    user_role = current_user["role"]
    query = {}
    
    if user_role == "lawyer":
        # Lawyers see their assigned clients and paralegals
        query = {
            "$or": [
                {"assigned_lawyer_id": current_user["_id"]},
                {"_id": current_user["_id"]}
            ]
        }
    elif user_role == "paralegal":
        # Paralegals see their assigned clients
        query = {
            "$or": [
                {"assigned_paralegal_id": current_user["_id"]},
                {"_id": current_user["_id"]}
            ]
        }
    elif user_role == "client":
        # Clients see themselves and their assigned lawyer/paralegal
        ids_to_see = [current_user["_id"]]
        if current_user.get("assigned_lawyer_id"):
            ids_to_see.append(current_user["assigned_lawyer_id"])
        if current_user.get("assigned_paralegal_id"):
            ids_to_see.append(current_user["assigned_paralegal_id"])
            
        query = {"_id": {"$in": ids_to_see}}
    elif user_role == "admin":
        # Admin sees everyone
        query = {}
    
    users = []
    cursor = users_collection.find(query)
    async for user in cursor:
        user_data = {
            "id": user["_id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "is_active": user.get("is_active", True),
            "assigned_lawyer_id": user.get("assigned_lawyer_id"),
            "assigned_paralegal_id": user.get("assigned_paralegal_id"),
            "assigned_lawyer_name": None,
            "assigned_paralegal_name": None
        }
        
        # Fetch names for assignments
        if user_data["assigned_lawyer_id"]:
            lawyer = await users_collection.find_one({"_id": user_data["assigned_lawyer_id"]})
            if lawyer:
                user_data["assigned_lawyer_name"] = lawyer["full_name"]
        
        if user_data["assigned_paralegal_id"]:
            paralegal = await users_collection.find_one({"_id": user_data["assigned_paralegal_id"]})
            if paralegal:
                user_data["assigned_paralegal_name"] = paralegal["full_name"]
                
        users.append(user_data)
    return users

@router.get("/{user_id}", response_model=UserListResponse)
async def get_user_by_id(user_id: str, current_user: dict = Depends(RoleChecker(["admin"]))):
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user.get("is_active", True)
    }

@router.put("/{user_id}")
async def update_user(user_id: str, update_data: UserUpdate, current_user: dict = Depends(RoleChecker(["admin", "lawyer"]))):
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_fields = {}
    
    # Restrict lawyer from updating certain fields if we ever add them to UserUpdate
    # For now, UserUpdate only has role and is_active.
    # If the user is a lawyer, prevent changing role?
    if current_user["role"] == "lawyer":
        if update_data.role is not None:
            raise HTTPException(status_code=403, detail="Lawyers cannot change user roles")
            
    if update_data.role is not None:
        update_fields["role"] = update_data.role
    if update_data.is_active is not None:
        update_fields["is_active"] = update_data.is_active
        
    if not update_fields:
        return {"msg": "No changes provided"}
        
    await users_collection.update_one({"_id": user_id}, {"$set": update_fields})
    return {"msg": "User updated successfully"}
