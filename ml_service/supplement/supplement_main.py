from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from recommendation_engine import get_supplement_recommendations
from schedule_generator import generate_supplement_schedule


app = FastAPI(
    title="Smart Supplement Advisory ML API",
    description="ML API for supplement recommendation, safety checking, and schedule generation",
    version="1.0.0"
)

# Allow requests from React Native / Node.js services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Request Models
# -----------------------------

class SupplementRecommendationRequest(BaseModel):
    age: int = Field(..., example=24)
    gender: str = Field(..., example="female")
    height_cm: float = Field(..., example=160)
    weight_kg: float = Field(..., example=55)
    bmi: float = Field(..., example=21.5)
    health_condition: str = Field(..., example="none")
    medication: str = Field(..., example="none")
    goal: str = Field(..., example="muscle gain")
    budget_range: str = Field(..., example="10000-25000")
    activity_level: str = Field(..., example="moderate")


class ScheduleRequest(BaseModel):
    supplement_id: str = Field(..., example="S001")
    supplement_name: str = Field(..., example="Whey Protein")
    category: str = Field(..., example="protein")
    ingredients: str = Field(..., example="whey protein")
    goal: str = Field(..., example="muscle gain")


# -----------------------------
# Root / Health Endpoints
# -----------------------------

@app.get("/")
def root():
    return {
        "success": True,
        "service": "Smart Supplement Advisory ML API",
        "status": "running",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "recommend": "/supplement/recommend",
            "generate_schedule": "/supplement/generate-schedule"
        }
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "status": "healthy",
        "message": "Supplement ML service is running successfully"
    }


# -----------------------------
# Supplement Recommendation API
# -----------------------------

@app.post("/supplement/recommend")
def recommend_supplements(request: SupplementRecommendationRequest):
    try:
        user_profile = {
            "age": request.age,
            "gender": request.gender,
            "height_cm": request.height_cm,
            "weight_kg": request.weight_kg,
            "bmi": request.bmi,
            "health_condition": request.health_condition,
            "medication": request.medication,
            "goal": request.goal,
            "budget_range": request.budget_range,
            "activity_level": request.activity_level
        }

        result = get_supplement_recommendations(user_profile)

        return {
            "success": True,
            "message": "Supplement recommendations generated successfully",
            "data": result
        }

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Required model or dataset file not found: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Recommendation generation failed: {str(e)}"
        )


# -----------------------------
# Supplement Schedule API
# -----------------------------

@app.post("/supplement/generate-schedule")
def generate_schedule(request: ScheduleRequest):
    try:
        selected_supplement = {
            "supplement_id": request.supplement_id,
            "name": request.supplement_name,
            "category": request.category,
            "ingredients": request.ingredients,
            "goal": request.goal
        }

        schedule = generate_supplement_schedule(selected_supplement)

        return {
            "success": True,
            "message": "Supplement schedule generated successfully",
            "data": schedule
        }

    except FileNotFoundError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Required schedule dataset file not found: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Schedule generation failed: {str(e)}"
        )