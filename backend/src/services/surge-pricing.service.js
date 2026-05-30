/**
 * Surge Pricing Service — Precificação dinâmica baseada em demanda/oferta.
 *
 * Lógica:
 * 1. Calcula a razão entre solicitações ativas (requesting) e motoristas disponíveis
 * 2. Aplica multiplicador progressivo:
 *    - Razão < 1.5: sem surge (1.0x)
 *    - Razão 1.5-3.0: surge leve (1.2x-1.5x)
 *    - Razão 3.0-5.0: surge moderado (1.5x-2.0x)
 *    - Razão > 5.0: surge alto (2.0x-3.0x)
 */

const DriverLocation = require('../models/DriverLocation');
const Ride = require('../models/Ride');

// Configurações
const DEFAULT_SURGE_THRESHOLD = 1.5;  // razão mínima para ativar surge
const DEFAULT_MAX_SURGE = 3.0;         // multiplicador máximo
const DEFAULT_BASE_MULTIPLIER = 1.0;   // sem surge

/**
 * Calcula o multiplicador de surge para uma região.
 * @param {number} lat - Latitude do centro
 * @param {number} lng - Longitude do centro
 * @param {number} radiusKm - Raio de busca em km (default 10km)
 * @returns {Promise<{multiplier: number, demandCount: number, supplyCount: number, level: string}>}
 */
async function calculateSurgeMultiplier(lat, lng, radiusKm = 10) {
  try {
    const radiusMeters = radiusKm * 1000;

    // 1. Contar solicitações ativas na região (sem motorista ainda)
    const activeRequests = await Ride.countDocuments({
      status: 'requesting',
      driverId: null,
      'pickup.latitude': { $gte: lat - 0.1, $lte: lat + 0.1 },
      'pickup.longitude': { $gte: lng - 0.1, $lte: lng + 0.1 },
      requestedAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) }, // últimos 15 min
    });

    // 2. Contar motoristas disponíveis na região
    const availableDrivers = await DriverLocation.countDocuments({
      status: 'available',
      currentRideId: null,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radiusMeters,
        },
      },
    });

    // 3. Calcular razão demanda/oferta
    const supplyCount = Math.max(1, availableDrivers); // evita divisão por zero
    const demandCount = activeRequests;
    const ratio = demandCount / supplyCount;

    // 4. Determinar multiplicador
    let multiplier = DEFAULT_BASE_MULTIPLIER;
    let level = 'normal';

    if (ratio >= 5.0) {
      multiplier = 2.5 + Math.min(0.5, (ratio - 5) * 0.05);
      level = 'very_high';
    } else if (ratio >= 3.0) {
      multiplier = 1.8 + (ratio - 3) * 0.35;
      level = 'high';
    } else if (ratio >= 1.5) {
      multiplier = 1.2 + (ratio - 1.5) * 0.2;
      level = 'moderate';
    }

    // Limitar ao máximo configurado
    multiplier = Math.min(DEFAULT_MAX_SURGE, Math.max(1.0, Math.round(multiplier * 10) / 10));

    return {
      multiplier,
      demandCount,
      supplyCount: availableDrivers,
      ratio: Math.round(ratio * 10) / 10,
      level,
    };
  } catch (error) {
    console.error('[SurgePricing] Erro ao calcular:', error);
    return {
      multiplier: 1.0,
      demandCount: 0,
      supplyCount: 0,
      ratio: 0,
      level: 'error',
    };
  }
}

/**
 * Obtém zonas de calor para o mapa (heatmap data).
 * Agrega solicitações não atendidas nos últimos 30 min por grade.
 * @returns {Promise<Array<{lat: number, lng: number, weight: number}>>}
 */
async function getHeatmapData(centerLat, centerLng, radiusKm = 20) {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const requests = await Ride.find({
      status: { $in: ['requesting', 'cancelled_no_driver'] },
      requestedAt: { $gte: thirtyMinAgo },
      'pickup.latitude': { $gte: centerLat - 0.3, $lte: centerLat + 0.3 },
      'pickup.longitude': { $gte: centerLng - 0.3, $lte: centerLng + 0.3 },
    }).select('pickup.latitude pickup.longitude status');

    // Agrupar por grade aproximada (2 casas decimais ≈ ~1km)
    const grid = new Map();
    requests.forEach((ride) => {
      const lat = Math.round(ride.pickup.latitude * 100) / 100;
      const lng = Math.round(ride.pickup.longitude * 100) / 100;
      const key = `${lat},${lng}`;
      const current = grid.get(key) || { lat, lng, count: 0, cancelled: 0 };
      current.count++;
      if (ride.status === 'cancelled_no_driver') current.cancelled++;
      grid.set(key, current);
    });

    // Converter para array com peso
    const points = Array.from(grid.values()).map((pt) => ({
      lat: pt.lat,
      lng: pt.lng,
      weight: pt.count + pt.cancelled * 2, // canceladas pesam mais
      count: pt.count,
    }));

    return points;
  } catch (error) {
    console.error('[Heatmap] Erro:', error);
    return [];
  }
}

module.exports = { calculateSurgeMultiplier, getHeatmapData };
