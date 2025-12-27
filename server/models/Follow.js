const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
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
   status: {
  type: String,
  enum: ["pending", "accepted", "disconnected"],
  default: "pending",
}
,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Follow", followSchema);
