const mongoose = require("mongoose");

const phoneVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true,
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
