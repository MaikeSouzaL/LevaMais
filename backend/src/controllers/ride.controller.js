const Ride = require("../models/Ride");
const RideHistory = require("../models/RideHistory");
const DriverLocation = require("../models/DriverLocation");
const User = require("../models/User");
const Promotion = require("../models/Promotion");
const ShiftOffer = require("../models/ShiftOffer");
const City = require("../models/City");

const { getRuntimeConfig } = require("../services/platformConfig.service");
const { calculateDeliveryPricingSnapshot, fetchRouteMetricsWithGoogleMaps, fetchRouteMetricsBatch } = require("../services/delivery-pricing.service");
const { calculateRideCategories } = require("../services/ride-pricing.service");
const { calculateSurgeMultiplier } = require("../services/surge-pricing.service");
const walletEscrow = require("../services/walletEscrow.service");

// mixins (rating + proofs)
const ratingProofMixin = require("./ride.ratingProof.mixin");
const mongoose = require("mongoose");
const NON_TERMINAL_STATUSES = [
  "requesting",
  "payment_pending",
  "driver_assigned",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
];
const RIDE_CAPABLE_VEHICLES = new Set(["motorcycle", "car"]);
const DEFAULT_APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Sao_Paulo";
const DEFAULT_APP_FEE_PERCENTAGE = Number(process.env.APP_FEE_PERCENTAGE || 15);
const DEFAULT_RIDE_SEARCH_TIMEOUT_SECONDS = Number(process.env.RIDE_SEARCH_TIMEOUT_SECONDS || 300);
const DRIVER_DAILY_GOAL_RIDES = Number(process.env.DRIVER_DAILY_GOAL_RIDES || 10);
const DRIVER_DAILY_BONUS_AMOUNT = Number(process.env.DRIVER_DAILY_BONUS_AMOUNT || 20);

