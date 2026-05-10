def generate_schedule(ingredients):
    ingredients = str(ingredients).lower()

    if "protein" in ingredients or "whey" in ingredients:
        return "After workout"

    elif "creatine" in ingredients:
        return "After workout or morning"

    elif "omega" in ingredients or "fish oil" in ingredients:
        return "After meal"

    elif "iron" in ingredients:
        return "Morning before meal"

    elif "caffeine" in ingredients:
        return "30 minutes before workout"

    elif "calcium" in ingredients:
        return "After meal"

    else:
        return "As directed"
    