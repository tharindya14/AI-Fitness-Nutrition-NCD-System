import pandas as pd

INTERACTIONS_PATH = "../../datasets/interactions.csv"

def check_interaction(user_medication, supplement_ingredients):
    interactions = pd.read_csv(INTERACTIONS_PATH)

    user_medication = str(user_medication).lower().strip()
    supplement_ingredients = str(supplement_ingredients).lower()

    risks = []

    for _, row in interactions.iterrows():
        medicine = str(row["medicine"]).lower().strip()
        ingredient = str(row["supplement_ingredient"]).lower().strip()

        if medicine == user_medication and ingredient in supplement_ingredients:
            risks.append({
                "medicine": row["medicine"],
                "ingredient": row["supplement_ingredient"],
                "risk": row["interaction_risk"],
                "severity": row["severity"],
                "recommendation": row["recommendation"]
            })

    return risks