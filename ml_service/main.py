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

DRUG_DRUG_PATH = BASE_DIR / "datasets" / "drug_drug_interactions.csv"
USER_PROFILE_PATH = BASE_DIR / "datasets" / "user_profiles.csv"
USER_MEDICINES_PATH = BASE_DIR / "datasets" / "user_medicines.csv"
BMI_GUIDANCE_PATH = BASE_DIR / "datasets" / "bmi_food_guidance.csv"

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)

foods = pd.read_csv(FOOD_PATH)
drugs = pd.read_csv(DRUG_CLEAN_PATH)
train_pairs = pd.read_csv(TRAIN_PATH)
allergen_df = pd.read_csv(ALLERGEN_PATH)
alternatives = pd.read_csv(ALTERNATIVE_PATH)

drug_drug_df = pd.read_csv(DRUG_DRUG_PATH)
user_profiles_df = pd.read_csv(USER_PROFILE_PATH)
user_medicines_df = pd.read_csv(USER_MEDICINES_PATH)
bmi_guidance_df = pd.read_csv(BMI_GUIDANCE_PATH)

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


def calculate_bmi(height_cm, weight_kg):
    try:
        height_m = float(height_cm) / 100
        weight_kg = float(weight_kg)

        if height_m <= 0 or weight_kg <= 0:
            return None, "Invalid"

        bmi = round(weight_kg / (height_m ** 2), 2)

        if bmi < 18.5:
            category = "Underweight"
        elif bmi < 25:
            category = "Normal"
        elif bmi < 30:
            category = "Overweight"
        else:
            category = "Obese"

        return bmi, category

    except Exception:
        return None, "Invalid"


def get_bmi_advice(bmi_category):
    if bmi_category == "Underweight":
        return "User is underweight. Nutrient-dense and balanced food choices are recommended."
    elif bmi_category == "Normal":
        return "User BMI is in the normal range. Balanced food choices are recommended."
    elif bmi_category == "Overweight":
        return "User is overweight. Lower sugar and lower calorie alternatives may be more suitable."
    elif bmi_category == "Obese":
        return "User is in the obese BMI category. Lower calorie, lower sugar, and lower sodium alternatives should be prioritized."
    elif bmi_category == "Invalid":
        return "Invalid height or weight values were provided."
    else:
        return "BMI was not provided, so BMI-based food guidance was not applied."


