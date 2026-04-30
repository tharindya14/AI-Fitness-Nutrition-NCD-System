import sys
import json
import pandas as pd
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "food_drug_risk_model.pkl"
ENCODER_PATH = BASE_DIR / "models" / "encoders.pkl"
FOOD_PATH = BASE_DIR / "datasets" / "food_subset.csv"
ALLERGEN_PATH = BASE_DIR / "datasets" / "food_ingredients_and_allergens.csv"
ALTERNATIVE_PATH = BASE_DIR / "datasets" / "alternative_foods.csv"

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)

foods = pd.read_csv(FOOD_PATH)
allergen_df = pd.read_csv(ALLERGEN_PATH)
alternatives = pd.read_csv(ALTERNATIVE_PATH)

features = [
    "Chemical_Class",
    "Habit_Forming",
    "Therapeutic_Class",
    "Action_Class",
    "energy",
    "protein",
    "fat",
    "carbs",
    "fiber",
    "calcium",
    "iron",
    "vitamin_c",
    "vitamin_a",
    "vitamin_k_proxy",
    "is_alcohol",
    "is_leafy_green",
    "meal_type"
]

label_map = {
    0: "Safe",
    1: "Moderate",
    2: "Dangerous"
}


def check_allergy(food_name, user_allergies):
    food_name_lower = food_name.lower()

    matched_rows = allergen_df[
        allergen_df["Food Product"]
        .astype(str)
        .str.lower()
        .str.contains(food_name_lower, na=False)
    ]

    detected = []

    for _, row in matched_rows.iterrows():
        allergens_text = str(row["Allergens"]).lower()

        for allergy in user_allergies:
            if allergy.lower() in allergens_text:
                detected.append(allergy)

    return list(set(detected))


def encode_input(input_df):
    for col, le in encoders.items():
        input_df[col] = input_df[col].astype(str)

        known_classes = set(le.classes_)

        input_df[col] = input_df[col].apply(
            lambda x: x if x in known_classes else le.classes_[0]
        )

        input_df[col] = le.transform(input_df[col])

    return input_df


def suggest_alternatives(original_energy, max_results=5):
    df = alternatives.copy()

    if "is_alcohol" in df.columns:
        df = df[df["is_alcohol"] == 0]

    df["energy_difference"] = abs(df["energy"] - original_energy)

    sort_cols = ["energy_difference"]
    ascending = [True]

    if "sugars" in df.columns:
        sort_cols.append("sugars")
        ascending.append(True)

    if "sodium" in df.columns:
        sort_cols.append("sodium")
        ascending.append(True)

    df = df.sort_values(by=sort_cols, ascending=ascending)

    available_cols = [
        col for col in [
            "Food",
            "food_type",
            "energy",
            "protein",
            "carbs",
            "fat",
            "sugars",
            "sodium"
        ]
        if col in df.columns
    ]

    return df[available_cols].head(max_results).to_dict(orient="records")


def predict_safety(request_data):
    drug_name = request_data.get("drug_name", "")
    food_name = request_data.get("food_name", "")
    meal_type = request_data.get("meal_type", "Lunch")
    allergies = request_data.get("allergies", [])

    food_match = foods[
        foods["Food"].astype(str).str.lower() == food_name.lower()
    ]

    if food_match.empty:
        return {
            "success": False,
            "error": "Food not found in food_subset.csv",
            "food_name": food_name
        }

    food = food_match.iloc[0]

    input_data = {
        "Chemical_Class": "Unknown",
        "Habit_Forming": 0,
        "Therapeutic_Class": "Unknown",
        "Action_Class": "Unknown",
        "energy": food["energy"],
        "protein": food["protein"],
        "fat": food["fat"],
        "carbs": food["carbs"],
        "fiber": food["fiber"],
        "calcium": food["calcium"],
        "iron": food["iron"],
        "vitamin_c": food["vitamin_c"],
        "vitamin_a": food["vitamin_a"],
        "vitamin_k_proxy": food["vitamin_k_proxy"],
        "is_alcohol": food["is_alcohol"],
        "is_leafy_green": food["is_leafy_green"],
        "meal_type": meal_type
    }

    input_df = pd.DataFrame([input_data])
    input_df = encode_input(input_df)

    risk_prediction = int(model.predict(input_df[features])[0])
    probability = model.predict_proba(input_df[features])[0].tolist()

    allergy_risks = check_allergy(food_name, allergies)

    score = 0

    if risk_prediction == 1:
        score += 50
    elif risk_prediction == 2:
        score += 80

    if allergy_risks:
        score += 40

    if score == 0:
        final_level = "Safe"
    elif score < 80:
        final_level = "Moderate"
    else:
        final_level = "Dangerous"

    alternative_list = []

    if final_level != "Safe":
        alternative_list = suggest_alternatives(food["energy"])

    return {
        "success": True,
        "drug_name": drug_name,
        "food_name": food_name,
        "meal_type": meal_type,
        "model_risk": label_map[risk_prediction],
        "allergy_risks": allergy_risks,
        "risk_score": score,
        "final_risk_level": final_level,
        "probability": probability,
        "recommended_alternatives": alternative_list
    }


if __name__ == "__main__":
    try:
        input_json = sys.argv[1]
        request_data = json.loads(input_json)

        result = predict_safety(request_data)

        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))