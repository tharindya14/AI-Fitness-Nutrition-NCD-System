const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const { searchMedications } = require("../controllers/medicationController");

const {
  getRecommendations,
  generateSchedule,
  addProgress,
  getMyHistory,
  getMySchedules,
  getMyProgress,
  getMyReport,
  getTodayProgress,
deleteProgress,
} = require("../controllers/supplementController");

// Public medication autocomplete, like diet-service /drugs
router.get("/drugs", searchMedications);

// Protected routes
router.post("/recommend", authMiddleware, getRecommendations);
router.post("/schedule", authMiddleware, generateSchedule);
router.post("/progress", authMiddleware, addProgress);

router.get("/history", authMiddleware, getMyHistory);
router.get("/schedules", authMiddleware, getMySchedules);
router.get("/progress", authMiddleware, getMyProgress);
router.get("/progress/today", authMiddleware, getTodayProgress);
router.delete("/progress/:progressId", authMiddleware, deleteProgress);
router.get("/report", authMiddleware, getMyReport);

module.exports = router;