async function moveToHistory(ride) {
  try {
    // Rede de segurança do escrow: se a corrida termina CANCELADA com um hold ainda
    // reservado (caminhos que não passam pelo cancel principal — timeout, re-dispatch,
    // falha no estorno), devolve o valor retido ao cliente para não prender o saldo.
    if (
      ride?.payment?.escrow?.status === "reserved" &&
      String(ride.status || "").startsWith("cancelled")
    ) {
      try {
        await walletEscrow.refund(ride, { feeAmount: 0 });
        await ride.save();
      } catch (escrowSafetyErr) {
        console.error(`[RideHistory] Falha ao estornar hold preso da corrida ${ride._id}:`, escrowSafetyErr);
      }
    }

    await RideHistory.findOneAndUpdate(
      { _id: ride._id },
      ride.toObject(),
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    // Keep in main Ride collection - do not delete!
    // await Ride.deleteOne({ _id: ride._id });
    console.log(`[RideHistory] Kept ride ${ride._id} in main collection and saved to history.`);
  } catch (err) {
    console.error(`[RideHistory] Failed to save ride ${ride._id} to history:`, err);
  }
}

let rideControllerInstance;

function normalizePaymentMethod(rawMethod) {
  let value = rawMethod;
  if (typeof rawMethod === 'object' && rawMethod !== null) {
    value = rawMethod.type || rawMethod.method || rawMethod;
  }
  value = String(value || "")
    .trim()
    .toLowerCase();

  if (!value) return null;

  if (["cash", "dinheiro"].includes(value)) return "cash";
  if (["pix"].includes(value)) return "pix";
  if (["wallet", "carteira"].includes(value)) return "wallet";
  if (["card", "credit_card", "debit_card", "credit", "debit"].includes(value)) {
    return "card";
  }
  if (["card_machine", "maquininha"].includes(value)) {
    return "card_machine";
  }

  return null;
}

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const haversineDistance = calculateHaversineDistance;

function calculateDynamicSearchRadius(ride) {
  const vehicleType = ride.vehicleType || "motorcycle";
  const isWaitingInQueue = !!ride.isWaitingInQueue;

  // Align with progressive scaler defined in src/hooks/useRealtimeDelivery.ts
  const radiusConfig = {
    motorcycle: { nearby: 2.5, expanded: 8.0, regional: 15.0 },
    car: { nearby: 5.0, expanded: 15.0, regional: 30.0 },
    van: { nearby: 10.0, expanded: 35.0, regional: 80.0 },
    truck: { nearby: 15.0, expanded: 80.0, regional: 200.0 },
  };

  const vehicleConfig = radiusConfig[vehicleType] || radiusConfig.motorcycle;

  if (isWaitingInQueue) {
    return vehicleConfig.regional * 1000;
  }

  const requestedTime = new Date(ride.requestedAt || ride.createdAt).getTime();
  const secondsElapsed = (Date.now() - requestedTime) / 1000;

  let activeRadiusKm = vehicleConfig.regional;
  if (secondsElapsed < 20) {
    activeRadiusKm = vehicleConfig.nearby;
  } else if (secondsElapsed < 60) {
    activeRadiusKm = vehicleConfig.expanded;
  } else {
    activeRadiusKm = vehicleConfig.regional;
  }

  return activeRadiusKm * 1000;
}

async function calculateRideEstimate(req, res) {
  try {
    const { pickup, dropoff, vehicleType, distance, duration } = req.body;

    if (!pickup || !dropoff || !vehicleType) {
      return sendError(res, 400, "pickup, dropoff e vehicleType são obrigatórios");
    }

    const runtimeConfig = await getRuntimeConfig();
    const ridePricing = runtimeConfig.ridePricing || runtimeConfig.vehiclePricing;

    if (!ridePricing || !ridePricing[vehicleType]) {
      return sendError(res, 400, `Tipo de veículo ${vehicleType} não suportado para corridas`);
    }

    const pricing = ridePricing[vehicleType];
    const minimumKm = pricing.minimumDistance !== undefined ? pricing.minimumDistance : (pricing.minimumKm !== undefined ? pricing.minimumKm : 3);
    const minimumFee = pricing.minimumFare !== undefined ? pricing.minimumFare : (pricing.minimumFee !== undefined ? pricing.minimumFee : 8);
    const pricePerKm = pricing.perKm !== undefined ? pricing.perKm : (pricing.pricePerKm !== undefined ? pricing.pricePerKm : 2.5);
    const baseFare = pricing.baseFare !== undefined ? pricing.baseFare : minimumFee;

    let distanceKm = Number(distance);
    let durationMin = Number(duration);

    if (!Number.isFinite(distanceKm) || !Number.isFinite(durationMin)) {
      const metrics = await fetchRouteMetricsWithGoogleMaps(pickup, dropoff);
      if (!metrics) {
        return sendError(res, 500, "Erro ao obter rota da API do Google Maps. A API do Google Maps é obrigatória.");
      }
      distanceKm = metrics.distanceInMeters / 1000;
      durationMin = metrics.durationInSeconds ? Math.round(metrics.durationInSeconds / 60) : Math.round(distanceKm * 2.5);
    }

    let suggestedPrice;
    if (distanceKm <= minimumKm) {
      suggestedPrice = minimumFee;
    } else {
      suggestedPrice = minimumFee + ((distanceKm - minimumKm) * pricePerKm);
    }

    const minPrice = suggestedPrice * 0.8;
    const maxPrice = suggestedPrice * 1.3;

    res.json({
      suggestedPrice: Math.round(suggestedPrice * 100) / 100,
      minPrice: Math.round(minPrice * 100) / 100,
      maxPrice: Math.round(maxPrice * 100) / 100,
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMin,
      pricingBreakdown: {
        baseFare: baseFare,
        distancePrice: Math.round(Math.max(0, suggestedPrice - baseFare) * 100) / 100,
        total: Math.round(suggestedPrice * 100) / 100
      }
    });
  } catch (error) {
    console.error("Erro ao calcular estimativa de corrida:", error);
    return sendError(res, 500, "Erro ao calcular estimativa", { details: error.message });
  }
}

const SCHEDULED_DISPATCH_TIMEOUTS = new Map();
const ACTIVE_SEARCH_TIMEOUTS = new Map();
const PAYMENT_PENDING_TIMEOUTS = new Map();

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function sanitizeRouteCoordinates(routeCoordinates, pickup, dropoff) {
  const normalized = Array.isArray(routeCoordinates)
    ? routeCoordinates
        .map((point) => {
          const latitude = Number(point?.latitude);
          const longitude = Number(point?.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
          return { latitude, longitude };
        })
        .filter(Boolean)
    : [];

  if (normalized.length >= 2) {
    return normalized;
  }

  const pickupLat = Number(pickup?.latitude);
  const pickupLng = Number(pickup?.longitude);
  const dropoffLat = Number(dropoff?.latitude);
  const dropoffLng = Number(dropoff?.longitude);

  if (
    Number.isFinite(pickupLat) &&
    Number.isFinite(pickupLng) &&
    Number.isFinite(dropoffLat) &&
    Number.isFinite(dropoffLng)
  ) {
    return [
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: dropoffLat, longitude: dropoffLng },
    ];
  }

  return [];
}

function normalizePromotionCode(rawCode) {
  return String(rawCode || "")
    .trim()
    .toUpperCase();
}

function isPromotionActiveNow(promotion, now = new Date()) {
  if (!promotion || !promotion.isActive) return false;
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return false;
  if (promotion.endsAt && new Date(promotion.endsAt) < now) return false;
  return true;
}

function calculatePromotionDiscount(promotion, amount) {
  const total = toMoney(amount);
  if (total <= 0) return 0;

  if (promotion.discountType === "percentage") {
    const pct = Number(promotion.discountValue || 0);
    const raw = toMoney(total * (pct / 100));
    if (promotion.maxDiscount && promotion.maxDiscount > 0) {
      return toMoney(Math.min(raw, promotion.maxDiscount));
    }
    return raw;
  }

  return toMoney(Math.min(total, Number(promotion.discountValue || 0)));
}

function parseScheduledDate(rawValue) {
  if (!rawValue) return null;
  const value = new Date(rawValue);
  if (Number.isNaN(value.getTime())) return null;
  return value;
}

function isScheduledForFuture(scheduledFor) {
  if (!scheduledFor) return false;
  return scheduledFor.getTime() > Date.now() + 60 * 1000;
}

function calculateSuggestedMinPrice(total, percent = 0.8) {
  const safeTotal = Math.max(0, Number(total || 0));
  const safePercent = Number.isFinite(Number(percent)) ? Number(percent) : 0.8;
  return toMoney(safeTotal * safePercent);
}

function applyFinalPriceOnRide(ride, finalPrice, appFeePercentage) {
  const total = toMoney(finalPrice);
  const platformFee = toMoney(total * ((Number(appFeePercentage || 0) || 0) / 100));
  const driverValue = toMoney(total - platformFee);

  ride.pricing.total = total;
  ride.pricing.platformFee = platformFee;
  ride.pricing.driverValue = driverValue;

  if (ride.splitDetails) {
    const repShare = toMoney(Number(ride.splitDetails.representativeShare || 0));
    const repRatio =
      Number(ride.splitDetails.totalAppFee || 0) > 0
        ? repShare / Number(ride.splitDetails.totalAppFee || 1)
        : 0;
    const representativeShare = toMoney(platformFee * repRatio);
    ride.splitDetails.totalAppFee = platformFee;
    ride.splitDetails.representativeShare = representativeShare;
    ride.splitDetails.platformShare = toMoney(platformFee - representativeShare);
  }
}

function isServiceCompatibleWithVehicle(vehicleType, serviceType) {
  const normalizedVehicle = String(vehicleType || "").trim().toLowerCase();
  const normalizedService = String(serviceType || "").trim().toLowerCase();
  if (normalizedService === "delivery") return true;
  if (normalizedService === "ride") return RIDE_CAPABLE_VEHICLES.has(normalizedVehicle);
  return false;
}

// Resolve a categoria de CORRIDA de um motorista a partir do tipo de veículo + classificação.
// motos -> "moto"; carros sem classificação caem em "car_economy".
function resolveDriverRideCategory(vehicleType, rideCategory) {
  const v = String(vehicleType || "").trim().toLowerCase();
  if (v === "motorcycle") return "moto";
  if (v === "car") {
    const c = String(rideCategory || "").trim().toLowerCase();
    if (["car_economy", "car_comfort", "car_luxury"].includes(c)) return c;
    return "car_economy";
  }
  return null;
}

// Rank dos tiers de carro (luxo atende comfort/economy; comfort atende economy).
const CAR_TIER_RANK = { car_economy: 1, car_comfort: 2, car_luxury: 3 };

// Verifica se um motorista pode atender uma corrida de uma dada categoria.
// Regra estilo Uber: tier superior atende tiers inferiores; moto só atende moto.
function isDriverCategoryCompatible(driverVehicleType, driverRideCategory, requestedRideCategory) {
  const requested = String(requestedRideCategory || "").trim().toLowerCase();
  if (!requested) return true; // corrida sem categoria definida: sem restrição
  const driverCat = resolveDriverRideCategory(driverVehicleType, driverRideCategory);
  if (!driverCat) return false;
  if (requested === "moto") return driverCat === "moto";
  const reqRank = CAR_TIER_RANK[requested];
  const drvRank = CAR_TIER_RANK[driverCat];
  if (!reqRank || !drvRank) return false; // moto não atende carro e vice-versa
  return drvRank >= reqRank;
}

function getDateKeyInTimezone(date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    if (!year || !month || !day) return date.toISOString().split("T")[0];
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

async function resolvePromotionForRide({
  code,
  clientId,
  amount,
  serviceType,
}) {
  const normalizedCode = normalizePromotionCode(code);
  if (!normalizedCode) return null;

  const promotion = await Promotion.findOne({ code: normalizedCode });
  if (!promotion) {
    return { error: "Cupom nao encontrado" };
  }

  if (!isPromotionActiveNow(promotion)) {
    return { error: "Cupom inativo ou expirado" };
  }

  if (
    Array.isArray(promotion.serviceTypes) &&
    promotion.serviceTypes.length > 0 &&
    serviceType &&
    !promotion.serviceTypes.includes(serviceType)
  ) {
    return { error: "Cupom nao e valido para este servico" };
  }

  const safeAmount = toMoney(amount);
  if (safeAmount < Number(promotion.minOrderValue || 0)) {
    return {
      error: `Valor minimo para este cupom: R$ ${Number(
        promotion.minOrderValue || 0,
      ).toFixed(2)}`,
    };
  }

  if (
    Number.isFinite(Number(promotion.usageLimit)) &&
    Number(promotion.usageLimit) >= 0 &&
    Number(promotion.usageCount || 0) >= Number(promotion.usageLimit)
  ) {
    return { error: "Cupom esgotado" };
  }

  const userUsageCount = await Ride.countDocuments({
    clientId,
    "promotion.promotionId": promotion._id,
  });
  if (
    Number.isFinite(Number(promotion.perUserLimit)) &&
    Number(promotion.perUserLimit) > 0 &&
    userUsageCount >= Number(promotion.perUserLimit)
  ) {
    return { error: "Limite de uso deste cupom atingido" };
  }

  const discountAmount = calculatePromotionDiscount(promotion, safeAmount);
  const finalTotal = toMoney(Math.max(0, safeAmount - discountAmount));

  return {
    promotion,
    discountAmount,
    finalTotal,
  };
}

class RideController {
  getNonTerminalStatuses() {
    return NON_TERMINAL_STATUSES;
  }

  async dispatchRideToNearbyDrivers(ride, io) {
    try {
      if (!io || !ride) return;

      // Hydrate client details so the payload builder includes Name/Photo!
      if (!ride.populated("clientId")) {
        await ride.populate("clientId");
      }

      // Dynamic Progressive Scaling synchronized with the client-side circle UI!
      const dynamicRadius = calculateDynamicSearchRadius(ride);
      const searchRadius = dynamicRadius;

      let nearbyDrivers = [];
      try {
        nearbyDrivers = await DriverLocation.findNearby(
          ride.pickup.latitude,
          ride.pickup.longitude,
          searchRadius,
          ride.vehicleType,
          50,
          ride.serviceType,
        );
      } catch (findDriversErr) {
        console.error("Erro ao buscar motoristas proximos:", findDriversErr);
      }

      const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id, status: "completed" }).catch(() => 0);

      // Filtrar motoristas que aceitam maquininha física caso o pagamento seja via card_machine
      const paymentMethod = normalizePaymentMethod(
        ride?.payment?.method?.type || ride?.payment?.method || ride?.payment
      );
      
      try {
        const driverIds = nearbyDrivers.map(d => d.driverId).filter(Boolean);
        if (driverIds.length > 0) {
          let query = { _id: { $in: driverIds } };
          
          if (paymentMethod === "card_machine") {
            query["driverPreferences.acceptsCardMachine"] = true;
          } else if (paymentMethod === "pix") {
            query["driverPreferences.acceptsPix"] = { $ne: false }; // default: true
          } else if (paymentMethod === "cash") {
            query["driverPreferences.acceptsCash"] = { $ne: false }; // default: true
          }
          // Note: wallet and in-app credit cards do not filter drivers (mandatory as requested)

          const users = await User.find(query).select("_id");
          const allowedDriverIds = new Set(users.map(u => String(u._id)));
          nearbyDrivers = nearbyDrivers.filter(d => allowedDriverIds.has(String(d.driverId)));
        }
      } catch (filterErr) {
        console.error("Erro ao filtrar motoristas por preferências de pagamento:", filterErr);
      }

      nearbyDrivers.forEach((driver) => {
        try {
          if (!driver || !driver.driverId) return;
          const driverStr = String(driver.driverId);

          const alreadyProposed =
            Array.isArray(ride.negotiation?.offers) &&
            ride.negotiation.offers.some(
              (item) => String(item.driverId?._id || item.driverId) === driverStr,
            );
          const alreadyRejected =
            Array.isArray(ride.rejectedBy) &&
            ride.rejectedBy.some(
              (item) => String(item.driverId?._id || item.driverId) === driverStr,
            );
          if (alreadyProposed || alreadyRejected) return;

          let distanceToPickup = 0;
          try {
            if (typeof driver.distanceTo === "function") {
              distanceToPickup = driver.distanceTo(
                ride.pickup.latitude,
                ride.pickup.longitude,
              );
            }
          } catch (distErr) {
            console.error(`Erro ao calcular distancia para driver=${driver.driverId}:`, distErr);
          }

          if (ride.isWaitingInQueue) {
            // Light notification only (amber banner & bell)
            io.to(`driver-${driver.driverId}`).emit("waiting-queue-updated");
          } else {
            //Standard pop-up card flow for active search
            const payload = buildRideRequestPayload(ride, {
              distanceToPickup,
              clientRidesCount,
            });
            io.to(`driver-${driver.driverId}`).emit("new-ride-request", payload);
            if (ride.serviceType === "delivery") {
              io.to(`driver-${driver.driverId}`).emit("delivery-open", payload);
            } else {
              io.to(`driver-${driver.driverId}`).emit("ride-open", payload);
            }
          }
        } catch (driverEmitErr) {
          console.error(`Erro ao despachar requisicao para driver=${driver?.driverId}:`, driverEmitErr);
        }
      });

      // Enviar  Push para motoristas em segundo plano ou fechados
      //  Silenciar Push para a Fila de Espera (apenas alerta leve interno na Tarja)
      if (!ride.isWaitingInQueue) {
        try {
          const driverIds = nearbyDrivers.map(d => d.driverId).filter(Boolean);
          if (driverIds.length > 0) {
            User.find({ _id: { $in: driverIds } }).select("pushToken")
              .then(users => {
                const pushTokens = users.map(u => u.pushToken).filter(Boolean);
                if (pushTokens.length > 0) {
                  const pushNotificationService = require("../services/push-notification.service");
                  pushNotificationService.sendPushNotifications(
                    pushTokens,
                    "Ã°Å¸Å¡â‚¬ Novo pedido disponÃƒÂ­vel!",
                    `Nova solicitaÃƒÂ§ÃƒÂ£o de ${ride.serviceType === "delivery" ? "entrega" : "corrida"} por R$ ${Number(ride.pricing?.total || 0).toFixed(2).replace(".", ",")}`,
                    {
                      type: "new_order",
                      rideId: String(ride._id),
                      serviceType: ride.serviceType,
                    },
                    "urgent_delivery"
                  ).catch(err => console.error("Erro ao enviar push:", err));
                }
              })
              .catch(err => console.error("Erro ao buscar pushTokens:", err));
          }
        } catch (pushErr) {
          console.error("Erro ao enviar notificaÃƒÂ§ÃƒÂµes push em lote para motoristas:", pushErr);
        }
      }

      const timeoutKey = String(ride._id);
      const previousActiveTimeout = ACTIVE_SEARCH_TIMEOUTS.get(timeoutKey);
      if (previousActiveTimeout) {
        clearTimeout(previousActiveTimeout);
        ACTIVE_SEARCH_TIMEOUTS.delete(timeoutKey);
      }

      const activeTimeout = setTimeout(async () => {
        try {
          const updatedRide = await Ride.findById(ride._id);
          
          // Ã°Å¸â€ºÂ¡Ã¯Â¸Â NEGOTIATION SHIELD: If any drivers sent proposals, BLOCK timeout cancellation!
          const activeOffers = Array.isArray(updatedRide?.negotiation?.offers)
            ? updatedRide.negotiation.offers.filter(o => o.status !== "rejected")
            : [];

          if (
            updatedRide &&
            String(updatedRide.status) === "requesting" &&
            !updatedRide.driverId &&
            !updatedRide.isWaitingInQueue &&
            activeOffers.length === 0 // Ã°Å¸â€ºÂ¡Ã¯Â¸Â Only cancel if no negotiations are currently active!
          ) {
            updatedRide.status = "cancelled_no_driver";
            updatedRide.cancelledAt = new Date();
            await updatedRide.save();
            await moveToHistory(updatedRide);

            const clientId = ride.clientId?._id || ride.clientId;
            if (clientId) {
              const cancelPayload1 = { rideId: ride._id, reason: "no_driver_found" };
              io.to(`client-${clientId}`).emit("ride-cancelled", cancelPayload1);
              if (ride.serviceType === "delivery") {
                io.to(`client-${clientId}`).emit("delivery-cancelled", cancelPayload1);
              } else {
                io.to(`client-${clientId}`).emit("ride-cancelled", cancelPayload1);
              }
            }

            // Ã°Å¸Å¡Â¨ EXCLUSIVE FIX: Broadcast the timeout-cancellation to ALL nearby drivers who received the offer!
            if (Array.isArray(nearbyDrivers) && nearbyDrivers.length > 0) {
              nearbyDrivers.forEach((driver) => {
                if (driver && driver.driverId) {
                  const cancelPayload2 = { rideId: ride._id, reason: "tempo_limite_esgotado" };
                  io.to(`driver-${driver.driverId}`).emit("ride-cancelled", cancelPayload2);
                  if (ride.serviceType === "delivery") {
                    io.to(`driver-${driver.driverId}`).emit("delivery-cancelled", cancelPayload2);
                  } else {
                    io.to(`driver-${driver.driverId}`).emit("ride-cancelled", cancelPayload2);
                  }
                }
              });
            }
          }
        } catch (timeoutErr) {
          console.error("Erro no timeout de cancelamento por falta de motorista:", timeoutErr);
        } finally {
          ACTIVE_SEARCH_TIMEOUTS.delete(timeoutKey);
        }
      }, (ride.searchTimeoutSeconds || 300) * 1000);

      ACTIVE_SEARCH_TIMEOUTS.set(timeoutKey, activeTimeout);
    } catch (dispatchErr) {
      console.error("Erro critico em dispatchRideToNearbyDrivers:", dispatchErr);
    }
  }

  scheduleRideDispatch(rideId, scheduledFor, io) {
    const key = String(rideId);
    const previous = SCHEDULED_DISPATCH_TIMEOUTS.get(key);
    if (previous) {
      clearTimeout(previous);
      SCHEDULED_DISPATCH_TIMEOUTS.delete(key);
    }

    const delay = Math.max(0, new Date(scheduledFor).getTime() - Date.now());
    const timeoutRef = setTimeout(async () => {
      try {
        const ride = await Ride.findById(rideId)
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");

        if (!ride || ride.status !== "scheduled") return;

        ride.status = "requesting";
        ride.requestedAt = new Date();
        await ride.save();

        await module.exports.dispatchRideToNearbyDrivers(ride, io);
      } catch (error) {
        console.error("Erro ao disparar corrida agendada:", error);
      } finally {
        SCHEDULED_DISPATCH_TIMEOUTS.delete(key);
      }
    }, delay);

    SCHEDULED_DISPATCH_TIMEOUTS.set(key, timeoutRef);
  }

  // Timeout para payment_pending: expira apos 5 minutos se o cliente nao confirmar pagamento
  schedulePaymentPendingTimeout(rideId, io) {
    const key = String(rideId);
    const previous = PAYMENT_PENDING_TIMEOUTS.get(key);
    if (previous) {
      clearTimeout(previous);
      PAYMENT_PENDING_TIMEOUTS.delete(key);
    }

    const PAYMENT_DEADLINE_MS = 5 * 60 * 1000; // 5 minutos

    const timeoutRef = setTimeout(async () => {
      try {
        const ride = await Ride.findById(rideId);
        if (!ride || String(ride.status) !== "payment_pending") {
          PAYMENT_PENDING_TIMEOUTS.delete(key);
          return;
        }

        // Libera o motorista e volta para busca
        const previousDriverId = ride.driverId;
        ride.driverId = null;
        ride.negotiation.selectedDriverId = null;
        ride.negotiation.selectedAt = null;
        ride.negotiation.finalAgreedPrice = null;
        ride.status = "requesting";
        ride.payment.method = null;
        ride.payment.status = "not_selected";
        ride.requestedAt = new Date();
        ride.payment.failureReason = "payment_timeout";

        await ride.save();
        if (previousDriverId) {
          await DriverLocation.findOneAndUpdate(
            { driverId: previousDriverId },
            { status: "available", currentRideId: null },
          );
        }

        if (io) {
          if (previousDriverId) {
            io.to("driver-" + previousDriverId).emit("delivery-selection-expired", {
              rideId: ride._id,
              reason: "tempo_pagamento_expirado",
            });
            const cancelPayload3 = {
              rideId: ride._id,
              cancelledBy: "system",
              reason: "payment_timeout",
              message: "Pagamento do cliente expirou. Solicitação cancelada para o motorista.",
            };
            io.to("driver-" + previousDriverId).emit("ride-cancelled", cancelPayload3);
            if (ride.serviceType === "delivery") {
              io.to("driver-" + previousDriverId).emit("delivery-cancelled", cancelPayload3);
            } else {
              io.to("driver-" + previousDriverId).emit("ride-cancelled", cancelPayload3);
            }
          }
          const clientId = ride.clientId?._id || ride.clientId;
          if (clientId) {
            io.to("client-" + clientId).emit("ride-payment-expired", {
              rideId: ride._id,
              reason: "Tempo de pagamento expirado. O motorista foi liberado.",
            });
            io.to("client-" + clientId).emit("ride-status-updated", ride);
          }
        }
      } catch (error) {
        console.error("Erro no timeout de payment_pending:", error);
      } finally {
        PAYMENT_PENDING_TIMEOUTS.delete(key);
      }
    }, PAYMENT_DEADLINE_MS);

    PAYMENT_PENDING_TIMEOUTS.set(key, timeoutRef);
  }

  // Buscar corrida ativa do usuÃƒÆ’Ã‚Â¡rio autenticado
  async getActive(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;

      // Motorista: usa DriverLocation.currentRideId como fonte de verdade
      if (userType === "driver") {
        const DriverLocation = require("../models/DriverLocation");
        const dl = await DriverLocation.findOne({ driverId: userId });

        let ride = dl?.currentRideId
          ? await Ride.findById(dl.currentRideId)
              .populate("clientId", "name phone profilePhoto")
              .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt")
                        : null;

        if (!ride) {
          ride = await Ride.findOne({
            driverId: userId,
            status: { $in: NON_TERMINAL_STATUSES },
          })
            .sort({ updatedAt: -1 })
            .populate("clientId", "name phone profilePhoto")
            .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");

          if (ride?._id && dl) {
            await DriverLocation.findOneAndUpdate(
              { driverId: userId },
              { currentRideId: ride._id, status: "on_ride" },
            );
          }
        }

        if (!ride) {
          return res.json({ active: false, ride: null });
        }

        // Se jÃƒÆ’Ã‚Â¡ finalizou/cancelou, considera sem corrida ativa
        if (
          [
            "completed",
            "cancelled",
            "cancelled_by_client",
            "cancelled_by_driver",
            "cancelled_no_driver",
          ].includes(ride.status)
        ) {
          return res.json({ active: false, ride: null });
        }

        return res.json({ active: true, ride });
      }

      // Cliente (opcional): pega a ÃƒÆ’Ã‚Âºltima corrida nÃƒÆ’Ã‚Â£o finalizada
      if (userType === "client") {
        const ride = await Ride.findOne({
          clientId: userId,
          status: { $in: NON_TERMINAL_STATUSES },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");

        if (!ride) return res.json({ active: false, ride: null });
        return res.json({ active: true, ride });
      }

      return res.json({ active: false, ride: null });
    } catch (error) {
      console.error("Erro ao buscar corrida ativa:", error);
      return sendError(res, 500, "Erro ao buscar corrida ativa", {
        details: error.message,
      });
    }
  }

  // Lista corridas ativas (cliente/motorista)
  async getActiveList(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;
      const statuses = NON_TERMINAL_STATUSES;

      if (userType === "client") {
        const clientStatuses = [
          ...NON_TERMINAL_STATUSES,
          "scheduled",
        ];
        const rides = await Ride.find({
          clientId: userId,
          status: { $in: clientStatuses },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");

        // Dynamically add allRejected flag
        const enrichedRides = [];
        for (const ride of rides) {
          const rideObj = ride.toObject();
          if (ride.status === "requesting") {
            const searchRadius = 15000;
            const nearbyDrivers = await DriverLocation.findNearby(
              ride.pickup.latitude,
              ride.pickup.longitude,
              searchRadius,
              ride.vehicleType,
              100,
              ride.serviceType,
            ).catch(() => []);

            const nextAvailable = nearbyDrivers.find((d) => {
              const id = String(d.driverId);
              const rejected = ride.rejectedBy?.some(
                (r) => String(r.driverId) === id,
              );
              return !rejected;
            });

            rideObj.allRejected = !nextAvailable;
          } else {
            rideObj.allRejected = false;
          }
          enrichedRides.push(rideObj);
        }

        return res.json({ active: enrichedRides.length > 0, count: enrichedRides.length, rides: enrichedRides });
      }

      if (userType === "driver") {
        const rides = await Ride.find({
          driverId: userId,
          status: { $in: statuses },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");

        return res.json({ active: rides.length > 0, count: rides.length, rides });
      }

      return res.json({ active: false, count: 0, rides: [] });
    } catch (error) {
      console.error("Erro ao buscar lista de corridas ativas:", error);
      return sendError(res, 500, "Erro ao buscar corridas ativas", {
        details: error.message,
      });
    }
  }

  // Motorista busca solicitacoes ainda disponiveis.
  // Isso cobre quando o socket foi perdido ou o motorista ficou online depois do pedido.
  async getAvailableRequests(req, res) {
    try {
      const driverId = req.user.id;

      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem buscar solicitacoes");
      }

      // Ã°Å¸Å¡â‚¬ Pre-calculate negotiations count for the driver home screen banner
      const pendingNegotiationsCount = await Ride.countDocuments({
        status: { $in: ["requesting", "driver_assigned"] },
        "negotiation.enabled": true,
        "negotiation.finalAgreedPrice": null,
        "negotiation.offers": {
          $elemMatch: {
            driverId: new mongoose.Types.ObjectId(driverId),
            status: { $in: ["accepted", "countered", "client_countered"] },
          },
        },
      }).catch(() => 0);

      const clientCounteredCount = await Ride.countDocuments({
        status: { $in: ["requesting", "driver_assigned"] },
        "negotiation.enabled": true,
        "negotiation.finalAgreedPrice": null,
        "negotiation.offers": {
          $elemMatch: {
            driverId: new mongoose.Types.ObjectId(driverId),
            status: "client_countered",
          },
        },
      }).catch(() => 0);

      const activeRide = await Ride.findOne({
        driverId,
        status: { $in: NON_TERMINAL_STATUSES },
      }).select("_id");
      if (activeRide?._id) {
        return res.json({ count: 0, requests: [], pendingNegotiationsCount, clientCounteredCount });
      }

      const driverLocation = await DriverLocation.findOne({ driverId });
      if (
        !driverLocation ||
        driverLocation.status !== "available" ||
        driverLocation.currentRideId
      ) {
        let waitingQueueCount = 0;
        if (driverLocation) {
          const fallbackSvcs = Array.isArray(driverLocation.serviceTypes) ? driverLocation.serviceTypes : [];
          if (fallbackSvcs.length > 0) {
          waitingQueueCount = await Ride.countDocuments({
              status: "requesting",
              isWaitingInQueue: true,
              vehicleType: driverLocation.vehicleType,
              serviceType: { $in: fallbackSvcs },
              "rejectedBy.driverId": { $ne: driverId },
            });
          }
        }
        return res.json({ count: 0, requests: [], waitingQueueCount, pendingNegotiationsCount, clientCounteredCount });
      }

      const serviceTypes = Array.isArray(driverLocation.serviceTypes)
        ? driverLocation.serviceTypes
        : [];
      if (!serviceTypes.length) {
        const waitingQueueCount = 0;
        return res.json({ count: 0, requests: [], waitingQueueCount, pendingNegotiationsCount, clientCounteredCount });
      }
      const compatibleServiceTypes = serviceTypes.filter((serviceType) =>
        isServiceCompatibleWithVehicle(driverLocation.vehicleType, serviceType),
      );
      if (!compatibleServiceTypes.length) {
        return res.json({ count: 0, requests: [], waitingQueueCount: 0, pendingNegotiationsCount, clientCounteredCount });
      }

      const requestedAfter = new Date(Date.now() - 12 * 60 * 60 * 1000); // Exibe ofertas de ate 12 horas atras para manter ativas visiveis
      const rides = await Ride.find({
        status: { $in: ["requesting", "driver_assigned"] },
        vehicleType: driverLocation.vehicleType,
        serviceType: { $in: compatibleServiceTypes },
        "negotiation.offers.driverId": { $ne: new mongoose.Types.ObjectId(driverId) }, // Ã°Å¸Å¡â‚¬ Robust casting to exclude active negotiations!
        $and: [
          {
            $or: [
              { status: "requesting", driverId: null },
              { status: "driver_assigned", driverId },
            ],
          },
           {
             $or: [
               // Ã°Å¸Å’Â Fila de Espera PÃƒÂºblica: Fica permanentemente visÃƒÂ­vel (mas respeitando rejeiÃƒÂ§ÃƒÂµes)
               {
                 $and: [
                   { isWaitingInQueue: true },
                   { "rejectedBy.driverId": { $ne: driverId } },
                 ],
               },
               // Ã°Å¸Å¡â‚¬ Oferta Direta em Tempo Real: Respeita o limite de 2min e esconde de quem jÃƒÂ¡ recusou
               {
                 $and: [
                   { requestedAt: { $gte: requestedAfter } },
                   { "rejectedBy.driverId": { $ne: driverId } },
                 ],
               },
             ],
           },
        ],
      })
        .sort({ requestedAt: -1 })
        .limit(30)
        .populate("clientId", "name phone profilePhoto rating");

      const clientIds = [...new Set(rides.map((r) => r.clientId?._id?.toString()).filter(Boolean))];
      const ridesCounts = await RideHistory.aggregate([
        { $match: { clientId: { $in: clientIds.map(id => new mongoose.Types.ObjectId(id)) }, status: "completed" } },
        { $group: { _id: "$clientId", count: { $sum: 1 } } },
      ]);
      const countByClientId = new Map(ridesCounts.map((item) => [item._id.toString(), item.count]));

      const requests = rides
        .map((ride) => {
          const pickup = ride.pickup;
          if (!pickup?.latitude || !pickup?.longitude) return null;

          // Align driver visibility filter with progressive frontend seeker! Ã°Å¸Â§Â­Ã°Å¸Å¡â‚¬
          const dynamicRadius = calculateDynamicSearchRadius(ride);

          const distanceToPickup = driverLocation.distanceTo(
            pickup.latitude,
            pickup.longitude,
          );

          if (distanceToPickup > dynamicRadius) return null;
          const cId = ride.clientId?._id?.toString();
          const clientRidesCount = countByClientId.get(cId) || 0;
          return buildRideRequestPayload(ride, { distanceToPickup, clientRidesCount });
        })
        .filter(Boolean)
        .slice(0, 10);

      console.log(
        `[rides/available-requests] driver=${driverId} requests=${requests.length}`,
      );

      // Ã¢Å“â€¦ Derive waitingQueueCount from already-filtered requests so the badge
      // always matches exactly what the driver sees in the queue tab.
      const waitingQueueCount = requests.filter((r) => r.isWaitingInQueue === true).length;

      return res.json({ count: requests.length, requests, waitingQueueCount, pendingNegotiationsCount, clientCounteredCount });
    } catch (error) {
      console.error("Erro ao buscar solicitacoes disponiveis:", error);
      return sendError(res, 500, "Erro ao buscar solicitacoes disponiveis", {
        details: error.message,
      });
    }
  }

  // Lista negociacoes pendentes para o motorista (ja respondeu e aguarda cliente)
  async getPendingNegotiations(req, res) {
    try {
      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem consultar negociacoes pendentes");
      }

      const driverId = String(req.user.id);

      const rides = await Ride.find({
        $or: [
          // NegociaÃ§Ãµes pendentes ativas
          {
            status: { $in: ["requesting", "driver_assigned"] },
            "negotiation.enabled": true,
            "negotiation.finalAgreedPrice": null,
            "negotiation.offers": {
              $elemMatch: {
                driverId: new mongoose.Types.ObjectId(driverId),
                status: { $in: ["accepted", "countered", "client_countered"] },
              },
            },
          },
          // Cliente selecionou minha proposta e esta confirmando o pagamento
          {
            status: "payment_pending",
            driverId: new mongoose.Types.ObjectId(driverId),
            "negotiation.enabled": true,
          },
          // Corridas concluÃ­das por mim
          {
            status: "completed",
            driverId: new mongoose.Types.ObjectId(driverId),
          },
          // Corridas canceladas pelo motorista (eu)
          {
            status: "cancelled_by_driver",
            driverId: new mongoose.Types.ObjectId(driverId),
          },
          // Corridas canceladas pelo cliente que o motorista interagiu
          {
            status: "cancelled_by_client",
            $or: [
              {
                "negotiation.offers.driverId": new mongoose.Types.ObjectId(driverId),
              },
              {
                "rejectedBy.driverId": new mongoose.Types.ObjectId(driverId),
              },
            ],
          },
          // Corridas onde recusei e foram finalizadas/canceladas
          {
            status: { $in: ["cancelled", "cancelled_by_driver", "cancelled_no_driver", "no_drivers_available"] },
            "rejectedBy.driverId": new mongoose.Types.ObjectId(driverId),
          }
        ],
      })
        .populate("clientId", "name phone profilePhoto rating")
        .sort({ updatedAt: -1 });

      const pending = rides.map((ride) => {
        const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
        let myOffer = offers.find(
          (offer) => String(offer.driverId?._id || offer.driverId) === driverId,
        );

        // Se o motorista nÃ£o fez proposta mas rejeitou a corrida (estÃ¡ em rejectedBy)
        const isRejectedByMe = Array.isArray(ride.rejectedBy) && ride.rejectedBy.some(
          (r) => String(r.driverId?._id || r.driverId) === driverId
        );

        if (!myOffer && isRejectedByMe) {
          myOffer = {
            amount: ride.pricing?.total || ride.negotiation?.clientOffer || 0,
            status: "rejected",
            createdAt: new Date(),
          };
        }

        return {
          rideId: String(ride._id),
          status: ride.status,
          serviceType: ride.serviceType,
          vehicleType: ride.vehicleType,
          pickup: ride.pickup,
          dropoff: ride.dropoff,
          distance: ride.distance,
          duration: ride.duration,
          pricing: ride.pricing,
          details: ride.details,
          requestedAt: ride.requestedAt,
          negotiation: {
            enabled: Boolean(ride.negotiation?.enabled),
            clientOffer: ride.negotiation?.clientOffer ?? null,
            suggestedMinPrice: ride.negotiation?.suggestedMinPrice ?? null,
            myOffer: myOffer
              ? {
                  amount: myOffer.amount,
                  driverAmount: myOffer.driverAmount || null,
                  status: myOffer.status,
                  message: myOffer.message || "",
                  createdAt: myOffer.createdAt,
                  updatedAt: myOffer.updatedAt,
                }
              : null,
          },
          client: ride.clientId
            ? {
                id: ride.clientId._id,
                name: ride.clientId.name,
                phone: ride.clientId.phone,
                profilePhoto: ride.clientId.profilePhoto,
                rating: ride.clientId.rating,
              }
            : null,
        };
      });

      return res.json({ success: true, count: pending.length, requests: pending });
    } catch (error) {
      console.error("Erro ao buscar negociacoes pendentes:", error);
      return sendError(res, 500, "Erro ao buscar negociacoes pendentes", {
        details: error.message,
      });
    }
  }

  // Criar uma nova solicitaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o de corrida
  async create(req, res) {
    try {
      const {
        serviceType,
        vehicleType,
        rideCategory,
        purposeId,
        cityId,
        pickup,
        dropoff,
        stops,
        pricing,
        distance,
        duration,
        details,
        payment,
        scheduledFor,
        negotiation,
        promotionCode,
        routeCoordinates,
      } = req.body;

      // ── Antifraude / KYC do cliente ──
      // Bloqueia conta suspensa/bloqueada; (opcional) exige verificação de identidade.
      const clientAccount = await User.findById(req.user.id).select("accountStatus clientVerification");
      if (clientAccount) {
        const acct = String(clientAccount.accountStatus || "active");
        if (acct === "blocked" || acct === "suspended") {
          return sendError(
            res,
            403,
            acct === "blocked"
              ? "Sua conta está bloqueada. Fale com o suporte."
              : "Sua conta está suspensa temporariamente. Fale com o suporte.",
            { accountStatus: acct },
          );
        }
        const cfgKyc = await getRuntimeConfig().catch(() => null);
        if (
          cfgKyc?.requireClientVerification &&
          String(clientAccount.clientVerification?.status || "none") !== "approved"
        ) {
          return sendError(res, 403, "Conclua a verificação de identidade no app antes de pedir.", {
            needsVerification: true,
          });
        }

        // ── Geofencing: pickup precisa estar dentro do raio de uma cidade ativa ──
        if (cfgKyc?.geofencingEnabled) {
          const pLat = Number(pickup?.latitude);
          const pLng = Number(pickup?.longitude);
          if (Number.isFinite(pLat) && Number.isFinite(pLng)) {
            const activeCities = await City.find({ isActive: true })
              .select("center radiusKm name")
              .lean()
              .catch(() => []);
            const within = (activeCities || []).some((c) => {
              const cLat = Number(c.center?.latitude);
              const cLng = Number(c.center?.longitude);
              if (!Number.isFinite(cLat) || !Number.isFinite(cLng)) return false;
              const km = calculateHaversineDistance(pLat, pLng, cLat, cLng);
              return km <= Number(c.radiusKm || 50);
            });
            if (activeCities.length > 0 && !within) {
              return sendError(res, 403, "Ainda não atendemos nesta região. Em breve!", {
                outOfServiceArea: true,
              });
            }
          }
        }
      }

      // Sanitiza paradas (waypoints): mantém apenas coords válidas e normaliza a ordem
      const sanitizedStops = Array.isArray(stops)
        ? stops
            .filter(
              (s) =>
                Number.isFinite(Number(s?.latitude)) &&
                Number.isFinite(Number(s?.longitude)),
            )
            .map((s, idx) => ({
              address: s.address || "",
              latitude: Number(s.latitude),
              longitude: Number(s.longitude),
              order: Number.isFinite(Number(s.order)) ? Number(s.order) : idx,
            }))
        : [];

      // Categoria de corrida válida (apenas fluxo ride)
      const VALID_RIDE_CATEGORIES = ["moto", "car_economy", "car_comfort", "car_luxury"];
      const resolvedRideCategory =
        String(serviceType || "").toLowerCase() === "ride" &&
        VALID_RIDE_CATEGORIES.includes(rideCategory)
          ? rideCategory
          : null;

      const clientId = req.user.id; // Do middleware de autenticaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o

      // Verifica se possui saldo na carteira digital (wallet)
      const normPaymentMethod = normalizePaymentMethod(payment?.method?.type || payment?.method || payment);
      if (normPaymentMethod === "wallet") {
        const clientUser = await User.findById(clientId);
        const walletBalance = clientUser?.wallet?.balance || 0;
        const requestedOffer = Number(negotiation?.clientOffer) || Number(pricing?.total) || 0;
        if (walletBalance < requestedOffer) {
          return sendError(res, 400, "Saldo insuficiente na carteira LevaPay. Por favor, adicione saldo para continuar.");
        }
      }

      // ValidaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes bÃƒÆ’Ã‚Â¡sicas
      if (!pickup || !dropoff) {
        return sendError(res, 400, "Origem e destino sao obrigatorios");
      }

      const scheduledDate = parseScheduledDate(scheduledFor);
      if (scheduledFor && !scheduledDate) {
        return sendError(res, 400, "Data de agendamento invalida");
      }

      // Resolver purposeId (o app pode mandar slug, ex.: "documents")
      let resolvedPurposeId = purposeId;
      try {
        const mongoose = require("mongoose");
        if (
          resolvedPurposeId &&
          !mongoose.Types.ObjectId.isValid(resolvedPurposeId)
        ) {
          // Purpose removido
          const purpose = await Purpose.findOne({
            id: String(resolvedPurposeId),
            vehicleType: vehicleType,
          }).select("_id");
          resolvedPurposeId = purpose?._id;
        }
      } catch (e) {
        console.log("Aviso: nÃƒÆ’Ã‚Â£o foi possÃƒÆ’Ã‚Â­vel resolver purposeId", purposeId);
        resolvedPurposeId = undefined;
      }

      // Permite novo pedido quando o cliente so tiver entregas ativas.
      // Bloqueia quando existir corrida/frete ativo.
      const activeRide = await Ride.findOne({
        clientId,
        status: { $in: NON_TERMINAL_STATUSES },
        serviceType: { $nin: ["delivery"] },
      }).select("_id status");

      if (activeRide?._id) {
        return sendError(res, 400, "Voce ja possui uma corrida em andamento", {
          rideId: activeRide._id,
          status: activeRide.status,
        });
      }
      if (!isServiceCompatibleWithVehicle(vehicleType, serviceType)) {
        return sendError(res, 400, "Tipo de servico incompativel com o veiculo selecionado");
      }

      // Criar a corrida
      // App fee e timeout padrao movidos para constantes do backend.
      const runtimeConfig = await getRuntimeConfig().catch(() => null);
      const appFeePercentage = Number(
        runtimeConfig?.appFeePercentage || DEFAULT_APP_FEE_PERCENTAGE,
      );

      const isDeliveryRequest = String(serviceType || "").toLowerCase() === "delivery";
      let pricingSnapshot = null;
      let safePricing = { ...(pricing || {}) };
      let resolvedDistance = distance;
      let resolvedDuration = duration;

      if (isDeliveryRequest) {
        pricingSnapshot = await calculateDeliveryPricingSnapshot({
          serviceType: "delivery",
          vehicleType,
          pickup,
          dropoff,
          deliveryType: details?.itemType || req.body.deliveryType,
          cargoSize: details?.cargoSize || req.body.cargoSize,
          approximateWeightKg: details?.approximateWeightKg || req.body.approximateWeightKg,
          isFragile: details?.isFragile ?? req.body.isFragile,
          needsHelper: details?.needsHelper ?? req.body.needsHelper,
          priority: details?.priority ?? req.body.priority,
          runtimeConfig,
        });
        safePricing = { ...pricingSnapshot.pricing };
        resolvedDistance = pricingSnapshot.distance;
        resolvedDuration = pricingSnapshot.duration;
      }

      const subtotal = toMoney(Number(safePricing.total || 0));
      if (!Number.isFinite(subtotal) || subtotal <= 0) {
        return sendError(res, 400, "Preco da corrida invalido");
      }

      let appliedPromotion = null;
      let discountAmount = 0;
      let finalTotal = subtotal;

      if (promotionCode) {
        const promotionResult = await resolvePromotionForRide({
          code: promotionCode,
          clientId,
          amount: subtotal,
          serviceType,
        });

        if (promotionResult?.error) {
          return sendError(res, 400, promotionResult.error);
        }

        if (promotionResult?.promotion) {
          appliedPromotion = promotionResult.promotion;
          discountAmount = toMoney(promotionResult.discountAmount || 0);
          finalTotal = toMoney(promotionResult.finalTotal || subtotal);
        }
      }

      safePricing.subtotal = subtotal;
      safePricing.discountAmount = discountAmount;
      safePricing.promotionCode = appliedPromotion?.code || undefined;
      safePricing.total = finalTotal;

      const suggestedMinPrice = isDeliveryRequest
        ? toMoney(
            Number(
              pricingSnapshot?.smartPricing?.minimumPrice ||
                pricingSnapshot?.pricing?.subtotal ||
                finalTotal,
            ),
          )
        : calculateSuggestedMinPrice(
            finalTotal,
            runtimeConfig?.suggestedMinPricePercent ?? 0.8,
          );
      const requestedOffer = Number(negotiation?.clientOffer);
      const wantsNegotiation = Boolean(negotiation?.enabled) && Number.isFinite(requestedOffer);
      if (wantsNegotiation && requestedOffer <= 0) {
        return sendError(res, 400, "Oferta do cliente invalida");
      }
      if (isDeliveryRequest && wantsNegotiation && requestedOffer < suggestedMinPrice) {
        return sendError(res, 400, "Oferta abaixo do minimo permitido para esta entrega", {
          suggestedMinPrice,
          requestedOffer: toMoney(requestedOffer),
        });
      }

      // 2. Calcula Taxa da Plataforma (Valor Bruto que sai do motorista)
      const total = finalTotal;
      const platformFee = toMoney(total * (appFeePercentage / 100));
      const driverValue = toMoney(total - platformFee);

      // 3. Verifica Split com Representante (Se houver)
      let platformShare = platformFee; // PadrÃƒÆ’Ã‚Â£o: 100% da taxa vai pra plataforma
      let representativeShare = 0;
      let representativeId = null;

      if (cityId) {
        const city = await City.findById(cityId);
        if (city && city.representativeId) {
          representativeId = city.representativeId;
          // PadrÃƒÆ’Ã‚Â£o 50/50 ou override da cidade
          const repPct = city.revenueSharing?.representativePercentage || 50;
          representativeShare = platformFee * (repPct / 100);
          platformShare = platformFee - representativeShare;
        }
      }

      // Adiciona calculos ao objeto de pricing
      safePricing.platformFee = platformFee;
      safePricing.driverValue = driverValue;

      // Salva detalhe do split no objeto da corrida (para relatÃƒÆ’Ã‚Â³rios futuros)
      const splitDetails = {
        platformConfigUsed: appFeePercentage,
        totalAppFee: platformFee,
        platformShare: parseFloat(platformShare.toFixed(2)),
        representativeShare: parseFloat(representativeShare.toFixed(2)),
        representativeId: representativeId,
      };

      const resolvedDetails = { ...(details || {}) };


      const ride = new Ride({
        clientId: req.user.id,
        serviceType,
        vehicleType,
        rideCategory: resolvedRideCategory,
        purposeId: resolvedPurposeId,
        pickup,
        dropoff,
        stops: sanitizedStops,
        pricing: safePricing,
        splitDetails,
        distance: resolvedDistance,
        duration: resolvedDuration,
        routeCoordinates: sanitizeRouteCoordinates(routeCoordinates, pickup, dropoff),
        details: resolvedDetails,
        searchTimeoutSeconds: Number(
          runtimeConfig?.rideSearchTimeoutSeconds ||
            DEFAULT_RIDE_SEARCH_TIMEOUT_SECONDS,
        ),
        status: isScheduledForFuture(scheduledDate) ? "scheduled" : "requesting",
        requestedAt: new Date(),
        scheduledFor: scheduledDate || undefined,
        negotiation: {
          enabled: wantsNegotiation,
          clientOffer: wantsNegotiation ? toMoney(requestedOffer) : null,
          initialClientOffer: wantsNegotiation ? toMoney(requestedOffer) : null,
          suggestedMinPrice: wantsNegotiation ? suggestedMinPrice : null,
          finalAgreedPrice: null,
          offers: [],
        },
        cityId: cityId,
        promotion: appliedPromotion
          ? {
              promotionId: appliedPromotion._id,
              code: appliedPromotion.code,
              discountType: appliedPromotion.discountType,
              discountValue: appliedPromotion.discountValue,
              discountAmount,
              appliedAt: new Date(),
            }
          : undefined,
      });

      const paymentMethod = normalizePaymentMethod(payment?.method?.type || payment?.method || payment);
      if (paymentMethod) {
        ride.payment.method = paymentMethod;
        ride.payment.status = "pre_selected";
      }

      await ride.save();

      if (appliedPromotion) {
        await Promotion.updateOne(
          { _id: appliedPromotion._id },
          { $inc: { usageCount: 1 } },
        );
      }

      // Popular dados do cliente
      await ride.populate("clientId", "name phone profilePhoto");

      // Iniciar busca por motorista (via WebSocket)
      const io = req.app.get("io");
      if (io && ride.status === "scheduled" && scheduledDate) {
        module.exports.scheduleRideDispatch(ride._id, scheduledDate, io);
      } else if (io) {
        await module.exports.dispatchRideToNearbyDrivers(ride, io);
      }

      res.status(201).json({
        message: "Corrida solicitada com sucesso",
        ride,
        negotiationWarning:
          wantsNegotiation && Number(requestedOffer) < Number(suggestedMinPrice)
            ? `Oferta abaixo do sugerido (${suggestedMinPrice.toFixed(2)})`
            : null,
      });
    } catch (error) {
      console.error("Erro ao criar corrida:", error);
      return sendError(res, 500, "Erro ao criar corrida", {
        details: error.message,
      });
    }
  }

  // Motorista aceita a corrida
  async accept(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.id;

      // Impedir aceitar se o motorista estiver zerado ou com saldo negativo
      const driver = await User.findById(driverId);
      if (!driver) {
        return sendError(res, 404, "Motorista nao encontrado");
      }
      const balance = driver.driverBalance?.balance || 0;
      const opCredit = driver.driverBalance?.operationalCredit || 0;
      if (balance + opCredit <= 0) {
        return sendError(
          res,
          400,
          "Saldo insuficiente. Recarregue sua carteira para aceitar novas corridas/entregas."
        );
      }

      const now = new Date();
      const activeShift = await ShiftOffer.findOne({
        acceptedBy: driverId,
        status: "accepted",
        startAt: { $lte: now },
        endAt: { $gt: now },
      }).select("title startAt endAt");
      if (activeShift?._id) {
        return sendError(
          res,
          400,
          "Voce esta em plantao ativo e nao pode aceitar outras corridas agora",
          {
            shift: {
              id: activeShift._id,
              title: activeShift.title,
              startAt: activeShift.startAt,
              endAt: activeShift.endAt,
            },
          },
        );
      }

      // Impedir aceitar se o motorista jÃƒÆ’Ã‚Â¡ estiver em corrida
      const driverLocation = await DriverLocation.findOne({ driverId });
      if (driverLocation?.currentRideId) {
        return sendError(res, 400, "Voce ja possui uma corrida ativa", {
          currentRideId: driverLocation.currentRideId,
        });
      }

      const rideSnapshot = await Ride.findById(rideId).select(
        "_id serviceType vehicleType rideCategory status driverId rejectedBy negotiation",
      );
      if (!rideSnapshot) {
        return sendError(res, 404, "Corrida nao encontrada");
      }
      if (!driverLocation) {
        return sendError(res, 400, "Atualize sua localizacao antes de aceitar corridas");
      }
      if (!isServiceCompatibleWithVehicle(driverLocation.vehicleType, rideSnapshot.serviceType)) {
        return sendError(res, 400, "Servico incompativel com o veiculo do motorista");
      }
      const driverServiceTypes = Array.isArray(driverLocation.serviceTypes)
        ? driverLocation.serviceTypes
        : [];
      if (!driverServiceTypes.includes(String(rideSnapshot.serviceType || ""))) {
        return sendError(res, 400, "Este servico nao esta ativo para o motorista");
      }
      if (String(driverLocation.vehicleType || "") !== String(rideSnapshot.vehicleType || "")) {
        return sendError(res, 400, "Tipo de veiculo do motorista nao corresponde a solicitacao");
      }
      // Corrida: o motorista precisa atender a categoria solicitada (tier compatível)
      if (String(rideSnapshot.serviceType || "") === "ride" && rideSnapshot.rideCategory) {
        let driverCat = driverLocation.rideCategory;
        if (!driverCat) {
          const driverUser = await User.findById(driverId).select("vehicleInfo.rideCategory");
          driverCat = driverUser?.vehicleInfo?.rideCategory;
        }
        if (!isDriverCategoryCompatible(driverLocation.vehicleType, driverCat, rideSnapshot.rideCategory)) {
          return sendError(res, 400, "Sua categoria de veiculo nao corresponde a categoria da corrida");
        }
      }

      // 1) Tenta ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œtravarÃƒÂ¢Ã¢â€šÂ¬Ã‚Â o motorista (evita ele aceitar duas corridas em paralelo)
      const lockedDriver = await DriverLocation.findOneAndUpdate(
        {
          driverId,
          $or: [{ currentRideId: null }, { currentRideId: { $exists: false } }],
        },
        { status: "on_ride", currentRideId: rideId },
        { new: true },
      );

      if (!lockedDriver) {
        return sendError(res, 400, "Voce ja possui uma corrida ativa");
      }

      // 2) Aceite atÃƒÆ’Ã‚Â´mico da corrida (evita dois motoristas aceitarem ao mesmo tempo)
      const ride = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: { $in: ["requesting", "driver_assigned"] },
          "rejectedBy.driverId": { $ne: driverId },
          $or: [
            // ainda nÃƒÆ’Ã‚Â£o reservada
            { status: "requesting", driverId: null },
            // reservada para este motorista
            { status: "driver_assigned", driverId: driverId },
          ],
        },
        {
          driverId,
          status: "accepted",
          acceptedAt: now,
        },
        { new: true },
      );

      if (!ride) {
        // Libera o motorista caso a corrida nÃƒÆ’Ã‚Â£o esteja mais disponÃƒÆ’Ã‚Â­vel
        await DriverLocation.findOneAndUpdate(
          { driverId, currentRideId: rideId },
          { status: "available", currentRideId: null },
        );

        return sendError(res, 400, "Corrida nao esta mais disponivel");
      }

      if (ride.negotiation?.enabled && !ride.negotiation?.finalAgreedPrice) {
        await DriverLocation.findOneAndUpdate(
          { driverId, currentRideId: rideId },
          { status: "available", currentRideId: null },
        );
        return sendError(
          res,
          400,
          "Aguardando cliente selecionar a oferta antes do aceite final",
        );
      }

      // Escrow LevaPay no aceite direto (fluxo sem negociação). Idempotente: no fluxo
      // de lance o valor já foi retido no confirmNegotiationPayment. Se o hold falhar,
      // bloqueia o aceite e libera o driver.
      const paymentMethod = normalizePaymentMethod(
        ride?.payment?.method?.type || ride?.payment?.method || ride?.payment
      );
      if (paymentMethod === "wallet" && ride?.payment?.escrow?.status !== "reserved") {
        try {
          await walletEscrow.reserve(ride);
          await ride.save();
        } catch (escrowErr) {
          // Liberar trava do driver antes de retornar erro
          await DriverLocation.findOneAndUpdate(
            { driverId, currentRideId: rideId },
            { status: "available", currentRideId: null }
          );
          const statusCode = escrowErr.code === "INSUFFICIENT_BALANCE" ? 400 : 500;
          const message = escrowErr.code === "INSUFFICIENT_BALANCE"
            ? "Saldo LevaPay insuficiente para esta corrida."
            : "Erro ao reter o saldo para a corrida";
          return sendError(res, statusCode, message, { details: escrowErr.message });
        }
      }

      // Popular dados
      await ride.populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");
      await ride.populate("clientId", "name phone profilePhoto");

      // Notificar cliente via WebSocket
      const io = req.app.get("io");
      if (io) {
        // Obter dados do motorista
        const driverLocation = await DriverLocation.findOne({ driverId });

        const acceptPayload = {
          rideId: ride._id,
          driver: {
            id: ride.driverId._id,
            name: ride.driverId.name,
            phone: ride.driverId.phone,
            profilePhoto: ride.driverId.profilePhoto,
            rating: Number(ride.driverId.rating || 5),
            vehicle: driverLocation?.vehicle || {},
          },
          eta: ride.duration,
        };
        io.to(`client-${ride.clientId._id}`).emit("driver-found", acceptPayload);
        if (ride.serviceType === "delivery") {
          io.to(`client-${ride.clientId._id}`).emit("delivery-accepted", acceptPayload);
        } else {
          io.to(`client-${ride.clientId._id}`).emit("ride-accepted", acceptPayload);
        }

        // Notificar cliente sobre mudança na carteira (se LevaPay)
        if (ride?.payment?.escrow?.status === "reserved") {
          try {
            const clientId = ride.clientId?._id || ride.clientId;
            const clientForBalance = await User.findById(clientId);
            if (clientForBalance) {
              io.to(`client-${clientId}`).emit("wallet-updated", {
                balance: clientForBalance.wallet?.balance || 0,
                held: clientForBalance.wallet?.held || 0,
              });
            }
          } catch {}
        }

        // Notificar outros motoristas que a corrida foi aceita
        io.emit("ride-taken", { rideId: ride._id });

        // Emitir status atualizado para o client e ride room
        const statusPayload = {
          rideId: ride._id,
          status: ride.status,
          timestamp: new Date().toISOString(),
        };
        io.to(`client-${ride.clientId._id}`).emit("ride-status-updated", statusPayload);
        io.to(`ride:${ride._id}`).emit("ride-status-updated", statusPayload);
      }

      res.json({
        message: "Corrida aceita com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao aceitar corrida:", error);
      return sendError(res, 500, "Erro ao aceitar corrida", {
        details: error.message,
      });
    }
  }

  // Motorista rejeita a corrida
  async reject(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.id;
      const { reason } = req.body;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      // Adicionar ÃƒÂ  lista de rejeitados se nÃƒÂ£o estiver lÃƒÂ¡
      const alreadyRejected = ride.rejectedBy.some(
        (r) => String(r.driverId) === String(driverId)
      );
      if (!alreadyRejected) {
        ride.rejectedBy.push({
          driverId,
          rejectedAt: new Date(),
          reason,
        });
      }

      // ðŸš€ EXCLUSIVE: If the driver cancels/rejects the request, mark their active proposal as rejected!
      if (ride.negotiation && Array.isArray(ride.negotiation.offers)) {
        const targetIndex = ride.negotiation.offers.findIndex(
          (o) => String(o.driverId) === String(driverId) && o.status !== "rejected"
        );
        if (targetIndex >= 0) {
          ride.negotiation.offers[targetIndex].status = "rejected";
          ride.negotiation.offers[targetIndex].updatedAt = new Date();
        }
      }

      // Se a corrida estava reservada para este motorista, libera e tenta o prÃƒÂ³ximo
      const isAssignedToMe =
        ride.status === "driver_assigned" &&
        ride.driverId &&
        ride.driverId.toString() === driverId.toString();

      if (isAssignedToMe) {
        ride.status = "requesting";
        ride.driverId = null;
      }

      await ride.save();

      // Notifica o cliente de que as ofertas foram atualizadas (removendo a proposta retirada em tempo real)
      const io = req.app.get("io") || req.app.get("socketio");
      if (io) {
        const resolvedClientId = ride.clientId?._id || ride.clientId;
        if (resolvedClientId) {
          io.to(`client-${resolvedClientId}`).emit("ride-offers-updated", { rideId: ride._id });
        }
      }

      // Tenta oferecer para o prÃƒÂ³ximo motorista (Ignorado se jÃƒÂ¡ estiver na fila de espera pÃƒÂºblica!)
      if (io && ["requesting", "driver_assigned"].includes(ride.status) && !ride.isWaitingInQueue) {
        const searchRadius = 15000; // Buscar motoristas num raio de 15km
        const nearbyDrivers = await DriverLocation.findNearby(
          ride.pickup.latitude,
          ride.pickup.longitude,
          searchRadius,
          ride.vehicleType,
          100, // tenta buscar atÃƒÂ© 100 prÃƒÂ³ximos
          ride.serviceType,
        );

        const next = nearbyDrivers.find((d) => {
          const id = String(d.driverId);
          const rejected = ride.rejectedBy?.some(
            (r) => String(r.driverId) === id,
          );
          return !rejected;
        });

        if (next) {
          ride.driverId = next.driverId;
          ride.status = "driver_assigned";
          await ride.save();
          
          // Hydrate client data before re-casting to next driver
          await ride.populate("clientId");

          const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id, status: "completed" }).catch(() => 0);
          const payloadNext = buildRideRequestPayload(ride, { distanceToPickup: 0, clientRidesCount });
          io.to(`driver-${next.driverId}`).emit("new-ride-request", payloadNext);
          if (ride.serviceType === "delivery") {
            io.to(`driver-${next.driverId}`).emit("delivery-open", payloadNext);
          } else {
            io.to(`driver-${next.driverId}`).emit("ride-open", payloadNext);
          }
        } else {
          // Keep the ride alive in 'requesting' state so it can wait for the full searchTimeoutSeconds
          // instead of instantly canceling. This improves UX drastically.
          ride.status = "requesting";
          ride.driverId = null;
          await ride.save();

          // Re-populate client payload to guarantee valid connection
          if (!ride.populated("clientId")) {
             await ride.populate("clientId");
          }

          const resolvedClientId = ride.clientId?._id || ride.clientId;
          if (resolvedClientId) {
            io.to(`client-${resolvedClientId}`).emit("ride-offers-updated", {
              rideId: ride._id,
              reason: "driver_rejected_some",
              message: "Os motoristas disponíveis recusaram esta oferta. Sugerimos aguardar mais ou aumentar a oferta para atrair interessados.",
            });
          }
        }
      }

      res.json({
        message: "Corrida rejeitada",
      });
    } catch (error) {
      console.error("Erro ao rejeitar corrida:", error);
      return sendError(res, 500, "Erro ao rejeitar corrida", {
        details: error.message,
      });
    }
  }

  async listOffers(req, res) {
    try {
      const { rideId } = req.params;
      const userId = String(req.user.id);

      const ride = await Ride.findById(rideId)
        .populate("clientId", "name")
        .populate("driverId", "name")
        .populate("negotiation.offers.driverId", "name profilePhoto");

      if (!ride) return sendError(res, 404, "Corrida nao encontrada");

      const isClient = String(ride.clientId?._id || ride.clientId) === userId;
      const isDriver = String(ride.driverId?._id || ride.driverId) === userId;
      const isParticipant = isClient || isDriver;
      if (!isParticipant) {
        return sendError(res, 403, "Sem permissao para esta corrida");
      }

      const negotiation = ride.negotiation || {};
      const offers = Array.isArray(negotiation.offers) ? negotiation.offers : [];

      // =================================================================
      // Enriquece cada oferta com dados do motorista e rota real:
      //  - vehicleType: veiculo em uso agora (DriverLocation)
      //  - distanceToPickupKm/etaMinutes: rota real via Google Distance Matrix
      //  - rating: media real de estrelas (User.ratingStats)
      //  - completedRides: total real de corridas/entregas concluidas
      // =================================================================
      const VEHICLE_LABEL = {
        bicycle: "Bicicleta",
        motorcycle: "Moto",
        car: "Carro",
        van: "Van",
        truck: "Caminhao",
      };

      const driverIds = offers
        .map((o) => String(o.driverId?._id || o.driverId))
        .filter(Boolean);

      const [driverLocs, drivers] = await Promise.all([
        driverIds.length
          ? DriverLocation.find({
              driverId: { $in: driverIds.map((id) => new mongoose.Types.ObjectId(id)) },
            }).lean()
          : Promise.resolve([]),
        driverIds.length
          ? User.find({ _id: { $in: driverIds.map((id) => new mongoose.Types.ObjectId(id)) } })
              .select("name profilePhoto ratingStats cancelledRidesCount")
              .lean()
          : Promise.resolve([]),
      ]);

      const locByDriver = new Map(
        driverLocs.map((d) => [String(d.driverId), d]),
      );
      const userById = new Map(
        drivers.map((u) => [String(u._id), u]),
      );

      // Contagem de concluidos: 1 query agregada para todos (evita N+1)
      const completedCount = driverIds.length
        ? await Ride.aggregate([
            {
              $match: {
                driverId: { $in: driverIds.map((id) => new mongoose.Types.ObjectId(id)) },
                status: "completed",
              },
            },
            { $group: { _id: "$driverId", count: { $sum: 1 } } },
          ])
        : [];
      const completedByDriver = new Map(
        completedCount.map((c) => [String(c._id), c.count]),
      );

      const pickupLat = Number(ride.pickup?.latitude);
      const pickupLng = Number(ride.pickup?.longitude);

      const enrichedOffers = await Promise.all(offers.map(async (o) => {
        const offerDoc =
          o && typeof o.toObject === "function"
            ? o.toObject({ depopulate: false })
            : { ...(o || {}) };
        const id = String(offerDoc.driverId?._id || offerDoc.driverId);
        const loc = locByDriver.get(id);
        const u = userById.get(id);

        const vt = (loc?.vehicleType || offerDoc.vehicleType || ride.vehicleType || "motorcycle").toLowerCase();
        const label = VEHICLE_LABEL[vt] || "Moto";

        // ── Métricas = SNAPSHOT salvo no envio da oferta (sem chamar o Google no poll) ──
        // O ETA/km foi calculado uma vez quando o motorista enviou a oferta (estimativa
        // de chegada). Aqui só lemos o que está salvo, economizando requisições.
        let distanceKm = Number.isFinite(Number(offerDoc.distanceToPickupKm))
          ? Number(offerDoc.distanceToPickupKm)
          : null;
        let etaMinutes = Number.isFinite(Number(offerDoc.etaMinutes))
          ? Number(offerDoc.etaMinutes)
          : null;
        let routeSource = offerDoc.distanceSource || (distanceKm != null ? "snapshot" : null);
        const coords = loc?.location?.coordinates;

        // Fallback LOCAL (sem Google) só para ofertas antigas sem snapshot.
        if (distanceKm == null && Array.isArray(coords) && coords.length >= 2 &&
          Number.isFinite(pickupLat) && Number.isFinite(pickupLng)) {
          const dLng2 = Number(coords[0]);
          const dLat2 = Number(coords[1]);
          if (Number.isFinite(dLat2) && Number.isFinite(dLng2)) {
            const roadKm = calculateHaversineDistance(dLat2, dLng2, pickupLat, pickupLng) * 1.3;
            distanceKm = Math.round(roadKm * 100) / 100;
            etaMinutes = Math.max(1, Math.round(roadKm / 0.5)); // ~30 km/h
            routeSource = "estimate";
          }
        }

        const ratingStats = u?.ratingStats;
        const rating =
          ratingStats && ratingStats.totalRatings > 0
            ? Number(Number(ratingStats.averageStars).toFixed(1))
            : 5.0;
        const completedRides = completedByDriver.get(id) || 0;
        // Confiança = % de corridas concluídas sem cancelar (completed / (completed + canceladas)).
        const cancelledByDriver = Number(u?.cancelledRidesCount || 0);
        const reliabilityDenom = completedRides + cancelledByDriver;
        const reliabilityPct =
          reliabilityDenom >= 3 ? Math.round((completedRides / reliabilityDenom) * 100) : null;

        return {
          ...offerDoc,
          amount: toMoney(offerDoc.amount),
          driverAmount:
            offerDoc.driverAmount === null || offerDoc.driverAmount === undefined
              ? null
              : toMoney(offerDoc.driverAmount),
          driverId: {
            _id: id,
            name: offerDoc.driverId?.name || u?.name || "Entregador",
            profilePhoto: offerDoc.driverId?.profilePhoto || u?.profilePhoto || null,
            rating,
            completedRides,
            reliabilityPct,
          },
          vehicleType: vt,
          vehicleLabel: label,
          distanceToPickupKm: distanceKm,
          etaMinutes,
          routeSource,
          reliabilityPct,
        };
      }));

      const responseOffers = enrichedOffers.sort(
        (a, b) => Number(a.amount || 0) - Number(b.amount || 0),
      );

      // Check if all available drivers rejected
      const searchRadius = 15000;
      const nearbyDrivers = await DriverLocation.findNearby(
        ride.pickup.latitude,
        ride.pickup.longitude,
        searchRadius,
        ride.vehicleType,
        100,
        ride.serviceType,
      ).catch(() => []);

      const nextAvailable = nearbyDrivers.find((d) => {
        const id = String(d.driverId);
        const rejected = ride.rejectedBy?.some(
          (r) => String(r.driverId) === id,
        );
        return !rejected;
      });

      const isAllRejected = ride.status === "requesting" && !nextAvailable;

      return res.json({
        success: true,
        allRejected: isAllRejected,
        negotiation: {
          enabled: Boolean(negotiation.enabled),
          clientOffer: negotiation.clientOffer ?? null,
          suggestedMinPrice: negotiation.suggestedMinPrice ?? null,
          finalAgreedPrice: negotiation.finalAgreedPrice ?? null,
          selectedDriverId: negotiation.selectedDriverId ?? null,
        },
        offers: responseOffers,
      });
    } catch (error) {
      console.error("Erro ao listar ofertas:", error);
      return sendError(res, 500, "Erro ao listar ofertas", {
        details: error.message,
      });
    }
  }

  async submitOfferResponse(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = String(req.user.id);
      const now = new Date();

      // Impedir responder oferta se o motorista estiver zerado ou com saldo negativo
      const driver = await User.findById(driverId);
      if (!driver) {
        return sendError(res, 404, "Motorista nao encontrado");
      }
      const balance = driver.driverBalance?.balance || 0;
      const opCredit = driver.driverBalance?.operationalCredit || 0;
      if (balance + opCredit <= 0) {
        return sendError(
          res,
          400,
          "Saldo insuficiente. Recarregue sua carteira para propor novos valores ou aceitar ofertas."
        );
      }

      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem responder ofertas");
      }

      const activeShift = await ShiftOffer.findOne({
        acceptedBy: driverId,
        status: "accepted",
        startAt: { $lte: now },
        endAt: { $gt: now },
      }).select("title startAt endAt");
      if (activeShift?._id) {
        return sendError(
          res,
          400,
          "Voce esta em plantao ativo e nao pode responder negociacoes agora",
          {
            shift: {
              id: activeShift._id,
              title: activeShift.title,
              startAt: activeShift.startAt,
              endAt: activeShift.endAt,
            },
          },
        );
      }

      const driverLocation = await DriverLocation.findOne({ driverId }).select(
        "vehicleType rideCategory serviceTypes currentRideId location",
      );
      if (!driverLocation) {
        return sendError(res, 400, "Atualize sua localizacao antes de responder negociacoes");
      }
      if (driverLocation.currentRideId) {
        return sendError(res, 400, "Voce ja possui uma corrida ativa", {
          currentRideId: driverLocation.currentRideId,
        });
      }

      const ride = await Ride.findById(rideId).populate("clientId", "name");
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");
      if (!isServiceCompatibleWithVehicle(driverLocation.vehicleType, ride.serviceType)) {
        return sendError(res, 400, "Servico incompativel com o veiculo do motorista");
      }
      const driverServiceTypes = Array.isArray(driverLocation.serviceTypes)
        ? driverLocation.serviceTypes
        : [];
      if (!driverServiceTypes.includes(String(ride.serviceType || ""))) {
        return sendError(res, 400, "Este servico nao esta ativo para o motorista");
      }
      if (String(driverLocation.vehicleType || "") !== String(ride.vehicleType || "")) {
        return sendError(res, 400, "Tipo de veiculo do motorista nao corresponde a solicitacao");
      }
      // Corrida: motorista precisa atender a categoria solicitada (tier compatível)
      if (String(ride.serviceType || "") === "ride" && ride.rideCategory) {
        let driverCat = driverLocation.rideCategory;
        if (!driverCat) {
          const driverUser = await User.findById(driverId).select("vehicleInfo.rideCategory");
          driverCat = driverUser?.vehicleInfo?.rideCategory;
        }
        if (!isDriverCategoryCompatible(driverLocation.vehicleType, driverCat, ride.rideCategory)) {
          return sendError(res, 400, "Sua categoria de veiculo nao corresponde a categoria da corrida");
        }
      }

      if (!["requesting", "driver_assigned"].includes(String(ride.status || ""))) {
        return sendError(res, 400, "Corrida nao esta aberta para negociacao");
      }

      if (!ride.negotiation?.enabled) {
        return sendError(res, 400, "Negociacao nao habilitada para esta corrida");
      }

      ride.negotiation.offers = Array.isArray(ride.negotiation.offers)
        ? ride.negotiation.offers
        : [];

      const existingIndex = ride.negotiation.offers.findIndex(
        (item) => String(item.driverId) === driverId,
      );
      const existingOffer = existingIndex >= 0 ? ride.negotiation.offers[existingIndex] : null;

      const action = String(req.body?.action || "").toLowerCase();
      const message = String(req.body?.message || "").slice(0, 300);
      const clientOffer = Number(ride.negotiation.clientOffer || ride.pricing.total || 0);
      const providedAmount = Number(req.body?.amount);

      let status = "countered";
      let amount = clientOffer;

      if (existingOffer && existingOffer.status === "client_countered") {
        amount = existingOffer.amount || clientOffer;
      }

      let shouldAutoMatch = false;

      if (action === "accept") {
        status = "accepted";
        if (existingOffer && existingOffer.status === "client_countered") {
          amount = existingOffer.amount;
          shouldAutoMatch = true; // Contraproposta do cliente aceita — match direto
        } else {
          // Aceite direto do motorista: pula negociação e vai direto pra corrida
          shouldAutoMatch = true;
          status = "accepted";
        }
      } else if (action === "counter") {
        if (!Number.isFinite(providedAmount) || providedAmount <= 0) {
          return sendError(res, 400, "Valor de contraoferta invalido");
        }
        status = "countered";
        amount = toMoney(providedAmount);
      } else if (action === "reject") {
        status = "rejected";
        amount = clientOffer;
      } else {
        return sendError(res, 400, "Acao invalida");
      }

      // Métricas calculadas UMA VEZ aqui (no envio da oferta) e salvas no banco.
      // O cliente vê esse snapshot (estimativa de chegada) sem novas chamadas ao Google.
      // O motorista pode enviar a localização atual no corpo (latitude/longitude);
      // caso contrário usamos a última posição salva em DriverLocation.
      let etaMinutes = null;
      let distanceToPickupKm = null;
      let distanceSource = null;
      if (status !== "rejected") {
        try {
          const bodyLat = Number(req.body?.latitude);
          const bodyLng = Number(req.body?.longitude);
          const hasBodyCoords = Number.isFinite(bodyLat) && Number.isFinite(bodyLng);
          const coords = driverLocation.location?.coordinates || [];
          const dLat = hasBodyCoords ? bodyLat : Number(coords[1]);
          const dLng = hasBodyCoords ? bodyLng : Number(coords[0]);
          const pLat = Number(ride.pickup?.latitude);
          const pLng = Number(ride.pickup?.longitude);

          // Persiste a localização enviada pelo motorista (mantém DriverLocation atual).
          if (hasBodyCoords) {
            await DriverLocation.updateOne(
              { driverId },
              { $set: { "location.coordinates": [bodyLng, bodyLat] } },
            ).catch(() => {});
          }

          if ([dLat, dLng, pLat, pLng].every((n) => Number.isFinite(n))) {
            const metrics = await fetchRouteMetricsWithGoogleMaps(
              { latitude: dLat, longitude: dLng },
              { latitude: pLat, longitude: pLng },
            );
            if (metrics && metrics.distanceInMeters > 0) {
              distanceToPickupKm = Math.round((metrics.distanceInMeters / 1000) * 10) / 10;
              etaMinutes = metrics.durationInSeconds
                ? Math.max(1, Math.ceil(metrics.durationInSeconds / 60))
                : null;
              distanceSource = "route_api";
            } else {
              // Fallback: haversine × 1.3 (fator de via) ~30 km/h, só se o Google falhar.
              const straightKm = calculateHaversineDistance(dLat, dLng, pLat, pLng);
              const roadKm = straightKm * 1.3;
              distanceToPickupKm = Math.round(roadKm * 10) / 10;
              etaMinutes = Math.max(1, Math.round(roadKm / 0.5));
              distanceSource = "estimate";
            }
          }
        } catch (metricsErr) {
          console.error("Erro ao calcular ETA/distância da oferta:", metricsErr?.message || metricsErr);
        }
      }

      const VEHICLE_LABELS = { motorcycle: "Moto", car: "Carro", van: "Van", truck: "Caminhão", bicycle: "Bike" };
      const offerVehicleType = String(driverLocation.vehicleType || ride.vehicleType || "motorcycle");

      const payload = {
        driverId,
        amount,
        status,
        message,
        etaMinutes,
        distanceToPickupKm,
        distanceSource,
        vehicleType: offerVehicleType,
        vehicleLabel: VEHICLE_LABELS[offerVehicleType] || "Moto",
        createdAt: existingOffer ? existingOffer.createdAt || now : now,
        updatedAt: now,
      };

      if (existingIndex >= 0) {
        ride.negotiation.offers[existingIndex] = payload;
      } else {
        ride.negotiation.offers.push(payload);
      }

      const io = req.app.get("io");

      if (shouldAutoMatch) {
        const finalPrice = toMoney(amount);
        applyFinalPriceOnRide(
          ride,
          finalPrice,
          Number(ride.splitDetails?.platformConfigUsed || 15),
        );

        ride.negotiation.finalAgreedPrice = finalPrice;
        ride.negotiation.selectedDriverId = driverId;
        ride.negotiation.selectedAt = now;
        ride.driverId = driverId;
        ride.status = "accepted";
        ride.acceptedAt = now;
        ride.requestedAt = now;

        await ride.save();
        await ride.populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");
        await ride.populate("clientId");

        if (io) {
          const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId._id || ride.clientId, status: "completed" }).catch(() => 0);
          const payloadDr = buildRideRequestPayload(ride, {
            negotiationSelected: true,
            clientRidesCount,
          });
          io.to(`driver-${driverId}`).emit("new-ride-request", payloadDr);
          if (ride.serviceType === "delivery") {
            io.to(`driver-${driverId}`).emit("delivery-open", payloadDr);
          } else {
            io.to(`driver-${driverId}`).emit("ride-open", payloadDr);
          }

          io.to(`client-${ride.clientId._id || ride.clientId}`).emit("ride-offer-selected", {
            rideId: ride._id,
            driverId,
            finalPrice
          });
          if (ride.serviceType === "delivery") {
            io.to(`client-${ride.clientId._id || ride.clientId}`).emit("delivery-negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          } else {
            io.to(`client-${ride.clientId._id || ride.clientId}`).emit("ride-negotiated", { rideId: ride._id, action: "offer_selected", driverId });
          }
        }

        return res.json({
          success: true,
          message: "Contraproposta aceita com sucesso! Corrida atribuÃƒÂ­da.",
          offer: payload,
          rideMatched: true
        });
      }

      await ride.save();
      await ride.populate("negotiation.offers.driverId", "name profilePhoto");

      if (io) {
        const clientId = ride.clientId._id || ride.clientId;
        io.to(`client-${clientId}`).emit("ride-offers-updated", {
          rideId: ride._id,
        });
        if (ride.serviceType === "delivery") {
          io.to(`client-${clientId}`).emit("delivery-negotiated", { rideId: ride._id, action: "proposal_received" });
        } else {
          io.to(`client-${clientId}`).emit("ride-negotiated", { rideId: ride._id, action: "proposal_received" });
        }

        if (status === "accepted") {
          io.to(`client-${clientId}`).emit("driver-accepted-offer", {
            rideId: ride._id,
            driverId,
            amount,
          });
          if (ride.serviceType === "delivery") {
            io.to(`client-${clientId}`).emit("delivery-negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          } else {
            io.to(`client-${clientId}`).emit("ride-negotiated", { rideId: ride._id, action: "proposal_accepted", driverId });
          }
        }
      }

      return res.json({
        success: true,
        message: "Oferta enviada",
        offer: payload,
      });
    } catch (error) {
      console.error("Erro ao enviar oferta:", error);
      return sendError(res, 500, "Erro ao enviar oferta", {
        details: error.message,
      });
    }
  }


  async clientCounterOffer(req, res) {
    try {
      const { rideId } = req.params;
      const clientId = String(req.user.id);
      const { driverId, amount } = req.body;

      if (!driverId || !amount || isNaN(amount) || amount <= 0) {
        return sendError(res, 400, "Motorista e valor da contraproposta sao obrigatorios");
      }

      const ride = await Ride.findById(rideId);
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");
      
      if (String(ride.clientId?._id || ride.clientId) !== clientId) {
        return sendError(res, 403, "Apenas o cliente pode enviar contraproposta");
      }

      if (!["requesting", "driver_assigned"].includes(String(ride.status || ""))) {
        return sendError(res, 400, "A corrida nao permite negociacao ativa");
      }

      ride.negotiation.offers = Array.isArray(ride.negotiation.offers) ? ride.negotiation.offers : [];
      const offer = ride.negotiation.offers.find(item => String(item.driverId?._id || item.driverId) === String(driverId));

      if (!offer) {
        return sendError(res, 404, "Oferta do motorista nao encontrada para negociar");
      }

      const now = new Date();
      // Preserve original driver offer before client counter-proposal
      if (!offer.driverAmount) {
        offer.driverAmount = offer.amount;
      }
      offer.amount = toMoney(amount);
      offer.status = "client_countered";
      offer.updatedAt = now;

      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`client-${clientId}`).emit("ride-offers-updated", { rideId: ride._id });
        if (ride.serviceType === "delivery") {
          io.to(`client-${clientId}`).emit("delivery-negotiated", { rideId: ride._id, action: "proposal_updated" });
        } else {
          io.to(`client-${clientId}`).emit("ride-negotiated", { rideId: ride._id, action: "proposal_updated" });
        }

        io.to(`driver-${driverId}`).emit("client-counter-proposal", {
          rideId: ride._id,
          amount: offer.amount
        });
        if (ride.serviceType === "delivery") {
          io.to(`driver-${driverId}`).emit("delivery-negotiated", { rideId: ride._id, action: "counter_proposal" });
        } else {
          io.to(`driver-${driverId}`).emit("ride-negotiated", { rideId: ride._id, action: "counter_proposal" });
        }

        io.to(`driver-${driverId}`).emit("waiting-queue-updated", { rideId: ride._id });
      }

      return res.json({
        success: true,
        message: "Contraproposta enviada ao motorista com sucesso",
        newAmount: offer.amount
      });

    } catch (error) {
      console.error("Erro ao enviar contraproposta:", error);
      return sendError(res, 500, "Erro ao enviar contraproposta", { details: error.message });
    }
  }

  async selectOffer(req, res) {
    try {
      const { rideId } = req.params;
      const clientId = String(req.user.id);
      const selectedDriverId = String(req.body?.driverId || "");

      if (!selectedDriverId) {
        return sendError(res, 400, "Motorista da oferta e obrigatorio");
      }

      const ride = await Ride.findById(rideId)
        .populate("clientId", "name")
        .populate("negotiation.offers.driverId", "name profilePhoto");

      if (!ride) return sendError(res, 404, "Corrida nao encontrada");
      if (String(ride.clientId?._id || ride.clientId) !== clientId) {
        return sendError(res, 403, "Somente o cliente pode selecionar oferta");
      }
      if (!ride.negotiation?.enabled) {
        return sendError(res, 400, "Negociacao nao habilitada para esta corrida");
      }
      if (!["requesting", "driver_assigned", "payment_pending"].includes(String(ride.status || ""))) {
        return sendError(res, 400, "Corrida nao esta aberta para selecao de oferta");
      }

      const offer = (ride.negotiation.offers || []).find(
        (item) => String(item.driverId?._id || item.driverId) === selectedDriverId,
      );

      if (!offer) {
        return sendError(res, 404, "Oferta do motorista nao encontrada");
      }

      if (!["accepted", "countered"].includes(String(offer.status || ""))) {
        return sendError(res, 400, "Oferta nao pode ser selecionada");
      }

      const finalPrice = toMoney(offer.amount || ride.pricing.total);
      applyFinalPriceOnRide(
        ride,
        finalPrice,
        Number(ride.splitDetails?.platformConfigUsed || 15),
      );

      const originalMethod = ride.payment?.method || normalizePaymentMethod(req.body?.method) || "cash";

      ride.payment = ride.payment || {};
      ride.payment.paidAt = undefined;
      ride.payment.failureReason = undefined;

      ride.negotiation.finalAgreedPrice = finalPrice;
      ride.negotiation.selectedDriverId = selectedDriverId;
      ride.negotiation.selectedAt = new Date();
      ride.driverId = selectedDriverId;
      ride.requestedAt = new Date();

      if (originalMethod === "wallet") {
        try {
          await walletEscrow.reserve(ride);
          ride.payment.method = "wallet";
          ride.payment.status = "completed";
          ride.status = "driver_assigned";
        } catch (escrowErr) {
          if (escrowErr.code === "INSUFFICIENT_BALANCE") {
            return sendError(res, 400, "Saldo Leva Pay insuficiente para aceitar esta proposta.");
          } else {
            return sendError(res, 500, "Erro ao reter o saldo para a corrida", { details: escrowErr.message });
          }
        }
      } else {
        // Remove payment_pending completely for all other methods
        ride.payment.method = originalMethod;
        ride.payment.status = "pending";
        ride.status = "driver_assigned";
      }

      await ride.save();
      await ride.populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");
      await ride.populate("clientId");

      const io = req.app.get("io");
      if (io) {
        const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id || ride.clientId, status: "completed" }).catch(() => 0);
        const payloadAssigned = buildRideRequestPayload(ride, {
          negotiationSelected: true,
          clientRidesCount,
        });

        // Always broadcast as driver_assigned
        io.to(`driver-${selectedDriverId}`).emit("new-ride-request", payloadAssigned);

        io.to(`client-${ride.clientId._id || ride.clientId}`).emit("ride-status-updated", ride);
      }

      return res.json({
        success: true,
        message: "Oferta selecionada com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao selecionar oferta:", error);
      return sendError(res, 500, "Erro ao selecionar oferta", {
        details: error.message,
      });
    }
  }

  // Confirmar pagamento apos selecao de proposta (payment_pending -> driver_assigned)
  async confirmNegotiationPayment(req, res) {
    try {
      const { rideId } = req.params;
      const clientId = String(req.user.id);
      const method = normalizePaymentMethod(req.body?.method);

      if (!method) {
        return sendError(res, 400, "Metodo de pagamento invalido");
      }

      const ride = await Ride.findById(rideId).populate("clientId");
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");
      if (String(ride.clientId?._id || ride.clientId) !== clientId) {
        return sendError(res, 403, "Somente o cliente pode confirmar pagamento");
      }
      if (String(ride.status || "") !== "payment_pending") {
        return sendError(res, 400, "Corrida nao esta aguardando pagamento");
      }
      if (!ride.driverId) {
        return sendError(res, 400, "Nao existe motorista selecionado para esta corrida");
      }

      // Taxa de cancelamento pendente: tenta quitar com o saldo LevaPay; se não cobrir,
      // bloqueia até o cliente quitar (depósito) ou pagar a pendência.
      const clientUser = await User.findById(clientId);
      if (clientUser && Number(clientUser.pendingDebt || 0) > 0) {
        await walletEscrow.settlePendingDebt(clientUser);
        if (Number(clientUser.pendingDebt || 0) > 0) {
          await clientUser.save();
          return sendError(
            res,
            402,
            `Você tem uma taxa de cancelamento pendente de R$ ${Number(clientUser.pendingDebt).toFixed(2)}. Deposite no LevaPay para continuar.`,
            { pendingDebt: Number(clientUser.pendingDebt) },
          );
        }
        await clientUser.save();
      }

      ride.payment = ride.payment || {};
      ride.payment.method = method;
      ride.payment.status = method === "cash" ? "pending" : "completed";
      ride.payment.paidAt = new Date();
      ride.status = "driver_assigned";
      const timeoutKey = String(ride._id);
      const pendingTimeout = PAYMENT_PENDING_TIMEOUTS.get(timeoutKey);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        PAYMENT_PENDING_TIMEOUTS.delete(timeoutKey);
      }

      // Escrow LevaPay: retém o valor da corrida da carteira do cliente neste momento.
      if (method === "wallet") {
        try {
          await walletEscrow.reserve(ride);
        } catch (escrowErr) {
          if (escrowErr.code === "INSUFFICIENT_BALANCE") {
            return sendError(res, 400, "Saldo LevaPay insuficiente para esta corrida.", {
              required: escrowErr.required,
              available: escrowErr.available,
            });
          }
          console.error("Erro ao reter saldo LevaPay (escrow):", escrowErr);
          return sendError(res, 500, "Erro ao reter o saldo para a corrida", { details: escrowErr.message });
        }
      }

      await ride.save();
      await ride.populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");
      await ride.populate("clientId");

      const io = req.app.get("io");
      if (io) {
        const clientRidesCount = await Ride.countDocuments({ clientId: ride.clientId?._id || ride.clientId, status: "completed" }).catch(() => 0);
        io.to(`driver-${ride.driverId?._id || ride.driverId}`).emit(
          "new-ride-request",
          buildRideRequestPayload(ride, {
            negotiationSelected: true,
            clientRidesCount,
          }),
        );
        io.to(`client-${ride.clientId._id || ride.clientId}`).emit("ride-status-updated", ride);

        // Notificar cliente sobre mudança na carteira
        if (ride?.payment?.escrow?.status === "reserved") {
          try {
            const cid = ride.clientId?._id || ride.clientId;
            const clientForBalance = await User.findById(cid);
            if (clientForBalance) {
              io.to(`client-${cid}`).emit("wallet-updated", {
                balance: clientForBalance.wallet?.balance || 0,
                held: clientForBalance.wallet?.held || 0,
              });
            }
          } catch {}
        }
      }

      return res.json({
        success: true,
        message: "Pagamento confirmado com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao confirmar pagamento da negociacao:", error);
      return sendError(res, 500, "Erro ao confirmar pagamento", {
        details: error.message,
      });
    }
  }

  // Cancelar selecao de pagamento pendente (cliente desiste ou timeout)
  async cancelPaymentSelection(req, res) {
    try {
      const { rideId } = req.params;
      const clientId = String(req.user.id);

      const ride = await Ride.findById(rideId);
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");
      if (String(ride.clientId) !== clientId) {
        return sendError(res, 403, "Somente o cliente pode cancelar a selecao de pagamento");
      }
      if (String(ride.status || "") !== "payment_pending") {
        return sendError(res, 400, "Corrida nao esta aguardando pagamento");
      }

      // Libera o motorista
      const previousDriverId = ride.driverId;
      ride.driverId = null;
      ride.negotiation.selectedDriverId = null;
      ride.negotiation.selectedAt = null;
      ride.negotiation.finalAgreedPrice = null;
      ride.status = "requesting";
      ride.payment.method = null;
      ride.payment.status = "not_selected";
      ride.requestedAt = new Date();
      const timeoutKey = String(ride._id);
      const pendingTimeout = PAYMENT_PENDING_TIMEOUTS.get(timeoutKey);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        PAYMENT_PENDING_TIMEOUTS.delete(timeoutKey);
      }

      await ride.save();
      if (previousDriverId) {
        await DriverLocation.findOneAndUpdate(
          { driverId: previousDriverId },
          { status: "available", currentRideId: null },
        );
      }

      const io = req.app.get("io");
      if (io) {
        if (previousDriverId) {
          io.to(`driver-${previousDriverId}`).emit("delivery-selection-expired", {
            rideId: ride._id,
            reason: "cliente_cancelou_selecao",
          });
          io.to(`driver-${previousDriverId}`).emit("ride-cancelled", {
            rideId: ride._id,
            cancelledBy: "client",
            reason: "payment_selection_cancelled",
            message: "O cliente não confirmou o pagamento. Solicitação cancelada para o motorista.",
          });
        }
        io.to(`client-${clientId}`).emit("ride-status-updated", ride);
      }

      return res.json({
        success: true,
        message: "Selecao cancelada. Motorista liberado. Pedido voltou para busca.",
        ride,
      });
    } catch (error) {
      console.error("Erro ao cancelar selecao de pagamento:", error);
      return sendError(res, 500, "Erro ao cancelar selecao", { details: error.message });
    }
  }

  async declineOffer(req, res) {
    try {
      const { rideId } = req.params;
      const { driverId } = req.body;
      const clientId = String(req.user.id);

      const ride = await Ride.findById(rideId);
      if (!ride) return sendError(res, 404, "Corrida nÃƒÂ£o encontrada");
      if (String(ride.clientId) !== clientId) {
        return sendError(res, 403, "Sem permissÃƒÂ£o para recusar esta oferta");
      }

      const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
      const targetIndex = offers.findIndex(
        (o) => String(o.driverId) === String(driverId)
      );

      if (targetIndex >= 0) {
        ride.negotiation.offers[targetIndex].status = "rejected";
        ride.negotiation.offers[targetIndex].updatedAt = new Date();
        await ride.save();

        const io = req.app.get("socketio") || req.app.get("io");
        if (io) {
          io.to(`client-${clientId}`).emit("ride-offers-updated", { rideId });
          if (ride.serviceType === "delivery") {
            io.to(`client-${clientId}`).emit("delivery-negotiated", { rideId, action: "proposal_rejected" });
          } else {
            io.to(`client-${clientId}`).emit("ride-negotiated", { rideId, action: "proposal_rejected" });
          }

          io.to(`driver-${driverId}`).emit("ride-offer-rejected-by-client", { rideId });
          if (ride.serviceType === "delivery") {
            io.to(`driver-${driverId}`).emit("delivery-negotiated", { rideId, action: "proposal_rejected" });
          } else {
            io.to(`driver-${driverId}`).emit("ride-negotiated", { rideId, action: "proposal_rejected" });
          }
        }
      }

      return res.json({ success: true, message: "Oferta recusada com sucesso." });
    } catch (error) {
      console.error("Erro em declineOffer:", error);
      return sendError(res, 500, "Erro ao recusar oferta", { details: error.message });
    }
  }

  // Cancelar corrida (cliente ou motorista)
  async cancel(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;
      const userIdStr = String(userId);
      const { reason } = req.body;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (["cancelled", "cancelled_by_client", "cancelled_by_driver", "cancelled_no_driver"].includes(ride.status)) {
        return res.json({ success: true, message: "Corrida ja cancelada" });
      }

      if (!ride.canBeCancelled()) {
        return sendError(res, 400, "Corrida nao pode ser cancelada neste momento");
      }

      // Verificar quem estÃƒÆ’Ã‚Â¡ cancelando
      const isClient = ride.clientId?.toString() === userIdStr;
      const isDriver = ride.driverId?.toString() === userIdStr;

      if (!isClient && !isDriver) {
        return sendError(res, 403, "Voce nao tem permissao para cancelar esta corrida");
      }

      // Registra o cancelamento do motorista (métrica cancellationRate), sem multa.
      if (isDriver && ride.driverId) {
        await User.findByIdAndUpdate(ride.driverId, { $inc: { cancelledRidesCount: 1 } }).catch(() => {});
      }

      // ── FASE 2: motorista cancela ANTES de iniciar → re-despacho automático ──
      // O cliente é estornado 100% e a corrida volta para a fila (sem encerrar).
      const REDISPATCHABLE = ["driver_assigned", "accepted", "driver_arriving", "arrived"];
      if (isDriver && REDISPATCHABLE.includes(String(ride.status || ""))) {
        const prevDriverId = ride.driverId;

        // Libera o valor retido (cliente recebe de volta; novo motorista re-reserva ao confirmar).
        if (ride.payment?.escrow?.status === "reserved") {
          try {
            await walletEscrow.refund(ride, { feeAmount: 0 });
          } catch (refundErr) {
            console.error("Erro ao estornar hold no re-despacho:", refundErr);
          }
        }

        // Não oferecer novamente a este motorista; reabre a corrida para busca.
        ride.rejectedBy = ride.rejectedBy || [];
        ride.rejectedBy.push({ driverId: prevDriverId, rejectedAt: new Date(), reason: "driver_cancelled" });
        if (ride.negotiation) {
          ride.negotiation.selectedDriverId = null;
          ride.negotiation.selectedAt = null;
          ride.negotiation.finalAgreedPrice = null;
        }
        if (ride.payment) {
          // mantém o método escolhido pelo cliente; só reabre o status p/ re-confirmação.
          ride.payment.status = "not_selected";
        }
        ride.driverId = null;
        ride.status = "requesting";
        ride.requestedAt = new Date();
        ride.isWaitingInQueue = false;
        await ride.save();

        if (prevDriverId) {
          await DriverLocation.findOneAndUpdate(
            { driverId: prevDriverId },
            { status: "available", currentRideId: null },
          );
        }

        const io = req.app.get("io");
        if (io) {
          io.to(`client-${ride.clientId}`).emit("ride-status-updated", {
            rideId: ride._id,
            status: "requesting",
            driverCancelled: true,
            message: "Seu motorista cancelou. Já estamos buscando um novo motorista para você.",
            timestamp: new Date().toISOString(),
          });
          if (prevDriverId) {
            io.to(`driver-${prevDriverId}`).emit("ride-cancelled", {
              rideId: ride._id,
              cancelledBy: "driver_self",
              reason,
            });
          }
        }

        try {
          await ride.populate("clientId", "name phone profilePhoto");
          await module.exports.dispatchRideToNearbyDrivers(ride, io);
        } catch (dispatchErr) {
          console.error("Erro no re-despacho após cancelamento do motorista:", dispatchErr);
        }

        return res.json({
          success: true,
          redispatched: true,
          message:
            "Você saiu desta corrida. O cliente foi reembolsado integralmente e a corrida voltou para a fila de busca.",
          ride,
        });
      }

      // Taxa de cancelamento (Fase 2): janela grátis 2 min, 20% do lance, split 80/20.
      // Valores configuráveis via platformConfig.cancellation (fallback nos defaults).
      const runtimeCfg = await getRuntimeConfig().catch(() => null);
      const cancelCfg = runtimeCfg?.cancellation || {};
      const feeInfo = ride.computeBidCancellationFee({
        byClient: isClient,
        freeWindowSec: cancelCfg.freeWindowSec,
        feePct: cancelCfg.feePct,
        collectedFeePct: cancelCfg.collectedFeePct,
        driverSharePct: cancelCfg.driverSharePct,
      });
      const cancellationFee = feeInfo.fee;
      const escrowReserved = ride.payment?.escrow?.status === "reserved";
      const preCancelStatus = String(ride.status || "");

      ride.status = isClient ? "cancelled_by_client" : "cancelled_by_driver";
      ride.cancelledAt = new Date();
      ride.cancellationFee = {
        amount: feeInfo.fee,
        reason,
        by: isClient ? "client" : isDriver ? "driver" : "system",
        driverShare: feeInfo.driverShare,
        platformShare: feeInfo.platformShare,
        freeWindow: feeInfo.free,
        chargedVia: "none",
      };

      // Liquidação financeira do cancelamento.
      try {
        if (escrowReserved) {
          // wallet: a taxa sai do valor retido; o restante volta ao cliente.
          await walletEscrow.refund(ride, { feeAmount: feeInfo.fee });
          ride.cancellationFee.chargedVia = feeInfo.fee > 0 ? "wallet_hold" : "none";
        } else if (feeInfo.fee > 0 && isClient) {
          // cash / maquininha (sem valor in-app): vira dívida cobrada na próxima corrida.
          await walletEscrow.addPendingDebt(ride.clientId, feeInfo.fee, ride._id);
          ride.cancellationFee.chargedVia = "pending_debt";
        }
        // Credita a parte do motorista pela taxa (quando aplicável).
        if (feeInfo.fee > 0 && isClient && ride.driverId && feeInfo.driverShare > 0) {
          await walletEscrow.creditDriver(ride.driverId, ride._id, feeInfo.driverShare, {
            type: "cancellation_fee",
            description: `Taxa de cancelamento da corrida ${ride._id}`,
          });
        }
        // Sem multa ao motorista por cancelar: apenas a métrica de cancelamento é registrada.
      } catch (settleErr) {
        console.error("Erro na liquidação financeira do cancelamento:", settleErr);
      }

      await ride.save();
      await moveToHistory(ride);

      // Liberar motorista
      if (ride.driverId) {
        await DriverLocation.findOneAndUpdate(
          { driverId: ride.driverId },
          {
            status: "available",
            currentRideId: null,
          },
        );
      }

      // Notificar via WebSocket
      const io = req.app.get("io");
      if (io) {
        // Always emit ride-status-updated to the client so their UI reflects the new status
        const clientRoomId = `client-${ride.clientId}`;
        io.to(clientRoomId).emit("ride-status-updated", {
          rideId: ride._id,
          status: ride.status,
          cancelledBy: isClient ? "client" : "driver",
          reason,
          cancellationFee,
          timestamp: new Date().toISOString(),
        });

        const targetId = isClient ? ride.driverId : ride.clientId;
        const targetType = isClient ? "driver" : "client";

        if (targetId) {
          const cancelPayload4 = {
            rideId: ride._id,
            cancelledBy: isClient ? "client" : "driver",
            reason,
            cancellationFee,
          };
          io.to(`${targetType}-${targetId}`).emit("ride-cancelled", cancelPayload4);
          if (ride.serviceType === "delivery") {
            io.to(`${targetType}-${targetId}`).emit("delivery-cancelled", cancelPayload4);
          } else {
            io.to(`${targetType}-${targetId}`).emit("ride-cancelled", cancelPayload4);
          }
        } else if (isClient && !ride.driverId) {
          // Broadcast cancel message to ALL connected drivers to guarantee popup is cleared instantly everywhere
          const cancelPayload5 = {
            rideId: ride._id,
            cancelledBy: "client",
            reason: "cancelamento_pre_aceite"
          };
          io.emit("ride-cancelled", cancelPayload5);
          if (ride.serviceType === "delivery") {
            io.emit("delivery-cancelled", cancelPayload5);
          } else {
            io.emit("ride-cancelled", cancelPayload5);
          }
        }
      }

      res.json({
        message: "Corrida cancelada",
        cancellationFee,
      });
    } catch (error) {
      console.error("Erro ao cancelar corrida:", error);
      return sendError(res, 500, "Erro ao cancelar corrida", { details: error.message });
    }
  }

  // Entrega com problema no destino: destinatário ausente / endereço errado / recusou.
  // Aciona a devolução do pacote e a liquidação (cliente 100%, motorista total×1,15).
  async reportDeliveryFailure(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = String(req.user.id);
      const { reason, photoUrl, note } = req.body || {};

      const ride = await Ride.findById(rideId);
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");
      if (String(ride.driverId || "") !== driverId) {
        return sendError(res, 403, "Apenas o motorista da entrega pode relatar o problema");
      }
      const isDelivery = ride.serviceType === "delivery" || ride.serviceType === "frete";
      if (!isDelivery) return sendError(res, 400, "Acao exclusiva para entregas");
      if (!["arrived", "in_progress"].includes(String(ride.status || ""))) {
        return sendError(res, 400, "So e possivel relatar problema com a entrega em andamento no destino");
      }

      const validReasons = ["recipient_absent", "wrong_address", "refused", "inaccessible", "other"];
      const safeReason = validReasons.includes(String(reason)) ? String(reason) : "other";

      ride.deliveryFailure = {
        ...(ride.deliveryFailure ? ride.deliveryFailure.toObject?.() || ride.deliveryFailure : {}),
        reason: safeReason,
        reportedAt: new Date(),
        photoUrl: photoUrl || ride.deliveryFailure?.photoUrl,
        note: note || ride.deliveryFailure?.note,
      };
      ride.status = "delivery_failed";
      ride.cancelledAt = new Date();

      // Liquidação: cliente paga 100%; motorista recebe total×(1+bonus). Plataforma absorve.
      try {
        const runtimeCfg = await getRuntimeConfig().catch(() => null);
        const bonusPct = Number(runtimeCfg?.delivery?.failedReturnBonusPct ?? 0.15);
        await walletEscrow.settleFailedDelivery(ride, { driverId: ride.driverId, bonusPct });
      } catch (settleErr) {
        console.error("Erro na liquidacao de entrega falha:", settleErr);
      }

      await ride.save();
      await moveToHistory(ride);

      if (ride.driverId) {
        await DriverLocation.findOneAndUpdate(
          { driverId: ride.driverId },
          { status: "available", currentRideId: null },
        );
      }

      const io = req.app.get("io");
      if (io) {
        io.to(`client-${ride.clientId}`).emit("ride-status-updated", {
          rideId: ride._id,
          status: "delivery_failed",
          reason: safeReason,
          message: "Sua entrega não pôde ser concluída no destino. O entregador devolverá o item ao endereço de origem.",
          timestamp: new Date().toISOString(),
        });
        io.to(`client-${ride.clientId}`).emit("delivery-failed", { rideId: ride._id, reason: safeReason });
      }

      return res.json({
        success: true,
        message: "Problema de entrega registrado. Devolução do pacote acionada.",
        deliveryFailure: ride.deliveryFailure,
        ride,
      });
    } catch (error) {
      console.error("Erro ao relatar falha de entrega:", error);
      return sendError(res, 500, "Erro ao relatar falha de entrega", { details: error.message });
    }
  }

  async retryRide(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida nÃƒÂ£o encontrada");
      }

      // Ã°Å¸â€â€ž Reiniciar ciclo de busca dinÃƒÂ¢mico
      ride.status = "requesting";
      ride.requestedAt = new Date();
      ride.isWaitingInQueue = false;
      ride.cancelledAt = undefined;
      // Limpa drivers anteriores recusados ou aceites perdidos se necessÃƒÂ¡rio
      ride.driverId = undefined; 
      
      await ride.save();

      // Ã°Å¸â€˜Â¤ Popular dados necessÃƒÂ¡rios para o payload do despacho
      await ride.populate("clientId", "name phone profilePhoto");

      const io = req.app.get("io");
      if (io) {
        // Ã°Å¸Å¡â‚¬ Disparar o Dispatcher central novamente para notificar os motoristas
        await module.exports.dispatchRideToNearbyDrivers(ride, io);
      }

      res.json({
        success: true,
        message: "Busca reiniciada com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao reiniciar busca da corrida:", error);
      return sendError(res, 500, "Erro ao reiniciar busca");
    }
  }

  async addTip(req, res) {
    try {
      const { rideId } = req.params;
      const userId = String(req.user.id || "");
      const amount = Number(req.body?.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return sendError(res, 400, "Valor de gorjeta invalido");
      }

      const roundedAmount = Number(amount.toFixed(2));
      if (roundedAmount > 500) {
        return sendError(res, 400, "Valor de gorjeta acima do permitido");
      }

      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (String(ride.clientId || "") !== userId) {
        return sendError(res, 403, "Voce nao tem permissao para enviar gorjeta nesta corrida");
      }

      if (ride.status !== "completed") {
        return sendError(res, 400, "A gorjeta so pode ser enviada apos a corrida finalizada");
      }

      if (Number(ride?.rating?.clientRating?.tips || 0) > 0) {
        return sendError(res, 400, "Gorjeta ja enviada para esta corrida");
      }

      ride.rating = ride.rating || {};
      ride.rating.clientRating = ride.rating.clientRating || {};
      ride.rating.clientRating.tips = roundedAmount;
      ride.rating.clientRating.createdAt =
        ride.rating.clientRating.createdAt || new Date();

      await ride.save();

      const io = req.app.get("io");
      if (io && ride.driverId) {
        io.to(`driver-${ride.driverId}`).emit("ride-tip-added", {
          rideId: ride._id,
          amount: roundedAmount,
        });
      }

      return res.json({
        success: true,
        message: "Gorjeta enviada com sucesso",
        tip: roundedAmount,
      });
    } catch (error) {
      console.error("Erro ao enviar gorjeta:", error);
      return sendError(res, 500, "Erro ao enviar gorjeta", {
        details: error.message,
      });
    }
  }

  // Colocar a corrida na fila de espera
  async enterWaitingQueue(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;

      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (String(ride.clientId) !== String(userId)) {
        return sendError(res, 403, "Apenas o cliente proprietario pode colocar a corrida na fila de espera");
      }

      ride.status = "requesting";
      ride.driverId = null;
      ride.isWaitingInQueue = true;
      ride.requestedAt = new Date();
      // Limpa os motoristas que rejeitaram para dar uma nova chance a todos na fila de espera
      ride.rejectedBy = [];
      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`client-${ride.clientId}`).emit("ride-status-changed", {
          rideId: ride._id,
          status: "requesting",
          isWaitingInQueue: true,
        });

        // Despacha e envia notificaÃƒÂ§ÃƒÂµes push para os motoristas prÃƒÂ³ximos
        await module.exports.dispatchRideToNearbyDrivers(ride, io);
      }

      return res.json({
        success: true,
        message: "Corrida adicionada a fila de espera com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao entrar na fila de espera:", error);
      return sendError(res, 500, "Erro ao entrar na fila de espera", {
        details: error.message,
      });
    }
  }

  // Validar PIN de coleta ou entrega
  async validatePin(req, res) {
    try {
      const { rideId } = req.params;
      const { pinType, pin } = req.body;
      const driverId = req.user.id;
      const driverIdStr = String(driverId);

      // Validar tipo de PIN
      if (!["pickup", "delivery"].includes(pinType)) {
        return sendError(res, 400, "Tipo de PIN inválido. Use 'pickup' ou 'delivery'");
      }

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return sendError(res, 404, "Corrida não encontrada");
      }

      // Apenas motorista atribuído pode validar PIN
      if (ride.driverId?.toString() !== driverIdStr) {
        return sendError(res, 403, "Apenas o motorista pode validar PIN");
      }

      // Pegar PIN esperado do ride
      const expectedPin = ride.details?.[`${pinType}Pin`];

      // Se não há PIN definido, não é necessário validar
      if (!expectedPin) {
        return res.json({
          success: true,
          valid: true,
          required: false,
          message: "PIN não é obrigatório para esta entrega"
        });
      }

      // Verificar tentativas
      const attempts = ride.proofs?.[`${pinType}PinAttempts`] || 0;

      if (attempts >= 5) {
        return sendError(res, 429, "Muitas tentativas. Entre em contato com o suporte.");
      }

      // Comparar PINs
      const pinValid = String(pin).trim() === String(expectedPin).trim();

      // Atualizar contagem de tentativas
      ride.proofs = ride.proofs || {};
      ride.proofs[`${pinType}PinAttempts`] = attempts + 1;

      if (pinValid) {
        // PIN correto - marcar como validado
        ride.proofs[`${pinType}PinValidated`] = true;
        ride.proofs[`${pinType}PinValidatedAt`] = new Date();
        await ride.save();

        return res.json({
          success: true,
          valid: true,
          required: true,
          validatedAt: ride.proofs[`${pinType}PinValidatedAt`],
          message: `PIN de ${pinType === "pickup" ? "coleta" : "entrega"} validado com sucesso`
        });
      } else {
        // PIN incorreto - salvar tentativas
        await ride.save();
        const remaining = 5 - (attempts + 1);

        return res.status(401).json({
          success: false,
          valid: false,
          required: true,
          attempts: attempts + 1,
          remaining,
          message: `PIN incorreto. Tentativas restantes: ${remaining}`
        });
      }
    } catch (error) {
      console.error("Erro ao validar PIN:", error);
      return sendError(res, 500, "Erro ao validar PIN", {
        details: error.message,
      });
    }
  }

  // Atualizar status da corrida
  async updateStatus(req, res) {
    try {
      const { rideId } = req.params;
      const { status, arrivedAtDropoff } = req.body;
      const driverId = req.user.id;
      const driverIdStr = String(driverId);
      const nextStatus = String(status || "").trim();
      const markArrivedAtDropoff = Boolean(arrivedAtDropoff);

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (ride.driverId?.toString() !== driverIdStr) {
        return sendError(res, 403, "Apenas o motorista pode atualizar o status");
      }

      // Fluxo especial: marcar chegada no destino sem alterar status principal
      if (markArrivedAtDropoff && !nextStatus) {
        if (String(ride.status) !== "in_progress") {
          return sendError(res, 400, "So pode marcar chegada no destino durante a entrega");
        }
        if (ride.serviceType !== "delivery") {
          return sendError(res, 400, "Acao exclusiva para entregas");
        }
        ride.arrivedAtDropoff = new Date();
        await ride.save();

        const io = req.app.get("io");
        if (io) {
          io.to(`client-${ride.clientId}`).emit("ride-status-updated", {
            rideId: ride._id,
            status: ride.status,
            arrivedAtDropoff: true,
            arrivedAtDropoffTime: ride.arrivedAtDropoff,
            timestamp: new Date().toISOString(),
          });
        }

        return res.json({ success: true, message: "Chegada no destino registrada", ride });
      }

      const allowedStatuses = ["driver_arriving", "arrived", "in_progress", "completed"];
      if (!allowedStatuses.includes(nextStatus)) {
        return sendError(res, 400, "Status invalido para atualizacao do motorista", { allowed: allowedStatuses });
      }

      const allowedTransitions = {
        accepted: ["driver_arriving", "arrived"],
        driver_assigned: ["driver_arriving", "arrived"],
        driver_arriving: ["arrived"],
        arrived: ["in_progress"],
        in_progress: ["completed"],
      };

      const currentStatus = String(ride.status || "");
      const canTransition = Boolean(
        allowedTransitions[currentStatus]?.includes(nextStatus),
      );

      if (!canTransition) {
        return sendError(res, 400, "Transicao de status invalida", { current: currentStatus, requested: nextStatus });
      }

      if (ride.serviceType === "delivery" || ride.serviceType === "frete") {
        if (nextStatus === "in_progress") {
          if (ride.details?.pickupPin && !ride.proofs?.pickupPinValidated) {
            return sendError(res, 400, "Valide o PIN de coleta antes de iniciar a entrega");
          }
        }
        if (nextStatus === "completed") {
          const reqPin = String(req.body.deliveryPin || "").trim();
          const expectedPin = String(ride.details?.deliveryPin || "").trim();
          if (expectedPin && reqPin !== expectedPin) {
            return sendError(res, 400, "PIN de entrega incorreto. Verifique com o recebedor.");
          }
        }
      }
      ride.status = nextStatus;

      if (nextStatus === "arrived") {
        ride.arrivedAt = new Date();
      } else if (nextStatus === "in_progress") {
        ride.startedAt = new Date();
      } else if (nextStatus === "completed") {
        ride.completedAt = new Date();

        await DriverLocation.findOneAndUpdate(
          { driverId },
          {
            status: "available",
            currentRideId: null,
          },
        );

        try {
          const paymentMethod = normalizePaymentMethod(
            ride?.payment?.method?.type || ride?.payment?.method || ride?.payment
          );
          const pricingTotal = toMoney(ride?.pricing?.total || 0);

          let platformFee = toMoney(ride?.pricing?.platformFee ?? ride?.pricing?.serviceFee ?? 0);
          if (platformFee <= 0) {
            const knownTotal = toMoney(ride?.pricing?.total || 0);
            const knownDriverValue = toMoney(ride?.pricing?.driverValue || 0);
            if (knownTotal > 0 && knownDriverValue >= 0 && knownTotal >= knownDriverValue) {
              platformFee = toMoney(knownTotal - knownDriverValue);
            }
          }
          if (platformFee <= 0 && pricingTotal > 0) {
            const runtimeConfig = await getRuntimeConfig().catch(() => null);
            const pct = Number(
              runtimeConfig?.appFeePercentage || DEFAULT_APP_FEE_PERCENTAGE,
            );
            platformFee = toMoney(pricingTotal * (pct / 100));
          }

          const driverValue = toMoney(
            ride?.pricing?.driverValue ?? Math.max(0, pricingTotal - platformFee)
          );

          // Escrow LevaPay: se há valor retido, ele paga o motorista (e a taxa já está
          // embutida em driverValue). Evita o duplo crédito/débito do caminho legado abaixo.
          const useEscrow = paymentMethod === "wallet" && ride?.payment?.escrow?.status === "reserved";
          let escrowCredit = 0;
          if (useEscrow) {
            try {
              const rel = await walletEscrow.release(ride, { driverId, driverValue, platformFee });
              escrowCredit = toMoney(rel?.credit || 0);
            } catch (relErr) {
              console.error("Erro ao liberar escrow LevaPay na conclusão:", relErr);
            }
          }

          const driver = await User.findById(driverId);
          if (driver && driver.userType === "driver") {
            if (!driver.driverBalance) {
              driver.driverBalance = {
                balance: 0,
                totalDeposits: 0,
                totalDeductions: 0,
                transactions: [],
              };
            }

            const transactions = Array.isArray(driver.driverBalance.transactions)
              ? driver.driverBalance.transactions
              : [];
            const rideIdStr = String(ride._id);
            const alreadyCredited = transactions.some(
              (tx) => tx?.rideId === rideIdStr && tx?.type === "client_in_app_payment"
            );
            const alreadyDebited = transactions.some(
              (tx) => tx?.rideId === rideIdStr && tx?.type === "app_fee_debit"
            );

            // No fluxo de escrow o crédito já foi feito pelo release; reflete no realtime.
            let creditedAmount = useEscrow ? escrowCredit : 0;
            let deductedAmount = 0;
            const isInAppPayment = paymentMethod && paymentMethod !== "cash" && paymentMethod !== "card_machine" && !useEscrow;

            if (isInAppPayment && driverValue > 0 && !alreadyCredited) {
              creditedAmount = driverValue;
              driver.driverBalance.balance = toMoney(
                (driver.driverBalance.balance || 0) + creditedAmount
              );
              driver.driverBalance.totalDeposits = toMoney(
                (driver.driverBalance.totalDeposits || 0) + creditedAmount
              );
              driver.driverBalance.transactions.push({
                type: "client_in_app_payment",
                amount: creditedAmount,
                description: `Crédito da corrida ${rideIdStr} (${paymentMethod})`,
                rideId: rideIdStr,
                status: "completed",
                createdAt: new Date(),
              });
            }

            if (platformFee > 0 && !alreadyDebited && !useEscrow) {
              deductedAmount = toMoney(platformFee);
              driver.driverBalance.balance = toMoney(
                (driver.driverBalance.balance || 0) - deductedAmount
              );
              driver.driverBalance.totalDeductions = toMoney(
                (driver.driverBalance.totalDeductions || 0) + deductedAmount
              );
              driver.driverBalance.transactions.push({
                type: "app_fee_debit",
                amount: deductedAmount,
                description: `Taxa da plataforma da corrida ${rideIdStr}`,
                rideId: rideIdStr,
                status: "completed",
                createdAt: new Date(),
              });
            }

            await driver.save();
            try {
              const DriverDailyStats = require("../models/DriverDailyStats");
              const now = new Date();
              const dateStr = getDateKeyInTimezone(now);
              await DriverDailyStats.findOneAndUpdate(
                { driverId, dateStr },
                {
                  $inc: {
                    completedRidesCount: 1,
                    totalEarnings: toMoney(creditedAmount),
                    totalPlatformFees: toMoney(deductedAmount),
                  },
                  $set: {
                    walletBalanceEnd: toMoney(driver.driverBalance.balance || 0),
                  },
                  $setOnInsert: {
                    walletBalanceStart: toMoney(driver.driverBalance.balance || 0),
                    firstOnlineAt: now,
                  },
                },
                { upsert: true, new: true }
              );
            } catch (dailyStatsErr) {
              console.error("Erro ao atualizar DriverDailyStats na conclusão da corrida:", dailyStatsErr);
            }


            const io = req.app.get("io");
            if (io) {
              io.to(`driver-${driverId}`).emit("balance_updated", {
                balance: toMoney(driver.driverBalance.balance || 0),
                credited: toMoney(creditedAmount),
                deducted: toMoney(deductedAmount),
                rideId: ride._id,
                paymentMethod: paymentMethod || "unknown",
              });
            }
          }
        } catch (balanceErr) {
          console.error("Erro ao atualizar saldo unificado do motorista:", balanceErr);
        }
      }

      await ride.save();
      if (nextStatus === "completed") {
        await moveToHistory(ride);
      }

      const io = req.app.get("io");
      if (io) {
        const statusPayload = {
          rideId: ride._id,
          status: ride.status,
          timestamp: new Date().toISOString(),
        };
        if (ride.arrivedAtDropoff) {
          statusPayload.arrivedAtDropoff = true;
          statusPayload.arrivedAtDropoffTime = ride.arrivedAtDropoff;
        }
        io.to(`client-${ride.clientId}`).emit("ride-status-updated", statusPayload);

        // Notificar cliente sobre mudança na carteira apos liberação do escrow
        if (nextStatus === "completed") {
          try {
            const cid = ride.clientId?._id || ride.clientId;
            const clientUser = await User.findById(cid);
            if (clientUser) {
              io.to(`client-${cid}`).emit("wallet-updated", {
                balance: clientUser.wallet?.balance || 0,
                held: clientUser.wallet?.held || 0,
              });
            }
          } catch {}
        }
      }

      res.json({
        message: "Status atualizado",
        ride,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return sendError(res, 500, "Erro ao atualizar status", { details: error.message });
    }
  }

  // Buscar corrida por ID
  async getById(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;
      const userIdStr = String(userId);

      let ride = await Ride.findById(rideId)
        .populate("clientId", "name phone profilePhoto")
        .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");

      if (!ride) {
        ride = await RideHistory.findById(rideId)
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt");
      }

      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      // Verificar permissao
      const isClient = ride.clientId?._id?.toString() === userIdStr;
      const isDriver = ride.driverId?._id?.toString() === userIdStr;
      const isRejectedDriver = Array.isArray(ride.rejectedBy) &&
        ride.rejectedBy.some((item) => String(item?.driverId || "") === userIdStr);
      const hasNegotiated = Array.isArray(ride?.negotiation?.offers) &&
        ride.negotiation.offers.some((offer) => String(offer?.driverId || "") === userIdStr);

      if (!isClient && !isDriver && !isRejectedDriver && !hasNegotiated && req.user.userType !== "admin") {
        return sendError(res, 403, "Voce nao tem permissao para ver esta corrida");
      }

      return res.json(ride);
    } catch (error) {
      console.error("Erro ao buscar corrida:", error);
      return sendError(res, 500, "Erro ao buscar corrida", {
        details: error.message,
      });
    }
  }

  // Gerar Pix de Pagamento da Corrida
  async createRidePixPayment(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (ride.payment && ride.payment.status === "completed") {
        return res.json({
          success: true,
          transactionId: ride.payment.transactionId,
          amount: ride.pricing.total,
          pixCode: ride.payment.pixCode,
          qrCodeData: ride.payment.qrCodeData,
          status: "completed",
          message: "Pagamento ja finalizado"
        });
      }

      // Se ja gerou e tem os dados, reutilizar para evitar criar multiplas intents
      if (ride.payment && ride.payment.pixCode && ride.payment.qrCodeData) {
        return res.json({
          success: true,
          transactionId: ride.payment.transactionId,
          amount: ride.pricing.total,
          pixCode: ride.payment.pixCode,
          qrCodeData: ride.payment.qrCodeData,
          status: ride.payment.status || "pending"
        });
      }

      const amountValue = ride.pricing.total;
      let transactionId = "";
      let pixCode = "";
      let qrCodeData = "";

      const stripeSecret = process.env.STRIPE_SECRET_KEY;
      const stripeInstance = stripeSecret ? require("stripe")(stripeSecret) : null;

      if (stripeInstance) {
        try {
          const amountInCents = Math.round(amountValue * 100);
          const paymentIntent = await stripeInstance.paymentIntents.create({
            amount: amountInCents,
            currency: "brl",
            payment_method_types: ["pix"],
            payment_method_data: {
              type: "pix",
            },
            confirm: true,
            return_url: "https://example.com",
            metadata: {
              kind: "ride_payment",
              rideId: String(ride._id),
              driverId: String(ride.driverId),
              clientId: String(ride.clientId)
            },
          });

          transactionId = paymentIntent.id;

          if (paymentIntent.next_action && paymentIntent.next_action.pix_display_qr_code) {
            pixCode = paymentIntent.next_action.pix_display_qr_code.data;
            qrCodeData = paymentIntent.next_action.pix_display_qr_code.image_url_png || pixCode;
          }
        } catch (stripeError) {
          console.error("[Stripe Ride PIX] Erro ao criar intent no Stripe:", stripeError.message);
        }
      }

      // Fallback/Simulacao se o Stripe nao estiver configurado ou falhar em desenvolvimento
      if (!pixCode || !qrCodeData) {
        const crypto = require("crypto");
        const randomId = crypto.randomBytes(12).toString("hex");
        pixCode = `00020101021226870014br.gov.bcb.pix2565pix.leva-mais.com.br/qr/${randomId}5204000053039865405${amountValue.toFixed(2)}5802BR5913LEVA MAIS APP6009SAO PAULO62070503***6304`;
        qrCodeData = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(pixCode)}`;
        transactionId = `pi_mock_${randomId}`;
      }

      if (!ride.payment) {
        ride.payment = { method: "pix", status: "pending" };
      }
      ride.payment.transactionId = transactionId;
      ride.payment.pixCode = pixCode;
      ride.payment.qrCodeData = qrCodeData;
      ride.payment.status = "pending";
      await ride.save();

      // Emitir evento Socket informando que o PIX foi gerado
      const io = req.app.get("io");
      if (io) {
        io.to(String(rideId)).emit("ride-pix-generated", {
          rideId: String(rideId),
          pixCode,
          qrCodeData,
          amount: amountValue
        });
      }

      return res.json({
        success: true,
        transactionId,
        amount: amountValue,
        pixCode,
        qrCodeData,
        expiresIn: 3600,
        status: "pending",
        instructions: [
          "Abra o app do seu banco",
          "Escolha pagar com PIX",
          "Escaneie o QR Code ou cole o código",
          "Confirme o pagamento",
        ],
      });
    } catch (error) {
      console.error("Erro ao gerar pagamento PIX da corrida:", error);
      return sendError(res, 500, "Erro ao gerar pagamento PIX", { details: error.message });
    }
  }

  // Simular confirmacao de pagamento PIX de corrida (apenas para teste/dev)
  async confirmRidePixPaymentMock(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (ride.payment && ride.payment.status === "completed") {
        return res.json({ success: true, message: "Pagamento ja confirmado" });
      }

      if (!ride.payment) {
        ride.payment = { method: "pix" };
      }
      ride.payment.status = "completed";
      ride.payment.paidAt = new Date();
      await ride.save();

      const amountValue = ride.pricing.total;
      const driverId = ride.driverId;

      if (driverId) {
        const driver = await User.findById(driverId);
        if (driver) {
          driver.driverBalance = driver.driverBalance || { balance: 0, totalDeposits: 0, totalDeductions: 0, transactions: [] };
          driver.driverBalance.balance = Number((Number(driver.driverBalance.balance || 0) + amountValue).toFixed(2));
          driver.driverBalance.totalDeposits = Number((Number(driver.driverBalance.totalDeposits || 0) + amountValue).toFixed(2));
          driver.driverBalance.transactions.push({
            type: "client_in_app_payment",
            amount: amountValue,
            description: `Pagamento da corrida/entrega ${rideId} via PIX (Simulado)`,
            referenceId: ride.payment.transactionId || `pi_mock_${require("crypto").randomBytes(8).toString("hex")}`,
            status: "completed",
            createdAt: new Date(),
          });
          await driver.save();
        }
      }

      const io = req.app.get("io");
      if (io) {
        io.to(String(rideId)).emit("ride-status-updated", {
          rideId: String(rideId),
          status: ride.status,
          paymentStatus: "completed",
          ride
        });
        io.to(String(rideId)).emit("ride-payment-confirmed", {
          rideId: String(rideId),
          paymentStatus: "completed",
          amount: amountValue
        });
      }

      return res.json({ success: true, message: "Pagamento simulado com sucesso" });
    } catch (error) {
      console.error("Erro ao simular confirmacao PIX:", error);
      return sendError(res, 500, "Erro ao simular confirmacao PIX", { details: error.message });
    }
  }

  // Histórico de corridas
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20, page = 1 } = req.query;

      // Force cast to ObjectId for $or queries to ensure safety
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const isAdmin = req.user && req.user.userType === "admin";

      const query = {
        ...(isAdmin ? (req.query.clientId ? { clientId: req.query.clientId } : req.query.driverId ? { driverId: req.query.driverId } : {}) : req.user.userType === "driver" ? { $or: [{ driverId: userObjectId }, { "rejectedBy.driverId": userObjectId }, { "negotiation.offers.driverId": userObjectId }] } : { clientId: userObjectId }),
      };

      if (status) {
        query.status = status;
      }

      // Query both active Rides and archived RideHistory
      const [activeRides, historyRides] = await Promise.all([
        Ride.find(query)
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt")
          .lean(),
        RideHistory.find(query)
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto ratingStats vehicleInfo createdAt")
          .lean()
      ]);

      // Combine both results and remove duplicates by ID
      const seenIds = new Set();
      const uniqueRides = [];

      for (const ride of [...activeRides, ...historyRides]) {
        const idStr = String(ride._id || ride.id);
        if (!seenIds.has(idStr)) {
          seenIds.add(idStr);
          uniqueRides.push(ride);
        }
      }

      // Sort by createdAt descending
      uniqueRides.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Paginate merged array
      const total = uniqueRides.length;
      const limitVal = parseInt(limit);
      const pageVal = parseInt(page);
      const startIndex = (pageVal - 1) * limitVal;
      const paginatedRides = uniqueRides.slice(startIndex, startIndex + limitVal);

      res.json({
        rides: paginatedRides,
        pagination: {
          total,
          page: pageVal,
          limit: limitVal,
          pages: Math.ceil(total / limitVal),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return sendError(res, 500, "Erro ao buscar historico", { details: error.message });
    }
  }

  // EstatÃƒÆ’Ã‚Â­sticas do motorista (Ganhos de hoje, Meta)
  async getDriverStats(req, res) {
    try {
      const driverId = req.user.id;
      const { startOfDay, endOfDay } = require("date-fns");

      const now = new Date();
      // Considerando fuso horÃƒÆ’Ã‚Â¡rio local simples (ideal seria receber timezone do client)
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const timeZone = process.env.APP_TIMEZONE || DEFAULT_APP_TIMEZONE;
      const stats = await RideHistory.aggregate([
        {
          $match: {
            driverId: new mongoose.Types.ObjectId(driverId),
            status: "completed",
            completedAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $project: {
            rideNetValue: {
              $ifNull: [
                "$pricing.driverValue",
                { $multiply: ["$pricing.total", 0.8] },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$rideNetValue" },
            ridesCount: { $sum: 1 },
          },
        },
      ]);

      const result = stats[0] || { totalEarnings: 0, ridesCount: 0 };

      const runtimeConfig = await getRuntimeConfig().catch(() => null);
      const dailyGoal = Number(
        runtimeConfig?.driverDailyGoalRides || DRIVER_DAILY_GOAL_RIDES,
      );
      const configuredBonus = Number(
        runtimeConfig?.driverDailyBonusAmount || DRIVER_DAILY_BONUS_AMOUNT,
      );
      const bonusAmount = result.ridesCount >= dailyGoal ? configuredBonus : 0;

      // Valor final ja representa o liquido do motorista:
      // prioriza pricing.driverValue e usa fallback legado (80% de pricing.total).
      const driverShare = Number((result.totalEarnings || 0).toFixed(2));

      let rating = 5.0;
      let acceptanceRate = 100;
      let cancellationRate = 0;
      let onlineTime = 0;

      try {
        // 1. Calcular Rating MÃƒÆ’Ã‚Â©dio das Corridas
        const ratingAgg = await RideHistory.aggregate([
          {
            $match: {
              driverId: new mongoose.Types.ObjectId(driverId),
              status: "completed",
              "rating.clientRating.stars": { $exists: true, $ne: null },
            },
          },
          {
            $sort: { "rating.clientRating.createdAt": -1 }
          },
          {
            $limit: 50
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating.clientRating.stars" },
            },
          },
        ]);
        if (ratingAgg.length > 0 && ratingAgg[0].avgRating != null) {
          rating = Number(ratingAgg[0].avgRating.toFixed(1));
        }

        // 2. Calcular Taxa de AceitaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o (Aceitas / Total Ofertadas)
        const acceptedCount = (await Ride.countDocuments({
          driverId: new mongoose.Types.ObjectId(driverId),
        })) + (await RideHistory.countDocuments({
          driverId: new mongoose.Types.ObjectId(driverId),
        }));
        const rejectedCount = (await Ride.countDocuments({
          "rejectedBy.driverId": new mongoose.Types.ObjectId(driverId),
        })) + (await RideHistory.countDocuments({
          "rejectedBy.driverId": new mongoose.Types.ObjectId(driverId),
        }));
        const totalOffers = acceptedCount + rejectedCount;
        if (totalOffers > 0) {
          acceptanceRate = Math.round((acceptedCount / totalOffers) * 100);
        }

        // 2b. Taxa de cancelamento do motorista.
        // Usa o contador persistente (cancelledRidesCount), que sobrevive ao re-despacho
        // (quando a corrida cancelada pelo motorista volta para a fila e perde o driverId).
        // Denominador = cancelamentos + corridas concluídas pelo motorista.
        const driverCancelDoc = await User.findById(driverId).select("cancelledRidesCount");
        const cancelledByDriverCount = Number(driverCancelDoc?.cancelledRidesCount || 0);
        const completedByDriverCount = (await Ride.countDocuments({
          driverId: new mongoose.Types.ObjectId(driverId),
          status: "completed",
        })) + (await RideHistory.countDocuments({
          driverId: new mongoose.Types.ObjectId(driverId),
          status: "completed",
        }));
        const cancelDenom = cancelledByDriverCount + completedByDriverCount;
        if (cancelDenom > 0) {
          cancellationRate = Math.round((cancelledByDriverCount / cancelDenom) * 100);
        }

        // 3. Obter Tempo Online Acumulado Real do Banco (com InterpolaÃƒÂ§ÃƒÂ£o em Tempo Real ao Segundo)
        const user = await User.findById(driverId).select("onlineStats cancelledRidesCount");
        if (user && user.onlineStats) {
          const todayStr = getDateKeyInTimezone(new Date());
          if (user.onlineStats.activeDateStr === todayStr) {
            let baseTime = user.onlineStats.totalSecondsToday || 0;

            // Ã°Å¸â€™Â¡ MÃƒÂGICA DO TEMPO REAL: Se ele estÃƒÂ¡ online agora, soma os segundos exatos
            // decorridos desde a ÃƒÂºltima gravaÃƒÂ§ÃƒÂ£o para bater 100% com o cronÃƒÂ´metro do app!
            if (user.onlineStats.isOnline && user.onlineStats.lastHeartbeatAt) {
              const last = new Date(user.onlineStats.lastHeartbeatAt).getTime();
              const diffMs = Date.now() - last;
              const diffSec = Math.floor(diffMs / 1000);

              // Apenas interpola se for uma janela realista (menos de 60s)
              if (diffSec > 0 && diffSec < 60) {
                baseTime += diffSec;
              }
            }
            
            onlineTime = baseTime;
          }
        }
      } catch (innerErr) {
        console.error("Erro ao computar mÃƒÆ’Ã‚Â©tricas adicionais do motorista:", innerErr);
      }

      res.json({
        earnings: driverShare,
        rides: result.ridesCount,
        goal: dailyGoal,
        bonus: bonusAmount,
        rating,
        acceptanceRate,
        cancellationRate,
        onlineTime,
      });
    } catch (error) {
      console.error("Erro ao buscar estatÃƒÆ’Ã‚Â­sticas:", error);
      res.status(500).json({
        earnings: 0,
        rides: 0,
        goal: 10,
        bonus: 0,
      });
    }
  }

  // HistÃƒÆ’Ã‚Â³rico de ganhos (ÃƒÆ’Ã‚Âºltimos 7 dias)
  async getEarningsHistory(req, res) {
    try {
      const driverId = req.user.id;
      const { period = "week" } = req.query; // 'day', 'week', 'month'
      const driverObjectId = new mongoose.Types.ObjectId(driverId);

      let startDate = new Date();
      let groupByFormat = ""; // Format for $dateToString

      // Configure Date Range and Grouping
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0); // Start of today
        groupByFormat = "%H:00"; // Group by Hour
      } else if (period === "month") {
        startDate.setDate(1); // Start of current month
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = "%Y-%m-%d"; // Group by Day
      } else {
        // Default: Week
        startDate.setDate(startDate.getDate() - 6); // Last 7 days
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = "%Y-%m-%d"; // Group by Day
      }

      const timeZone = process.env.APP_TIMEZONE || DEFAULT_APP_TIMEZONE;
      const stats = await RideHistory.aggregate([
        {
          $match: {
            driverId: driverObjectId,
            status: "completed",
            completedAt: { $gte: startDate },
          },
        },
        {
          $project: {
            // Agrupamento por timezone configuravel (APP_TIMEZONE)
            completedAt: 1,
            // Use valor salvo ou calcula 80% fallback para legados
            val: {
              $ifNull: [
                "$pricing.driverValue",
                { $multiply: ["$pricing.total", 0.8] },
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: groupByFormat, date: "$completedAt", timezone: timeZone },
            },
            total: { $sum: "$val" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill missing slots (Gap Filling)
      const result = [];
      const now = new Date();
      const current = new Date(startDate);

      if (period === "day") {
        // 00:00 to 23:00
        for (let i = 0; i < 24; i++) {
          const hourLabel = `${String(i).padStart(2, "0")}:00`;
          const match = stats.find((s) => s._id === hourLabel);
          result.push({
            label: hourLabel,
            value: match ? match.total : 0, // Valor jÃƒÆ’Ã‚Â¡ ÃƒÆ’Ã‚Â© liquido do motorista
            count: match ? match.count : 0,
          });
        }
      } else if (period === "week" || period === "month") {
        // Fill days until today
        while (current <= now) {
          const dateKey = current.toISOString().split("T")[0]; // YYYY-MM-DD
          const match = stats.find((s) => s._id === dateKey);

          // Format Label
          let label = "";
          if (period === "week") {
            const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
            label = days[current.getDay()];
          } else {
            label = `${current.getDate()}/${current.getMonth() + 1}`;
          }

          result.push({
            label: label,
            fullDate: dateKey,
            value: match ? match.total : 0, // Valor jÃƒÆ’Ã‚Â¡ ÃƒÆ’Ã‚Â© liquido
            count: match ? match.count : 0,
          });

          current.setDate(current.getDate() + 1);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Erro ao buscar histÃƒÆ’Ã‚Â³rico de ganhos:", error);
      return sendError(res, 500, "Erro interno ao buscar dados");
    }
  }

  // Calcular preÃƒÆ’Ã‚Â§o (antes de criar a corrida)
  async calculatePrice(req, res) {
    try {
      const { pickup, dropoff, vehicleType, purposeId, cityId, serviceType = "ride" } = req.body;

      if (!pickup || !dropoff) {
        return sendError(res, 400, "Origem e destino sao obrigatorios");
      }

      if (String(serviceType || "").toLowerCase() === "delivery") {
        const snapshot = await calculateDeliveryPricingSnapshot({
          serviceType: "delivery",
          vehicleType,
          pickup,
          dropoff,
          deliveryType: req.body.deliveryType,
          cargoSize: req.body.cargoSize,
          approximateWeightKg: req.body.approximateWeightKg,
          isFragile: req.body.isFragile,
          needsHelper: req.body.needsHelper,
          priority: req.body.priority,
        });
        const { runtimeConfig, ...response } = snapshot;
        return res.json(response);
      }

      // Validar se cityId foi enviado (agora ÃƒÆ’Ã‚Â© obrigatÃƒÆ’Ã‚Â³rio para preÃƒÆ’Ã‚Â§o preciso)
      // Se o app antigo nÃƒÆ’Ã‚Â£o mandar, tentamos inferir (geo) ou usar regra global (se existir)
      // Por enquanto, vamos assumir que o app PRECISA mandar ou a gente geocodifica no back.
      // Como o usuÃƒÆ’Ã‚Â¡rio disse "pegamos a localizaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o... buscamos configuraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Âµes da cidade",
      // o ideal seria o backend resolver a cidade via lat/long se o app nÃƒÆ’Ã‚Â£o mandar.
      // MVP: App manda ou Backend resolve. Vamos focar na lÃƒÆ’Ã‚Â³gica de preÃƒÆ’Ã‚Â§o primeiro.

      const mongoose = require("mongoose");
      // PricingRule removido
      // Purpose removido

      // Distância em metros via Google Maps API
      let distanceInMeters = req.body.distance;
      let durationInSeconds = req.body.duration;

      if (typeof distanceInMeters !== "number" || typeof durationInSeconds !== "number") {
        const metrics = await fetchRouteMetricsWithGoogleMaps(pickup, dropoff);
        if (!metrics) {
          return res.status(500).json({
            error: "Erro ao obter rota da API do Google Maps. A API do Google Maps é obrigatória.",
            details: "Google Maps API falhou ou está indisponível e o fallback de Haversine foi removido."
          });
        }
        distanceInMeters = metrics.distanceInMeters;
        durationInSeconds = metrics.durationInSeconds || Math.max(60, Math.round(((distanceInMeters / 1000) / 35) * 3600 + 180));
      }
      
      const distance = distanceInMeters;
      const distanceKm = distanceInMeters / 1000;

      // Resolver purpose (aceita ObjectId OU slug)
      let purposeDoc = null;
      if (purposeId) {
        if (mongoose.Types.ObjectId.isValid(purposeId)) {
          purposeDoc = await Purpose.findById(purposeId).select("_id id title");
        } else {
          purposeDoc = await Purpose.findOne({
            id: String(purposeId),
            vehicleType: vehicleType,
          }).select("_id id title");
        }
      }

      // ==============================================================================
      // NOVA LÃƒÆ’Ã¢â‚¬Å“GICA DE PRECIFICAÃƒÆ’Ã¢â‚¬Â¡ÃƒÆ’Ã†â€™O (Prioridade: Cidade/VeÃƒÆ’Ã‚Â­culo/ServiÃƒÆ’Ã‚Â§o)
      // ==============================================================================

      console.log("[calculatePrice] ParÃƒÆ’Ã‚Â¢metros recebidos:", {
        cityId,
        vehicleType,
        purposeId,
        purposeDocId: purposeDoc?._id,
        distanceKm,
      });

      let rule = null;

      if (cityId) {
        // 1. Tenta regra ESPECÃƒÆ’Ã‚ÂFICA: Cidade + VeÃƒÆ’Ã‚Â­culo + ServiÃƒÆ’Ã‚Â§o
        if (purposeDoc?._id) {
          rule = await PricingRule.findOne({
            cityId,
            vehicleCategory: vehicleType,
            purposeId: purposeDoc._id,
            active: true,
          });
          
          if (rule && rule.pricing.minimumFee === 0 && rule.pricing.pricePerKm === 0) {
            rule = null;
          }

          console.log(
            "[calculatePrice] Busca especÃƒÆ’Ã‚Â­fica (Cidade+VeÃƒÆ’Ã‚Â­culo+ServiÃƒÆ’Ã‚Â§o):",
            rule ? `Encontrada: ${rule.name}` : "NÃƒÆ’Ã‚Â£o encontrada ou zerada",
          );
        }

        // 2. Se nÃƒÆ’Ã‚Â£o achar, tenta regra BASE da Cidade: Cidade + VeÃƒÆ’Ã‚Â­culo (sem serviÃƒÆ’Ã‚Â§o)
        if (!rule) {
          rule = await PricingRule.findOne({
            cityId,
            vehicleCategory: vehicleType,
            purposeId: null, // Regra base explicitamente
            active: true,
          });

          if (rule && rule.pricing.minimumFee === 0 && rule.pricing.pricePerKm === 0) {
            rule = null;
          }

          console.log(
            "[calculatePrice] Busca base (Cidade+VeÃƒÆ’Ã‚Â­culo):",
            rule ? `Encontrada: ${rule.name}` : "NÃƒÆ’Ã‚Â£o encontrada ou zerada",
          );
        }
      } else {
        console.log("[calculatePrice] ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â cityId NÃƒÆ’Ã†â€™O foi enviado pelo cliente!");
      }

      // 3. Fallback (Opcional): Regra Global (sem cidade)
      // Se nÃƒÆ’Ã‚Â£o achou na cidade (ou cityId nÃƒÆ’Ã‚Â£o veio), tenta regra global
      if (!rule) {
        console.log(
          "[calculatePrice] Tentando fallback para regra global (sem cityId)...",
        );
        const globalFilter = {
          cityId: null,
          vehicleCategory: vehicleType,
          active: true,
        };

        // Global EspecÃƒÆ’Ã‚Â­fica
        if (purposeDoc?._id) {
          rule = await PricingRule.findOne({
            ...globalFilter,
            purposeId: purposeDoc._id,
          });
          if (rule && rule.pricing.minimumFee === 0 && rule.pricing.pricePerKm === 0) {
            rule = null;
          }
          console.log(
            "[calculatePrice] Busca global especÃƒÆ’Ã‚Â­fica:",
            rule ? `Encontrada: ${rule.name}` : "NÃƒÆ’Ã‚Â£o encontrada ou zerada",
          );
        }
        // Global Base
        if (!rule) {
          rule = await PricingRule.findOne({
            ...globalFilter,
            purposeId: null,
          });
          if (rule && rule.pricing.minimumFee === 0 && rule.pricing.pricePerKm === 0) {
            rule = null;
          }
          console.log(
            "[calculatePrice] Busca global base:",
            rule ? `Encontrada: ${rule.name}` : "NÃƒÆ’Ã‚Â£o encontrada ou zerada",
          );
        }
      }

      const runtimeConfig = await getRuntimeConfig().catch(() => null);

      // 4. Ultimo recurso: configuracao global da PlatformConfig (vehiclePricing)
      if (!rule) {
        const vPricing = runtimeConfig?.vehiclePricing?.[vehicleType];
        if (vPricing && (Number(vPricing.minimumFee) > 0 || Number(vPricing.pricePerKm) > 0)) {
          console.log("[calculatePrice] Usando fallback global da PlatformConfig para veiculo:", vehicleType);
          rule = {
            name: `PLATFORM_CONFIG_${String(vehicleType || "MOTORCYCLE").toUpperCase()}`,
            pricing: {
              pricePerKm: Number(vPricing.pricePerKm || 0),
              minimumKm: Number(vPricing.minimumKm || 0),
              minimumFee: Number(vPricing.minimumFee || 0),
            },
          };
        }
      }

      if (!rule) {
        if (serviceType === "delivery") {
          console.log("[calculatePrice] Ã¢Å¡Â Ã¯Â¸Â Regra de Banco nÃƒÂ£o encontrada para logÃƒÂ­stica. Ativando fallback AUTÃƒâ€œNOMO da Smart Engine.");
          // Inicializa rule fake para nÃƒÂ£o quebrar o restante do cÃƒÂ³digo, permitindo fluxo seguir para injeÃƒÂ§ÃƒÂ£o smart
          rule = {
            name: "SMART_ENGINE_AUTONOMOUS_DEFAULTS",
            pricing: { minimumKm: 0, minimumFee: 0, pricePerKm: 0 }
          };
        } else {
          console.log(
            "[calculatePrice] Ã¢ÂÅ’ ERRO: Nenhuma regra encontrada!",
            {
              cityId,
              vehicleType,
              purposeId,
            },
          );
          return res.status(400).json({
            error:
              "ServiÃƒÂ§o nÃƒÂ£o disponÃƒÂ­vel ou sem preÃƒÂ§o configurado nesta regiÃƒÂ£o.",
            details: "Nenhuma regra de preÃƒÂ§o encontrada (PricingRule).",
          });
        }
      }

      console.log("[calculatePrice] ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Regra encontrada:", {
        name: rule.name,
        cityId: rule.cityId,
        vehicleCategory: rule.vehicleCategory,
        purposeId: rule.purposeId,
        pricing: rule.pricing,
      });

      // Extrair valores da regra encontrada
      const minimumKm = Number(rule.pricing.minimumKm || 0);
      const minimumFee = Number(rule.pricing.minimumFee || 0);
      const pricePerKm = Number(rule.pricing.pricePerKm || 0);
      // CÃƒÆ’Ã‚Â¡lculo
      // Regra comum: (Base) + (Km Excedente * PreÃƒÆ’Ã‚Â§oKm)
      // Mas a regra do usuÃƒÆ’Ã‚Â¡rio foi: "KM mÃƒÆ’Ã‚Â­nimo que irÃƒÆ’Ã‚Â¡ se basear na taxa mÃƒÆ’Ã‚Â­nima"
      // InterpretaÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o: AtÃƒÆ’Ã‚Â© X km, paga Y. Acima disso, paga Y + (Km - X)*Z.

      let finalPrice = 0;
      let breakdown = {};

      if (distanceKm <= minimumKm) {
        finalPrice = minimumFee;
        breakdown = { method: "minimum_fee", minimumFee, distanceKm };
        console.log("[calculatePrice] ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â° CÃƒÆ’Ã‚Â¡lculo (Taxa MÃƒÆ’Ã‚Â­nima):", {
          distanceKm,
          minimumKm,
          minimumFee,
          finalPrice,
        });
      } else {
        const exceedKm = distanceKm - minimumKm;
        const distancePrice = exceedKm * pricePerKm;
        finalPrice = minimumFee + distancePrice;
        breakdown = {
          method: "distance_calc",
          minimumFee,
          exceedKm,
          pricePerKm,
          distancePrice,
        };
        console.log("[calculatePrice] ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â° CÃƒÆ’Ã‚Â¡lculo (DistÃƒÆ’Ã‚Â¢ncia):", {
          distanceKm,
          minimumKm,
          exceedKm,
          pricePerKm,
          minimumFee,
          distancePrice,
          finalPrice: `R$ ${finalPrice.toFixed(2)}`,
        });
      }

      // Ajuste de duraÃƒÆ’Ã‚Â§ÃƒÆ’Ã‚Â£o (opcional, se configurado)
      // if (rule.pricing.pricePerMinute) ...

      const durationMinutes = Math.max(1, Math.ceil(durationInSeconds / 60)); // Uses injected time scalar

    const feePercentage = Number(
      runtimeConfig?.appFeePercentage || DEFAULT_APP_FEE_PERCENTAGE,
    );

    const baseRidePrice = parseFloat(minimumFee.toFixed(2));
    const distanceExtraPrice = parseFloat((finalPrice - minimumFee).toFixed(2));
    
    // Arredondamento para nÃƒÆ’Ã‚Âºmeros "limpos" (mÃƒÆ’Ã‚Âºltiplos de 0.10)

    const finalTotal = Math.round(finalPrice * 10) / 10;
    
    // Ajusta a taxa de serviÃƒÂ§o para que o total bata exatamente (Total - Base - DistÃƒÂ¢ncia)
    const adjustedServiceFee = parseFloat((finalTotal * (feePercentage / 100)).toFixed(2));

    // ==============================================================================
    // SMART LOGISTICS ENGINE INJECTION Ã¢Å¡Â¡
    // ==============================================================================
    const { 
      deliveryType, 
      cargoSize, 
      priority, 
      needsHelper
    } = req.body;

    if (serviceType === "delivery" || deliveryType || cargoSize) {
      const PricingEngine = require("../services/pricing-engine");
      const pEco = Number(runtimeConfig?.logisticsMultipliers?.priorityEconomic || 1.0);
      const pFast = Number(runtimeConfig?.logisticsMultipliers?.priorityFast || 1.3);
      const pUrg = Number(runtimeConfig?.logisticsMultipliers?.priorityUrgent || 1.8);
      
      const smartCalculation = PricingEngine.calculate({
        pricePerKmRule: pricePerKm > 0 ? pricePerKm : Number(runtimeConfig?.vehiclePricing?.[vehicleType]?.pricePerKm || 1.5),
        minFeeRule: minimumFee,
        minKmRule: minimumKm,
        distanceKm,
        priority: Number(priority || 0),
        priorityEconomic: pEco,
        priorityFast: pFast,
        priorityUrgent: pUrg,
        cargoSizeSmall: Number(runtimeConfig?.logisticsMultipliers?.cargoSizeSmall || 1.0),
        cargoSizeMedium: Number(runtimeConfig?.logisticsMultipliers?.cargoSizeMedium || 1.15),
        cargoSizeLarge: Number(runtimeConfig?.logisticsMultipliers?.cargoSizeLarge || 1.4),
        fragileSurchargeValue: Number(runtimeConfig?.logisticsMultipliers?.fragileSurcharge || 1.1),
        helperSurchargeValue: Number(runtimeConfig?.logisticsMultipliers?.helperSurcharge || 1.15),
        weightUpTo5kg: Number(runtimeConfig?.logisticsMultipliers?.weightUpTo5kg || 1.0),
        weightUpTo15kg: Number(runtimeConfig?.logisticsMultipliers?.weightUpTo15kg || 1.1),
        weightUpTo30kg: Number(runtimeConfig?.logisticsMultipliers?.weightUpTo30kg || 1.25),
        weightUpTo50kg: Number(runtimeConfig?.logisticsMultipliers?.weightUpTo50kg || 1.5),
        weightAbove50kg: Number(runtimeConfig?.logisticsMultipliers?.weightAbove50kg || 1.8),
        cargoSize: cargoSize || "small",
        approximateWeightKg: req.body?.approximateWeightKg,
        isFragile: Boolean(req.body?.isFragile),
        needsHelper: Boolean(req.body?.needsHelper),
      });

      console.log(`[calculatePrice] Ã¢Å“â€¦ PreÃƒÂ§o FINAL Smart Engine: R$ ${smartCalculation.suggestedPrice}`);

      return res.json({
        pricing: {
          basePrice: baseRidePrice,
          distancePrice: distanceExtraPrice,
          serviceFee: adjustedServiceFee,
          total: smartCalculation.suggestedPrice, // Anchor offer
          currency: "BRL",
          breakdown: { ...breakdown, smartDetails: smartCalculation.details },
          ruleUsed: rule.name,
        },
        distance: {
          value: Math.round(distanceInMeters),
          text: `${distanceKm.toFixed(1)} km`,
        },
        duration: {
          value: durationMinutes * 60,
          text: `${durationMinutes} min`,
        },
        smartPricing: smartCalculation,
      });
    }

    return res.json({
      pricing: {
        basePrice: baseRidePrice,
        distancePrice: distanceExtraPrice,
        serviceFee: adjustedServiceFee,
        total: parseFloat(finalTotal.toFixed(2)),
        currency: "BRL",
        breakdown,
        ruleUsed: rule.name,
      },
        distance: {
          value: Math.round(distanceInMeters),
          text: `${distanceKm.toFixed(1)} km`,
        },
        duration: {
          value: durationMinutes * 60,
          text: `${durationMinutes} min`,
        },
        purpose: purposeDoc
          ? { id: purposeDoc.id, title: purposeDoc.title }
          : undefined,
      });
    } catch (error) {
      console.error("Erro ao calcular preÃƒÆ’Ã‚Â§o:", error);
      return sendError(res, 500, "Erro ao calcular preco", { details: error?.message, stack: process.env.NODE_ENV === "production" ? undefined : error?.stack });
    }
  }

  // Calcular estimativa de corrida (estilo inDriver - pré-cálculo para lance do cliente)
  /**
   * Lista categorias de CORRIDA (moto / economy / comfort / luxury) já com preço
   * calculado para a rota (pickup -> stops -> dropoff). Fluxo separado de entrega.
   */
  async calculateRideCategories(req, res) {
    try {
      const { pickup, dropoff, stops, cityId, distance, duration } = req.body;

      if (!pickup || !dropoff) {
        return sendError(res, 400, "Origem e destino são obrigatórios");
      }

      // Surge pricing (gated por config). Multiplicador por demanda/oferta na região da coleta.
      let surgeMultiplier = 1;
      let surgeInfo = null;
      try {
        const cfgSurge = await getRuntimeConfig().catch(() => null);
        if (cfgSurge?.surgeEnabled) {
          const s = await calculateSurgeMultiplier(Number(pickup.latitude), Number(pickup.longitude));
          if (s && s.multiplier > 1) {
            surgeMultiplier = s.multiplier;
            surgeInfo = { multiplier: s.multiplier, level: s.level };
          }
        }
      } catch (surgeErr) {
        console.warn("[calculateRideCategories] surge indisponível:", surgeErr?.message);
      }

      const result = await calculateRideCategories({
        pickup,
        dropoff,
        stops,
        cityId,
        distance,
        duration,
        surgeMultiplier,
      });
      result.surge = surgeInfo;

      // Disponibilidade por categoria: conta motoristas de CORRIDA próximos ao embarque.
      try {
        const pLat = Number(pickup.latitude);
        const pLng = Number(pickup.longitude);
        if (Number.isFinite(pLat) && Number.isFinite(pLng)) {
          const nearby = await DriverLocation.findNearby(pLat, pLng, 15000, undefined, 50, "ride");

          // Conta, por categoria, motoristas compatíveis (tier superior atende inferior).
          // Usa o cache DriverLocation.rideCategory (sincronizado no update de localização).
          result.categories = result.categories.map((c) => {
            const count = nearby.reduce((acc, d) => {
              return acc + (isDriverCategoryCompatible(d.vehicleType, d.rideCategory, c.category) ? 1 : 0);
            }, 0);
            return { ...c, availableCount: count, available: count > 0 };
          });
        }
      } catch (availErr) {
        // Disponibilidade é best-effort; não bloqueia o cálculo de preço.
        console.warn("[calculateRideCategories] disponibilidade indisponível:", availErr?.message);
      }

      return res.json(result);
    } catch (error) {
      const status = error?.statusCode || 500;
      return sendError(res, status, error?.message || "Erro ao calcular categorias de corrida", {
        details: error?.details,
      });
    }
  }

  async calculateRideEstimate(req, res) {
    try {
      const { pickup, dropoff, vehicleType } = req.body;

      if (!pickup || !dropoff || !vehicleType) {
        return sendError(res, 400, "pickup, dropoff e vehicleType são obrigatórios");
      }

      if (!RIDE_CAPABLE_VEHICLES.has(vehicleType)) {
        return sendError(res, 400, `Tipo de veículo ${vehicleType} não suportado para corridas. Use: motorcycle ou car`);
      }

      const runtimeConfig = await getRuntimeConfig();
      const ridePricing = runtimeConfig.ridePricing || runtimeConfig.vehiclePricing;

      if (!ridePricing || !ridePricing[vehicleType]) {
        return sendError(res, 500, `Configuração de preço não encontrada para ${vehicleType}`);
      }

      const pricing = ridePricing[vehicleType];
      const minimumKm = pricing.minimumDistance !== undefined ? pricing.minimumDistance : (pricing.minimumKm !== undefined ? pricing.minimumKm : 3);
      const minimumFee = pricing.minimumFare !== undefined ? pricing.minimumFare : (pricing.minimumFee !== undefined ? pricing.minimumFee : 8);
      const pricePerKm = pricing.perKm !== undefined ? pricing.perKm : (pricing.pricePerKm !== undefined ? pricing.pricePerKm : 2.5);

      const metrics = await fetchRouteMetricsWithGoogleMaps(pickup, dropoff);
      if (!metrics) {
        return sendError(res, 500, "Erro ao obter rota da API do Google Maps.");
      }
      
      const distanceKm = metrics.distanceInMeters / 1000;
      const durationMin = metrics.durationInSeconds 
        ? Math.round(metrics.durationInSeconds / 60) 
        : Math.round(distanceKm * 2.5);

      let suggestedPrice;
      if (distanceKm <= minimumKm) {
        suggestedPrice = minimumFee;
      } else {
        suggestedPrice = minimumFee + ((distanceKm - minimumKm) * pricePerKm);
      }

      const minPrice = suggestedPrice * 0.8;
      const maxPrice = suggestedPrice * 1.3;

      return res.json({
        success: true,
        suggestedPrice: Math.round(suggestedPrice * 100) / 100,
        minPrice: Math.round(minPrice * 100) / 100,
        maxPrice: Math.round(maxPrice * 100) / 100,
        distanceKm: Math.round(distanceKm * 100) / 100,
        durationMin,
        pricingBreakdown: {
          baseFare: minimumFee,
          distancePrice: Math.max(0, suggestedPrice - minimumFee),
          total: suggestedPrice
        }
      });
    } catch (error) {
      console.error("Erro ao calcular estimativa de corrida:", error);
      return sendError(res, 500, "Erro ao calcular estimativa", { details: error.message });
    }
  }

  // Buscar motoristas prÃƒÆ’Ã‚Â³ximos (para exibir no mapa)
  async getNearbyDrivers(req, res) {
    try {
      const { latitude, longitude, radius, vehicleType, limit, cityId } = req.query;

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ error: "Latitude e Longitude sÃƒÆ’Ã‚Â£o obrigatÃƒÆ’Ã‚Â³rios" });
      }

      // Buscar raio configurado na cidade (prioridade)
      let searchRadius = parseInt(radius) || 5000;
      try {
        if (cityId) {
          const city = await City.findById(cityId).select("searchRadius");
          if (city?.searchRadius) {
            searchRadius = city.searchRadius;
          }
        }
      } catch (e) {
        // Usa fallback se nÃƒÆ’Ã‚Â£o conseguir buscar a cidade
      }

      const DriverLocation = require("../models/DriverLocation");
      const drivers = await DriverLocation.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        searchRadius,
        vehicleType,
        parseInt(limit) || 10
      );

      const populated = await DriverLocation.populate(drivers, {
        path: "driverId",
        select: "name profilePhoto rating",
      });

      const mapped = populated.map((d) => {
        const driverUser = d.driverId && typeof d.driverId === "object" ? d.driverId : {};
        return {
          id: driverUser._id || d.driverId,
          name: driverUser.name || "Motorista",
          profilePhoto: driverUser.profilePhoto || null,
          rating: driverUser.rating || 5.0,
          latitude: d.location.coordinates[1],
          longitude: d.location.coordinates[0],
          type: d.vehicleType || "car",
          rotation: 0,
          serviceTypes: d.serviceTypes || [],
        };
      });

      res.json(mapped);
    } catch (error) {
      console.error("Erro ao buscar motoristas prÃƒÆ’Ã‚Â³ximos:", error);
      return sendError(res, 500, "Erro interno", { details: error.message });
    }
  }

  async getAvailableScheduledRides(req, res) {
    try {
      const driverId = req.user?.id;
      const driverLocation = await DriverLocation.findOne({ driverId }).select(
        "vehicleType serviceTypes",
      );
      if (!driverLocation) {
        return res.json({ count: 0, rides: [] });
      }

      const driverServiceTypes = Array.isArray(driverLocation.serviceTypes)
        ? driverLocation.serviceTypes
        : [];
      const compatibleServiceTypes = driverServiceTypes.filter((serviceType) =>
        isServiceCompatibleWithVehicle(driverLocation.vehicleType, serviceType),
      );
      if (!compatibleServiceTypes.length) {
        return res.json({ count: 0, rides: [] });
      }

      const rides = await Ride.find({
        status: "scheduled",
        vehicleType: String(driverLocation.vehicleType || ""),
        serviceType: { $in: compatibleServiceTypes },
        $or: [{ driverId: { $exists: false } }, { driverId: null }],
      })
        .populate("clientId", "name phone profilePhoto rating")
        .sort({ scheduledFor: 1 });

      return res.json({ count: rides.length, rides });
    } catch (error) {
      console.error("Erro ao buscar agendamentos disponiveis:", error);
      return sendError(res, 500, "Erro ao buscar agendamentos disponiveis", { details: error.message });
    }
  }

  async acceptScheduled(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.id;
      const now = new Date();

      // Impedir aceitar agendamento se o motorista estiver zerado ou com saldo negativo
      const driver = await User.findById(driverId);
      if (!driver) {
        return sendError(res, 404, "Motorista nao encontrado");
      }
      const balance = driver.driverBalance?.balance || 0;
      const opCredit = driver.driverBalance?.operationalCredit || 0;
      if (balance + opCredit <= 0) {
        return sendError(
          res,
          400,
          "Saldo insuficiente. Recarregue sua carteira para aceitar corridas agendadas."
        );
      }

      const activeShift = await ShiftOffer.findOne({
        acceptedBy: driverId,
        status: "accepted",
        startAt: { $lte: now },
        endAt: { $gt: now },
      }).select("title startAt endAt");
      if (activeShift?._id) {
        return sendError(
          res,
          400,
          "Voce esta em plantao ativo e nao pode aceitar outras corridas agora",
          {
            shift: {
              id: activeShift._id,
              title: activeShift.title,
              startAt: activeShift.startAt,
              endAt: activeShift.endAt,
            },
          },
        );
      }

      const driverLocation = await DriverLocation.findOne({ driverId });
      if (!driverLocation) {
        return sendError(res, 400, "Atualize sua localizacao antes de aceitar corridas");
      }
      if (driverLocation.currentRideId) {
        return sendError(res, 400, "Voce ja possui uma corrida ativa", {
          currentRideId: driverLocation.currentRideId,
        });
      }

      const rideSnapshot = await Ride.findById(rideId).select(
        "_id serviceType vehicleType status driverId",
      );
      if (!rideSnapshot) {
        return sendError(res, 404, "Corrida nao encontrada");
      }
      if (String(rideSnapshot.status || "") !== "scheduled") {
        return sendError(res, 400, "Corrida agendada nao esta mais disponivel");
      }
      if (!isServiceCompatibleWithVehicle(driverLocation.vehicleType, rideSnapshot.serviceType)) {
        return sendError(res, 400, "Servico incompativel com o veiculo do motorista");
      }
      const driverServiceTypes = Array.isArray(driverLocation.serviceTypes)
        ? driverLocation.serviceTypes
        : [];
      if (!driverServiceTypes.includes(String(rideSnapshot.serviceType || ""))) {
        return sendError(res, 400, "Este servico nao esta ativo para o motorista");
      }
      if (String(driverLocation.vehicleType || "") !== String(rideSnapshot.vehicleType || "")) {
        return sendError(res, 400, "Tipo de veiculo do motorista nao corresponde a solicitacao");
      }

      const rideUpdated = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: "scheduled",
          $or: [{ driverId: { $exists: false } }, { driverId: null }],
        },
        {
          driverId,
          status: "driver_assigned",
          acceptedAt: new Date(),
        },
        { new: true }
      );
      const ride =
        rideUpdated && typeof rideUpdated.populate === "function"
          ? await rideUpdated.populate("clientId", "name phone profilePhoto rating")
          : rideUpdated;

      if (!ride) {
        return sendError(res, 400, "Corrida agendada nao esta mais disponivel");
      }

      return res.json({ message: "Corrida agendada aceita com sucesso", ride });
    } catch (error) {
      console.error("Erro ao aceitar corrida agendada:", error);
      return sendError(res, 500, "Erro ao aceitar corrida agendada", { details: error.message });
    }
  }

  async increaseOffer(req, res) {
    try {
      const { rideId } = req.params;
      const { incrementAmount } = req.body;
      
      const io = req.app.get("io");

      const ride = await Ride.findById(rideId).populate("clientId");
      if (!ride) {
        return sendError(res, 404, "Corrida nÃ£o encontrada.");
      }

      // Se a corrida expirou ou foi cancelada sem motorista, ativamos preventivamente a negociaÃ§Ã£o para permitir a ressuscitaÃ§Ã£o!
      const isResuscitable = ["cancelled_no_driver", "no_drivers_available", "cancelled"].includes(ride.status) && !ride.driverId;
      if (isResuscitable && ride.negotiation) {
        ride.negotiation.enabled = true;
      }

      // Valida se ainda estÃ¡ em negociaÃ§Ã£o e permite aumento
      const blockedStatuses = ["accepted", "driver_arriving", "arrived", "in_progress", "completed"];
      if (!isResuscitable) {
        blockedStatuses.push("cancelled");
      }

      if (!ride.negotiation || !ride.negotiation.enabled || blockedStatuses.includes(ride.status)) {
        return sendError(res, 400, "NÃ£o Ã© possÃ­vel alterar a oferta desta corrida agora.");
      }

      const currentOffer = Number(ride.negotiation.clientOffer || ride.pricing.total || 0);
      
      // Define o piso dinÃ¢mico: a oferta inicial feita ao criar o chamado! ðŸ›¡ï¸
      const minFloor = Number(ride.negotiation.initialClientOffer || ride.pricing.subtotal || 5.00);

      const parsedInc = Number(incrementAmount);
      const rawNewOffer = currentOffer + (isNaN(parsedInc) ? 2 : parsedInc);
      
      // NÃ£o permite reduzir abaixo do valor inicial em hipÃ³tese alguma!
      const newOffer = toMoney(Math.max(minFloor, rawNewOffer));

      ride.negotiation.clientOffer = newOffer;
      ride.pricing.total = newOffer;
      ride.rejectedBy = [];

      // 🚀 Ao aumentar oferta, sair da fila de espera para disparar o bottom sheet
      // do motorista (new-ride-request) em vez do alerta silencioso (waiting-queue-updated)
      ride.isWaitingInQueue = false;

      if (["cancelled_no_driver", "no_drivers_available", "cancelled"].includes(ride.status)) {
        ride.status = "requesting";
      }
      
      await ride.save();

      // Disparos em tempo real via sockets e push
      if (io) {
        io.to(`ride:${rideId}`).emit("ride-status-updated", ride);
        
        const formattedVal = `R$ ${Number(newOffer).toFixed(2).replace(".", ",")}`;
        
        // Canal global de alerta de ajuste! Ã°Å¸â€â€
        io.emit("queue-ride-offer-increased", {
          rideId: ride._id,
          newOffer: newOffer,
          message: `Ã°Å¸Å¡â‚¬ OFERTA ATUALIZADA! Um pedido ajustou o valor para ${formattedVal}!`
        });
        
        // Re-despacha para os motoristas ativos notificando o ajuste!
        await rideControllerInstance.dispatchRideToNearbyDrivers(ride, io);
      }

      return res.json({ 
        success: true, 
        newOffer, 
        message: "Oferta atualizada com sucesso." 
      });

    } catch (error) {
      console.error("Erro em increaseOffer:", error);
      return sendError(res, 500, "Erro interno ao aumentar oferta", { details: error.message });
    }
  }

  // Salvar ponto de tracking GPS durante a entrega
  async saveTrackPoint(req, res) {
    try {
      const { rideId } = req.params;
      const { latitude, longitude, heading, speed, accuracy, phase, capturedAt } = req.body;

      if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
        return sendError(res, 400, "Latitude e longitude sao obrigatorias");
      }

      const ride = await Ride.findById(rideId).select("driverId status");
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");

      const driverId = req.user.id;
      if (String(ride.driverId) !== String(driverId)) {
        return sendError(res, 403, "Apenas o motorista designado pode enviar pontos de rota");
      }

      const activeStatuses = ["accepted", "driver_arriving", "arrived", "in_progress"];
      if (!activeStatuses.includes(ride.status)) {
        return sendError(res, 400, "Rota nao esta em execucao ativa");
      }

      const RideTrackPoint = require("../models/RideTrackPoint");
      const point = await RideTrackPoint.create({
        rideId,
        driverId,
        latitude: Number(latitude),
        longitude: Number(longitude),
        heading: Number.isFinite(Number(heading)) ? Number(heading) : null,
        speed: Number.isFinite(Number(speed)) ? Number(speed) : null,
        accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : null,
        phase: phase || "to_dropoff",
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      });

      return res.status(201).json({ success: true, point });
    } catch (error) {
      console.error("Erro ao salvar track point:", error);
      return sendError(res, 500, "Erro ao salvar ponto de rota", { details: error.message });
    }
  }

  // Consultar auditoria da rota percorrida (admin/suporte)
  async getRouteAudit(req, res) {
    try {
      const { rideId } = req.params;
      const userIdStr = String(req.user?.id || "");


      const ride = await Ride.findById(rideId)
        .select("pickup dropoff status statusHistory proofs driverId clientId serviceType vehicleType")
        .populate("driverId", "name phone")
        .populate("clientId", "name phone");

      if (!ride) return sendError(res, 404, "Corrida nao encontrada");

      const isClient = String(ride?.clientId?._id || ride?.clientId || "") === userIdStr;
      const isDriver = String(ride?.driverId?._id || ride?.driverId || "") === userIdStr;
      if (!isClient && !isDriver && req.user.userType !== "admin") {
        return sendError(res, 403, "Voce nao tem permissao para ver esta corrida");
      }

      const RideTrackPoint = require("../models/RideTrackPoint");
      const points = await RideTrackPoint.find({ rideId })
        .sort({ capturedAt: 1 })
        .lean();

      // Agrupar pontos por fase
      const phases = {};
      const phaseOrder = ["to_pickup", "at_pickup", "to_dropoff", "at_dropoff", "completed"];
      for (const phase of phaseOrder) {
        const phasePoints = points.filter((p) => p.phase === phase);
        if (phasePoints.length > 0) {
          phases[phase] = {
            pointCount: phasePoints.length,
            startTime: phasePoints[0].capturedAt,
            endTime: phasePoints[phasePoints.length - 1].capturedAt,
            points: phasePoints,
          };
        }
      }

      // Calcular metricas basicas
      const totalPoints = points.length;
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];

      const startedAt = firstPoint?.capturedAt || null;
      const endedAt = lastPoint?.capturedAt || null;
      const totalDurationMs = startedAt && endedAt
        ? new Date(endedAt).getTime() - new Date(startedAt).getTime()
        : null;

      // Calcular distancia total aproximada (Haversine simplificada)
      let totalDistanceMeters = 0;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        totalDistanceMeters += haversineDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
      }

      // Calcular velocidade media
      const avgSpeed = totalPoints > 0
        ? points.reduce((sum, p) => sum + (Number(p.speed) || 0), 0) / totalPoints
        : null;

      // Calcular divergencia da rota planejada
      const plannedDistanceMeters = Number(ride.distance?.value || 0);
      const routeDivergence = plannedDistanceMeters > 0
        ? Math.round(((totalDistanceMeters - plannedDistanceMeters) / plannedDistanceMeters) * 100)
        : null;

      return res.json({
        rideId,
        status: ride.status,
        pickup: ride.pickup,
        dropoff: ride.dropoff,
        driver: ride.driverId,
        client: ride.clientId,
        statusHistory: ride.statusHistory,
        proofs: ride.proofs,
        totalPoints,
        totalDistanceMeters: Math.round(totalDistanceMeters),
        plannedDistanceMeters,
        routeDivergencePercent: routeDivergence,
        avgSpeedKmh: avgSpeed ? Math.round(avgSpeed * 10) / 10 : null,
        startedAt,
        endedAt,
        totalDurationMs,
        phases,
        // Trajeto completo percorrido (flat, ordenado) — "por onde o motorista passou"
        track: points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
          capturedAt: p.capturedAt,
          phase: p.phase,
          speed: p.speed ?? null,
          heading: p.heading ?? null,
        })),
      });
    } catch (error) {
      console.error("Erro ao consultar auditoria de rota:", error);
      return sendError(res, 500, "Erro ao consultar auditoria de rota", { details: error.message });
    }
  }

  async promoteToScheduled(req, res) {
    try {
      const { rideId } = req.params;
      const { scheduledFor } = req.body;

      if (!scheduledFor) {
        return sendError(res, 400, "Horario de agendamento e obrigatorio.");
      }

      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada.");
      }

      // Valida se a corrida pode ser promovida (so se nao tiver motorista aceito ainda)
      const allowedStatuses = ["requesting", "searching_driver", "offers_received", "payment_pending", "no_drivers_available"];
      if (!allowedStatuses.includes(ride.status)) {
        return sendError(res, 400, "Nao e possivel agendar uma corrida ja aceita ou em andamento.");
      }

      ride.status = "scheduled";
      ride.scheduledFor = new Date(scheduledFor);
      
      // Limpa ofertas ativas e limpa motoristas que recusaram para que o agendamento fique limpo
      ride.rejectedBy = [];
      if (ride.negotiation) {
        ride.negotiation.offers = [];
        ride.negotiation.finalAgreedPrice = null;
      }

      await ride.save();

      // Envia atualizacoes via websocket
      const io = req.app.get("io");
      if (io) {
        io.emit("ride-status-changed", { rideId: String(ride._id), status: "scheduled" });
        io.emit("ride-offers-updated", { rideId: String(ride._id) });
      }

      return res.json({
        success: true,
        message: "Corrida promovida para agendada com sucesso.",
        ride
      });
    } catch (error) {
      console.error("Erro ao promover corrida para agendada:", error);
      return sendError(res, 500, "Erro ao promover corrida para agendada", { details: error.message });
    }
  }

  async getRideNfse(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId)
        .populate("clientId", "name cpf email phone")
        .populate("driverId", "name cpf email phone");

      if (!ride) {
        return sendError(res, 404, "Corrida não encontrada.");
      }

      // NFS-e simula apenas para corridas completadas
      if (ride.status !== "completed") {
        return sendError(res, 400, "NFS-e simulada só pode ser gerada para corridas concluídas.");
      }

      const client = ride.clientId || {};
      const driver = ride.driverId || {};

      const formatCPF = (raw) => {
        const cpf = String(raw || "").replace(/\D/g, "");
        if (cpf.length !== 11) return "Não informado";
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      };

      const completedDate = ride.completedAt || ride.updatedAt || new Date();
      const formattedDate = new Date(completedDate).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });

      // Cálculo de ISS municipal simulado
      const total = Number(ride.pricing?.total || 0);
      const issRate = 5; // 5%
      const issValue = Math.round(total * (issRate / 100) * 100) / 100;
      
      // Gera número e código verificador simulados a partir do ID
      const hexId = String(ride._id).slice(-8).toUpperCase();
      const nfseNumber = `${new Date(completedDate).getFullYear()}${String(new Date(completedDate).getMonth() + 1).padStart(2, "0")}${hexId}`;
      const verificationCode = `VERI-${String(ride._id).slice(-4).toUpperCase()}-${String(ride.clientId?._id || "0").slice(-4).toUpperCase()}`;

      const nfse = {
        number: nfseNumber,
        verificationCode,
        issuedAt: formattedDate,
        status: "Emitida e Homologada",
        serviceDescription: `Serviço de transporte privado individual de passageiros prestado no trajeto de "${ride.pickup.address}" até "${ride.dropoff.address}".\nDistância total: ${ride.distance?.text || "N/A"}.\nDuração total: ${ride.duration?.text || "N/A"}.\nModalidade: ${ride.vehicleType === "motorcycle" ? "Moto" : "Carro"}.`,
        provider: {
          name: driver.name || "Prestador Leva+",
          cpf: formatCPF(driver.cpf),
          phone: driver.phone || "Não informado",
          role: "Motorista Parceiro",
        },
        taker: {
          name: client.name || "Cliente Leva+",
          cpf: formatCPF(client.cpf),
          email: client.email || "Não informado",
        },
        financial: {
          totalValue: total,
          deductions: 0.00,
          calculationBase: total,
          issRate: issRate,
          issValue: issValue,
          netValue: Math.round((total - issValue) * 100) / 100,
        },
        intermediary: {
          name: "Leva+ Intermediação de Serviços Ltda.",
          cnpj: "42.189.444/0001-99",
          city: "São Paulo - SP",
        }
      };

      return res.json({
        success: true,
        nfse,
      });
    } catch (error) {
      console.error("Erro ao gerar NFS-e simulada:", error);
      return sendError(res, 500, "Erro ao gerar NFS-e simulada", { details: error.message });
    }
  }
}

function buildRideRequestPayload(ride, extras = {}) {
  const negotiation = ride.negotiation || {};
  const enabled = Boolean(negotiation.enabled);
  const client = ride.clientId || {};
  const pricingTotal = Number(negotiation.clientOffer ?? ride?.pricing?.total ?? 0) || 0;
  const estimatedPlatformFee =
    Number(ride?.pricing?.platformFee ?? ride?.pricing?.serviceFee ?? toMoney(pricingTotal * 0.2)) || 0;
  const requiredBalance = toMoney(pricingTotal * 0.2);
  const distanceToPickup = Number(extras.distanceToPickup || 0);
  // Fallback ETA (seconds) until pickup based on straight-line distance when router ETA is unavailable.
  const durationToPickupSecondsRaw =
    extras.durationToPickup != null
      ? Number(extras.durationToPickup)
      : distanceToPickup > 0
        ? Math.max(120, Math.round((distanceToPickup / 1000 / 30) * 3600))
        : 0;
  const durationToPickupSeconds = Number.isFinite(durationToPickupSecondsRaw)
    ? Math.max(0, Math.round(durationToPickupSecondsRaw))
    : 0;
  const durationToPickupText =
    durationToPickupSeconds > 0 ? `${Math.max(1, Math.round(durationToPickupSeconds / 60))} min` : null;

  return {
    rideId: ride._id,
    status: ride.status,
    pickup: ride.pickup,
    dropoff: ride.dropoff,
    pricing: ride.pricing,
    distance: ride.distance,
    duration: ride.duration,
    serviceType: ride.serviceType,
    vehicleType: ride.vehicleType,
    requestedAt: ride.requestedAt,
    isWaitingInQueue: ride.isWaitingInQueue || false,
    details: ride.details || {},
    scheduledFor: ride.scheduledFor || null,
    distanceToPickup,
    durationToPickup:
      durationToPickupSeconds > 0
        ? {
            value: durationToPickupSeconds,
            text: durationToPickupText,
          }
        : null,
    payment: ride.payment || { method: { type: "cash" } },
    financialRisk: {
      requiredBalance,
      estimatedPlatformFee,
    },
    negotiation: enabled
      ? {
          enabled: true,
          clientOffer: negotiation.clientOffer ?? null,
          suggestedMinPrice: negotiation.suggestedMinPrice ?? null,
          finalAgreedPrice: negotiation.finalAgreedPrice ?? null,
        }
      : { enabled: false },
    negotiationSelected: Boolean(extras.negotiationSelected),
    paymentPending: ride.status === "payment_pending",
    client: {
      name: client.name,
      phone: client.phone,
      profilePhoto: client.profilePhoto,
      rating: client.rating || 5.0,
      ridesCount: extras.clientRidesCount || 0,
    },
  };
}


/**
 * Checks if a time (HH:mm) is within a range (HH:mm..HH:mm).
 * Supports overnight ranges (e.g. 22:00 -> 06:00).
 */
function isTimeInRange(current, start, end) {
  try {
    if (!current || !start || !end) return false;

    const toMinutes = (hhmm) => {
      const [h, m] = String(hhmm)
        .split(":")
        .map((v) => parseInt(v, 10));
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    const c = toMinutes(current);
    const s = toMinutes(start);
    const e = toMinutes(end);

    if (c == null || s == null || e == null) return false;

    // normal range
    if (s <= e) return c >= s && c <= e;

    // overnight (e.g. 22:00-06:00)
    return c >= s || c <= e;
  } catch {
    return false;
  }
}

// attach extra handlers
ratingProofMixin.attach(RideController, { Ride, DriverLocation, User });

const instance = new RideController();
rideControllerInstance = instance;
module.exports = instance;
module.exports.moveToHistory = moveToHistory;
