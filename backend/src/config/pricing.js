// Configuração fixa de preços por tipo de veículo
// Preços em BRL (Reais)

const PRICING = {
  // Taxa da plataforma (%)
  APP_FEE_PERCENTAGE: 15,

  // Preços por tipo de veículo
  motorcycle: {
    minimumKm: 3,
    minimumFee: 7.00,        // preço mínimo da corrida
    pricePerKm: 0.99,        // preço por km adicional
  },

  car: {
    minimumKm: 3,
    minimumFee: 8.00,
    pricePerKm: 2.50,
  },

  van: {
    minimumKm: 5,
    minimumFee: 20.00,
    pricePerKm: 4.00,
  },

  truck: {
    minimumKm: 5,
    minimumFee: 35.00,
    pricePerKm: 6.00,
  },

  // Multiplicador para entrega (sobre preço base)
  deliveryMultiplier: 1.2,

  // Preço sugerido mínimo como % do total (para negociação)
  suggestedMinPricePercent: 0.8,
};

function getVehiclePricing(vehicleType) {
  return PRICING[vehicleType] || PRICING.motorcycle;
}

function calculateSuggestedMinPrice(total) {
  return Number((Math.max(0, total) * PRICING.suggestedMinPricePercent).toFixed(2));
}

function calculatePriceBreakdown(vehicleType, distanceKm, serviceType) {
  const vp = getVehiclePricing(vehicleType);

  const distance = Math.max(0, Number(distanceKm || 0));

  // Preço base (taxa mínima)
  let ridePrice = vp.minimumFee;

  // Distância acima do mínimo
  if (distance > vp.minimumKm) {
    ridePrice += (distance - vp.minimumKm) * vp.pricePerKm;
  }

  // Multiplicador de entrega
  if (serviceType === "delivery") {
    ridePrice *= PRICING.deliveryMultiplier;
  }

  const subtotal = Number(ridePrice.toFixed(2));
  const platformFee = Number((subtotal * (PRICING.APP_FEE_PERCENTAGE / 100)).toFixed(2));
  const driverValue = Number((subtotal - platformFee).toFixed(2));
  const suggestedMinPrice = calculateSuggestedMinPrice(subtotal);

  return {
    pricing: {
      subtotal,
      platformFee,
      driverValue,
      total: subtotal,
      currency: "BRL",
    },
    suggestedMinPrice,
    basePrice: vp.minimumFee,
    pricePerKm: vp.pricePerKm,
    minimumKm: vp.minimumKm,
    appFeePercentage: PRICING.APP_FEE_PERCENTAGE,
  };
}

module.exports = {
  PRICING,
  getVehiclePricing,
  calculateSuggestedMinPrice,
  calculatePriceBreakdown,
};
