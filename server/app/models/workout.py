from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum

class ExerciseType(str, Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"
    SPORTS = "sports"

class Set(BaseModel):
    reps: int
    weight_kg: Optional[float] = None
    duration_seconds: Optional[int] = None
    distance_meters: Optional[float] = None
    rest_seconds: Optional[int] = None

class Exercise(BaseModel):
    name: str
    exercise_type: ExerciseType
    sets: List[Set]
    notes: Optional[str] = None

class WorkoutCreate(BaseModel):
    user_id: str
    name: str
    date: datetime
    exercises: List[Exercise]
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class WorkoutUpdate(BaseModel):
    name: Optional[str] = None
    exercises: Optional[List[Exercise]] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class WorkoutOut(WorkoutCreate):
    id: str
    created_at: datetime
    updated_at: datetime

class WorkoutSummary(BaseModel):
    id: str
    name: str
    date: datetime
    exercise_count: int
    total_sets: int
    duration_minutes: Optional[int] = None

class StrengthProgress(BaseModel):
    exercise_name: str
    current_1rm_kg: float
    target_1rm_kg: float
    estimated_completion_date: Optional[datetime] = None
    confidence_score: Optional[float] = None
