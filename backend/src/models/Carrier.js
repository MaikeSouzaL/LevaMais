const mongoose = require("mongoose");

// Transportadora (Fase D / Modo Transportadora) — perfil de um motorista que opera
// como mini-transportadora: rotas recorrentes, frete sob demanda e perfil público.
// Upgrade de conta com KYP próprio (aprovação manual via dashboard), espelhando Partner.kyc.
const carrierSchema = new mongoose.Schema(
  {
    driverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Motorista é obrigatório"],
      unique: true,
      index: true,
    },
    brandName: {
      type: String,
      required: [true, "Nome da transportadora é obrigatório"],
      trim: true,
    },
    slug: { type: String, unique: true, lowercase: true, trim: true }, // perfil público
    logo: { type: String, default: "" },
    bio: { type: String, default: "" },
    document: { type: String, default: "" }, // CNPJ/CPF
    documentHash: { type: String, index: true, sparse: true },
    contact: {
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      email: { type: String, lowercase: true, trim: true, default: "" },
    },
    // Áreas de atuação (cidades atendidas)
    serviceAreas: [
      {
        cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
        label: { type: String, default: "" },
      },
    ],
    // KYC da transportadora — aprovação manual via admin
    kyc: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected", "suspended"],
        default: "none",
        index: true,
      },
      documents: {
        idFront: { type: String, default: "" },
        idBack: { type: String, default: "" },
        addressProof: { type: String, default: "" },
        vehicleDoc: { type: String, default: "" },
        selfie: { type: String, default: "" },
      },
      rejectionReason: { type: String, default: "" },
      submittedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      reviewHistory: [
        {
          action: String,
          reason: String,
          reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          reviewedAt: { type: Date, default: Date.now },
        },
      ],
    },
    // Tabela de preços padrão da transportadora (usada em rotas/fretes próprios)
    pricing: {
      basePrice: { type: Number, min: 0, default: 0 },
      pricePerKg: { type: Number, min: 0, default: 0 },
      sizeMultipliers: {
        small: { type: Number, default: 1 },
        medium: { type: Number, default: 1.2 },
        large: { type: Number, default: 1.5 },
      },
    },
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    stats: {
      totalRoutes: { type: Number, default: 0 },
      totalDeliveries: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["active", "paused", "under_review", "blocked"],
      default: "under_review",
      index: true,
    },
    statusReason: { type: String, default: "" },
  },
  { timestamps: true },
);

carrierSchema.index({ status: 1, "kyc.status": 1 });
carrierSchema.index({ "serviceAreas.cityId": 1, status: 1 });

module.exports = mongoose.model("Carrier", carrierSchema);
