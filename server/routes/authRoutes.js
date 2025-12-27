const express = require("express");
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// ================= AUTH =================
router.post("/register", registerUser);
router.post("/login", loginUser);

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
