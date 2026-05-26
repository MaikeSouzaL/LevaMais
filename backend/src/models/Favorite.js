const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    label: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      default: "home",
    },
    address: {
      type: String,
      required: true,
    },
    formattedAddress: { type: String, trim: true },
    street: { type: String, trim: true },
    streetNumber: { type: String, trim: true },
    neighborhood: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    region: { type: String, trim: true },
    postalCode: { type: String, trim: true },
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

favoriteSchema.pre("validate", function (next) {
  if (!this.name && this.label) this.name = this.label;
  if (!this.label && this.name) this.label = this.name;
  if (!this.formattedAddress && this.address) this.formattedAddress = this.address;
  next();
});

favoriteSchema.index({ userId: 1, icon: 1, createdAt: -1 });
favoriteSchema.index({ userId: 1, name: 1, icon: 1, address: 1 }, { unique: false });

const Favorite = mongoose.model("Favorite", favoriteSchema, "favoritos");

module.exports = Favorite;
