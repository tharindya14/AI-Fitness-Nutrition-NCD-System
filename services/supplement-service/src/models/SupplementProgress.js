const mongoose = require("mongoose");

const supplementProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplementSchedule",
      required: true,
      index: true,
    },

    supplement_id: {
      type: String,
      required: true,
    },

    supplement_name: {
      type: String,
      required: true,
    },

    log_date: {
      type: Date,
      default: Date.now,
      index: true,
    },

    log_day: {
      type: String,
      required: true,
      index: true,
      // format: YYYY-MM-DD
    },

    taken_status: {
      type: String,
      enum: ["taken", "missed", "skipped"],
      required: true,
    },

    weight_kg: Number,
    bmi: Number,

    energy_level_1_5: {
      type: Number,
      min: 1,
      max: 5,
    },

    workout_performance_1_5: {
      type: Number,
      min: 1,
      max: 5,
    },

    side_effects: {
      type: String,
      default: "None",
    },

    goal_progress_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// One progress record per user + schedule + day
supplementProgressSchema.index(
  { userId: 1, scheduleId: 1, log_day: 1 },
  { unique: true }
);

module.exports = mongoose.model("SupplementProgress", supplementProgressSchema);