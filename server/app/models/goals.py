from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

class GoalType(str, Enum):
    WEIGHT_LOSS = "weight_loss"
    WEIGHT_GAIN = "weight_gain"
    MAINTENANCE = "maintenance"
    STRENGTH = "strength"
    ENDURANCE = "endurance"
    FLEXIBILITY = "flexibility"

class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"

class MacroTargets(BaseModel):
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float

class StrengthGoal(BaseModel):
    exercise_name: str
    target_weight_kg: float
    target_reps: int = 1
    current_weight_kg: Optional[float] = None
    current_reps: Optional[int] = None

class GoalCreate(BaseModel):
    user_id: str
    goal_type: GoalType
    title: str
    description: Optional[str] = None
    target_weight_kg: Optional[float] = None
    target_date: Optional[datetime] = None
    macro_targets: Optional[MacroTargets] = None
    strength_goals: Optional[List[StrengthGoal]] = None
    is_primary: bool = False

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_weight_kg: Optional[float] = None
    target_date: Optional[datetime] = None
    macro_targets: Optional[MacroTargets] = None
    strength_goals: Optional[List[StrengthGoal]] = None
    status: Optional[GoalStatus] = None
    is_primary: Optional[bool] = None

class GoalOut(GoalCreate):
    id: str
    status: GoalStatus
    created_at: datetime
    updated_at: datetime
    progress_percentage: Optional[float] = None

class GoalProgress(BaseModel):
    goal_id: str
    current_value: float
    target_value: float
    progress_percentage: float
    estimated_completion_date: Optional[datetime] = None
    last_updated: datetime
