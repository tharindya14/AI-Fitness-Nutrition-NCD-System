const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  checkDietSafety,
  getMyDietHistory,
} = require("../controllers/dietController");

const { searchFoods, searchDrugs } = require("../controllers/searchController");

const {
  getPersonalizedRecommendations,
} = require("../controllers/recommendationController");

const {
  classifyFoodDrugStory,
} = require("../controllers/storyController");

router.get("/foods", searchFoods);
router.get("/drugs", searchDrugs);

router.post("/check-safety", authMiddleware, checkDietSafety);
router.get("/history", authMiddleware, getMyDietHistory);
router.get("/recommendations", authMiddleware, getPersonalizedRecommendations);
router.post("/classify-story", authMiddleware, classifyFoodDrugStory);

module.exports = router;