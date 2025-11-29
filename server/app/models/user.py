from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr
from enum import Enum

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class ActivityLevel(str, Enum):
    SEDENTARY = "sedentary"
    LIGHTLY_ACTIVE = "lightly_active"
    MODERATELY_ACTIVE = "moderately_active"
    VERY_ACTIVE = "very_active"
    EXTRA_ACTIVE = "extra_active"

class UserCreate(BaseModel):
    """
    Schema for creating a user.

    Only the core identity fields are required. Profile fields are optional
    so registration can be lightweight from the mobile/web client.
    """
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    # Optional profile fields
    date_of_birth: Optional[datetime] = None
    gender: Optional[Gender] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None

from pydantic import BaseModel, EmailStr, Field

# ... (imports)

class UserOut(BaseModel):
    id: str = Field(alias="_id")
    email: str
    first_name: str
    last_name: str
    date_of_birth: Optional[datetime] = None
    gender: Optional[Gender] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class UserInDB(UserOut):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
