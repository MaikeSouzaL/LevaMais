
class PricingEngine {
  calculate({
    pricePerKmRule = 0,
    minFeeRule = 0,
    minKmRule = 0,
    distanceKm,
    priority = 1,
    priorityEconomic = 1.0,
    priorityFast = 1.3,
    priorityUrgent = 1.8
  }) {
    const pricePerKm = Number(pricePerKmRule || 0);
    const minFee = Number(minFeeRule || 0);
    const minKm = Number(minKmRule || 0);

   let rawComputedCost = minFee;
    
    if (distanceKm > minKm) {
      const overflowKm = distanceKm - minKm;
      // Formula: MinFee + (Overflow KMs * pricePerKm)
      rawComputedCost += (overflowKm * pricePerKm);
    }

    const baseDistanceCost = rawComputedCost;

    // Delivery Priority Multipliers (Economic, Fast, Urgent)
    const priorityMultipliers = {
      0: Number(priorityEconomic || 1.0), // Economic
      1: Number(priorityFast || 1.3),     // Fast
      2: Number(priorityUrgent || 1.8),   // Urgent
    };

    // Apply direct priority multipliers
    const mPriorityMin = priorityMultipliers[0];
    const minimumPrice = baseDistanceCost * mPriorityMin;

    const mPrioritySelected = priorityMultipliers[priority] ?? 1.0;
    const suggestedPrice = baseDistanceCost * mPrioritySelected;

    const mPriorityMax = priorityMultipliers[2];
    const priorityPrice = baseDistanceCost * mPriorityMax;

    return {
      minimumPrice: parseFloat(minimumPrice.toFixed(2)),
      suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
      priorityPrice: parseFloat(priorityPrice.toFixed(2)),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      details: {
        baseDistanceCost,
        configUsed: {
          pricePerKm,
          minFee,
          minKm
        },
        multipliers: {
          priority: mPrioritySelected
        }
      }
    };
  }
}

module.exports = new PricingEngine();
