import pandas as pd
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent

DRUG_PATH = BASE_DIR / "datasets" / "drug_clean.csv"
FOOD_PATH = BASE_DIR / "datasets" / "food_subset.csv"
OUTPUT_PATH = BASE_DIR / "frontend" / "constants" / "suggestions.ts"

print("Reading datasets...")

drugs = pd.read_csv(DRUG_PATH, usecols=["Name", "Contains"])
foods = pd.read_csv(FOOD_PATH, usecols=["Food"])

drug_items = []

for _, row in drugs.iterrows():
    name = str(row.get("Name", "")).strip()
    contains = str(row.get("Contains", "")).strip()

    if name and name.lower() != "nan":
        drug_items.append({
            "name": name,
            "contains": "" if contains.lower() == "nan" else contains
        })

seen_drugs = set()
unique_drugs = []

for item in drug_items:
    key = item["name"].lower()
    if key not in seen_drugs:
        seen_drugs.add(key)
        unique_drugs.append(item)

food_items = []

for _, row in foods.iterrows():
    name = str(row.get("Food", "")).strip()

    if name and name.lower() != "nan":
        food_items.append({
            "name": name
        })

seen_foods = set()
unique_foods = []

for item in food_items:
    key = item["name"].lower()
    if key not in seen_foods:
        seen_foods.add(key)
        unique_foods.append(item)

content = f"""// Auto-generated from datasets/drug_clean.csv and datasets/food_subset.csv
// Do not edit manually. Run: python generate_suggestions.py

export const DRUG_SUGGESTIONS = {json.dumps(unique_drugs, ensure_ascii=False, indent=2)};

export const FOOD_SUGGESTIONS = {json.dumps(unique_foods, ensure_ascii=False, indent=2)};
"""

OUTPUT_PATH.write_text(content, encoding="utf-8")

print("Generated successfully!")
print(f"Output file: {OUTPUT_PATH}")
print(f"Drug suggestions: {len(unique_drugs)}")
print(f"Food suggestions: {len(unique_foods)}")