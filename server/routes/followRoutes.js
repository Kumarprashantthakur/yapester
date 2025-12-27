const express = require("express");
const router = express.Router();
const Follow = require("../models/Follow");
const Message = require("../models/Message"); // 👈 MESSAGE MODEL
const protect = require("../middleware/authMiddleware");

/* ================= SEND FOLLOW ================= */
router.post("/send/:id", protect, async (req, res) => {
  try {
    const existing = await Follow.findOne({
      sender: req.user._id,
      receiver: req.params.id,
    });

    // 🔁 Allow follow again if disconnected
    if (existing) {
      if (existing.status === "disconnected") {
        existing.status = "pending";
        await existing.save();

        return res.json({
          message: "Follow request sent again",
        });
      }

      return res.status(400).json({
        message: "Already requested or connected",
      });
    }

    // 🆕 First time follow
    const follow = await Follow.create({
      sender: req.user._id,
      receiver: req.params.id,
      status: "pending",
    });

    res.json(follow);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Send failed" });
  }
});

/* ================= ACCEPT FOLLOW ================= */
router.post("/accept/:id", protect, async (req, res) => {
  try {
    const follow = await Follow.findById(req.params.id);

    if (!follow) {
      return res.status(404).json({ message: "Request not found" });
    }

    // 🧹 DELETE OLD CHAT (BOTH SIDES)
    await Message.deleteMany({
      $or: [
        { sender: follow.sender, receiver: follow.receiver },
        { sender: follow.receiver, receiver: follow.sender },
      ],
    });

    follow.status = "accepted";
    await follow.save();

    res.json({
      message: "Request accepted & new chat started",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Accept failed" });
  }
});

/* ================= REJECT FOLLOW ================= */
router.post("/reject/:id", protect, async (req, res) => {
  try {
    await Follow.findByIdAndDelete(req.params.id);
    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reject failed" });
  }
});

/* ================= CONNECTIONS ================= */
router.get("/connections", protect, async (req, res) => {
  try {
    const connections = await Follow.find({
      status: "accepted",
      $or: [
        { sender: req.user._id },
        { receiver: req.user._id },
      ],
    }).populate("sender receiver", "name username");

    res.json(connections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load connections" });
  }
});

/* ================= REQUESTS ================= */
router.get("/requests", protect, async (req, res) => {
  try {
    const requests = await Follow.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "name username");

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load requests" });
  }
});


/* ================= SENT REQUESTS ================= */
router.get("/sent", protect, async (req, res) => {
  try {
    const sentRequests = await Follow.find({
      sender: req.user._id,
      status: "pending",
    }).populate("receiver", "name username");

    res.json(sentRequests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load sent requests" });
  }
});





/* ================= DISCONNECT USER ================= */
router.post("/disconnect/:id", protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const otherUserId = req.params.id;

    const connection = await Follow.findOne({
      status: "accepted",
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    });

    if (!connection) {
      return res.status(400).json({
        message: "Already disconnected or not connected",
      });
    }

    connection.status = "disconnected";
    await connection.save();

    res.json({ message: "Disconnected successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Disconnect failed" });
  }
});

module.exports = router;
