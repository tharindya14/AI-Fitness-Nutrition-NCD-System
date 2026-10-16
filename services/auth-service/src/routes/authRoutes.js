const express = require("express");
const router = express.Router();
const jsonParser = express.json();

const {
  register,
  login,
  getMyProfile,
  updateProfile,
  uploadProfileImage,
  setDefaultAvatar,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const uploadProfileImageMiddleware = require("../middleware/uploadMiddleware");

router.post("/register", jsonParser, register);
router.post("/login", jsonParser, login);

router.get("/me", authMiddleware, getMyProfile);
router.put("/profile", authMiddleware, jsonParser, updateProfile);

router.post(
  "/profile/image",
  authMiddleware,
  uploadProfileImageMiddleware.single("profileImage"),
  uploadProfileImage
);

router.put("/profile/default-avatar", authMiddleware, jsonParser, setDefaultAvatar);

module.exports = router;