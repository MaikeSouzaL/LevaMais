
// Cargo size multipliers (increments over base price)
const CARGO_SIZE_MULTIPLIERS = {
  small: 1.0,
  medium: 1.15,
  large: 1.4,
};

// Weight surcharges (added to multiplier per kg tier)
function getWeightMultiplier(approximateWeightKg) {
  const w = Number(approximateWeightKg || 0);
  if (w <= 0) return 1.0;
  if (w <= 5) return 1.0;
  if (w <= 15) return 1.1;
  if (w <= 30) return 1.25;
  if (w <= 50) return 1.5;
  return 1.8; // >50kg
}

class PricingEngine {
  calculate({
    pricePerKmRule = 0,
    minFeeRule = 0,
    minKmRule = 0,
    distanceKm,
    priority = 1,
    priorityEconomic = 1.0,
    priorityFast = 1.3,
    priorityUrgent = 1.8,
    // Novos parametros para delivery
    cargoSize = "small",
    approximateWeightKg,
    isFragile = false,
    needsHelper = false,
  }) {
    const pricePerKm = Number(pricePerKmRule || 0);
    const minFee = Number(minFeeRule || 0);
    const minKm = Number(minKmRule || 0);

   let rawComputedCost = minFee;

    if (distanceKm > minKm) {
      const overflowKm = distanceKm - minKm;
      rawComputedCost += (overflowKm * pricePerKm);
    }

    const baseDistanceCost = rawComputedCost;

    // Delivery Priority Multipliers (Economic, Fast, Urgent)
    const priorityMultipliers = {
      0: Number(priorityEconomic || 1.0),
      1: Number(priorityFast || 1.3),
      2: Number(priorityUrgent || 1.8),
    };

    // Cargo attributes multipliers
    const cargoSizeMultiplier = CARGO_SIZE_MULTIPLIERS[cargoSize] || 1.0;
    const weightMultiplier = getWeightMultiplier(approximateWeightKg);
    const fragileSurcharge = isFragile ? 1.1 : 1.0;
    const helperSurcharge = needsHelper ? 1.15 : 1.0;

    // Combined cargo multiplier
    const cargoMultiplier = cargoSizeMultiplier * weightMultiplier * fragileSurcharge * helperSurcharge;

    // Apply priority multiplier
    const mPrioritySelected = priorityMultipliers[priority] ?? 1.0;
    const priorityMultiplier = mPrioritySelected;

    // Final calculation: base cost * cargo factors * priority
    const adjustedCost = baseDistanceCost * cargoMultiplier;

    const minimumPrice = adjustedCost * priorityMultipliers[0];
    const suggestedPrice = adjustedCost * priorityMultiplier;
    const priorityPrice = adjustedCost * priorityMultipliers[2];

    return {
      minimumPrice: parseFloat(minimumPrice.toFixed(2)),
      suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
      priorityPrice: parseFloat(priorityPrice.toFixed(2)),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      details: {
        baseDistanceCost: parseFloat(baseDistanceCost.toFixed(2)),
        configUsed: {
          pricePerKm,
          minFee,
          minKm,
        },
        multipliers: {
          priority: parseFloat(priorityMultiplier.toFixed(3)),
          cargoSize: parseFloat(cargoSizeMultiplier.toFixed(3)),
          weight: parseFloat(weightMultiplier.toFixed(3)),
          fragile: parseFloat(fragileSurcharge.toFixed(3)),
          helper: parseFloat(helperSurcharge.toFixed(3)),
          combinedCargo: parseFloat(cargoMultiplier.toFixed(3)),
        },
      },
    };
  }
}

module.exports = new PricingEngine();
