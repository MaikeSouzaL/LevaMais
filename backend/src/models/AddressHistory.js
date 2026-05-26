const mongoose = require("mongoose");

const addressHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    context: {
      type: String,
      enum: ["sender", "receiver", "general"],
      default: "general",
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    formattedAddress: {
      type: String,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    details: {
      type: String,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ["search", "favorite", "manual", "ride"],
      default: "search",
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    useCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

addressHistorySchema.pre("validate", function (next) {
  if (!this.formattedAddress && this.address) this.formattedAddress = this.address;
  if (!this.name && this.address) this.name = this.address.split(",")[0];
  next();
});

addressHistorySchema.index({ userId: 1, context: 1, lastUsedAt: -1 });
addressHistorySchema.index({ userId: 1, address: 1, context: 1 });

module.exports = mongoose.model("AddressHistory", addressHistorySchema, "address_histories");
