const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    pixKey: {
      type: String,
      required: true,
    },
    pixKeyType: {
      type: String,
      enum: ["cpf", "email", "phone", "random"],
      default: "cpf",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "paid", "rejected"],
      default: "pending",
    },
    transactionId: String,
    scheduledFor: Date,
    notes: String,
    processedAt: Date,
    cancelledAt: Date,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
