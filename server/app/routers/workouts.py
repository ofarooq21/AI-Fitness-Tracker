from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.infra.db import get_db
from app.models.workout import WorkoutCreate, WorkoutOut, WorkoutUpdate, WorkoutSummary, StrengthProgress
from app.core.auth import get_current_user_optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from celery.result import AsyncResult
from celery.exceptions import CeleryError
from celery_app import celery_app

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
    # Fire-and-forget: recompute forecasts for this user
    try:
        celery_app.send_task("compute_strength_forecast", args=[workout_data.user_id])
    except CeleryError:
        # Non-fatal if queue is unavailable
        pass
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
        # Trigger forecast recomputation
        user_id = existing_workout.get("user_id")
        if user_id:
            try:
                celery_app.send_task("compute_strength_forecast", args=[user_id])
            except CeleryError:
                pass
    
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
    else:
        # Try to recompute forecasts if we can find the workout's user
        # Best-effort: this is a delete, so we cannot read it now; noop
        pass

@router.get("/users/{user_id}/workouts/forecast", response_model=List[StrengthProgress])
async def get_workout_forecast(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Retrieve computed strength forecast for charting and ETAs."""
    cursor = db.get_collection("forecasts").find({"user_id": user_id})
    items: List[StrengthProgress] = []
    async for doc in cursor:
        items.append(StrengthProgress(
            exercise_name=doc.get("exercise_name"),
            current_1rm_kg=doc.get("current_1rm_kg") or 0.0,
            target_1rm_kg=doc.get("target_1rm_kg") or 0.0,
            estimated_completion_date=doc.get("estimated_completion_date"),
            confidence_score=doc.get("confidence_score"),
        ))
    return items
