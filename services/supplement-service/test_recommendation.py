from recommendation_engine import get_recommendations
from schedule_generator import generate_schedule

user_id = "U0020"

result = get_recommendations(user_id)

if "error" in result:
    print(result["error"])
else:
    print("\nUSER DETAILS")
    print("User ID:", result["user_id"])
    print("Goal:", result["goal"])

    print("\nSAFE SUPPLEMENTS")
    for s in result["safe"]:
        print("----------------------")
        print("Name:", s["name"])
        print("Category:", s["category"])
        print("Rating:", s["rating"])
        print("Price:", s["price_range"])
        print("Dosage:", s["dosage"])
        print("Schedule:", generate_schedule(s["ingredients"]))

    print("\nBLOCKED SUPPLEMENTS")
    for s in result["blocked"]:
        print("----------------------")
        print("Name:", s["name"])
        print("Risk:", s["risks"])