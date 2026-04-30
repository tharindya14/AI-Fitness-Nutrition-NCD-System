import sys
import json
import pandas as pd
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "food_drug_risk_model.pkl"
ENCODER_PATH = BASE_DIR / "models" / "encoders.pkl"

FOOD_PATH = BASE_DIR / "datasets" / "food_subset.csv"
DRUG_CLEAN_PATH = BASE_DIR / "datasets" / "drug_clean.csv"
TRAIN_PATH = BASE_DIR / "datasets" / "food_drug_pairs_train.csv"
ALLERGEN_PATH = BASE_DIR / "datasets" / "food_ingredients_and_allergens.csv"
ALTERNATIVE_PATH = BASE_DIR / "datasets" / "alternative_foods.csv"

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)

foods = pd.read_csv(FOOD_PATH)
drugs = pd.read_csv(DRUG_CLEAN_PATH)
train_pairs = pd.read_csv(TRAIN_PATH)
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
    "is_leafy_green"
]

label_map = {
    0: "Safe",
    1: "Moderate",
    2: "Dangerous"
}


def normalize_text(value):
    return str(value).lower().strip()


def get_drug_features(drug_name):
    drug_name_lower = normalize_text(drug_name)

    # 1. Search in drug_clean.csv by Name
    if "Name" in drugs.columns:
        exact_match = drugs[
            drugs["Name"].astype(str).str.lower().str.strip() == drug_name_lower
        ]

        if not exact_match.empty:
            row = exact_match.iloc[0]
            return {
                "Chemical_Class": row["Chemical_Class"] if "Chemical_Class" in drugs.columns else "Unknown",
                "Habit_Forming": row["Habit_Forming"] if "Habit_Forming" in drugs.columns else 0,
                "Therapeutic_Class": row["Therapeutic_Class"] if "Therapeutic_Class" in drugs.columns else "Unknown",
                "Action_Class": row["Action_Class"] if "Action_Class" in drugs.columns else "Unknown",
                "drug_found": True,
                "drug_source": "drug_clean.csv exact name"
            }

    # 2. Search in drug_clean.csv by Contains
    if "Contains" in drugs.columns:
        contains_match = drugs[
            drugs["Contains"].astype(str).str.lower().str.contains(drug_name_lower, na=False, regex=False)
        ]

        if not contains_match.empty:
            row = contains_match.iloc[0]
            return {
                "Chemical_Class": row["Chemical_Class"] if "Chemical_Class" in drugs.columns else "Unknown",
                "Habit_Forming": row["Habit_Forming"] if "Habit_Forming" in drugs.columns else 0,
                "Therapeutic_Class": row["Therapeutic_Class"] if "Therapeutic_Class" in drugs.columns else "Unknown",
                "Action_Class": row["Action_Class"] if "Action_Class" in drugs.columns else "Unknown",
                "drug_found": True,
                "drug_source": "drug_clean.csv contains"
            }

    # 3. Fallback search in food_drug_pairs_train.csv
    train_exact = train_pairs[
        train_pairs["drug_name"].astype(str).str.lower().str.strip() == drug_name_lower
    ]

    if not train_exact.empty:
        row = train_exact.iloc[0]
        return {
            "Chemical_Class": row["Chemical_Class"],
            "Habit_Forming": row["Habit_Forming"],
            "Therapeutic_Class": row["Therapeutic_Class"],
            "Action_Class": row["Action_Class"],
            "drug_found": True,
            "drug_source": "food_drug_pairs_train.csv exact"
        }

    train_partial = train_pairs[
        train_pairs["drug_name"].astype(str).str.lower().str.contains(drug_name_lower, na=False, regex=False)
    ]

    if not train_partial.empty:
        row = train_partial.iloc[0]
        return {
            "Chemical_Class": row["Chemical_Class"],
            "Habit_Forming": row["Habit_Forming"],
            "Therapeutic_Class": row["Therapeutic_Class"],
            "Action_Class": row["Action_Class"],
            "drug_found": True,
            "drug_source": "food_drug_pairs_train.csv partial"
        }

    return {
        "Chemical_Class": "Unknown",
        "Habit_Forming": 0,
        "Therapeutic_Class": "Unknown",
        "Action_Class": "Unknown",
        "drug_found": False,
        "drug_source": "not_found"
    }


