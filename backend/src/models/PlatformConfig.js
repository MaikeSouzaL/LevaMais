const mongoose = require("mongoose");

const PlatformConfigSchema = new mongoose.Schema(
  {
    isDevelopmentMode: { type: Boolean, default: true },
    requireClientVerification: { type: Boolean, default: false },
    surgeEnabled: { type: Boolean, default: false },
    geofencingEnabled: { type: Boolean, default: false },
    appFeePercentage: { type: Number, default: 15 },
    feePerStop: { type: Number, default: 2 }, // Adicional de R$2 por parada
    rideSearchTimeoutSeconds: { type: Number, default: 300 },
    driverDailyGoalRides: { type: Number, default: 10 },
    driverDailyBonusAmount: { type: Number, default: 20 },
    operationalCreditAmount: { type: Number, default: 5 },
    appTimeZone: { type: String, default: "America/Sao_Paulo" },
    suggestedMinPricePercent: { type: Number, default: 0.8 },
    vehiclePricing: {
      motorcycle: {
        minimumKm: { type: Number, default: 3 },
        minimumFee: { type: Number, default: 7 },
        pricePerKm: { type: Number, default: 0.99 },
      },
      car: {
        minimumKm: { type: Number, default: 3 },
        minimumFee: { type: Number, default: 8 },
        pricePerKm: { type: Number, default: 2.5 },
      },
      van: {
        minimumKm: { type: Number, default: 5 },
        minimumFee: { type: Number, default: 20 },
        pricePerKm: { type: Number, default: 4 },
      },
      truck: {
        minimumKm: { type: Number, default: 5 },
        minimumFee: { type: Number, default: 35 },
        pricePerKm: { type: Number, default: 6 },
      },
    },
    logisticsMultipliers: {
      priorityEconomic: { type: Number, default: 1.0 },
      priorityFast: { type: Number, default: 1.3 },
      priorityUrgent: { type: Number, default: 1.8 },
      cargoSizeSmall: { type: Number, default: 1.0 },
      cargoSizeMedium: { type: Number, default: 1.15 },
      cargoSizeLarge: { type: Number, default: 1.4 },
      fragileSurcharge: { type: Number, default: 1.1 },
      helperSurcharge: { type: Number, default: 1.15 },
      weightUpTo5kg: { type: Number, default: 1.0 },
      weightUpTo15kg: { type: Number, default: 1.1 },
      weightUpTo30kg: { type: Number, default: 1.25 },
      weightUpTo50kg: { type: Number, default: 1.5 },
      weightAbove50kg: { type: Number, default: 1.8 },
    },
    supportChannels: {
      phone: { type: String, default: "0800123456" },
      email: { type: String, default: "suporte@levamais.app" },
      whatsapp: { type: String, default: "5500000000000" },
      helpCenterUrl: { type: String, default: "" },
    },
    policyVersions: {
      termsVersion: { type: String, default: "2026-05-14" },
      privacyPolicyVersion: { type: String, default: "2026-05-14" },
      consentVersion: { type: String, default: "2026-05-14" },
    },
    // Marketplace (Fase D). Gate de rollout + comissão padrão global.
    marketplace: {
      marketplaceEnabled: { type: Boolean, default: false },
      defaultCommissionPct: { type: Number, default: 12 },
      // Base da comissão: sobre os itens (subtotal) e não sobre o frete.
      commissionBase: { type: String, enum: ["subtotal", "total"], default: "subtotal" },
      payoutHoldDays: { type: Number, default: 0 },
      minOrderGlobal: { type: Number, default: 0 },
    },
    // Rotas planejadas / maloteiro (Fase D).
    plannedRoutes: {
      plannedRoutesEnabled: { type: Boolean, default: false },
      defaultCommissionPct: { type: Number, default: 15 },
      insuranceFeePct: { type: Number, default: 2 }, // garantia opcional de encomenda
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlatformConfig", PlatformConfigSchema);
