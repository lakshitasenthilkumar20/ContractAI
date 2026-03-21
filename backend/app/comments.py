from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from datetime import datetime

from app.db import comments_collection, contracts_collection
from app.auth import get_current_active_user, RoleChecker
from app.utils import generate_uuid, get_current_time

router = APIRouter(prefix="/contracts/{contract_id}/comments", tags=["Comments"])

class CommentCreate(BaseModel):
    comment_text: str
    comment_type: str # internal | external | personal
    reply_comment_id: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    contract_id: str
    user_id: str
    user_name: Optional[str] = "Unknown"
    comment_text: str
    comment_type: str # internal | external | personal
    reply_comment_id: Optional[str] = None
    created_at: datetime

@router.post("", response_model=CommentResponse)
async def add_comment(
    contract_id: str,
    comment_in: CommentCreate,
    current_user: dict = Depends(get_current_active_user)
):
    contract = await contracts_collection.find_one({"_id": contract_id})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    # Check permissions
    if current_user["role"] == "client":
        if comment_in.comment_type == "internal":
            raise HTTPException(status_code=403, detail="Clients cannot post internal comments")

    comment_doc = {
        "_id": generate_uuid(),
        "contract_id": contract_id,
        "user_id": current_user["_id"],
        "user_name": current_user.get("full_name", "Unknown"),
        "comment_text": comment_in.comment_text,
        "comment_type": comment_in.comment_type,
        "reply_comment_id": comment_in.reply_comment_id,
        "created_at": get_current_time()
    }
    
    await comments_collection.insert_one(comment_doc)
    
    return {
        "id": comment_doc["_id"],
        "contract_id": comment_doc["contract_id"],
        "user_id": comment_doc["user_id"],
        "user_name": comment_doc["user_name"],
        "comment_text": comment_doc["comment_text"],
        "comment_type": comment_doc["comment_type"],
        "reply_comment_id": comment_doc["reply_comment_id"],
        "created_at": comment_doc["created_at"]
    }

@router.get("", response_model=List[CommentResponse])
async def get_comments(contract_id: str, current_user: dict = Depends(get_current_active_user)):
    # 1. Base visibility by role
    query = {"contract_id": contract_id}
    
    if current_user["role"] == "client":
        # Clients see: external comments OR their own personal notes
        query["$or"] = [
            {"comment_type": "external"},
            {"comment_type": "personal", "user_id": current_user["_id"]}
        ]
    elif current_user["role"] in ["lawyer", "paralegal"]:
        # Team sees: external OR internal OR their own personal notes
        query["$or"] = [
            {"comment_type": "external"},
            {"comment_type": "internal"},
            {"comment_type": "personal", "user_id": current_user["_id"]}
        ]
    # Admin sees everything except other people's personal notes? 
    # Usually admin sees all internal/external. Personal notes should stay personal.
    elif current_user["role"] == "admin":
        query["$or"] = [
            {"comment_type": "external"},
            {"comment_type": "internal"},
            {"comment_type": "personal", "user_id": current_user["_id"]}
        ]
        
    cursor = comments_collection.find(query).sort("created_at", 1)
    comments = []
    async for c in cursor:
        comments.append({
            "id": c["_id"],
            "contract_id": c["contract_id"],
            "user_id": c["user_id"],
            "user_name": c.get("user_name", "User"),
            "comment_text": c["comment_text"],
            "comment_type": c["comment_type"],
            "reply_comment_id": c.get("reply_comment_id"),
            "created_at": c["created_at"]
        })
    return comments
