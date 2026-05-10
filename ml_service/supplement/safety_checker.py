import pandas as pd


def normalize_text(value):
    return str(value).strip().lower()


def check_supplement_safety(recommended_products, user_medications, interactions_df):
    safe_products = []
    unsafe_products = []

    user_medications = [normalize_text(med) for med in user_medications]

    for _, product in recommended_products.iterrows():
        product_ingredients = normalize_text(product.get("ingredients", ""))
        product_name = str(product.get("name", "unknown product"))

        product_warnings = []

        for med in user_medications:
            if med in ["none", "no", "nan", ""]:
                continue

            med_rules = interactions_df[
                interactions_df["medicine"].astype(str).str.contains(med, case=False, na=False)
            ]

            for _, rule in med_rules.iterrows():
                risky_ingredient = normalize_text(rule.get("supplement_ingredient", ""))

                if risky_ingredient and risky_ingredient in product_ingredients:
                    product_warnings.append({
                        "medicine": str(rule.get("medicine", "")),
                        "supplement_ingredient": str(rule.get("supplement_ingredient", "")),
                        "interaction_risk": str(rule.get("interaction_risk", "")),
                        "severity": str(rule.get("severity", "")),
                        "recommendation": str(rule.get("recommendation", ""))
                    })

        if product_warnings:
            unsafe_products.append({
                "supplement_id": str(product.get("supplement_id", "")),
                "name": product_name.title(),
                "category": str(product.get("category", "")).title(),
                "price_lkr": float(product.get("price_lkr", 0)),
                "warnings": product_warnings
            })
        else:
            safe_products.append(product)

    safe_products_df = pd.DataFrame(safe_products)

    return safe_products_df, unsafe_products