def get_drug_features(drug_name):
    drug_name_lower = normalize_text(drug_name)

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
                "drug_contains": row["Contains"] if "Contains" in drugs.columns else "",
                "drug_found": True,
                "drug_source": "drug_clean.csv exact name"
            }

    if "Contains" in drugs.columns:
        contains_match = drugs[
            drugs["Contains"].astype(str).str.lower().str.contains(
                drug_name_lower,
                na=False,
                regex=False
            )
        ]

        if not contains_match.empty:
            row = contains_match.iloc[0]
            return {
                "Chemical_Class": row["Chemical_Class"] if "Chemical_Class" in drugs.columns else "Unknown",
                "Habit_Forming": row["Habit_Forming"] if "Habit_Forming" in drugs.columns else 0,
                "Therapeutic_Class": row["Therapeutic_Class"] if "Therapeutic_Class" in drugs.columns else "Unknown",
                "Action_Class": row["Action_Class"] if "Action_Class" in drugs.columns else "Unknown",
                "drug_contains": row["Contains"] if "Contains" in drugs.columns else "",
                "drug_found": True,
                "drug_source": "drug_clean.csv contains"
            }

    if "drug_name" in train_pairs.columns:
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
                "drug_contains": row["drug_contains"] if "drug_contains" in row else "",
                "drug_found": True,
                "drug_source": "food_drug_pairs_train.csv exact"
            }

        train_partial = train_pairs[
            train_pairs["drug_name"].astype(str).str.lower().str.contains(
                drug_name_lower,
                na=False,
                regex=False
            )
        ]

        if not train_partial.empty:
            row = train_partial.iloc[0]
            return {
                "Chemical_Class": row["Chemical_Class"],
                "Habit_Forming": row["Habit_Forming"],
                "Therapeutic_Class": row["Therapeutic_Class"],
                "Action_Class": row["Action_Class"],
                "drug_contains": row["drug_contains"] if "drug_contains" in row else "",
                "drug_found": True,
                "drug_source": "food_drug_pairs_train.csv partial"
            }

    return {
        "Chemical_Class": "Unknown",
        "Habit_Forming": 0,
        "Therapeutic_Class": "Unknown",
        "Action_Class": "Unknown",
        "drug_contains": "",
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
        foods["Food"].astype(str).str.lower().str.contains(
            food_name_lower,
            na=False,
            regex=False
        )
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
        if col not in input_df.columns:
            continue

        input_df[col] = input_df[col].astype(str)
        known_classes = set(le.classes_)

        input_df[col] = input_df[col].apply(
            lambda x: x if x in known_classes else le.classes_[0]
        )

        input_df[col] = le.transform(input_df[col])

    return input_df


def check_drug_drug_interactions(medicine_names):
    interactions = []

    if not medicine_names or len(medicine_names) < 2:
        return interactions

    df = drug_drug_df.copy()
    df.columns = df.columns.astype(str).str.strip()

    required_columns = [
        "medicine_1_name",
        "medicine_1_active_ingredient",
        "medicine_1_class",
        "medicine_2_name",
        "medicine_2_active_ingredient",
        "medicine_2_class",
        "interaction_risk",
        "severity",
        "risk_score",
        "mechanism",
        "recommendation",
        "source_type",
        "evidence_level"
    ]

    missing_columns = [col for col in required_columns if col not in df.columns]

    if missing_columns:
        return [{
            "error": "Missing required columns in drug_drug_interactions.csv",
            "missing_columns": missing_columns,
            "available_columns": df.columns.tolist()
        }]

    normalized_meds = [normalize_text(med) for med in medicine_names]

    for i in range(len(normalized_meds)):
        for j in range(i + 1, len(normalized_meds)):
            med1 = normalized_meds[i]
            med2 = normalized_meds[j]

            matched = df[
                (
                    (df["medicine_1_name"].astype(str).str.lower().str.strip() == med1) &
                    (df["medicine_2_name"].astype(str).str.lower().str.strip() == med2)
                )
                |
                (
                    (df["medicine_1_name"].astype(str).str.lower().str.strip() == med2) &
                    (df["medicine_2_name"].astype(str).str.lower().str.strip() == med1)
                )
            ]

            if not matched.empty:
                row = matched.iloc[0]

                try:
                    risk_score = int(row["risk_score"])
                except Exception:
                    severity_text = str(row["severity"]).lower()

                    if severity_text == "dangerous":
                        risk_score = 90
                    elif severity_text == "moderate":
                        risk_score = 60
                    elif severity_text == "low":
                        risk_score = 20
                    else:
                        risk_score = 0

                interactions.append({
                    "interaction_id": row["interaction_id"] if "interaction_id" in df.columns else "",
                    "medicine_1": row["medicine_1_name"],
                    "medicine_2": row["medicine_2_name"],
                    "active_ingredient_1": row["medicine_1_active_ingredient"],
                    "active_ingredient_2": row["medicine_2_active_ingredient"],
                    "medicine_1_class": row["medicine_1_class"],
                    "medicine_2_class": row["medicine_2_class"],
                    "interaction_type": row["interaction_risk"],
                    "severity": row["severity"],
                    "risk_score": risk_score,
                    "explanation": row["mechanism"],
                    "recommendation": row["recommendation"],
                    "source_type": row["source_type"],
                    "evidence_level": row["evidence_level"]
                })

    return interactions


def alternative_has_allergy(food_name, user_allergies):
    risks = check_allergy(food_name, user_allergies)
    return len(risks) > 0


def suggest_alternatives(
    original_energy,
    user_allergies=None,
    original_food_is_alcohol=0,
    bmi_category=None,
    max_results=5
):
    if user_allergies is None:
        user_allergies = []

    df = alternatives.copy()

    if "is_alcohol" in df.columns:
        df = df[df["is_alcohol"] == 0]

    if int(original_food_is_alcohol) == 1:
        if "consumption_type" in df.columns:
            beverage_df = df[
                df["consumption_type"].astype(str).str.lower().isin(
                    ["beverage", "drink"]
                )
            ]

            if not beverage_df.empty:
                df = beverage_df

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

    if bmi_category in ["Overweight", "Obese"]:
        if "sugars" in df.columns:
            sort_cols.insert(0, "sugars")
            ascending.insert(0, True)

        if "sodium" in df.columns:
            sort_cols.insert(1, "sodium")
            ascending.insert(1, True)

        if "energy" in df.columns:
            sort_cols.insert(2, "energy")
            ascending.insert(2, True)

    elif bmi_category == "Underweight":
        if "protein" in df.columns:
            sort_cols.insert(0, "protein")
            ascending.insert(0, False)

        if "energy" in df.columns:
            sort_cols.insert(1, "energy")
            ascending.insert(1, False)

    else:
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
            "fiber",
            "sugars",
            "sodium",
            "quantity"
        ]
        if col in df.columns
    ]

    results = df[available_cols].head(max_results).to_dict(orient="records")

    for item in results:
        if bmi_category in ["Overweight", "Obese"]:
            item["bmi_reason"] = "Prioritized lower sugar, lower sodium, and lower calorie alternatives."
        elif bmi_category == "Underweight":
            item["bmi_reason"] = "Prioritized nutrient-dense alternatives with higher energy or protein."
        elif bmi_category == "Normal":
            item["bmi_reason"] = "Prioritized balanced alternatives."
        else:
            item["bmi_reason"] = "BMI guidance was not applied."

    return results


