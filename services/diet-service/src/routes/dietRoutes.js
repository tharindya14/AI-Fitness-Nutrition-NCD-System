const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  checkDietSafety,
  getMyDietHistory,
  deleteDietHistoryItem,
} = require("../controllers/dietController");

const { searchFoods, searchDrugs } = require("../controllers/searchController");

router.get("/foods", searchFoods);
router.get("/drugs", searchDrugs);

router.post("/check-safety", authMiddleware, checkDietSafety);
router.get("/history", authMiddleware, getMyDietHistory);
router.delete("/history/:id", authMiddleware, deleteDietHistoryItem);

module.exports = router;