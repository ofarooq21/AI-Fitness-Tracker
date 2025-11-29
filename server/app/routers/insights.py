from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.infra.db import get_db
from app.core.auth import get_current_user_optional
from app.core.config import settings
from motor.motor_asyncio import AsyncIOMotorDatabase
import openai
import json

router = APIRouter(prefix="/insights", tags=["insights"])

class AIInsight(BaseModel):
    summary: str
    nutrition_tip: str
    workout_tip: str
    overall_score: int  # 0-100

class InsightsResponse(BaseModel):
    insights: AIInsight
    data_summary: dict

@router.get("/ai", response_model=InsightsResponse)
async def get_ai_insights(
    current_user: dict = Depends(get_current_user_optional),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get AI-powered insights based on user's nutrition, workouts, and goals."""
    
    # Use demo user if not authenticated
    user_id = current_user.get("user_id", "demo") if current_user else "demo"
    
    # Get data from last 7 days
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    
    # Aggregate meals data
    meals_cursor = db.meals.find({
        "user_id": user_id,
        "created_at": {"$gte": seven_days_ago}
    })
    
    total_calories = 0
    total_protein = 0
    total_carbs = 0
    total_fat = 0
    meal_count = 0
    meals_by_type = {"breakfast": 0, "lunch": 0, "dinner": 0, "snack": 0}
    
    async for meal in meals_cursor:
        macros = meal.get("macros", {})
        total_calories += macros.get("kcal", 0)
        total_protein += macros.get("protein_g", 0)
        total_carbs += macros.get("carbs_g", 0)
        total_fat += macros.get("fat_g", 0)
        meal_count += 1
        meal_type = meal.get("meal_type", "snack")
        meals_by_type[meal_type] = meals_by_type.get(meal_type, 0) + 1
    
    avg_daily_calories = total_calories / 7 if meal_count > 0 else 0
    avg_daily_protein = total_protein / 7 if meal_count > 0 else 0
    
    # Aggregate workouts data
    workouts_cursor = db.workouts.find({
        "user_id": user_id,
        "date": {"$gte": seven_days_ago}
    })
    
    workout_count = 0
    total_duration = 0
    exercise_types = {}
    
    async for workout in workouts_cursor:
        workout_count += 1
        total_duration += workout.get("duration_minutes", 0)
        for exercise in workout.get("exercises", []):
            ex_type = exercise.get("exercise_type", "unknown")
            exercise_types[ex_type] = exercise_types.get(ex_type, 0) + 1
    
    avg_workout_duration = total_duration / workout_count if workout_count > 0 else 0
    
    # Get active goals
    goals_cursor = db.goals.find({
        "user_id": user_id,
        "status": "active"
    })
    
    active_goals = []
    async for goal in goals_cursor:
        active_goals.append({
            "type": goal.get("goal_type"),
            "title": goal.get("title")
        })
    
    # Prepare data summary for AI
    data_summary = {
        "days_analyzed": 7,
        "meals": {
            "total": meal_count,
            "avg_daily": round(meal_count / 7, 1) if meal_count > 0 else 0,
            "by_type": meals_by_type,
            "avg_daily_calories": round(avg_daily_calories, 0),
            "avg_daily_protein_g": round(avg_daily_protein, 1)
        },
        "workouts": {
            "total": workout_count,
            "avg_per_week": workout_count,
            "avg_duration_minutes": round(avg_workout_duration, 0),
            "exercise_types": exercise_types
        },
        "goals": {
            "active_count": len(active_goals),
            "types": [g["type"] for g in active_goals]
        }
    }
    
    # Generate AI insights using OpenAI
    try:
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "REPLACE_ME":
            # Fallback if OpenAI not configured
            return InsightsResponse(
                insights=AIInsight(
                    summary="AI insights are not configured. Please set OPENAI_API_KEY in your environment.",
                    nutrition_tip="Track your meals consistently to get better insights.",
                    workout_tip="Aim for at least 3 workouts per week for optimal results.",
                    overall_score=50
                ),
                data_summary=data_summary
            )
        
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        prompt = f"""You are a fitness and nutrition AI coach. Analyze this user's data and provide brief, actionable insights.

User Data (Last 7 Days):
- Meals logged: {meal_count} ({round(meal_count/7, 1)} per day on average)
- Average daily calories: {round(avg_daily_calories, 0)} kcal
- Average daily protein: {round(avg_daily_protein, 1)}g
- Workouts completed: {workout_count}
- Active goals: {len(active_goals)} ({', '.join([g['type'] for g in active_goals]) if active_goals else 'none'})

Provide a JSON response with exactly this structure:
{{
    "summary": "A brief 2-3 sentence overall assessment of their progress",
    "nutrition_tip": "One specific, actionable nutrition tip based on their data",
    "workout_tip": "One specific, actionable workout tip based on their data",
    "overall_score": <number between 0-100 representing their overall consistency and progress>
}}

Be encouraging, specific, and actionable. Keep responses concise (1-2 sentences each)."""
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful fitness and nutrition AI coach. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )
        
        ai_text = response.choices[0].message.content.strip()
        
        # Try to parse JSON from response (might have markdown code blocks)
        if ai_text.startswith("```"):
            # Remove markdown code blocks
            ai_text = ai_text.split("```")[1]
            if ai_text.startswith("json"):
                ai_text = ai_text[4:]
        
        ai_data = json.loads(ai_text)
        
        insights = AIInsight(
            summary=ai_data.get("summary", "Great progress! Keep tracking your meals and workouts."),
            nutrition_tip=ai_data.get("nutrition_tip", "Aim for consistent meal logging to see better patterns."),
            workout_tip=ai_data.get("workout_tip", "Try to maintain a regular workout schedule."),
            overall_score=ai_data.get("overall_score", 50)
        )
        
    except Exception as e:
        # Fallback on error
        print(f"OpenAI error: {e}")
        insights = AIInsight(
            summary=f"You've logged {meal_count} meals and {workout_count} workouts in the last week. Keep up the consistency!",
            nutrition_tip="Try to log meals within 30 minutes of eating for better accuracy." if meal_count > 0 else "Start logging your meals to get personalized nutrition insights.",
            workout_tip=f"Aim for at least 3 workouts per week for optimal results." if workout_count < 3 else "Great workout consistency! Keep it up.",
            overall_score=min(100, (meal_count * 5) + (workout_count * 10))
        )
    
    return InsightsResponse(insights=insights, data_summary=data_summary)

