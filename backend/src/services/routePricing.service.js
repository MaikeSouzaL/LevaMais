const { getRuntimeConfig } = require("./platformConfig.service");

// Precificação de reserva de rota planejada (Fase D7–D9).
// price = (basePrice + weightKg × pricePerKg) × sizeMultipliers[size] (+ seguro opcional)
// commission = PlatformConfig.plannedRoutes.defaultCommissionPct sobre o price.

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function sizeMultiplier(route, size) {
  const mult = route?.pricing?.sizeMultipliers || {};
  const key = size === "large" ? "large" : size === "medium" ? "medium" : "small";
  const value = Number(mult[key]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

// Calcula o preço base da reserva (sem comissão), a partir da rota e do item.
function computeBasePrice(route, item = {}) {
  const base = Number(route?.pricing?.basePrice) || 0;
  const perKg = Number(route?.pricing?.pricePerKg) || 0;
  const weightKg = Math.max(0, Number(item.weightKg) || 0);
  let raw = (base + weightKg * perKg) * sizeMultiplier(route, item.size);

  // Precificação dinâmica por ocupação (Fase D9)
  const maxItems = Math.max(1, route?.capacity?.maxItems || 10);
  const maxWeight = Math.max(1, route?.capacity?.maxWeightKg || 50);
  const currentItems = Number(route?.capacityUsed?.items) || 0;
  const currentWeight = Number(route?.capacityUsed?.weightKg) || 0;

  const itemOccupancy = currentItems / maxItems;
  const weightOccupancy = currentWeight / maxWeight;
  const occupancy = Math.max(0, Math.min(1, Math.max(itemOccupancy, weightOccupancy)));

  let occupancyMultiplier = 1.0;
  if (occupancy > 0.8) {
    occupancyMultiplier = 1.15 + (occupancy - 0.8) * 1.25; // Até 1.4x
  } else if (occupancy > 0.5) {
    occupancyMultiplier = 1.0 + (occupancy - 0.5) * 0.5; // Até 1.15x
  }

  raw = raw * occupancyMultiplier;
  return round2(Math.max(0, raw));
}

// Calcula o pacote financeiro completo da reserva, com comissão e seguro opcional.
async function computeReservationPricing(route, item = {}, options = {}) {
  const config = await getRuntimeConfig();
  const plannedRoutes = config?.plannedRoutes || {};
  const commissionPct = Number(plannedRoutes.defaultCommissionPct) || 0;
  const insurancePct = options.withInsurance ? Number(plannedRoutes.insuranceFeePct) || 0 : 0;

  const basePrice = computeBasePrice(route, item);
  const insuranceFee = round2((Number(item.declaredValue) || 0) * (insurancePct / 100));
  const price = round2(basePrice + insuranceFee);
  const commissionAmount = round2(price * (commissionPct / 100));
  const driverPayout = round2(price - commissionAmount);

  return {
    price,
    basePrice,
    insuranceFee,
    commissionPct,
    commissionAmount,
    driverPayout,
  };
}

module.exports = {
  round2,
  computeBasePrice,
  computeReservationPricing,
};
