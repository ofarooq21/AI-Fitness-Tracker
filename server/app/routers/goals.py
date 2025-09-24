from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.infra.db import get_db
from app.models.goals import GoalCreate, GoalOut, GoalUpdate, GoalProgress
from app.core.auth import get_current_user_optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

router = APIRouter(prefix="/goals", tags=["goals"])

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new goal."""
    goal_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    goal_doc = {
        "_id": goal_id,
        **goal_data.dict(),
        "status": "active",
        "created_at": now,
        "updated_at": now
    }
    
    await db.goals.insert_one(goal_doc)
    
    return GoalOut(**goal_doc)

@router.get("", response_model=List[GoalOut])
async def list_goals(
    user_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List goals for a user."""
    # Use current user's ID if not specified
    if not user_id and current_user:
        user_id = current_user.get("user_id", "demo")
    elif not user_id:
        user_id = "demo"  # Fallback for demo mode
    
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    cursor = db.goals.find(query).sort("created_at", -1).skip(skip).limit(limit)
    
    goals = []
    async for doc in cursor:
        goals.append(GoalOut(**doc))
    
    return goals

@router.get("/{goal_id}", response_model=GoalOut)
async def get_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get a specific goal by ID."""
    goal = await db.goals.find_one({"_id": goal_id})
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    return GoalOut(**goal)

@router.put("/{goal_id}", response_model=GoalOut)
async def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Update a goal."""
    # Check if goal exists
    existing_goal = await db.goals.find_one({"_id": goal_id})
    if not existing_goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Update only provided fields
    update_data = {k: v for k, v in goal_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.goals.update_one(
            {"_id": goal_id},
            {"$set": update_data}
        )
    
    # Return updated goal
    updated_goal = await db.goals.find_one({"_id": goal_id})
    return GoalOut(**updated_goal)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a goal."""
    result = await db.goals.delete_one({"_id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )

@router.get("/{goal_id}/progress", response_model=GoalProgress)
async def get_goal_progress(
    goal_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get progress for a specific goal."""
    goal = await db.goals.find_one({"_id": goal_id})
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # TODO: Implement actual progress calculation based on goal type
    # For now, return placeholder data
    return GoalProgress(
        goal_id=goal_id,
        current_value=70.0,
        target_value=100.0,
        progress_percentage=70.0,
        estimated_completion_date=datetime(2024, 6, 1),
        last_updated=datetime.utcnow()
    )

@router.get("/user/{user_id}/progress", response_model=List[GoalProgress])
async def get_user_goals_progress(
    user_id: str,
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get progress for all active goals of a user."""
    # Get all active goals for the user
    goals = await db.goals.find({"user_id": user_id, "status": "active"}).to_list(None)
    
    progress_list = []
    for goal in goals:
        # TODO: Implement actual progress calculation based on goal type
        # For now, return placeholder data
        progress_list.append(GoalProgress(
            goal_id=str(goal["_id"]),
            current_value=70.0,
            target_value=100.0,
            progress_percentage=70.0,
            estimated_completion_date=datetime(2024, 6, 1),
            last_updated=datetime.utcnow()
        ))
    
    return progress_list
