const mongoose = require("mongoose");

const supplementProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    age: {
      type: Number,
      required: true,
    },

    gender: {
      type: String,
      required: true,
      trim: true,
    },

    height_cm: {
      type: Number,
      required: true,
    },

    weight_kg: {
      type: Number,
      required: true,
    },

    bmi: {
      type: Number,
      required: true,
    },

    health_condition: {
      type: String,
      default: "none",
      trim: true,
    },

    medication: {
      type: String,
      default: "none",
      trim: true,
    },

    goal: {
      type: String,
      required: true,
      trim: true,
    },

    budget_range: {
      type: String,
      required: true,
      trim: true,
    },

    activity_level: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplementProfile", supplementProfileSchema);