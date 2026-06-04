const mongoose = require("mongoose");

const disputeMessageSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorType: { type: String, enum: ["client", "driver", "admin"], required: true },
    message: { type: String, trim: true, maxlength: 2000 },
    evidenceUrls: [{ type: String, trim: true }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const disputeSchema = new mongoose.Schema(
  {
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true, index: true },
    openedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    category: {
      type: String,
      enum: [
        "payment",
        "safety",
        "delivery_problem",
        "cancellation_fee",
        "route",
        "behavior",
        "other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved", "rejected", "cancelled"],
      default: "open",
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    description: { type: String, trim: true, required: true, maxlength: 3000 },
    messages: [disputeMessageSchema],
    resolution: {
      summary: { type: String, trim: true, maxlength: 3000 },
      amountAdjusted: { type: Number, default: 0 },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      resolvedAt: { type: Date },
    },
  },
  { timestamps: true },
);

disputeSchema.index({ rideId: 1, openedBy: 1, status: 1 });
disputeSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Dispute", disputeSchema);
