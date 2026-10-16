import os
import pandas as pd
import random


BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SCHEDULE_RULES_PATH = os.path.join(BASE_DIR, "datasets/supplement_dataset", "schedule_rules.csv")


def normalize_text(value):
    return str(value).strip().lower()


def load_schedule_rules():
    if not os.path.exists(SCHEDULE_RULES_PATH):
        raise FileNotFoundError(f"Schedule rules dataset not found: {SCHEDULE_RULES_PATH}")

    schedule_df = pd.read_csv(SCHEDULE_RULES_PATH)

    for col in schedule_df.columns:
        if schedule_df[col].dtype == "object":
            schedule_df[col] = schedule_df[col].astype(str).str.strip().str.lower()

    return schedule_df


def generate_supplement_schedule(selected_supplement):
    schedule_df = load_schedule_rules()

    category = normalize_text(selected_supplement.get("category", ""))
    ingredients = normalize_text(selected_supplement.get("ingredients", ""))
    goal = normalize_text(selected_supplement.get("goal", ""))

    matched_rules = schedule_df[
        schedule_df["supplement_category"].astype(str).str.contains(category, case=False, na=False)
    ]

    if matched_rules.empty:
        matched_rules = schedule_df[
            schedule_df["target_goal"].astype(str).str.contains(goal, case=False, na=False)
        ]

    if matched_rules.empty:
        matched_rules = schedule_df[
            schedule_df["ingredient_keyword"].astype(str).apply(
                lambda x: x in ingredients if isinstance(x, str) else False
            )
        ]

    if matched_rules.empty:
        matched_rules = schedule_df.sample(1, random_state=random.randint(1, 9999))

    rule = matched_rules.sample(1, random_state=random.randint(1, 9999)).iloc[0]

    schedule = {
        "supplement_id": selected_supplement.get("supplement_id", ""),
        "supplement_name": selected_supplement.get("name", ""),
        "category": selected_supplement.get("category", ""),
        "recommended_time": str(rule.get("recommended_time", "")).title(),
        "with_meal": str(rule.get("with_meal", "")).title(),
        "frequency_per_day": int(rule.get("frequency_per_day", 1)),
        "dose_instruction": str(rule.get("dose_instruction", "")).title(),
        "duration_weeks": int(rule.get("duration_weeks", 8)),
        "avoid_with": str(rule.get("avoid_with", "")).title(),
        "spacing_rule": str(rule.get("spacing_rule", "")).title(),
        "tracking_frequency": str(rule.get("tracking_frequency", "")).title(),
        "expected_result_window": str(rule.get("expected_result_window", "")).title(),
        "adherence_tip": str(rule.get("adherence_tip", "")).title(),
        "safety_note": "This schedule is for decision-support only. Follow product label instructions and consult a healthcare professional when needed."
    }

    return schedule