
// Weight surcharges (added to multiplier per kg tier)
function getWeightMultiplier(approximateWeightKg, weights = {}) {
  const w = Number(approximateWeightKg || 0);
  const upTo5 = Number(weights.weightUpTo5kg ?? 1.0);
  const upTo15 = Number(weights.weightUpTo15kg ?? 1.1);
  const upTo30 = Number(weights.weightUpTo30kg ?? 1.25);
  const upTo50 = Number(weights.weightUpTo50kg ?? 1.5);
  const above50 = Number(weights.weightAbove50kg ?? 1.8);
  if (w <= 0) return 1.0;
  if (w <= 5) return upTo5;
  if (w <= 15) return upTo15;
  if (w <= 30) return upTo30;
  if (w <= 50) return upTo50;
  return above50; // >50kg
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
    cargoSizeSmall = 1.0,
    cargoSizeMedium = 1.15,
    cargoSizeLarge = 1.4,
    fragileSurchargeValue = 1.1,
    helperSurchargeValue = 1.15,
    weightUpTo5kg = 1.0,
    weightUpTo15kg = 1.1,
    weightUpTo30kg = 1.25,
    weightUpTo50kg = 1.5,
    weightAbove50kg = 1.8,
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
    const cargoSizeMultipliers = {
      small: Number(cargoSizeSmall || 1.0),
      medium: Number(cargoSizeMedium || 1.15),
      large: Number(cargoSizeLarge || 1.4),
    };
    const cargoSizeMultiplier = cargoSizeMultipliers[cargoSize] || 1.0;
    const weightMultiplier = getWeightMultiplier(approximateWeightKg, {
      weightUpTo5kg,
      weightUpTo15kg,
      weightUpTo30kg,
      weightUpTo50kg,
      weightAbove50kg,
    });
    const fragileSurcharge = isFragile ? Number(fragileSurchargeValue || 1.1) : 1.0;
    const helperSurcharge = needsHelper ? Number(helperSurchargeValue || 1.15) : 1.0;

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
