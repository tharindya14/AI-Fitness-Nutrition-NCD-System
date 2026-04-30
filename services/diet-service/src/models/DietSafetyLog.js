const mongoose = require("mongoose");

const dietSafetyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    drugName: String,
    foodName: String,
    mealType: String,
    allergies: [String],
    modelRisk: String,
    allergyRisks: [String],
    riskScore: Number,
    finalRiskLevel: String,
    probability: [Number],
    recommendedAlternatives: Array,
  },
  { timestamps: true }
);

module.exports = mongoose.model("DietSafetyLog", dietSafetyLogSchema);