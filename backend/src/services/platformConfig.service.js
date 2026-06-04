const PlatformConfig = require("../models/PlatformConfig");

const DEFAULT_PLATFORM_CONFIG = {
  isDevelopmentMode: true,
  // Exige verificação de identidade do cliente (KYC) antes de pedir corrida.
  // Default false: sem fricção. Admin liga quando quiser.
  requireClientVerification: false,
  // Surge pricing (preço dinâmico por demanda). Default false (preço estável).
  surgeEnabled: false,
  // Geofencing: bloquear pedidos fora do raio das cidades ativas. Default false.
  geofencingEnabled: false,
  appFeePercentage: 15,
  feePerStop: 2, // Adicional por parada
  rideSearchTimeoutSeconds: 300,
  driverDailyGoalRides: 10,
  driverDailyBonusAmount: 20,
  appTimeZone: "America/Sao_Paulo",
  suggestedMinPricePercent: 0.8,
  vehiclePricing: {
    motorcycle: { minimumKm: 3, minimumFee: 7, pricePerKm: 0.99 },
    car: { minimumKm: 3, minimumFee: 8, pricePerKm: 2.5 },
    van: { minimumKm: 5, minimumFee: 20, pricePerKm: 4 },
    truck: { minimumKm: 5, minimumFee: 35, pricePerKm: 6 },
  },
  // Preços específicos para CORRIDAS (separado de entregas)
  ridePricing: {
    motorcycle: {
      baseFare: 5.00,        // tarifa base
      perKm: 1.50,           // por km
      minimumFare: 8.00,     // tarifa mínima
      minimumDistance: 2,    // km mínimo
    },
    car: {
      baseFare: 8.00,
      perKm: 2.50,
      minimumFare: 12.00,
      minimumDistance: 2,
    },
  },
  logisticsMultipliers: {
    priorityEconomic: 1.0,
    priorityFast: 1.3,
    priorityUrgent: 1.8,
    cargoSizeSmall: 1.0,
    cargoSizeMedium: 1.15,
    cargoSizeLarge: 1.4,
    fragileSurcharge: 1.1,
    helperSurcharge: 1.15,
    weightUpTo5kg: 1.0,
    weightUpTo15kg: 1.1,
    weightUpTo30kg: 1.25,
    weightUpTo50kg: 1.5,
    weightAbove50kg: 1.8,
  },
  supportChannels: {
    phone: "0800123456",
    email: "suporte@levamais.app",
    whatsapp: "5500000000000",
    helpCenterUrl: "",
  },
  policyVersions: {
    termsVersion: "2026-05-14",
    privacyPolicyVersion: "2026-05-14",
    consentVersion: "2026-05-14",
  },
};

function sanitizeNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizeString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function mergeConfig(raw = {}) {
  const vehiclePricing = raw.vehiclePricing || {};
  const logistics = raw.logisticsMultipliers || {};

  return {
    isDevelopmentMode:
      raw.isDevelopmentMode !== undefined
        ? Boolean(raw.isDevelopmentMode)
        : DEFAULT_PLATFORM_CONFIG.isDevelopmentMode,
    requireClientVerification:
      raw.requireClientVerification !== undefined
        ? Boolean(raw.requireClientVerification)
        : DEFAULT_PLATFORM_CONFIG.requireClientVerification,
    surgeEnabled:
      raw.surgeEnabled !== undefined
        ? Boolean(raw.surgeEnabled)
        : DEFAULT_PLATFORM_CONFIG.surgeEnabled,
    geofencingEnabled:
      raw.geofencingEnabled !== undefined
        ? Boolean(raw.geofencingEnabled)
        : DEFAULT_PLATFORM_CONFIG.geofencingEnabled,
    appFeePercentage: sanitizeNumber(
      raw.appFeePercentage,
      DEFAULT_PLATFORM_CONFIG.appFeePercentage,
    ),
    feePerStop: sanitizeNumber(
      raw.feePerStop,
      DEFAULT_PLATFORM_CONFIG.feePerStop,
    ),
    rideSearchTimeoutSeconds: sanitizeNumber(
      raw.rideSearchTimeoutSeconds,
      DEFAULT_PLATFORM_CONFIG.rideSearchTimeoutSeconds,
    ),
    driverDailyGoalRides: sanitizeNumber(
      raw.driverDailyGoalRides,
      DEFAULT_PLATFORM_CONFIG.driverDailyGoalRides,
    ),
    driverDailyBonusAmount: sanitizeNumber(
      raw.driverDailyBonusAmount,
      DEFAULT_PLATFORM_CONFIG.driverDailyBonusAmount,
    ),
    appTimeZone: sanitizeString(
      raw.appTimeZone,
      DEFAULT_PLATFORM_CONFIG.appTimeZone,
    ),
    suggestedMinPricePercent: sanitizeNumber(
      raw.suggestedMinPricePercent,
      DEFAULT_PLATFORM_CONFIG.suggestedMinPricePercent,
    ),
    vehiclePricing: {
      motorcycle: {
        minimumKm: sanitizeNumber(
          vehiclePricing?.motorcycle?.minimumKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.motorcycle.minimumKm,
        ),
        minimumFee: sanitizeNumber(
          vehiclePricing?.motorcycle?.minimumFee,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.motorcycle.minimumFee,
        ),
        pricePerKm: sanitizeNumber(
          vehiclePricing?.motorcycle?.pricePerKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.motorcycle.pricePerKm,
        ),
      },
      car: {
        minimumKm: sanitizeNumber(
          vehiclePricing?.car?.minimumKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.car.minimumKm,
        ),
        minimumFee: sanitizeNumber(
          vehiclePricing?.car?.minimumFee,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.car.minimumFee,
        ),
        pricePerKm: sanitizeNumber(
          vehiclePricing?.car?.pricePerKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.car.pricePerKm,
        ),
      },
      van: {
        minimumKm: sanitizeNumber(
          vehiclePricing?.van?.minimumKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.van.minimumKm,
        ),
        minimumFee: sanitizeNumber(
          vehiclePricing?.van?.minimumFee,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.van.minimumFee,
        ),
        pricePerKm: sanitizeNumber(
          vehiclePricing?.van?.pricePerKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.van.pricePerKm,
        ),
      },
      truck: {
        minimumKm: sanitizeNumber(
          vehiclePricing?.truck?.minimumKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.truck.minimumKm,
        ),
        minimumFee: sanitizeNumber(
          vehiclePricing?.truck?.minimumFee,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.truck.minimumFee,
        ),
        pricePerKm: sanitizeNumber(
          vehiclePricing?.truck?.pricePerKm,
          DEFAULT_PLATFORM_CONFIG.vehiclePricing.truck.pricePerKm,
        ),
      },
    },
    ridePricing: {
      motorcycle: {
        baseFare: sanitizeNumber(
          raw.ridePricing?.motorcycle?.baseFare,
          DEFAULT_PLATFORM_CONFIG.ridePricing.motorcycle.baseFare,
        ),
        perKm: sanitizeNumber(
          raw.ridePricing?.motorcycle?.perKm,
          DEFAULT_PLATFORM_CONFIG.ridePricing.motorcycle.perKm,
        ),
        minimumFare: sanitizeNumber(
          raw.ridePricing?.motorcycle?.minimumFare,
          DEFAULT_PLATFORM_CONFIG.ridePricing.motorcycle.minimumFare,
        ),
        minimumDistance: sanitizeNumber(
          raw.ridePricing?.motorcycle?.minimumDistance,
          DEFAULT_PLATFORM_CONFIG.ridePricing.motorcycle.minimumDistance,
        ),
      },
      car: {
        baseFare: sanitizeNumber(
          raw.ridePricing?.car?.baseFare,
          DEFAULT_PLATFORM_CONFIG.ridePricing.car.baseFare,
        ),
        perKm: sanitizeNumber(
          raw.ridePricing?.car?.perKm,
          DEFAULT_PLATFORM_CONFIG.ridePricing.car.perKm,
        ),
        minimumFare: sanitizeNumber(
          raw.ridePricing?.car?.minimumFare,
          DEFAULT_PLATFORM_CONFIG.ridePricing.car.minimumFare,
        ),
        minimumDistance: sanitizeNumber(
          raw.ridePricing?.car?.minimumDistance,
          DEFAULT_PLATFORM_CONFIG.ridePricing.car.minimumDistance,
        ),
      },
    },
    logisticsMultipliers: {
      priorityEconomic: sanitizeNumber(
        logistics?.priorityEconomic,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.priorityEconomic,
      ),
      priorityFast: sanitizeNumber(
        logistics?.priorityFast,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.priorityFast,
      ),
      priorityUrgent: sanitizeNumber(
        logistics?.priorityUrgent,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.priorityUrgent,
      ),
      cargoSizeSmall: sanitizeNumber(
        logistics?.cargoSizeSmall,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.cargoSizeSmall,
      ),
      cargoSizeMedium: sanitizeNumber(
        logistics?.cargoSizeMedium,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.cargoSizeMedium,
      ),
      cargoSizeLarge: sanitizeNumber(
        logistics?.cargoSizeLarge,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.cargoSizeLarge,
      ),
      fragileSurcharge: sanitizeNumber(
        logistics?.fragileSurcharge,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.fragileSurcharge,
      ),
      helperSurcharge: sanitizeNumber(
        logistics?.helperSurcharge,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.helperSurcharge,
      ),
      weightUpTo5kg: sanitizeNumber(
        logistics?.weightUpTo5kg,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.weightUpTo5kg,
      ),
      weightUpTo15kg: sanitizeNumber(
        logistics?.weightUpTo15kg,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.weightUpTo15kg,
      ),
      weightUpTo30kg: sanitizeNumber(
        logistics?.weightUpTo30kg,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.weightUpTo30kg,
      ),
      weightUpTo50kg: sanitizeNumber(
        logistics?.weightUpTo50kg,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.weightUpTo50kg,
      ),
      weightAbove50kg: sanitizeNumber(
        logistics?.weightAbove50kg,
        DEFAULT_PLATFORM_CONFIG.logisticsMultipliers.weightAbove50kg,
      ),
    },
    supportChannels: {
      phone: sanitizeString(
        raw.supportChannels?.phone,
        DEFAULT_PLATFORM_CONFIG.supportChannels.phone,
      ),
      email: sanitizeString(
        raw.supportChannels?.email,
        DEFAULT_PLATFORM_CONFIG.supportChannels.email,
      ),
      whatsapp: sanitizeString(
        raw.supportChannels?.whatsapp,
        DEFAULT_PLATFORM_CONFIG.supportChannels.whatsapp,
      ),
      helpCenterUrl: sanitizeString(
        raw.supportChannels?.helpCenterUrl,
        DEFAULT_PLATFORM_CONFIG.supportChannels.helpCenterUrl,
      ),
    },
    policyVersions: {
      termsVersion: sanitizeString(
        raw.policyVersions?.termsVersion,
        DEFAULT_PLATFORM_CONFIG.policyVersions.termsVersion,
      ),
      privacyPolicyVersion: sanitizeString(
        raw.policyVersions?.privacyPolicyVersion,
        DEFAULT_PLATFORM_CONFIG.policyVersions.privacyPolicyVersion,
      ),
      consentVersion: sanitizeString(
        raw.policyVersions?.consentVersion,
        DEFAULT_PLATFORM_CONFIG.policyVersions.consentVersion,
      ),
    },
  };
}

async function ensureConfigDocument() {
  let doc = await PlatformConfig.findOne().sort({ createdAt: -1 });
  if (!doc) {
    doc = await PlatformConfig.create(DEFAULT_PLATFORM_CONFIG);
  }
  return doc;
}

async function getRuntimeConfig() {
  const doc = await ensureConfigDocument();
  const plain = doc.toObject ? doc.toObject() : doc;
  return mergeConfig(plain);
}

module.exports = {
  DEFAULT_PLATFORM_CONFIG,
  mergeConfig,
  ensureConfigDocument,
  getRuntimeConfig,
};
