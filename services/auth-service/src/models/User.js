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
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);