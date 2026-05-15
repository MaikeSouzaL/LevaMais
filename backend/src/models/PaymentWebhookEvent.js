const mongoose = require("mongoose");

const paymentWebhookEventSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["processed", "already_settled", "acknowledged"],
      default: "acknowledged",
    },
    rawPayload: {
      type: Object,
      default: {},
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    replayedAt: {
      type: Date,
      required: false,
    },
    replayReason: {
      type: String,
      trim: true,
      required: false,
    },
    replayedBy: {
      adminId: {
        type: String,
        trim: true,
      },
      adminEmail: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

paymentWebhookEventSchema.index({ transactionId: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("PaymentWebhookEvent", paymentWebhookEventSchema);
