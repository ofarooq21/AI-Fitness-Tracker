from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from app.infra.db import get_db
from app.models.user import UserCreate, UserOut, UserUpdate, Token
from app.core.auth import get_password_hash, create_access_token, get_current_user, verify_password
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "date_of_birth": user_data.date_of_birth,
        "gender": user_data.gender,
        "height_cm": user_data.height_cm,
        "weight_kg": user_data.weight_kg,
        "activity_level": user_data.activity_level,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Return user without password
    user_doc.pop("hashed_password")
    return UserOut(**user_doc)

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login", response_model=Token)
async def login_user(
    login_data: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Login user and return access token."""
    # Find user by email
    user = await db.users.find_one({"email": login_data.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": login_data.email})
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserOut)
async def get_current_user_profile(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    """Get current user's profile."""
    # Find user by email
    user = await db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Remove password hash from response
    user.pop("hashed_password", None)
    return UserOut(**user)

@router.put("/me", response_model=UserOut)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update current user's profile."""
    # Find user by email
    user = await db.users.find_one({"email": current_user["email"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update only provided fields
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one(
            {"email": current_user["email"]},
            {"$set": update_data}
        )
    
    # Return updated user
    updated_user = await db.users.find_one({"email": current_user["email"]})
    updated_user.pop("hashed_password", None)
    return UserOut(**updated_user)

@router.get("", response_model=List[UserOut])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all users (admin only - placeholder for now)."""
    # TODO: Implement proper admin check
    # For now, return empty list
    return []