def find_food(food_name):
    food_name_lower = normalize_text(food_name)

    exact_match = foods[
        foods["Food"].astype(str).str.lower().str.strip() == food_name_lower
    ]

    if not exact_match.empty:
        return exact_match.iloc[0]

    partial_match = foods[
        foods["Food"].astype(str).str.lower().str.contains(food_name_lower, na=False, regex=False)
    ]

    if not partial_match.empty:
        return partial_match.iloc[0]

    return None


def check_allergy(food_name, user_allergies):
    if not user_allergies:
        return []

    food_name_lower = normalize_text(food_name)

    matched_rows = allergen_df[
        allergen_df["Food Product"]
        .astype(str)
        .str.lower()
        .str.contains(food_name_lower, na=False, regex=False)
    ]

    detected = []

    for _, row in matched_rows.iterrows():
        allergens_text = str(row["Allergens"]).lower()

        for allergy in user_allergies:
            if normalize_text(allergy) in allergens_text:
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


def alternative_has_allergy(food_name, user_allergies):
    risks = check_allergy(food_name, user_allergies)
    return len(risks) > 0


def suggest_alternatives(original_energy, user_allergies=None, original_food_is_alcohol=0, max_results=5):
    if user_allergies is None:
        user_allergies = []

    df = alternatives.copy()

    # Remove alcohol items
    if "is_alcohol" in df.columns:
        df = df[df["is_alcohol"] == 0]

    # If original food is alcohol, ONLY recommend beverages/drinks
    if int(original_food_is_alcohol) == 1:
        if "consumption_type" in df.columns:
            beverage_df = df[
                df["consumption_type"].astype(str).str.lower().isin(
                    ["beverage", "drink"]
                )
            ]

            if not beverage_df.empty:
                df = beverage_df

        # Extra keyword filter for drink-like items
        drink_keywords = [
            "water", "juice", "tea", "coffee", "coconut", "smoothie",
            "milk", "lassi", "beverage", "drink"
        ]

        keyword_df = df[
            df["Food"].astype(str).str.lower().apply(
                lambda x: any(keyword in x for keyword in drink_keywords)
            )
        ]

        if not keyword_df.empty:
            df = keyword_df

    # Remove alternatives that match user allergies
    safe_rows = []

    for _, row in df.iterrows():
        alt_food_name = str(row["Food"])

        if not alternative_has_allergy(alt_food_name, user_allergies):
            safe_rows.append(row)

    df = pd.DataFrame(safe_rows)

    if df.empty:
        return []

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
            "consumption_type",
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

def apply_rule_based_safety(food, drug_name):
    warnings = []

    food_name = normalize_text(food["Food"])
    drug_name_lower = normalize_text(drug_name)

    is_alcohol = int(food["is_alcohol"]) if "is_alcohol" in food else 0
    is_leafy_green = int(food["is_leafy_green"]) if "is_leafy_green" in food else 0
    vitamin_k = float(food["vitamin_k_proxy"]) if "vitamin_k_proxy" in food else 0
    calcium = float(food["calcium"]) if "calcium" in food else 0
    carbs = float(food["carbs"]) if "carbs" in food else 0

    # General alcohol safety rule
    if is_alcohol == 1:
        warnings.append({
            "type": "alcohol_interaction",
            "severity": "Dangerous",
            "message": "Alcohol may interact with medications and increase side effects."
        })

    # Warfarin + vitamin K / leafy greens
    if "warfarin" in drug_name_lower and (is_leafy_green == 1 or vitamin_k > 0):
        warnings.append({
            "type": "vitamin_k_warfarin",
            "severity": "Moderate",
            "message": "Vitamin K rich foods may affect warfarin effectiveness."
        })

    # Statin + grapefruit
    if ("atorvastatin" in drug_name_lower or "simvastatin" in drug_name_lower) and "grapefruit" in food_name:
        warnings.append({
            "type": "grapefruit_statin",
            "severity": "Dangerous",
            "message": "Grapefruit can increase statin side effects."
        })

    # Metformin + high carb
    if "metformin" in drug_name_lower and carbs > 60:
        warnings.append({
            "type": "high_carb_diabetes_drug",
            "severity": "Moderate",
            "message": "High carbohydrate foods may affect blood glucose control."
        })

    # Thyroxine + calcium rich food
    if ("thyroxine" in drug_name_lower or "levothyroxine" in drug_name_lower) and calcium > 100:
        warnings.append({
            "type": "calcium_thyroid_absorption",
            "severity": "Moderate",
            "message": "Calcium-rich foods may reduce thyroid medicine absorption."
        })

    return warnings

