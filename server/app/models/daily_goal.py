from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class DailyTaskCreate(BaseModel):
    """Schema for creating a daily task."""
    user_id: str
    date: str  # YYYY-MM-DD format
    task_id: str  # e.g., "water", "steps", "protein", "workout", or custom ID
    label: str
    type: str  # "checkbox" or "counter"
    target: Optional[int] = None
    unit: Optional[str] = None
    current: int = 0
    done: bool = False
    is_custom: bool = False

class DailyTaskUpdate(BaseModel):
    """Schema for updating a daily task."""
    current: Optional[int] = None
    done: Optional[bool] = None
    target: Optional[int] = None

class DailyTaskOut(BaseModel):
    """Schema for daily task output."""
    id: str = Field(alias="_id")
    user_id: str
    date: str
    task_id: str
    label: str
    type: str
    target: Optional[int] = None
    unit: Optional[str] = None
    current: int
    done: bool
    is_custom: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

