from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommendation_engine import get_recommendations
from ml_predict import predict_goal

app = FastAPI(title="Smart Supplement Advisory API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthProfileInput(BaseModel):
    age: int
    gender: str | None = None
    height: float
    weight: float
    bmi: float | None = None
    health_condition: str
    medication: str
    goal: str
    price_range: str | None = None


@app.get("/")
def home():
    return {"message": "Supplement Recommendation API Running"}


@app.get("/predict")
def predict(age: int, bmi: float):
    result = predict_goal(age, bmi)
    return {"predicted_goal": result}


@app.get("/recommendations/{user_id}")
def recommendations(user_id: str):
    return get_recommendations(user_id)


@app.post("/recommend")
def recommend_from_profile(profile: HealthProfileInput):
    calculated_bmi = profile.weight / ((profile.height / 100) ** 2)

    predicted_goal = predict_goal(profile.age, calculated_bmi)

    # Existing dataset user U0020 temporary use
    raw_result = get_recommendations("U0020")

    # get_recommendations() return krna data eke recommendations thiyenne "safe" array eke
    if isinstance(raw_result, dict):
        if isinstance(raw_result.get("safe"), list):
            recommendations = raw_result.get("safe")
        elif isinstance(raw_result.get("recommendations"), list):
            recommendations = raw_result.get("recommendations")
        elif isinstance(raw_result.get("data"), list):
            recommendations = raw_result.get("data")
        elif isinstance(raw_result.get("results"), list):
            recommendations = raw_result.get("results")
        else:
            recommendations = []
    elif isinstance(raw_result, list):
        recommendations = raw_result
    else:
        recommendations = []

    # Optional price range filter
    if profile.price_range:
        recommendations = [
            item
            for item in recommendations
            if str(item.get("price_range", "")).lower()
            == profile.price_range.lower()
        ]

    return {
        "user_profile": {
            "age": profile.age,
            "gender": profile.gender,
            "weight": profile.weight,
            "height": profile.height,
            "bmi": round(calculated_bmi, 2),
            "health_condition": profile.health_condition,
            "medication": profile.medication,
            "entered_goal": profile.goal,
            "predicted_goal": predicted_goal,
            "price_range": profile.price_range,
        },
        "recommendations": recommendations,
    }