const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    conversationId: {
      type: String,
      required: true,
    },

    // 🔥 THIS WAS MISSING (MAIN BUG)
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent", // ✅ sabse important
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
