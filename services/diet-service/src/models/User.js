const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    password: String,
    age: Number,
    gender: String,
    height: Number,
    weight: Number,
    allergies: [String],
    medications: [String],
    healthConditions: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema, "users");