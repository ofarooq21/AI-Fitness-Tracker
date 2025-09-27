from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.infra.db import get_db
from app.models.workout import WorkoutCreate, WorkoutOut, WorkoutUpdate, WorkoutSummary, StrengthProgress
from app.core.auth import get_current_user_optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.post("", response_model=WorkoutOut, status_code=status.HTTP_201_CREATED)
async def create_workout(
    workout_data: WorkoutCreate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new workout."""
    workout_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    workout_doc = {
        "_id": workout_id,
        **workout_data.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.workouts.insert_one(workout_doc)
    
    return WorkoutOut(**workout_doc)

@router.get("", response_model=List[WorkoutSummary])
async def list_workouts(
    user_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List workouts for a user."""
    # Use current user's ID if not specified
    if not user_id and current_user:
        user_id = current_user.get("user_id", "demo")
    elif not user_id:
        user_id = "demo"  # Fallback for demo mode
    
    query = {"user_id": user_id}
    cursor = db.workouts.find(query).sort("date", -1).skip(skip).limit(limit)
    
    workouts = []
    async for doc in cursor:
        # Calculate summary data
        exercise_count = len(doc.get("exercises", []))
        total_sets = sum(len(exercise.get("sets", [])) for exercise in doc.get("exercises", []))
        
        workouts.append(WorkoutSummary(
            id=str(doc["_id"]),
            name=doc["name"],
            date=doc["date"],
            exercise_count=exercise_count,
            total_sets=total_sets,
            duration_minutes=doc.get("duration_minutes")
        ))
    
    return workouts

@router.get("/{workout_id}", response_model=WorkoutOut)
async def get_workout(
    workout_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific workout by ID."""
    workout = await db.workouts.find_one({"_id": workout_id})
    if not workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    return WorkoutOut(**workout)

@router.put("/{workout_id}", response_model=WorkoutOut)
async def update_workout(
    workout_id: str,
    workout_update: WorkoutUpdate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a workout."""
    # Check if workout exists
    existing_workout = await db.workouts.find_one({"_id": workout_id})
    if not existing_workout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )
    
    # Update only provided fields
    update_data = {k: v for k, v in workout_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.workouts.update_one(
            {"_id": workout_id},
            {"$set": update_data}
        )
    
    # Return updated workout
    updated_workout = await db.workouts.find_one({"_id": workout_id})
    return WorkoutOut(**updated_workout)

@router.delete("/{workout_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workout(
    workout_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a workout."""
    result = await db.workouts.delete_one({"_id": workout_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workout not found"
        )

@router.get("/strength/progress", response_model=List[StrengthProgress])
async def get_strength_progress(
    user_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get strength progress for a user."""
    # Use current user's ID if not specified
    if not user_id and current_user:
        user_id = current_user.get("user_id", "demo")
    elif not user_id:
        user_id = "demo"  # Fallback for demo mode
    
    # TODO: Implement actual strength progress calculation
    # For now, return placeholder data
    return [
        StrengthProgress(
            exercise_name="Bench Press",
            current_1rm_kg=80.0,
            target_1rm_kg=100.0,
            estimated_completion_date=datetime(2024, 6, 1),
            confidence_score=0.85
        ),
        StrengthProgress(
            exercise_name="Squat",
            current_1rm_kg=120.0,
            target_1rm_kg=150.0,
            estimated_completion_date=datetime(2024, 7, 15),
            confidence_score=0.78
        )
    ]
