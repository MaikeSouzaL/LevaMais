const mongoose = require("mongoose");

const senderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Only one sender profile per user
    },
    address: {
      type: String,
      required: true,
    },
    formattedAddress: { type: String, trim: true },
    details: { type: String, trim: true },
    contactName: { type: String, trim: true },
    contactPhone: { type: String, trim: true },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

senderSchema.pre("validate", function (next) {
  if (!this.formattedAddress && this.address) this.formattedAddress = this.address;
  next();
});

const Sender = mongoose.model("Sender", senderSchema, "remetentes");

module.exports = Sender;
