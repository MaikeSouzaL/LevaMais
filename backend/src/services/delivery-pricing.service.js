const { getRuntimeConfig } = require("./platformConfig.service");
const PricingEngine = require("./pricing-engine");

const DELIVERY_VEHICLES = new Set(["motorcycle", "car", "van", "truck"]);

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getCoordinate(point, key) {
  const value = Number(point?.[key]);
  return Number.isFinite(value) ? value : null;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createPricingError(message, statusCode = 400, details = undefined) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

function validateVehiclePricing(vehicleType, vehiclePricing) {
  const config = vehiclePricing?.[vehicleType];
  const minimumKm = Number(config?.minimumKm);
  const minimumFee = Number(config?.minimumFee);
  const pricePerKm = Number(config?.pricePerKm);

  if (
    !DELIVERY_VEHICLES.has(vehicleType) ||
    !Number.isFinite(minimumKm) ||
    !Number.isFinite(minimumFee) ||
    !Number.isFinite(pricePerKm) ||
    minimumKm < 0 ||
    minimumFee <= 0 ||
    pricePerKm <= 0
  ) {
    throw createPricingError("Preco de entrega nao configurado para este tipo de veiculo", 400, {
      vehicleType,
    });
  }

  return { minimumKm, minimumFee, pricePerKm };
}

function resolveMultiplier(logistics, key) {
  const value = Number(logistics?.[key]);
  if (!Number.isFinite(value) || value <= 0) {
    throw createPricingError(`Multiplicador de logistica invalido: ${key}`, 400, { key });
  }
  return value;
}

async function fetchRouteMetricsWithGoogleMaps(pickup, dropoff) {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_DISTANCE_MATRIX_KEY ||
    process.env.MAPS_API_KEY;

  if (!apiKey || typeof fetch !== "function") return null;

  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", `${pickup.latitude},${pickup.longitude}`);
  url.searchParams.set("destinations", `${dropoff.latitude},${dropoff.longitude}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const element = data?.rows?.[0]?.elements?.[0];
    if (element?.status !== "OK") return null;

    const distanceInMeters = Number(element?.distance?.value);
    const durationInSeconds = Number(element?.duration?.value);
    if (!Number.isFinite(distanceInMeters) || distanceInMeters <= 0) return null;

    return {
      distanceInMeters,
      durationInSeconds:
        Number.isFinite(durationInSeconds) && durationInSeconds > 0
          ? durationInSeconds
          : null,
      distanceSource: "route_api",
    };
  } catch (error) {
    console.warn("[deliveryPricing] Falha na rota real, usando Haversine:", error?.message || error);
    return null;
  }
}

async function resolveRouteMetrics(pickup, dropoff) {
  const routeMetrics = await fetchRouteMetricsWithGoogleMaps(pickup, dropoff);
  if (routeMetrics) return routeMetrics;

  const distanceInMeters = haversineDistance(
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude,
  );
  const distanceKm = distanceInMeters / 1000;

  return {
    distanceInMeters,
    durationInSeconds: Math.max(60, Math.round((distanceKm / 35) * 3600 + 180)),
    distanceSource: "haversine",
  };
}

async function calculateDeliveryPricingSnapshot(payload = {}) {
  const serviceType = String(payload.serviceType || "delivery").toLowerCase();
  if (serviceType !== "delivery") {
    throw createPricingError("Calculo de entrega recebeu tipo de servico invalido");
  }

  const vehicleType = String(payload.vehicleType || "").trim().toLowerCase();
  const pickupLatitude = getCoordinate(payload.pickup, "latitude");
  const pickupLongitude = getCoordinate(payload.pickup, "longitude");
  const dropoffLatitude = getCoordinate(payload.dropoff, "latitude");
  const dropoffLongitude = getCoordinate(payload.dropoff, "longitude");

  if (
    pickupLatitude === null ||
    pickupLongitude === null ||
    dropoffLatitude === null ||
    dropoffLongitude === null
  ) {
    throw createPricingError("Coordenadas de coleta e entrega sao obrigatorias para calcular o preco");
  }

  const runtimeConfig = payload.runtimeConfig || (await getRuntimeConfig());
  const vehicleConfig = validateVehiclePricing(vehicleType, runtimeConfig?.vehiclePricing);
  const logistics = runtimeConfig?.logisticsMultipliers || {};

  // Resolve as paradas intermediárias (stops)
  const stops = Array.isArray(payload.stops)
    ? payload.stops.filter((s) => s && Number.isFinite(s.latitude) && Number.isFinite(s.longitude))
    : [];

  const points = [
    { latitude: pickupLatitude, longitude: pickupLongitude },
    ...stops,
    { latitude: dropoffLatitude, longitude: dropoffLongitude },
  ];

  let totalDistanceInMeters = 0;
  let totalDurationInSeconds = 0;
  let distanceSource = "route_api";

  for (let i = 0; i < points.length - 1; i++) {
    const segment = await resolveRouteMetrics(points[i], points[i + 1]);
    totalDistanceInMeters += segment.distanceInMeters;
    totalDurationInSeconds += segment.durationInSeconds;
    if (segment.distanceSource === "haversine") {
      distanceSource = "haversine";
    }
  }

  const distanceKm = totalDistanceInMeters / 1000;
  const formula = distanceKm <= vehicleConfig.minimumKm ? "minimum_fee" : "minimum_plus_excess";
  const overflowKm = Math.max(0, distanceKm - vehicleConfig.minimumKm);
  const distancePrice = toMoney(overflowKm * vehicleConfig.pricePerKm);
  const baseTotal = toMoney(vehicleConfig.minimumFee + distancePrice);

  const priority = Number.isFinite(Number(payload.priority)) ? Number(payload.priority) : 0;
  const smartPricing = PricingEngine.calculate({
    pricePerKmRule: vehicleConfig.pricePerKm,
    minFeeRule: vehicleConfig.minimumFee,
    minKmRule: vehicleConfig.minimumKm,
    distanceKm,
    priority,
    priorityEconomic: resolveMultiplier(logistics, "priorityEconomic"),
    priorityFast: resolveMultiplier(logistics, "priorityFast"),
    priorityUrgent: resolveMultiplier(logistics, "priorityUrgent"),
    cargoSizeSmall: resolveMultiplier(logistics, "cargoSizeSmall"),
    cargoSizeMedium: resolveMultiplier(logistics, "cargoSizeMedium"),
    cargoSizeLarge: resolveMultiplier(logistics, "cargoSizeLarge"),
    fragileSurchargeValue: resolveMultiplier(logistics, "fragileSurcharge"),
    helperSurchargeValue: resolveMultiplier(logistics, "helperSurcharge"),
    weightUpTo5kg: resolveMultiplier(logistics, "weightUpTo5kg"),
    weightUpTo15kg: resolveMultiplier(logistics, "weightUpTo15kg"),
    weightUpTo30kg: resolveMultiplier(logistics, "weightUpTo30kg"),
    weightUpTo50kg: resolveMultiplier(logistics, "weightUpTo50kg"),
    weightAbove50kg: resolveMultiplier(logistics, "weightAbove50kg"),
    cargoSize: payload.cargoSize || "small",
    approximateWeightKg: payload.approximateWeightKg,
    isFragile: Boolean(payload.isFragile),
    needsHelper: Boolean(payload.needsHelper),
  });

  // Taxa de paradas: 2 reais a mais por cada parada (do PlatformConfig)
  const feePerStop = Number(runtimeConfig?.feePerStop ?? 2);
  const stopsFee = stops.length * feePerStop;

  const total = toMoney((smartPricing?.suggestedPrice || baseTotal) + stopsFee);
  const appFeePercentage = Number(runtimeConfig?.appFeePercentage || 0);
  const platformFee = toMoney(total * (appFeePercentage / 100));
  const driverValue = toMoney(total - platformFee);
  const durationMinutes = Math.max(1, Math.ceil(totalDurationInSeconds / 60));
  const minimumPrice = toMoney(
    (Number(smartPricing?.minimumPrice || 0) > 0 ? smartPricing.minimumPrice : baseTotal) + stopsFee,
  );

  return {
    pricing: {
      basePrice: toMoney(vehicleConfig.minimumFee),
      distancePrice,
      stopsFee,
      serviceFee: platformFee,
      platformFee,
      driverValue,
      subtotal: total,
      total,
      currency: "BRL",
      ruleUsed: `PLATFORM_CONFIG_${vehicleType.toUpperCase()}`,
      breakdown: {
        vehicleType,
        minimumKm: vehicleConfig.minimumKm,
        minimumFee: vehicleConfig.minimumFee,
        pricePerKm: vehicleConfig.pricePerKm,
        distanceKm: Number(distanceKm.toFixed(2)),
        distanceSource,
        formula,
        overflowKm: Number(overflowKm.toFixed(2)),
        appFeePercentage,
        feePerStop,
        stopsCount: stops.length,
        stopsFee,
        smartDetails: smartPricing?.details,
      },
    },
    distance: {
      value: Math.round(totalDistanceInMeters),
      text: `${distanceKm.toFixed(1)} km`,
    },
    duration: {
      value: durationMinutes * 60,
      text: `${durationMinutes} min`,
    },
    smartPricing: {
      ...smartPricing,
      minimumPrice,
      suggestedPrice: total,
    },
    runtimeConfig,
  };
}

module.exports = {
  calculateDeliveryPricingSnapshot,
};
