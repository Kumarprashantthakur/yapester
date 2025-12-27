const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const protect = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

router.get("/:userId", protect, async (req, res) => {
  try {
    const userA = req.user._id.toString();
    const userB = req.params.userId;

    const conversationId = [userA, userB].sort().join("_");

    const messages = await Message.find({ conversationId }).sort("createdAt");

    res.json(messages);
  } catch (err) {
    console.error("❌ FETCH ERROR:", err.message);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

module.exports = router;
