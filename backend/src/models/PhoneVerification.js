const mongoose = require("mongoose");

const phoneVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  phone: {
    type: String,
    required: true,
    index: true,
  },
  method: {
    type: String,
    enum: ["sms", "whatsapp", "voice", "manual"],
    default: "sms",
  },
  code: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
  used: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  verifiedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

phoneVerificationSchema.index({ phone: 1, used: 1, createdAt: -1 });

module.exports = mongoose.model("PhoneVerification", phoneVerificationSchema);
