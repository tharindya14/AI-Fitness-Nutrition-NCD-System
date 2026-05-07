const mongoose = require("mongoose");

const supplementScheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    recommendationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplementRecommendation",
    },

    supplement_id: {
      type: String,
      required: true,
    },

    supplement_name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    recommended_time: String,
    with_meal: String,

    frequency_per_day: {
      type: Number,
      default: 1,
    },

    dose_instruction: String,

    duration_weeks: {
      type: Number,
      default: 8,
    },

    avoid_with: String,
    spacing_rule: String,
    tracking_frequency: String,
    expected_result_window: String,
    adherence_tip: String,
    safety_note: String,

    start_date: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "completed", "stopped"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupplementSchedule", supplementScheduleSchema);