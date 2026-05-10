const mongoose = require("mongoose");

const dietSafetyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    heightCm: Number,
    weightKg: Number,
    bmi: Number,
    bmiCategory: String,
    bmiAdvice: String,

    medicineNames: [String],
    foodName: String,
    requestedFoodName: String,
    allergies: [String],

    drugDrugInteractions: Array,
    foodDrugResults: Array,

    finalRiskScore: Number,
    finalRiskLevel: String,
    summary: [String],
    overallAdvice: String,

    recommendedAlternatives: Array,
    disclaimer: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DietSafetyLog", dietSafetyLogSchema);