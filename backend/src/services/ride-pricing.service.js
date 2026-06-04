/**
 * ride-pricing.service — Cálculo de preço EXCLUSIVO do fluxo de Corrida (ride).
 *
 * Totalmente separado de delivery-pricing/pricing-engine (que são de Entrega).
 * Usa o model RideCategory (salvo no banco) e o helper genérico de rota do Google Maps.
 */

const RideCategory = require("../models/RideCategory");
// fetchRouteMetricsWithGoogleMaps é um helper genérico de rota (Google Maps), não lógica de entrega.
const { fetchRouteMetricsWithGoogleMaps } = require("./delivery-pricing.service");

// As categorias/preços ficam no banco (coleção RideCategory), populadas via
// scripts/seed-ride-categories.js e gerenciadas pela dashboard. Não há defaults no código.

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function getCoord(point, key) {
  const v = Number(point?.[key]);
  return Number.isFinite(v) ? v : null;
}

function createPricingError(message, statusCode = 400, details = undefined) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (details) error.details = details;
  return error;
}

/**
 * Distância/duração total passando por pickup -> stops -> dropoff.
 */
async function resolveRouteWithStops(pickup, dropoff, stops = []) {
  const validStops = (Array.isArray(stops) ? stops : []).filter(
    (s) => Number.isFinite(Number(s?.latitude)) && Number.isFinite(Number(s?.longitude)),
  );

  const points = [
    { latitude: getCoord(pickup, "latitude"), longitude: getCoord(pickup, "longitude") },
    ...validStops.map((s) => ({ latitude: Number(s.latitude), longitude: Number(s.longitude) })),
    { latitude: getCoord(dropoff, "latitude"), longitude: getCoord(dropoff, "longitude") },
  ];

  let totalDistanceInMeters = 0;
  let totalDurationInSeconds = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const segment = await fetchRouteMetricsWithGoogleMaps(points[i], points[i + 1]);
    if (!segment) {
      throw createPricingError(
        "Erro ao calcular a rota da corrida com a API do Google Maps.",
        500,
      );
    }
    totalDistanceInMeters += segment.distanceInMeters;
    totalDurationInSeconds += Number(segment.durationInSeconds || 0);
  }

  return {
    distanceInMeters: totalDistanceInMeters,
    durationInSeconds: totalDurationInSeconds,
    stopsCount: validStops.length,
  };
}

/**
 * Calcula o preço de UMA categoria para uma dada distância/duração.
 */
// Faixa de lance permitida em torno do preço sugerido (simétrica).
// O cliente pode ofertar de (total × (1 − fator)) até (total × (1 + fator)).
// Pode ser sobrescrito por categoria via pricing.bidRangeFactor.
const DEFAULT_BID_RANGE_FACTOR = 0.25; // ±25%

function priceForCategory(cat, { distanceKm, durationMin, stopsCount }) {
  const p = cat.pricing || {};
  const minimumKm = Number(p.minimumKm ?? 2);
  const minimumFee = Number(p.minimumFee ?? 5);
  const pricePerKm = Number(p.pricePerKm ?? 1.6);
  const pricePerMinute = Number(p.pricePerMinute ?? 0);
  const multiplier = Number(p.multiplier ?? 1.0);
  const feePerStop = Number(p.feePerStop ?? 2);

  const overflowKm = Math.max(0, distanceKm - minimumKm);
  const distancePrice = overflowKm * pricePerKm;
  const timePrice = (durationMin || 0) * pricePerMinute;
  const stopsFee = (stopsCount || 0) * feePerStop;

  const base = (minimumFee + distancePrice + timePrice) * multiplier;
  const total = toMoney(base + stopsFee);

  // Faixa simétrica de lance (±fator) calculada no backend = fonte da verdade.
  const rawFactor = Number(p.bidRangeFactor ?? DEFAULT_BID_RANGE_FACTOR);
  const bidRangeFactor = Number.isFinite(rawFactor) && rawFactor > 0 && rawFactor < 1 ? rawFactor : DEFAULT_BID_RANGE_FACTOR;
  const minPrice = toMoney(Math.max(1, total * (1 - bidRangeFactor)));
  const maxPrice = toMoney(total * (1 + bidRangeFactor));

  return {
    category: cat.category,
    label: cat.label,
    description: cat.description || "",
    icon: cat.icon || "directions-car",
    vehicleType: cat.vehicleType,
    maxPassengers: cat.maxPassengers ?? (cat.vehicleType === "motorcycle" ? 1 : 4),
    order: cat.order ?? 0,
    pricing: {
      basePrice: toMoney(minimumFee * multiplier),
      distancePrice: toMoney(distancePrice * multiplier),
      timePrice: toMoney(timePrice * multiplier),
      stopsFee: toMoney(stopsFee),
      total,
      // Faixa de lance permitida (simétrica ±bidRangeFactor em torno do total).
      minPrice,
      maxPrice,
      bidRangeFactor,
      currency: "BRL",
      multiplier,
      feePerStop,
    },
  };
}

/**
 * Lista categorias ativas (do banco, fallback nos defaults) já com preço calculado.
 */
async function calculateRideCategories({ pickup, dropoff, stops = [], cityId, distance, duration } = {}) {
  if (!pickup || !dropoff) {
    throw createPricingError("Origem e destino são obrigatórios", 400);
  }

  // Rota: usa métricas pré-computadas do cliente quando válidas, senão consulta o Google.
  let distanceInMeters = Number(distance);
  let durationInSeconds = Number(duration);
  let stopsCount = (Array.isArray(stops) ? stops : []).filter(
    (s) => Number.isFinite(Number(s?.latitude)) && Number.isFinite(Number(s?.longitude)),
  ).length;

  if (!Number.isFinite(distanceInMeters) || distanceInMeters <= 0) {
    const route = await resolveRouteWithStops(pickup, dropoff, stops);
    distanceInMeters = route.distanceInMeters;
    durationInSeconds = route.durationInSeconds;
    stopsCount = route.stopsCount;
  }

  const distanceKm = distanceInMeters / 1000;
  const durationMin = Math.max(1, Math.ceil((durationInSeconds || 0) / 60));

  // Buscar categorias da cidade; se não houver, usa as globais (cityId: null).
  let cats = [];
  if (cityId) {
    cats = await RideCategory.find({ cityId, active: true }).sort({ order: 1 }).lean();
  }
  if (!cats || cats.length === 0) {
    cats = await RideCategory.find({ cityId: null, active: true }).sort({ order: 1 }).lean();
  }
  if (!cats || cats.length === 0) {
    throw createPricingError(
      "Nenhuma categoria de corrida configurada. Rode scripts/seed-ride-categories.js ou cadastre na dashboard.",
      500,
    );
  }

  const categories = cats
    .map((c) => priceForCategory(c, { distanceKm, durationMin, stopsCount }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return {
    categories,
    distance: {
      value: Math.round(distanceInMeters),
      text: `${distanceKm.toFixed(1)} km`,
    },
    duration: {
      value: durationMin * 60,
      text: `${durationMin} min`,
    },
    stopsCount,
  };
}

module.exports = {
  calculateRideCategories,
  resolveRouteWithStops,
};
