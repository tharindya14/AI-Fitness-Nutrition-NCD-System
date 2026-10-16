import os
import pickle
import pandas as pd

from safety_checker import check_supplement_safety


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

MODEL_PATH = os.path.join(BASE_DIR, "models/supplement", "supplement_model.pkl")
SUPPLEMENTS_PATH = os.path.join(BASE_DIR, "datasets/supplement_dataset", "supplements_sri_lankan_prices.csv")
INTERACTIONS_PATH = os.path.join(BASE_DIR, "datasets/supplement_dataset", "interactions.csv")


def normalize_text(value):
    return str(value).strip().lower()


def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    with open(MODEL_PATH, "rb") as file:
        model = pickle.load(file)

    return model


def load_datasets():
    if not os.path.exists(SUPPLEMENTS_PATH):
        raise FileNotFoundError(f"Supplements dataset not found: {SUPPLEMENTS_PATH}")

    if not os.path.exists(INTERACTIONS_PATH):
        raise FileNotFoundError(f"Interactions dataset not found: {INTERACTIONS_PATH}")

    supplements_df = pd.read_csv(SUPPLEMENTS_PATH)
    interactions_df = pd.read_csv(INTERACTIONS_PATH)

    # Normalize text columns
    for col in supplements_df.columns:
        if supplements_df[col].dtype == "object":
            supplements_df[col] = supplements_df[col].astype(str).str.strip().str.lower()

    for col in interactions_df.columns:
        if interactions_df[col].dtype == "object":
            interactions_df[col] = interactions_df[col].astype(str).str.strip().str.lower()

    return supplements_df, interactions_df


def prepare_user_dataframe(user_profile):
    user_data = pd.DataFrame([{
        "age": int(user_profile["age"]),
        "gender": normalize_text(user_profile["gender"]),
        "height_cm": float(user_profile["height_cm"]),
        "weight_kg": float(user_profile["weight_kg"]),
        "bmi": float(user_profile["bmi"]),
        "health_condition": normalize_text(user_profile["health_condition"]),
        "medication": normalize_text(user_profile["medication"]),
        "goal": normalize_text(user_profile["goal"]),
        "budget_range": normalize_text(user_profile["budget_range"]),
        "activity_level": normalize_text(user_profile["activity_level"])
    }])

    return user_data


def filter_supplements_by_category_and_budget(supplements_df, predicted_category, budget_range, goal):
    predicted_category = normalize_text(predicted_category)
    budget_range = normalize_text(budget_range)
    goal = normalize_text(goal)

    # Exact category + budget match
    recommended_products = supplements_df[
        (supplements_df["category"].astype(str).str.lower() == predicted_category) &
        (supplements_df["price_range_lkr"].astype(str).str.lower() == budget_range)
    ]

    # Flexible match if exact match is empty
    if recommended_products.empty:
        recommended_products = supplements_df[
            (
                supplements_df["category"].astype(str).str.contains(predicted_category, case=False, na=False) |
                supplements_df["target_goal"].astype(str).str.contains(goal, case=False, na=False) |
                supplements_df["ingredients"].astype(str).str.contains(predicted_category, case=False, na=False)
            ) &
            (supplements_df["price_range_lkr"].astype(str).str.lower() == budget_range)
        ]

    # If budget match empty, use category only
    if recommended_products.empty:
        recommended_products = supplements_df[
            supplements_df["category"].astype(str).str.contains(predicted_category, case=False, na=False)
        ]

    # If still empty, use goal match
    if recommended_products.empty:
        recommended_products = supplements_df[
            supplements_df["target_goal"].astype(str).str.contains(goal, case=False, na=False)
        ]

    return recommended_products

def rank_products_by_goal(products_df, goal):
    goal = normalize_text(goal)

    def score_product(row):
        score = 0

        name = normalize_text(row.get("name", ""))
        ingredients = normalize_text(row.get("ingredients", ""))
        target_goal = normalize_text(row.get("target_goal", ""))
        category = normalize_text(row.get("category", ""))

        # Goal matching
        if goal in target_goal:
            score += 5

        # Muscle gain priority
        if any(word in goal for word in ["muscle", "strength", "body", "arms", "gain"]):
            if "whey" in ingredients or "whey" in name:
                score += 10
            if "protein" in ingredients or "protein" in name:
                score += 8
            if "creatine" in ingredients or "creatine" in name:
                score += 7
            if "bcaa" in ingredients or "branched-chain" in ingredients:
                score += 5
            if "collagen" in ingredients or "collagen" in name:
                score -= 5

        # Recovery priority
        if "recovery" in goal:
            if "bcaa" in ingredients:
                score += 8
            if "glutamine" in ingredients:
                score += 6
            if "whey" in ingredients:
                score += 5

        # Heart health priority
        if "heart" in goal:
            if "omega" in ingredients or "fish oil" in ingredients:
                score += 10

        # Rating priority
        try:
            score += float(row.get("rating", 0))
        except:
            score += 0

        return score

    products_df = products_df.copy()
    products_df["recommendation_score"] = products_df.apply(score_product, axis=1)

    products_df = products_df.sort_values(
        by=["recommendation_score", "rating"],
        ascending=False
    )

    return products_df

def convert_products_to_response(products_df, limit=5):
    response = []

    for _, row in products_df.head(limit).iterrows():
        response.append({
            "supplement_id": str(row.get("supplement_id", "")),
            "name": str(row.get("name", "")).title(),
            "category": str(row.get("category", "")).title(),
            "target_goal": str(row.get("target_goal", "")).title(),
            "ingredients": str(row.get("ingredients", "")),
            "dosage": str(row.get("dosage", "")),
            "brand": str(row.get("brand", "")).title(),
            "size": str(row.get("size", "")),
            "form": str(row.get("form", "")),
            "price_lkr": float(row.get("price_lkr", 0)),
            "price_range_lkr": str(row.get("price_range_lkr", "")),
            "rating": float(row.get("rating", 0)),
            "store_name": str(row.get("store_name", "")).title(),
            "safety_status": "safe"
        })

    return response


def get_supplement_recommendations(user_profile):
    model = load_model()
    supplements_df, interactions_df = load_datasets()

    user_df = prepare_user_dataframe(user_profile)

    predicted_category = model.predict(user_df)[0]
    predicted_category = normalize_text(predicted_category)

    user_budget = normalize_text(user_profile["budget_range"])
    user_goal = normalize_text(user_profile["goal"])
    user_medication = normalize_text(user_profile["medication"])

    recommended_products = filter_supplements_by_category_and_budget(
        supplements_df=supplements_df,
        predicted_category=predicted_category,
        budget_range=user_budget,
        goal=user_goal
    )

    safe_products_df, unsafe_products = check_supplement_safety(
        recommended_products=recommended_products,
        user_medications=[user_medication],
        interactions_df=interactions_df
    )

    ranked_safe_products_df = rank_products_by_goal(
    safe_products_df,
    user_goal
    )

    final_recommendations = convert_products_to_response(
        ranked_safe_products_df,
        limit=5
    )

    return {
        "predicted_category": predicted_category,
        "user_budget_range": user_budget,
        "total_matched_products": int(len(recommended_products)),
        "safe_products_count": int(len(safe_products_df)),
        "unsafe_products_count": int(len(unsafe_products)),
        "recommendations": final_recommendations,
        "unsafe_products": unsafe_products[:5],
        "note": "This is a decision-support recommendation only. Consult a healthcare professional before using supplements with medications or health conditions."
    }