const mongoose = require("mongoose");

// Parceiro do marketplace (PJ/responsável que opera uma ou mais lojas) — Fase D.
// Autentica pelo MESMO JWT do User (ownerUserId); KYC manual via dashboard, espelhando o padrão de driverDocuments.
const partnerSchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Usuário responsável é obrigatório"],
      index: true,
    },
    legalName: {
      type: String,
      required: [true, "Razão social é obrigatória"],
      trim: true,
    },
    tradeName: {
      type: String,
      required: [true, "Nome fantasia é obrigatório"],
      trim: true,
    },
    // CNPJ/CPF (segue padrão atual do Representative — armazenado em texto)
    document: { type: String, default: "" },
    documentHash: { type: String, index: true, sparse: true },
    contact: {
      email: { type: String, lowercase: true, trim: true, default: "" },
      phone: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },
    // KYC do parceiro — aprovação manual via admin (sem API biométrica/criminal)
    kyc: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected", "suspended"],
        default: "none",
        index: true,
      },
      documents: {
        socialContract: { type: String, default: "" },
        idFront: { type: String, default: "" },
        idBack: { type: String, default: "" },
        addressProof: { type: String, default: "" },
        storefrontPhoto: { type: String, default: "" },
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
    // Repasse (payout) — reusa a carteira do ownerUserId; saque via Withdrawal.
    payout: {
      method: { type: String, enum: ["wallet", "pix"], default: "wallet" },
      pixKey: { type: String, default: "" },
      holdDays: { type: Number, min: 0, default: 0 }, // D+N de retenção antes de liberar payout
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

partnerSchema.index({ status: 1, "kyc.status": 1 });

module.exports = mongoose.model("Partner", partnerSchema);
