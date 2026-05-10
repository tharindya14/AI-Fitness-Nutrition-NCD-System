import pandas as pd
from interaction_checker import check_interaction
from ml_predict import predict_goal

USERS_PATH = "../../datasets/user_profiles.csv"
SUPPLEMENTS_PATH = "../../datasets/supplements.csv"

def get_recommendations(user_id):
    users = pd.read_csv(USERS_PATH)
    supplements = pd.read_csv(SUPPLEMENTS_PATH)

    user = users[users["user_id"] == user_id]

    if user.empty:
        return {"error": "User not found"}

    user = user.iloc[0]

    age = int(user["age"])
    bmi = float(user["BMI"])

    actual_goal = str(user["goal"]).lower().strip()
    predicted_goal = predict_goal(age, bmi).lower().strip()

    # ML predicted goal eka use karala supplements filter karanawa
    goal = predicted_goal

    medication = str(user["medication"]).strip()

    matched_supplements = supplements[
        supplements["target_goal"].str.lower().str.strip() == goal
    ]

    safe = []
    blocked = []

    for _, sup in matched_supplements.iterrows():
        risks = check_interaction(medication, sup["ingredients"])

        data = sup.to_dict()

        if risks:
            data["risks"] = risks
            blocked.append(data)
        else:
            safe.append(data)

    safe = sorted(safe, key=lambda x: x["rating"], reverse=True)

    return {
        "user_id": user_id,
        "actual_goal": actual_goal,
        "predicted_goal": predicted_goal,
        "safe": safe[:10],
        "blocked": blocked
    }