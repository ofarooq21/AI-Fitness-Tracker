#!/usr/bin/env python3
"""
Simple API Test Script - Tests the FastAPI endpoints without database dependencies.
This script focuses on testing the API structure and basic functionality.
"""

import json
from datetime import datetime, date
from fastapi.testclient import TestClient
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.main import app

def test_api_structure():
    """Test API structure and basic endpoints."""
    print("Testing API structure...")
    
    client = TestClient(app)
    
    # Test root endpoint
    print("Testing root endpoint...")
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    print(f"✓ Root endpoint: {data['message']}")
    
    # Test health endpoint (basic, no DB dependency)
    print("\nTesting health endpoint...")
    response = client.get("/health/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print(f"✓ Health check: {data['status']}")
    
    # Test API documentation
    print("\nTesting API documentation...")
    response = client.get("/docs")
    assert response.status_code == 200
    print("✓ API documentation accessible")
    
    # Test OpenAPI schema
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "openapi" in schema
    assert "info" in schema
    print(f"✓ OpenAPI schema: {schema['info']['title']} v{schema['info']['version']}")
    
    return True

def test_endpoint_structure():
    """Test that all expected endpoints exist in the OpenAPI schema."""
    print("\nTesting endpoint structure...")
    
    client = TestClient(app)
    response = client.get("/openapi.json")
    schema = response.json()
    
    expected_paths = [
        "/",
        "/health/health",
        "/users/register",
        "/users/login", 
        "/users/me",
        "/meals",
        "/meals/presign",
        "/meals/scan",
        "/workouts",
        "/goals"
    ]
    
    paths = schema.get("paths", {})
    missing_paths = []
    
    for path in expected_paths:
        if path not in paths:
            missing_paths.append(path)
        else:
            print(f"✓ Endpoint exists: {path}")
    
    if missing_paths:
        print(f"⚠️  Missing endpoints: {missing_paths}")
        return False
    
    return True

def test_data_models():
    """Test that data models can be instantiated."""
    print("\nTesting data models...")
    
    try:
        from app.models.meal import MealCreate, MealType, Macros
        from app.models.user import UserCreate, Gender, ActivityLevel
        from app.models.workout import WorkoutCreate, ExerciseType, Set, Exercise
        from app.models.goals import GoalCreate, GoalType, MacroTargets
        
        # Test meal model
        macros = Macros(kcal=500, protein_g=25.0, carbs_g=50.0, fat_g=20.0)
        meal = MealCreate(
            label="Test Meal",
            portion_estimate_grams=200,
            macros=macros,
            meal_type=MealType.LUNCH
        )
        print(f"✓ Meal model: {meal.label}")
        
        # Test user model
        user = UserCreate(
            email="test@example.com",
            password="testpassword",
            first_name="Test",
            last_name="User",
            date_of_birth=datetime(1990, 1, 1),
            gender=Gender.MALE,
            height_cm=175.0,
            weight_kg=70.0,
            activity_level=ActivityLevel.MODERATELY_ACTIVE
        )
        print(f"✓ User model: {user.email}")
        
        # Test workout model
        sets = [Set(reps=10, weight_kg=50.0)]
        exercise = Exercise(name="Bench Press", exercise_type=ExerciseType.STRENGTH, sets=sets)
        workout = WorkoutCreate(
            user_id="test-user",
            name="Test Workout",
            date=datetime(2024, 1, 1, 10, 0, 0),
            exercises=[exercise]
        )
        print(f"✓ Workout model: {workout.name}")
        
        # Test goals model
        macro_targets = MacroTargets(calories=2000, protein_g=150.0, carbs_g=200.0, fat_g=80.0)
        goal = GoalCreate(
            user_id="test-user",
            goal_type=GoalType.WEIGHT_LOSS,
            title="Lose 10kg",
            macro_targets=macro_targets
        )
        print(f"✓ Goal model: {goal.title}")
        
        return True
        
    except Exception as e:
        print(f"✗ Model test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("AI Fitness + Nutrition Tracker - Simple API Test")
    print("=" * 60)
    
    try:
        success = True
        
        if not test_api_structure():
            success = False
            
        if not test_endpoint_structure():
            success = False
            
        if not test_data_models():
            success = False
        
        if success:
            print("\n🎉 All tests passed!")
            print("\nAPI structure is correct and ready for use.")
            print("\nTo run the full application:")
            print("1. Start Docker: docker-compose up -d")
            print("2. Access API docs: http://localhost:8000/docs")
            print("3. Test endpoints using the interactive docs")
        else:
            print("\n❌ Some tests failed. Please check the errors above.")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
