const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  checkDietSafety,
  getMyDietHistory,
} = require("../controllers/dietController");

router.post("/check-safety", authMiddleware, checkDietSafety);
router.get("/history", authMiddleware, getMyDietHistory);

module.exports = router;