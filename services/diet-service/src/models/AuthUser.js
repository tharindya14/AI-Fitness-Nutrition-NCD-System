const mongoose = require("mongoose");

const authUserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
    },

    age: {
      type: Number,
      default: null,
    },

    gender: {
      type: String,
      default: "",
    },

    height: {
      type: Number,
      default: null,
    },

    weight: {
      type: Number,
      default: null,
    },

    bmi: {
      type: Number,
      default: null,
    },

    allergies: {
      type: [String],
      default: [],
    },

    medications: {
      type: [String],
      default: [],
    },

    healthConditions: {
      type: [String],
      default: [],
    },

    profileImage: {
      type: String,
      default: "",
    },

    defaultAvatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

module.exports =
  mongoose.models.AuthUser || mongoose.model("AuthUser", authUserSchema);