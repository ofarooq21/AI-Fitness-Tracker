from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from enum import Enum

class MealType(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

class Macros(BaseModel):
    kcal: int
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: Optional[float] = None
    sugar_g: Optional[float] = None
    sodium_mg: Optional[float] = None

class MealCreate(BaseModel):
    user_id: str = "demo"  # placeholder until auth
    file_key: Optional[str] = None
    label: str
    confidence: Optional[float] = None
    portion_estimate_grams: int
    macros: Macros
    meal_type: MealType
    task_id: Optional[str] = None
    notes: Optional[str] = None

class MealUpdate(BaseModel):
    label: Optional[str] = None
    portion_estimate_grams: Optional[int] = None
    macros: Optional[Macros] = None
    meal_type: Optional[MealType] = None
    notes: Optional[str] = None

class MealOut(MealCreate):
    id: str
    created_at: datetime
    updated_at: datetime

class MealSummary(BaseModel):
    id: str
    label: str
    meal_type: MealType
    macros: Macros
    created_at: datetime

class DailyNutrition(BaseModel):
    date: datetime
    total_macros: Macros
    meals: List[MealSummary]
    goal_macros: Optional[Macros] = None
