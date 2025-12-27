const express = require("express");
const router = express.Router();
const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

/* ================= CURRENT USER ================= */
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("_id name username email");

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ================= ALL USERS ================= */
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find()
      .select("_id name username email");

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

module.exports = router;
