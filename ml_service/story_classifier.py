import sys
import json
import pandas as pd
import joblib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "story_classifier_model.pkl"
DRUG_PATH = BASE_DIR / "datasets" / "drug_clean.csv"
FOOD_PATH = BASE_DIR / "datasets" / "food_subset.csv"

story_model = joblib.load(MODEL_PATH)
drugs = pd.read_csv(DRUG_PATH, usecols=["Name", "Contains"])
foods = pd.read_csv(FOOD_PATH)


def normalize_text(text):
    return str(text).lower().strip()


def detect_drug(story):
    story_lower = normalize_text(story)

    matches = []

    for _, row in drugs.iterrows():
        name = str(row["Name"])
        contains = str(row["Contains"])

        name_lower = normalize_text(name)

        if len(name_lower) >= 4 and name_lower in story_lower:
            matches.append((name, contains, len(name_lower)))

    if matches:
        matches.sort(key=lambda x: x[2], reverse=True)
        return matches[0][0], matches[0][1]

    active_keywords = [
        "warfarin",
        "metformin",
        "atorvastatin",
        "simvastatin",
        "levothyroxine",
        "thyroxine",
        "paracetamol",
        "aspirin",
        "ibuprofen",
    ]

    for keyword in active_keywords:
        if keyword in story_lower:
            matched = drugs[
                drugs["Contains"]
                .astype(str)
                .str.lower()
                .str.contains(keyword, na=False, regex=False)
            ]

            if not matched.empty:
                row = matched.iloc[0]
                return str(row["Name"]), str(row["Contains"])

    return "", ""


def detect_food(story):
    story_lower = normalize_text(story)

    matches = []

    for _, row in foods.iterrows():
        food = str(row["Food"])
        food_lower = normalize_text(food)

        if len(food_lower) >= 3 and food_lower in story_lower:
            matches.append((food, len(food_lower)))

    if matches:
        matches.sort(key=lambda x: x[1], reverse=True)
        return matches[0][0]

    simple_foods = {
        "beer": "Beer",
        "alcohol": "Alcohol",
        "wine": "Wine",
        "spinach": "Spinach",
        "water": "Water",
        "milk": "Milk",
        "rice": "White Rice",
        "grapefruit": "Grapefruit Juice",
        "kola mallum": "Kola Mallum",
        "gotukola": "Gotukola Sambol",
        "cheese": "Cheese",
        "yogurt": "Yogurt",
    }

    for key, value in simple_foods.items():
        if key in story_lower:
            return value

    return ""


def classify_story(story):
    nlp_prediction = story_model.predict([story])[0]

    try:
        probabilities = story_model.predict_proba([story])[0].tolist()
        classes = story_model.classes_.tolist()
    except Exception:
        probabilities = []
        classes = []

    detected_drug, drug_contains = detect_drug(story)
    detected_food = detect_food(story)

    return {
        "success": True,
        "story": story,
        "nlp_prediction": nlp_prediction,
        "detected_drug": detected_drug,
        "drug_contains": drug_contains,
        "detected_food": detected_food,
        "classes": classes,
        "probability": probabilities,
    }


if __name__ == "__main__":
    try:
        input_arg = sys.argv[1]

        if input_arg.endswith(".json"):
            with open(input_arg, "r", encoding="utf-8") as file:
                request_data = json.load(file)
        else:
            request_data = json.loads(input_arg)

        story = request_data.get("story", "")

        if not story.strip():
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": "Story is required",
                    }
                )
            )
            sys.exit(0)

        result = classify_story(story)
        print(json.dumps(result))

    except Exception as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(error),
                }
            )
        )