def apply_rule_based_safety(food, drug_name, drug_contains=""):
    warnings = []

    food_name = normalize_text(food["Food"])
    drug_name_lower = normalize_text(drug_name)
    drug_contains_lower = normalize_text(drug_contains)

    drug_check_text = f"{drug_name_lower} {drug_contains_lower}"

    is_alcohol = int(food["is_alcohol"]) if "is_alcohol" in food else 0
    is_leafy_green = int(food["is_leafy_green"]) if "is_leafy_green" in food else 0
    vitamin_k = float(food["vitamin_k_proxy"]) if "vitamin_k_proxy" in food else 0
    calcium = float(food["calcium"]) if "calcium" in food else 0
    carbs = float(food["carbs"]) if "carbs" in food else 0

    if is_alcohol == 1:
        warnings.append({
            "type": "alcohol_interaction",
            "severity": "Dangerous",
            "message": "Alcohol may interact with medications and increase side effects."
        })

    if "warfarin" in drug_check_text and (is_leafy_green == 1 or vitamin_k > 0):
        warnings.append({
            "type": "vitamin_k_warfarin",
            "severity": "Moderate",
            "message": "Vitamin K rich foods such as spinach may affect warfarin effectiveness."
        })

    if (
        ("atorvastatin" in drug_check_text or "simvastatin" in drug_check_text)
        and "grapefruit" in food_name
    ):
        warnings.append({
            "type": "grapefruit_statin",
            "severity": "Dangerous",
            "message": "Grapefruit can increase statin side effects."
        })

    if "metformin" in drug_check_text and carbs > 60:
        warnings.append({
            "type": "high_carb_diabetes_drug",
            "severity": "Moderate",
            "message": "High carbohydrate foods may affect blood glucose control."
        })

    if (
        ("thyroxine" in drug_check_text or "levothyroxine" in drug_check_text)
        and calcium > 100
    ):
        warnings.append({
            "type": "calcium_thyroid_absorption",
            "severity": "Moderate",
            "message": "Calcium-rich foods may reduce thyroid medicine absorption."
        })

    return warnings


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


def predict_single_food_drug(drug_name, food, allergies):
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

    rule_warnings = apply_rule_based_safety(
        food,
        drug_name,
        drug_features.get("drug_contains", "")
    )

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

    return {
        "drug_name": drug_name,
        "drug_contains": drug_features.get("drug_contains", ""),
        "drug_found": drug_features["drug_found"],
        "drug_source": drug_features["drug_source"],
        "model_risk": label_map[risk_prediction],
        "probability": probability,
        "rule_warnings": rule_warnings,
        "allergy_risks": allergy_risks,
        "risk_score": risk_score,
        "final_risk_level": final_level,
        "explanation": explanation
    }


def get_highest_risk_level(food_drug_results, drug_drug_interactions):
    max_score = 0

    for item in food_drug_results:
        item_score = int(item.get("risk_score", 0))
        if item_score > max_score:
            max_score = item_score

    for interaction in drug_drug_interactions:
        if "error" in interaction:
            continue
    
        severity = str(interaction.get("severity", "")).lower()
    
        try:
            risk_score = int(interaction.get("risk_score", 0))
        except Exception:
            risk_score = 0
    
        if severity == "dangerous":
            max_score = max(max_score, 90)
        elif severity == "moderate":
            max_score = max(max_score, 60)
        else:
            max_score = max(max_score, risk_score)

    if max_score >= 80:
        level = "Dangerous"
    elif max_score >= 30:
        level = "Moderate"
    else:
        level = "Safe"

    return max_score, level


