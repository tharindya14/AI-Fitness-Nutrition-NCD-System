const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    age: Number,
    gender: String,
    height: Number,
    weight: Number,
    bmi: Number,
    allergies: [String],
    medications: [String],
    healthConditions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);