def build_explanation(drug_name, food_name, model_risk, allergy_risks, rule_warnings, final_level):
    key_risks = []

    for warning in rule_warnings:
        key_risks.append(warning["message"])

    if allergy_risks:
        key_risks.append(
            "This food may contain ingredients related to the user's allergy profile: "
            + ", ".join(allergy_risks)
        )

    if not key_risks:
        key_risks.append("No major food-drug or allergy risk was detected from the available dataset.")

    if final_level == "Dangerous":
        summary = (
            f"Combining {drug_name} with {food_name} is classified as a high-risk choice. "
            "The system detected safety concerns based on the food properties, medication-related data, "
            "and rule-based safety checks."
        )
        advice = (
            f"Avoid consuming {food_name} with {drug_name}. "
            "Choose a safer alternative and consult a qualified healthcare professional if unsure."
        )

    elif final_level == "Moderate":
        summary = (
            f"Combining {drug_name} with {food_name} may require caution. "
            "The system detected a moderate safety concern."
        )
        advice = (
            "Consume only with caution and follow medical or dietary guidance. "
            "A safer alternative is recommended if available."
        )

    else:
        summary = (
            f"No major safety issue was detected for {drug_name} with {food_name} "
            "based on the available dataset and safety rules."
        )
        advice = "This food appears safe according to the current system analysis."

    return {
        "summary": summary,
        "key_risks": key_risks,
        "advice": advice,
        "disclaimer": "This is a decision-support result only and should not be considered medical advice."
    }


def calculate_final_score(model_risk, allergy_risks, rule_warnings):
    score = 0

    if model_risk == 1:
        score += 50
    elif model_risk == 2:
        score += 80

    for warning in rule_warnings:
        if warning["severity"] == "Dangerous":
            score += 80
        elif warning["severity"] == "Moderate":
            score += 50

    if allergy_risks:
        score += 40

    if score > 100:
        score = 100

    if score == 0:
        level = "Safe"
    elif score < 80:
        level = "Moderate"
    else:
        level = "Dangerous"

    return score, level


def predict_safety(request_data):
    drug_name = request_data.get("drug_name", "")
    food_name = request_data.get("food_name", "")
    allergies = request_data.get("allergies", [])

    food = find_food(food_name)

    if food is None:
        return {
            "success": False,
            "error": "Food not found in food_subset.csv",
            "food_name": food_name
        }

    drug_features = get_drug_features(drug_name)

    input_data = {
        "Chemical_Class": drug_features["Chemical_Class"],
        "Habit_Forming": drug_features["Habit_Forming"],
        "Therapeutic_Class": drug_features["Therapeutic_Class"],
        "Action_Class": drug_features["Action_Class"],
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
        "is_leafy_green": food["is_leafy_green"]
    }

    input_df = pd.DataFrame([input_data])
    input_df = encode_input(input_df)

    risk_prediction = int(model.predict(input_df[features])[0])
    probability = model.predict_proba(input_df[features])[0].tolist()

    allergy_risks = check_allergy(food["Food"], allergies)
    rule_warnings = apply_rule_based_safety(food, drug_name)

    risk_score, final_level = calculate_final_score(
        risk_prediction,
        allergy_risks,
        rule_warnings
    )

    explanation = build_explanation(
    drug_name,
    food["Food"],
    label_map[risk_prediction],
    allergy_risks,
    rule_warnings,
    final_level
    )

    alternative_list = []

    if final_level != "Safe":
       alternative_list = suggest_alternatives(
           food["energy"],
           allergies,
           food["is_alcohol"]
       )

    return {
        "success": True,
        "drug_name": drug_name,
        "drug_found": drug_features["drug_found"],
        "drug_source": drug_features["drug_source"],
        "food_name": food["Food"],
        "requested_food_name": food_name,
        "model_risk": label_map[risk_prediction],
        "allergy_risks": allergy_risks,
        "rule_warnings": rule_warnings,
        "risk_score": risk_score,
        "final_risk_level": final_level,
        "probability": probability,
        "explanation": explanation,
        "recommended_alternatives": alternative_list,
    }


if __name__ == "__main__":
    try:
        input_arg = sys.argv[1]

        # If input is a JSON file path, read from file
        if input_arg.endswith(".json"):
            with open(input_arg, "r", encoding="utf-8") as file:
                request_data = json.load(file)
        else:
            request_data = json.loads(input_arg)

        result = predict_safety(request_data)
        print(json.dumps(result))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result))