def build_overall_summary(food_name, food_drug_results, drug_drug_interactions, final_level):
    summary_messages = []

    if drug_drug_interactions:
        for interaction in drug_drug_interactions:
            summary_messages.append(
                f"{interaction['medicine_1']} and {interaction['medicine_2']} have a "
                f"{interaction['severity']} drug-drug interaction: {interaction['explanation']}"
            )

    for result in food_drug_results:
        if result["final_risk_level"] != "Safe":
            summary_messages.append(
                f"{food_name} may have a {result['final_risk_level']} interaction with "
                f"{result['drug_name']}."
            )

    if not summary_messages:
        summary_messages.append(
            "No major safety issue was detected from the available dataset and rules."
        )

    if final_level == "Dangerous":
        overall_advice = (
            "High-risk result detected. Avoid this combination and choose a safer alternative. "
            "Consult a qualified healthcare professional if unsure."
        )
    elif final_level == "Moderate":
        overall_advice = (
            "Moderate-risk result detected. Consume with caution and follow medical or dietary guidance."
        )
    else:
        overall_advice = (
            "This combination appears safe according to the current system analysis."
        )

    return {
        "summary_messages": summary_messages,
        "overall_advice": overall_advice
    }


def predict_safety(request_data):
    height_cm = request_data.get("height_cm")
    weight_kg = request_data.get("weight_kg")
    medicine_names = request_data.get("medicine_names", [])
    food_name = request_data.get("food_name", "")
    allergies = request_data.get("allergies", [])

    old_drug_name = request_data.get("drug_name", "")

    if old_drug_name and not medicine_names:
        medicine_names = [old_drug_name]

    if isinstance(medicine_names, str):
        medicine_names = [medicine_names]

    medicine_names = [
        med.strip() for med in medicine_names
        if str(med).strip()
    ]

    if not medicine_names:
        return {
            "success": False,
            "error": "At least one medicine is required."
        }

    if not food_name:
        return {
            "success": False,
            "error": "Food name is required."
        }

    food = find_food(food_name)

    if food is None:
        return {
            "success": False,
            "error": "Food not found in food_subset.csv",
            "food_name": food_name
        }

    bmi = None
    bmi_category = "Not Provided"

    if height_cm is not None and weight_kg is not None:
        bmi, bmi_category = calculate_bmi(height_cm, weight_kg)

    bmi_advice = get_bmi_advice(bmi_category)

    drug_drug_interactions = check_drug_drug_interactions(medicine_names)

    food_drug_results = []

    for medicine in medicine_names:
        result = predict_single_food_drug(
            medicine,
            food,
            allergies
        )
        food_drug_results.append(result)

    final_score, final_level = get_highest_risk_level(
        food_drug_results,
        drug_drug_interactions
    )

    alternative_list = []

    if final_level != "Safe":
        alternative_list = suggest_alternatives(
            original_energy=food["energy"],
            user_allergies=allergies,
            original_food_is_alcohol=food["is_alcohol"],
            bmi_category=bmi_category
        )

    overall_summary = build_overall_summary(
        food_name=food["Food"],
        food_drug_results=food_drug_results,
        drug_drug_interactions=drug_drug_interactions,
        final_level=final_level
    )

    return {
        "success": True,
        "height_cm": height_cm,
        "weight_kg": weight_kg,
        "bmi": bmi,
        "bmi_category": bmi_category,
        "bmi_advice": bmi_advice,
        "medicine_names": medicine_names,
        "food_name": food["Food"],
        "requested_food_name": food_name,
        "drug_drug_interactions": drug_drug_interactions,
        "food_drug_results": food_drug_results,
        "final_risk_score": final_score,
        "final_risk_level": final_level,
        "summary": overall_summary["summary_messages"],
        "overall_advice": overall_summary["overall_advice"],
        "recommended_alternatives": alternative_list,
        "disclaimer": "This is a decision-support result only and should not be considered medical advice."
    }


if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            raise ValueError("Please provide a JSON input or JSON file path.")

        input_arg = sys.argv[1]

        if input_arg.endswith(".json"):
            with open(input_arg, "r", encoding="utf-8") as file:
                request_data = json.load(file)
        else:
            request_data = json.loads(input_arg)

        result = predict_safety(request_data)
        print(json.dumps(result, ensure_ascii=False, indent=2))

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_result, ensure_ascii=False, indent=2))