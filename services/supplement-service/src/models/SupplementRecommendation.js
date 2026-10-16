const mongoose = require("mongoose");

const recommendationItemSchema = new mongoose.Schema(
  {
    supplement_id: String,
    name: String,
    category: String,
    target_goal: String,
    ingredients: String,
    dosage: String,
    brand: String,
    size: String,
    form: String,
    price_lkr: Number,
    price_range_lkr: String,
    rating: Number,
    store_name: String,
    safety_status: String,
  },
  { _id: false }
);

const unsafeProductSchema = new mongoose.Schema(
  {
    supplement_id: String,
    name: String,
    category: String,
    price_lkr: Number,
    warnings: Array,
  },
  { _id: false }
);

const supplementRecommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplementProfile",
    },

    predicted_category: {
      type: String,
      required: true,
    },

    user_budget_range: {
      type: String,
      required: true,
    },

    total_matched_products: {
      type: Number,
      default: 0,
    },

    safe_products_count: {
      type: Number,
      default: 0,
    },

    unsafe_products_count: {
      type: Number,
      default: 0,
    },

    recommendations: [recommendationItemSchema],

    unsafe_products: [unsafeProductSchema],

    note: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "SupplementRecommendation",
  supplementRecommendationSchema
);