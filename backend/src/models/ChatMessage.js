const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderType: {
      type: String,
      enum: ["client", "driver", "admin"],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

chatMessageSchema.index({ rideId: 1, createdAt: 1 });
chatMessageSchema.index({ receiverId: 1, readAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
