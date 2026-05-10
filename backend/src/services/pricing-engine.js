/**
 * LEVA - Smart Freight Pricing Engine
 * Inspired by Loggi, Uber Flash, Lalamove
 */

// 1. Advanced Vehicle Operational Baselines ⚙️
const VEHICLE_BASE_CONFIG = {
  motorcycle: {
    minFee: 7.00,      // Absolutely won't launch below this
    pricePerKm: 0.99,  // Low operation cost
    minKmThreshold: 10 // Covers first 2km in base price
  },
  car: {
    minFee: 18.00,
    pricePerKm: 1.90,
    minKmThreshold: 3
  },
  van: {
    minFee: 55.00,
    pricePerKm: 2.80,
    minKmThreshold: 5
  },
  truck: {
    minFee: 130.00,
    pricePerKm: 4.80,
    minKmThreshold: 8
  }
};

// 2. Delivery Type Multipliers (Commodity risk & complexity)
// const DELIVERY_TYPE_MULTIPLIER = {
//   doc: 1.0,
//   food: 1.2,
//   box: 1.2,
//   market: 1.3,
//   material: 1.7,
//   furniture: 2.0,
//   moving: 2.5,
//   other: 1.3,
// };

// 3. Cargo Size Multipliers
// const CARGO_SIZE_MULTIPLIER = {
//   small: 1.0,
//   medium: 1.3,
//   large: 1.9,
// };

// 4. Delivery Priority Multipliers
const PRIORITY_MULTIPLIER = {
  0: 1.0, // Economic
  1: 1.3, // Fast
  2: 1.8, // Urgent
};

// 5. Dynamic Demand Simulation
const DEMAND_MULTIPLIER = {
  low: 1.0,
  medium: 1.0,
  high: 1.3,
  extreme: 1.5
};

const HELPER_BASE_FEE = 30.00;

class PricingEngine {
  /**
   * Calculates comprehensive freight dynamic pricing using advanced baseline stacking
   */
  calculate({
    basePriceRule = 0,
    pricePerKmRule = 0,
    distanceKm,
    vehicleType = "motorcycle",
    deliveryType = "box",
    cargoSize = "medium",
    priority = 1,
    needsHelper = false,
    demandLevel = "medium"
  }) {
    // Get configuration defaults specific to this mode of transport
    const config = VEHICLE_BASE_CONFIG[vehicleType] || VEHICLE_BASE_CONFIG.motorcycle;
    
    // Prioritize Database Override configuration if active, fallback to engine defaults
    const pricePerKm = pricePerKmRule > 0 ? pricePerKmRule : config.pricePerKm;
    const minFee = config.minFee;
    const minKm = config.minKmThreshold;

    // Distance Calculation Logic (Threshold-based 🚀)
    // Start natively with minFee which covers up to minKm included
    let rawComputedCost = minFee;
    
    if (distanceKm > minKm) {
      const overflowKm = distanceKm - minKm;
      // User's model: MinFee + (Overflow KMs * pricePerKm)
      rawComputedCost += (overflowKm * pricePerKm);
    }

    // BASELINE DISTANCE FEE (Safely aggregated)
    const distanceRaw = rawComputedCost;

    // Fetch multiplier vectors (Removed type and size per user request ⚖️)
    const mType = 1.0; 
    const mSize = 1.0; 
    const mDemand = DEMAND_MULTIPLIER[demandLevel] || 1.0;

    // BASE SYSTEM VALUE (Enforced pure distance metrics now)
    const systemBaseline = distanceRaw * mDemand;

    // Apply direct operational auxiliary surcharges
    const helperFee = needsHelper ? HELPER_BASE_FEE : 0;

    // Generate Tiered Pricing Responses
    
    // 1. MINIMUM PRICE (Economic priority applied to system baseline)
    const mPriorityMin = PRIORITY_MULTIPLIER[0];
    const minimumPrice = (systemBaseline * mPriorityMin) + (helperFee * 0.8);

    // 2. SUGGESTED PRICE (User-selected priority applied)
    const mPrioritySelected = PRIORITY_MULTIPLIER[priority] ?? 1.0;
    const suggestedPrice = (systemBaseline * mPrioritySelected) + helperFee;

    // 3. PRIORITY/PREMIUM PRICE (Max level urgency enforcement)
    const mPriorityMax = PRIORITY_MULTIPLIER[2];
    const priorityPrice = (systemBaseline * mPriorityMax) + (helperFee * 1.2);

    // Generate operational dynamic score (0-100 range)
    // Factors: Priority + Size weight
    const baseScore = 50;
    const pShift = (priority * 15);
    const sizeMap = { small: 0, medium: 10, large: 25 };
    const sShift = sizeMap[cargoSize] || 10;
    const deliveryScore = Math.min(100, baseScore + pShift + sShift);

    return {
      minimumPrice: parseFloat(minimumPrice.toFixed(2)),
      suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
      priorityPrice: parseFloat(priorityPrice.toFixed(2)),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      demandLevel,
      deliveryScore,
      details: {
        baseDistanceCost: distanceRaw,
        configUsed: {
          pricePerKm,
          minFee,
          minKm
        },
        multipliers: {
          type: mType,
          size: mSize,
          priority: mPrioritySelected,
          demand: mDemand
        },
        fees: {
          helper: helperFee
        }
      }
    };
  }
}

module.exports = new PricingEngine();
