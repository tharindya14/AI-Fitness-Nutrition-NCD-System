const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const User = require("../models/User");

const ALTERNATIVE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "datasets",
  "alternative_foods.csv"
);

function loadFoods() {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(ALTERNATIVE_PATH)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

function calculateBMI(heightCm, weightKg) {
  const heightM = Number(heightCm) / 100;
  const weight = Number(weightKg);

  if (!heightM || !weight) return null;

  return Number((weight / (heightM * heightM)).toFixed(1));
}

function getBmiCategory(bmi) {
  if (!bmi) return "Unknown";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function isAllergySafe(foodName, userAllergies = []) {
  const name = String(foodName || "").toLowerCase();

  for (const allergy of userAllergies) {
    const a = String(allergy || "").toLowerCase().trim();

    if (a && name.includes(a)) {
      return false;
    }
  }

  return true;
}

async function getPersonalizedRecommendations(req, res) {
  try {
    const userId = req.user.userId || req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const bmi = calculateBMI(user.height, user.weight);
    const bmiCategory = getBmiCategory(bmi);

    let foods = await loadFoods();

    foods = foods.filter((food) => Number(food.is_alcohol || 0) === 0);

    foods = foods.filter((food) =>
      isAllergySafe(food.Food, user.allergies || [])
    );

    foods = foods.map((food) => ({
      Food: food.Food,
      food_type: food.food_type,
      consumption_type: food.consumption_type,
      energy: Number(food.energy || 0),
      protein: Number(food.protein || 0),
      carbs: Number(food.carbs || 0),
      fat: Number(food.fat || 0),
      fiber: Number(food.fiber || 0),
      sugars: Number(food.sugars || 0),
      sodium: Number(food.sodium || 0),
      quantity: food.quantity,
    }));

    let filteredFoods = [...foods];
    let recommendationGoal = "Balanced healthy foods";

    if (bmiCategory === "Underweight") {
      recommendationGoal = "Higher calorie healthy foods for weight gain support";

      filteredFoods = filteredFoods
        .filter((food) => food.energy >= 150)
        .sort((a, b) => b.energy - a.energy);
    } else if (bmiCategory === "Overweight" || bmiCategory === "Obese") {
      recommendationGoal = "Lower calorie foods for weight management support";

      filteredFoods = filteredFoods
        .filter((food) => food.energy <= 150 && food.sugars <= 10)
        .sort((a, b) => a.energy - b.energy);
    } else {
      recommendationGoal = "Balanced foods for normal BMI range";

      filteredFoods = filteredFoods
        .filter((food) => food.energy <= 250)
        .sort((a, b) => b.protein - a.protein);
    }

    const recommendations = filteredFoods.slice(0, 8);

    return res.json({
      success: true,
      userProfile: {
        fullName: user.fullName,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        allergies: user.allergies || [],
        medications: user.medications || [],
        healthConditions: user.healthConditions || [],
      },
      bmi,
      bmiCategory,
      recommendationGoal,
      recommendations,
      explanation: {
        summary: `Based on the user's BMI category (${bmiCategory}), allergies, and profile details, the system selected suitable non-alcoholic food options.`,
        note: "This is a personalized dietary support feature and should not replace professional medical or nutritional advice.",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to generate personalized recommendations",
      error: error.message,
    });
  }
}

module.exports = {
  getPersonalizedRecommendations,
};