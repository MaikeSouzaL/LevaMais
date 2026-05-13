const Ride = require("../models/Ride");
const DriverLocation = require("../models/DriverLocation");
const User = require("../models/User");
const PricingConfig = require("../models/PricingConfig");
const City = require("../models/City");
const ShiftOffer = require("../models/ShiftOffer");
const Promotion = require("../models/Promotion");

// mixins (rating + proofs)
const ratingProofMixin = require("./ride.ratingProof.mixin");
const mongoose = require("mongoose");
const NON_TERMINAL_STATUSES = [
  "requesting",
  "driver_assigned",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
];

function normalizePaymentMethod(rawMethod) {
  const value = String(rawMethod || "")
    .trim()
    .toLowerCase();

  if (!value) return null;

  if (["cash", "dinheiro"].includes(value)) return "cash";
  if (["pix"].includes(value)) return "pix";
  if (["wallet", "carteira"].includes(value)) return "wallet";
  if (["card", "credit_card", "debit_card", "credit", "debit"].includes(value)) {
    return "card";
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

const SCHEDULED_DISPATCH_TIMEOUTS = new Map();

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
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

function calculateSuggestedMinPrice(total) {
  const safeTotal = Math.max(0, Number(total || 0));
  return toMoney(safeTotal * 0.8);
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

      let searchRadius = 15000;
      try {
        if (ride.cityId) {
          const city = await City.findById(ride.cityId).select("searchRadius");
          if (city?.searchRadius) {
            searchRadius = city.searchRadius;
          }
        }
      } catch (cityErr) {
        console.error("Erro ao buscar raio de busca da cidade:", cityErr);
        searchRadius = 15000;
      }

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

      nearbyDrivers.forEach((driver) => {
        try {
          if (!driver || !driver.driverId) return;

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
            // 🔔 Light notification only (amber banner & bell)
            io.to(`driver-${driver.driverId}`).emit("waiting-queue-updated");
          } else {
            // 🚀 Standard pop-up card flow for active search
            io.to(`driver-${driver.driverId}`).emit(
              "new-ride-request",
              buildRideRequestPayload(ride, {
                distanceToPickup,
              }),
            );
          }
        } catch (driverEmitErr) {
          console.error(`Erro ao despachar requisicao para driver=${driver?.driverId}:`, driverEmitErr);
        }
      });

      // Enviar Notificação Push para motoristas em segundo plano ou fechados
      // 🔇 Silenciar Push para a Fila de Espera (apenas alerta leve interno na Tarja)
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
                    "🚀 Novo pedido disponível!",
                    `Nova solicitação de ${ride.serviceType === "delivery" ? "entrega" : "corrida"} por R$ ${Number(ride.pricing?.total || 0).toFixed(2).replace(".", ",")}`,
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
          console.error("Erro ao enviar notificações push em lote para motoristas:", pushErr);
        }
      }

      setTimeout(async () => {
        try {
          const updatedRide = await Ride.findById(ride._id);
          if (
            updatedRide &&
            ["requesting", "driver_assigned"].includes(updatedRide.status) &&
            !updatedRide.isWaitingInQueue
          ) {
            updatedRide.status = "cancelled_no_driver";
            updatedRide.cancelledAt = new Date();
            await updatedRide.save();

            const clientId = ride.clientId?._id || ride.clientId;
            if (clientId) {
              io.to(`client-${clientId}`).emit("ride-cancelled", {
                rideId: ride._id,
                reason: "no_driver_found",
              });
            }

            // 🚨 EXCLUSIVE FIX: Broadcast the timeout-cancellation to ALL nearby drivers who received the offer!
            if (Array.isArray(nearbyDrivers) && nearbyDrivers.length > 0) {
              nearbyDrivers.forEach((driver) => {
                if (driver && driver.driverId) {
                  io.to(`driver-${driver.driverId}`).emit("ride-cancelled", {
                    rideId: ride._id,
                    reason: "tempo_limite_esgotado",
                  });
                }
              });
            }
          }
        } catch (timeoutErr) {
          console.error("Erro no timeout de cancelamento por falta de motorista:", timeoutErr);
        }
      }, (ride.searchTimeoutSeconds || 60) * 1000);
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
          .populate("driverId", "name phone profilePhoto")
          .populate("purposeId");

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
  // Buscar corrida ativa do usuÃ¡rio autenticado
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
              .populate("driverId", "name phone profilePhoto")
              .populate("purposeId")
          : null;

        if (!ride) {
          ride = await Ride.findOne({
            driverId: userId,
            status: { $in: NON_TERMINAL_STATUSES },
          })
            .sort({ updatedAt: -1 })
            .populate("clientId", "name phone profilePhoto")
            .populate("driverId", "name phone profilePhoto")
            .populate("purposeId");

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

        // Se jÃ¡ finalizou/cancelou, considera sem corrida ativa
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

      // Cliente (opcional): pega a Ãºltima corrida nÃ£o finalizada
      if (userType === "client") {
        const ride = await Ride.findOne({
          clientId: userId,
          status: { $in: NON_TERMINAL_STATUSES },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto")
          .populate("purposeId");

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
        const clientStatuses = [...NON_TERMINAL_STATUSES, "scheduled"];
        const rides = await Ride.find({
          clientId: userId,
          status: { $in: clientStatuses },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto")
          .populate("purposeId");

        return res.json({ active: rides.length > 0, count: rides.length, rides });
      }

      if (userType === "driver") {
        const rides = await Ride.find({
          driverId: userId,
          status: { $in: statuses },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto")
          .populate("purposeId");

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

      const activeRide = await Ride.findOne({
        driverId,
        status: { $in: NON_TERMINAL_STATUSES },
      }).select("_id");
      if (activeRide?._id) {
        return res.json({ count: 0, requests: [] });
      }

      const now = new Date();
      const activeShift = await ShiftOffer.findOne({
        acceptedBy: driverId,
        status: "accepted",
        startAt: { $lte: now },
        endAt: { $gt: now },
      }).select("_id");
      if (activeShift?._id) {
        return res.json({ count: 0, requests: [] });
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
        return res.json({ count: 0, requests: [], waitingQueueCount });
      }

      const serviceTypes = Array.isArray(driverLocation.serviceTypes)
        ? driverLocation.serviceTypes
        : [];
      if (!serviceTypes.length) {
        const waitingQueueCount = 0;
        return res.json({ count: 0, requests: [], waitingQueueCount });
      }

      const requestedAfter = new Date(Date.now() - 2 * 60 * 1000);
      const rides = await Ride.find({
        status: { $in: ["requesting", "driver_assigned"] },
        vehicleType: driverLocation.vehicleType,
        serviceType: { $in: serviceTypes },
        $and: [
          {
            $or: [
              { status: "requesting", driverId: null },
              { status: "driver_assigned", driverId },
            ],
          },
           {
             $or: [
               // 🌍 Fila de Espera Pública: Fica permanentemente visível (mas respeitando rejeições)
               {
                 $and: [
                   { isWaitingInQueue: true },
                   { "rejectedBy.driverId": { $ne: driverId } },
                 ],
               },
               // 🚀 Oferta Direta em Tempo Real: Respeita o limite de 2min e esconde de quem já recusou
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

      const cityIds = [
        ...new Set(
          rides
            .map((ride) => ride.cityId?.toString())
            .filter(Boolean),
        ),
      ];
      const cities = cityIds.length
        ? await City.find({ _id: { $in: cityIds } }).select("_id searchRadius")
        : [];
      const radiusByCityId = new Map(
        cities.map((city) => [city._id.toString(), city.searchRadius || 15000]),
      );

      const requests = rides
        .map((ride) => {
          const pickup = ride.pickup;
          if (!pickup?.latitude || !pickup?.longitude) return null;

          const maxDistance =
            radiusByCityId.get(ride.cityId?.toString()) || 15000;
          const distanceToPickup = driverLocation.distanceTo(
            pickup.latitude,
            pickup.longitude,
          );

          if (distanceToPickup > maxDistance) return null;
          return buildRideRequestPayload(ride, { distanceToPickup });
        })
        .filter(Boolean)
        .slice(0, 10);

      console.log(
        `[rides/available-requests] driver=${driverId} requests=${requests.length}`,
      );

      // ✅ Derive waitingQueueCount from already-filtered requests so the badge
      // always matches exactly what the driver sees in the queue tab.
      const waitingQueueCount = requests.filter((r) => r.isWaitingInQueue === true).length;

      return res.json({ count: requests.length, requests, waitingQueueCount });
    } catch (error) {
      console.error("Erro ao buscar solicitacoes disponiveis:", error);
      return sendError(res, 500, "Erro ao buscar solicitacoes disponiveis", {
        details: error.message,
      });
    }
  }

  // Criar uma nova solicitaÃ§Ã£o de corrida
  async create(req, res) {
    try {
      const {
        serviceType,
        vehicleType,
        purposeId,
        cityId,
        pickup,
        dropoff,
        pricing,
        distance,
        duration,
        details,
        payment,
        scheduledFor,
        negotiation,
        promotionCode,
      } = req.body;

      const clientId = req.user.id; // Do middleware de autenticaÃ§Ã£o

      // ValidaÃ§Ãµes bÃ¡sicas
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
          const Purpose = require("../models/Purpose");
          const purpose = await Purpose.findOne({
            id: String(resolvedPurposeId),
            vehicleType: vehicleType,
          }).select("_id");
          resolvedPurposeId = purpose?._id;
        }
      } catch (e) {
        console.log("Aviso: nÃ£o foi possÃ­vel resolver purposeId", purposeId);
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

      // Criar a corrida
      const PlatformConfig = require("../models/PlatformConfig");
      const City = require("../models/City");

      // 1. Busca configuraÃ§Ãµes globais (App Fee %)
      let config = await PlatformConfig.findOne().sort({ createdAt: -1 });
      if (!config) {
        // Cria default se nÃ£o existir
        config = await PlatformConfig.create({ appFeePercentage: 15 });
      }
      const appFeePercentage = config.appFeePercentage || 15;

      const safePricing = {
        ...(pricing || {}),
      };

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

      const suggestedMinPrice = calculateSuggestedMinPrice(finalTotal);
      const requestedOffer = Number(negotiation?.clientOffer);
      const wantsNegotiation = Boolean(negotiation?.enabled) && Number.isFinite(requestedOffer);
      if (wantsNegotiation && requestedOffer <= 0) {
        return sendError(res, 400, "Oferta do cliente invalida");
      }

      // 2. Calcula Taxa da Plataforma (Valor Bruto que sai do motorista)
      const total = finalTotal;
      const platformFee = total * (appFeePercentage / 100);
      const driverValue = total - platformFee;

      // 3. Verifica Split com Representante (Se houver)
      let platformShare = platformFee; // PadrÃ£o: 100% da taxa vai pra plataforma
      let representativeShare = 0;
      let representativeId = null;

      if (cityId) {
        const city = await City.findById(cityId);
        if (city && city.representativeId) {
          representativeId = city.representativeId;
          // PadrÃ£o 50/50 ou override da cidade
          const repPct = city.revenueSharing?.representativePercentage || 50;
          representativeShare = platformFee * (repPct / 100);
          platformShare = platformFee - representativeShare;
        }
      }

      // Adiciona calculos ao objeto de pricing
      safePricing.platformFee = platformFee;
      safePricing.driverValue = driverValue;

      // Salva detalhe do split no objeto da corrida (para relatÃ³rios futuros)
      const splitDetails = {
        platformConfigUsed: appFeePercentage,
        totalAppFee: platformFee,
        platformShare: parseFloat(platformShare.toFixed(2)),
        representativeShare: parseFloat(representativeShare.toFixed(2)),
        representativeId: representativeId,
      };

      const ride = new Ride({
        clientId: req.user.id,
        serviceType,
        vehicleType,
        purposeId: resolvedPurposeId,
        pickup,
        dropoff,
        pricing: safePricing,
        splitDetails,
        distance,
        duration,
        details,
        searchTimeoutSeconds: config.rideSearchTimeoutSeconds || 60,
        status: isScheduledForFuture(scheduledDate) ? "scheduled" : "requesting",
        requestedAt: new Date(),
        scheduledFor: scheduledDate || undefined,
        negotiation: {
          enabled: wantsNegotiation,
          clientOffer: wantsNegotiation ? toMoney(requestedOffer) : null,
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
        ride.payment = {
          ...(ride.payment || {}),
          method: paymentMethod,
        };
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

      // Impedir aceitar se o motorista jÃ¡ estiver em corrida
      const driverLocation = await DriverLocation.findOne({ driverId });
      if (driverLocation?.currentRideId) {
        return sendError(res, 400, "Voce ja possui uma corrida ativa", {
          currentRideId: driverLocation.currentRideId,
        });
      }

      // 1) Tenta â€œtravarâ€ o motorista (evita ele aceitar duas corridas em paralelo)
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

      // 2) Aceite atÃ´mico da corrida (evita dois motoristas aceitarem ao mesmo tempo)
      const ride = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: { $in: ["requesting", "driver_assigned"] },
          "rejectedBy.driverId": { $ne: driverId },
          $or: [
            // ainda nÃ£o reservada
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
        // Libera o motorista caso a corrida nÃ£o esteja mais disponÃ­vel
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

      // Popular dados
      await ride.populate("driverId", "name phone profilePhoto");
      await ride.populate("clientId", "name phone profilePhoto");

      // Notificar cliente via WebSocket
      const io = req.app.get("io");
      if (io) {
        // Obter dados do motorista
        const driverLocation = await DriverLocation.findOne({ driverId });

        io.to(`client-${ride.clientId._id}`).emit("driver-found", {
          rideId: ride._id,
          driver: {
            id: ride.driverId._id,
            name: ride.driverId.name,
            phone: ride.driverId.phone,
            profilePhoto: ride.driverId.profilePhoto,
            rating: 4.8, // TODO: calcular rating real
            vehicle: driverLocation?.vehicle || {},
          },
          eta: ride.duration,
        });

        // Notificar outros motoristas que a corrida foi aceita
        io.emit("ride-taken", { rideId: ride._id });
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

      // Adicionar à lista de rejeitados se não estiver lá
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

      // Se a corrida estava reservada para este motorista, libera e tenta o próximo
      const isAssignedToMe =
        ride.status === "driver_assigned" &&
        ride.driverId &&
        ride.driverId.toString() === driverId.toString();

      if (isAssignedToMe) {
        ride.status = "requesting";
        ride.driverId = null;
      }

      await ride.save();

      // Tenta oferecer para o próximo motorista (Ignorado se já estiver na fila de espera pública!)
      const io = req.app.get("io");
      if (io && ["requesting", "driver_assigned"].includes(ride.status) && !ride.isWaitingInQueue) {
        const searchRadius = 15000; // Buscar motoristas num raio de 15km
        const nearbyDrivers = await DriverLocation.findNearby(
          ride.pickup.latitude,
          ride.pickup.longitude,
          searchRadius,
          ride.vehicleType,
          100, // tenta buscar até 100 próximos
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

          io.to(`driver-${next.driverId}`).emit(
            "new-ride-request",
            buildRideRequestPayload(ride, { distanceToPickup: 0 })
          );
        } else {
          // 🚨 CRITICAL UPGRADE: If ALL nearby drivers rejected the offer, trigger terminal state instantly!
          // This now applies whether in Queue OR in initial Broadcast mode!
          ride.status = "cancelled_no_driver";
          await ride.save();

          // Re-populate client payload to guarantee valid connection
          if (!ride.populated("clientId")) {
             await ride.populate("clientId");
          }

          const resolvedClientId = ride.clientId?._id || ride.clientId;
          if (resolvedClientId) {
            io.to(`client-${resolvedClientId}`).emit("ride-cancelled", {
              rideId: ride._id,
              reason: "todos_recusaram",
              message: "Todos os motoristas disponíveis no momento recusaram a solicitação. Sugerimos aumentar a oferta para atrair interessados.",
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

      const responseOffers = [...offers].sort(
        (a, b) => Number(a.amount || 0) - Number(b.amount || 0),
      );

      return res.json({
        success: true,
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

      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem responder ofertas");
      }

      const ride = await Ride.findById(rideId).populate("clientId", "name");
      if (!ride) return sendError(res, 404, "Corrida nao encontrada");

      if (!["requesting", "driver_assigned"].includes(String(ride.status || ""))) {
        return sendError(res, 400, "Corrida nao esta aberta para negociacao");
      }

      if (!ride.negotiation?.enabled) {
        return sendError(res, 400, "Negociacao nao habilitada para esta corrida");
      }

      const action = String(req.body?.action || "").toLowerCase();
      const message = String(req.body?.message || "").slice(0, 300);
      const now = new Date();
      const clientOffer = Number(ride.negotiation.clientOffer || ride.pricing.total || 0);
      const providedAmount = Number(req.body?.amount);

      let status = "countered";
      let amount = clientOffer;

      if (action === "accept") {
        status = "accepted";
        amount = clientOffer;
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

      ride.negotiation.offers = Array.isArray(ride.negotiation.offers)
        ? ride.negotiation.offers
        : [];

      const existingIndex = ride.negotiation.offers.findIndex(
        (item) => String(item.driverId) === driverId,
      );

      const payload = {
        driverId,
        amount,
        status,
        message,
        createdAt:
          existingIndex >= 0
            ? ride.negotiation.offers[existingIndex].createdAt || now
            : now,
        updatedAt: now,
      };

      if (existingIndex >= 0) {
        ride.negotiation.offers[existingIndex] = payload;
      } else {
        ride.negotiation.offers.push(payload);
      }

      await ride.save();
      await ride.populate("negotiation.offers.driverId", "name profilePhoto");

      const io = req.app.get("io");
      if (io) {
        io.to(`client-${ride.clientId._id || ride.clientId}`).emit("ride-offers-updated", {
          rideId: ride._id,
        });
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
      if (!["requesting", "driver_assigned"].includes(String(ride.status || ""))) {
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

      ride.negotiation.finalAgreedPrice = finalPrice;
      ride.negotiation.selectedDriverId = selectedDriverId;
      ride.negotiation.selectedAt = new Date();
      ride.driverId = selectedDriverId;
      ride.status = "driver_assigned";
      ride.requestedAt = new Date();

      await ride.save();
      await ride.populate("driverId", "name phone profilePhoto");
      await ride.populate("clientId");

      const io = req.app.get("io");
      if (io) {
        io.to(`driver-${selectedDriverId}`).emit(
          "new-ride-request",
          buildRideRequestPayload(ride, {
            negotiationSelected: true,
          }),
        );
        io.to(`client-${ride.clientId._id || ride.clientId}`).emit("ride-offer-selected", {
          rideId: ride._id,
          driverId: selectedDriverId,
          finalPrice,
        });
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

      if (!ride.canBeCancelled()) {
        return sendError(res, 400, "Corrida nao pode ser cancelada neste momento");
      }

      // Verificar quem estÃ¡ cancelando
      const isClient = ride.clientId?.toString() === userIdStr;
      const isDriver = ride.driverId?.toString() === userIdStr;

      if (!isClient && !isDriver) {
        return sendError(res, 403, "Voce nao tem permissao para cancelar esta corrida");
      }

      // Calcular taxa de cancelamento
      const cancellationFee = ride.calculateCancellationFee();

      ride.status = isClient ? "cancelled_by_client" : "cancelled_by_driver";
      ride.cancelledAt = new Date();
      ride.cancellationFee = {
        amount: cancellationFee,
        reason,
      };

      await ride.save();

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
        const targetId = isClient ? ride.driverId : ride.clientId;
        const targetType = isClient ? "driver" : "client";

        if (targetId) {
          io.to(`${targetType}-${targetId}`).emit("ride-cancelled", {
            rideId: ride._id,
            cancelledBy: isClient ? "client" : "driver",
            reason,
            cancellationFee,
          });
        } else if (isClient && !ride.driverId) {
          // Broadcast cancel message to ALL notified drivers in the region
          try {
             let searchRadius = 15000;
             if (ride.cityId) {
               const city = await City.findById(ride.cityId).select("searchRadius");
               if (city?.searchRadius) {
                 searchRadius = city.searchRadius;
               }
             }
             const nearbyDrivers = await DriverLocation.findNearby(
                ride.pickup.latitude,
                ride.pickup.longitude,
                searchRadius,
                ride.vehicleType,
                50,
                ride.serviceType
             );
             nearbyDrivers.forEach(drv => {
                if (!drv.driverId) return;
                io.to(`driver-${drv.driverId}`).emit("ride-cancelled", {
                   rideId: ride._id,
                   cancelledBy: "client",
                   reason: "cancelamento_pre_aceite"
                });
             });
          } catch (broadcastErr) {
             console.error("Erro ao disparar broadcast de cancelamento:", broadcastErr);
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

  async retryRide(req, res) {
    try {
      const { rideId } = req.params;
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return sendError(res, 404, "Corrida não encontrada");
      }

      // 🔄 Reiniciar ciclo de busca dinâmico
      ride.status = "requesting";
      ride.requestedAt = new Date();
      ride.isWaitingInQueue = false;
      ride.cancelledAt = undefined;
      // Limpa drivers anteriores recusados ou aceites perdidos se necessário
      ride.driverId = undefined; 
      
      await ride.save();

      // 👤 Popular dados necessários para o payload do despacho
      await ride.populate("clientId", "name phone profilePhoto");

      const io = req.app.get("io");
      if (io) {
        // 🚀 Disparar o Dispatcher central novamente para notificar os motoristas
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

        // Despacha e envia notificações push para os motoristas próximos
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

  // Atualizar status da corrida
  async updateStatus(req, res) {
    try {
      const { rideId } = req.params;
      const { status } = req.body;
      const driverId = req.user.id;
      const driverIdStr = String(driverId);
      const nextStatus = String(status || "").trim();

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      if (ride.driverId?.toString() !== driverIdStr) {
        return sendError(res, 403, "Apenas o motorista pode atualizar o status");
      }

      const allowedStatuses = ["driver_arriving", "arrived", "in_progress", "completed"];
      if (!allowedStatuses.includes(nextStatus)) {
        return sendError(res, 400, "Status invalido para atualizacao do motorista", { allowed: allowedStatuses });
      }

      const allowedTransitions = {
        accepted: ["driver_arriving", "arrived"],
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

      if (ride.serviceType === "delivery") {
        if (nextStatus === "in_progress" && !ride.proofs?.pickupPhoto) {
          return sendError(res, 400, "Envie a foto da coleta antes de iniciar a entrega");
        }
        if (nextStatus === "completed" && !ride.proofs?.deliveryPhoto) {
          return sendError(res, 400, "Envie a foto da entrega antes de finalizar");
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
          const rideValue = ride.pricing?.driverValue || ride.pricing?.total || 0;
          const deductionPercentage = 0.2;
          const deductAmount = toMoney(rideValue * deductionPercentage);

          if (deductAmount > 0) {
            const driver = await User.findById(driverId);
            if (driver && driver.userType === "driver") {
              if (!driver.driverBalance) {
                driver.driverBalance = {
                  balance: 0,
                  totalDeposits: 0,
                  totalDeductions: 0,
                  transactions: [],
                  selectedCategories: [],
                  selectedVehicles: [],
                };
              }

              driver.driverBalance.balance = toMoney(
                Math.max(0, driver.driverBalance.balance - deductAmount)
              );
              driver.driverBalance.totalDeductions = toMoney(
                (driver.driverBalance.totalDeductions || 0) + deductAmount
              );

              driver.driverBalance.transactions.push({
                type: "deduction",
                amount: deductAmount,
                description: `Dedução de 20% da corrida ${ride._id}`,
                rideId: ride._id,
                status: "completed",
                createdAt: new Date(),
              });

              await driver.save();

              const io = req.app.get("io");
              if (io) {
                io.to(`driver-${driverId}`).emit("balance_updated", {
                  balance: driver.driverBalance.balance,
                  deducted: deductAmount,
                  rideId: ride._id,
                });
              }
            }
          }
        } catch (deductionErr) {
          console.error("Erro ao descontar saldo do motorista:", deductionErr);
        }
      }

      await ride.save();

      const io = req.app.get("io");
      if (io) {
        io.to(`client-${ride.clientId}`).emit("ride-status-updated", {
          rideId: ride._id,
          status: ride.status,
          timestamp: new Date().toISOString(),
        });
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

      const ride = await Ride.findById(rideId)
        .populate("clientId", "name phone profilePhoto")
        .populate("driverId", "name phone profilePhoto")
        .populate("purposeId");

      if (!ride) {
        return sendError(res, 404, "Corrida nao encontrada");
      }

      // Verificar permissao
      const isClient = ride.clientId?._id?.toString() === userIdStr;
      const isDriver = ride.driverId?._id?.toString() === userIdStr;

      if (!isClient && !isDriver) {
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

  // HistÃ³rico de corridas
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20, page = 1 } = req.query;

      // Force cast to ObjectId for $or queries to ensure safety
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const query = {
        $or: [{ clientId: userObjectId }, { driverId: userObjectId }],
      };

      if (status) {
        query.status = status;
      }

      const rides = await Ride.find(query)
        .populate("clientId", "name phone profilePhoto")
        .populate("driverId", "name phone profilePhoto")
        .populate("purposeId")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Ride.countDocuments(query);

      res.json({
        rides,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar histÃ³rico:", error);
      return sendError(res, 500, "Erro ao buscar historico", { details: error.message });
    }
  }

  // EstatÃ­sticas do motorista (Ganhos de hoje, Meta)
  async getDriverStats(req, res) {
    try {
      const driverId = req.user.id;
      const { startOfDay, endOfDay } = require("date-fns");

      const now = new Date();
      // Considerando fuso horÃ¡rio local simples (ideal seria receber timezone do client)
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const stats = await Ride.aggregate([
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

      // Meta diÃ¡ria hardcoded por enquanto (gamification MVP)
      const dailyGoal = 10;

      // Simular um bÃ´nus de R$ 20 se atingir a meta
      const bonusAmount = result.ridesCount >= dailyGoal ? 20 : 0;

      // Valor final ja representa o liquido do motorista:
      // prioriza pricing.driverValue e usa fallback legado (80% de pricing.total).
      const driverShare = Number((result.totalEarnings || 0).toFixed(2));

      let rating = 5.0;
      let acceptanceRate = 100;
      let onlineTime = 0;

      try {
        // 1. Calcular Rating MÃ©dio das Corridas
        const ratingAgg = await Ride.aggregate([
          {
            $match: {
              driverId: new mongoose.Types.ObjectId(driverId),
              status: "completed",
              "rating.clientRating.stars": { $exists: true, $ne: null },
            },
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

        // 2. Calcular Taxa de AceitaÃ§Ã£o (Aceitas / Total Ofertadas)
        const acceptedCount = await Ride.countDocuments({
          driverId: new mongoose.Types.ObjectId(driverId),
        });
        const rejectedCount = await Ride.countDocuments({
          "rejectedBy.driverId": new mongoose.Types.ObjectId(driverId),
        });
        const totalOffers = acceptedCount + rejectedCount;
        if (totalOffers > 0) {
          acceptanceRate = Math.round((acceptedCount / totalOffers) * 100);
        }

        // 3. Obter Tempo Online Acumulado Real do Banco (com Interpolação em Tempo Real ao Segundo)
        const user = await User.findById(driverId).select("onlineStats");
        if (user && user.onlineStats) {
          const todayStr = new Date().toISOString().split("T")[0];
          if (user.onlineStats.activeDateStr === todayStr) {
            let baseTime = user.onlineStats.totalSecondsToday || 0;

            // 💡 MÁGICA DO TEMPO REAL: Se ele está online agora, soma os segundos exatos
            // decorridos desde a última gravação para bater 100% com o cronômetro do app!
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
        console.error("Erro ao computar mÃ©tricas adicionais do motorista:", innerErr);
      }

      res.json({
        earnings: driverShare,
        rides: result.ridesCount,
        goal: dailyGoal,
        bonus: bonusAmount,
        rating,
        acceptanceRate,
        onlineTime,
      });
    } catch (error) {
      console.error("Erro ao buscar estatÃ­sticas:", error);
      res.status(500).json({
        earnings: 0,
        rides: 0,
        goal: 10,
        bonus: 0,
      });
    }
  }

  // HistÃ³rico de ganhos (Ãºltimos 7 dias)
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

      const stats = await Ride.aggregate([
        {
          $match: {
            driverId: driverObjectId,
            status: "completed",
            completedAt: { $gte: startDate },
          },
        },
        {
          $project: {
            // Adjust timzone MVP Fix: UTC-3 hardcoded
            localDate: { $subtract: ["$completedAt", 1000 * 60 * 60 * 3] },
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
              $dateToString: { format: groupByFormat, date: "$localDate" },
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
            value: match ? match.total : 0, // Valor jÃ¡ Ã© liquido do motorista
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
            const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            label = days[current.getDay()];
          } else {
            label = `${current.getDate()}/${current.getMonth() + 1}`;
          }

          result.push({
            label: label,
            fullDate: dateKey,
            value: match ? match.total : 0, // Valor jÃ¡ Ã© liquido
            count: match ? match.count : 0,
          });

          current.setDate(current.getDate() + 1);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Erro ao buscar histÃ³rico de ganhos:", error);
      return sendError(res, 500, "Erro interno ao buscar dados");
    }
  }

  // Calcular preÃ§o (antes de criar a corrida)
  async calculatePrice(req, res) {
    try {
      const { pickup, dropoff, vehicleType, purposeId, cityId, serviceType = "ride" } = req.body;

      if (!pickup || !dropoff) {
        return sendError(res, 400, "Origem e destino sao obrigatorios");
      }

      // Validar se cityId foi enviado (agora Ã© obrigatÃ³rio para preÃ§o preciso)
      // Se o app antigo nÃ£o mandar, tentamos inferir (geo) ou usar regra global (se existir)
      // Por enquanto, vamos assumir que o app PRECISA mandar ou a gente geocodifica no back.
      // Como o usuÃ¡rio disse "pegamos a localizaÃ§Ã£o... buscamos configuraÃ§Ãµes da cidade",
      // o ideal seria o backend resolver a cidade via lat/long se o app nÃ£o mandar.
      // MVP: App manda ou Backend resolve. Vamos focar na lÃ³gica de preÃ§o primeiro.

      const mongoose = require("mongoose");
      const PricingRule = require("../models/PricingRule");
      const Purpose = require("../models/Purpose");

      // DistÃ¢ncia Haversine em metros
      // Pre-calculate explicit provided metrics or fallback to geometric Haversine
      let distanceInMeters = req.body.distance;
      let durationInSeconds = req.body.duration;

      if (typeof distanceInMeters !== "number") {
        distanceInMeters = haversineDistance(
          pickup.latitude,
          pickup.longitude,
          dropoff.latitude,
          dropoff.longitude,
        );
      }
      
      const distance = distanceInMeters;
      const distanceKm = distanceInMeters / 1000;
      
      if (typeof durationInSeconds !== "number") {
         // Fallback estimation: basic 35km/h average including lights + startup penalty
         durationInSeconds = (distanceKm / 35) * 3600 + 180;
      }

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
      // NOVA LÃ“GICA DE PRECIFICAÃ‡ÃƒO (Prioridade: Cidade/VeÃ­culo/ServiÃ§o)
      // ==============================================================================

      console.log("[calculatePrice] ParÃ¢metros recebidos:", {
        cityId,
        vehicleType,
        purposeId,
        purposeDocId: purposeDoc?._id,
        distanceKm,
      });

      let rule = null;

      if (cityId) {
        // 1. Tenta regra ESPECÃFICA: Cidade + VeÃ­culo + ServiÃ§o
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
            "[calculatePrice] Busca especÃ­fica (Cidade+VeÃ­culo+ServiÃ§o):",
            rule ? `Encontrada: ${rule.name}` : "NÃ£o encontrada ou zerada",
          );
        }

        // 2. Se nÃ£o achar, tenta regra BASE da Cidade: Cidade + VeÃ­culo (sem serviÃ§o)
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
            "[calculatePrice] Busca base (Cidade+VeÃ­culo):",
            rule ? `Encontrada: ${rule.name}` : "NÃ£o encontrada ou zerada",
          );
        }
      } else {
        console.log("[calculatePrice] âš ï¸ cityId NÃƒO foi enviado pelo cliente!");
      }

      // 3. Fallback (Opcional): Regra Global (sem cidade)
      // Se nÃ£o achou na cidade (ou cityId nÃ£o veio), tenta regra global
      if (!rule) {
        console.log(
          "[calculatePrice] Tentando fallback para regra global (sem cityId)...",
        );
        const globalFilter = {
          cityId: null,
          vehicleCategory: vehicleType,
          active: true,
        };

        // Global EspecÃ­fica
        if (purposeDoc?._id) {
          rule = await PricingRule.findOne({
            ...globalFilter,
            purposeId: purposeDoc._id,
          });
          if (rule && rule.pricing.minimumFee === 0 && rule.pricing.pricePerKm === 0) {
            rule = null;
          }
          console.log(
            "[calculatePrice] Busca global especÃ­fica:",
            rule ? `Encontrada: ${rule.name}` : "NÃ£o encontrada ou zerada",
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
            rule ? `Encontrada: ${rule.name}` : "NÃ£o encontrada ou zerada",
          );
        }
      }

      // 4. Ãšltimo Recurso: ConfiguraÃ§Ã£o Global Aggregada (PricingConfig)
      if (!rule) {
        console.log("[calculatePrice] ðŸŒ Tentando ULTIMATO fallback: PricingConfig...");
        const globalConfig = await PricingConfig.findOne().sort({ updatedAt: -1 });

        if (globalConfig) {
          const vPricing = globalConfig.vehiclePricing?.find(p => p.vehicleType === vehicleType && p.enabled);

          if (vPricing && (vPricing.minimumFee > 0 || vPricing.pricePerKm > 0)) {
            console.log("[calculatePrice] âœ… Usando PricingConfig para veÃ­culo:", vehicleType);
            rule = {
              name: `GLOBAL_CONFIG_${vehicleType.toUpperCase()}`,
              pricing: {
                basePrice: vPricing.basePrice || 0,
                pricePerKm: vPricing.pricePerKm,
                pricePerMinute: vPricing.pricePerMinute || 0,
                minimumKm: vPricing.minimumKm,
                minimumFee: vPricing.minimumFee
              }
            };
            if (purposeDoc) {
              const pPricing = globalConfig.purposePricing?.find(p =>
                p.purposeId?.toString() === purposeDoc._id.toString() && p.enabled
              );
              if (pPricing) {
                if (pPricing.additionalPercentage > 0) {
                  rule.pricing.minimumFee *= (1 + pPricing.additionalPercentage / 100);
                  rule.pricing.pricePerKm *= (1 + pPricing.additionalPercentage / 100);
                }
                if (pPricing.additionalFixed > 0) {
                  rule.pricing.minimumFee += pPricing.additionalFixed;
                }
              }
            }
          }
        }
      }

      if (!rule) {
        if (serviceType === "delivery") {
          console.log("[calculatePrice] ⚠️ Regra de Banco não encontrada para logística. Ativando fallback AUTÓNOMO da Smart Engine.");
          // Inicializa rule fake para não quebrar o restante do código, permitindo fluxo seguir para injeção smart
          rule = {
            name: "SMART_ENGINE_AUTONOMOUS_DEFAULTS",
            pricing: { minimumKm: 0, minimumFee: 0, pricePerKm: 0, basePrice: 0 }
          };
        } else {
          console.log(
            "[calculatePrice] ❌ ERRO: Nenhuma regra encontrada!",
            {
              cityId,
              vehicleType,
              purposeId,
            },
          );
          return res.status(400).json({
            error:
              "Serviço não disponível ou sem preço configurado nesta região.",
            details: "Nenhuma regra de preço encontrada (PricingRule).",
          });
        }
      }

      console.log("[calculatePrice] âœ… Regra encontrada:", {
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
      const basePrice = Number(rule.pricing.basePrice || 0); // Se existir campo basePrice separado

      // CÃ¡lculo
      // Regra comum: (Base) + (Km Excedente * PreÃ§oKm)
      // Mas a regra do usuÃ¡rio foi: "KM mÃ­nimo que irÃ¡ se basear na taxa mÃ­nima"
      // InterpretaÃ§Ã£o: AtÃ© X km, paga Y. Acima disso, paga Y + (Km - X)*Z.

      let finalPrice = 0;
      let breakdown = {};

      if (distanceKm <= minimumKm) {
        finalPrice = minimumFee;
        breakdown = { method: "minimum_fee", minimumFee, distanceKm };
        console.log("[calculatePrice] ðŸ’° CÃ¡lculo (Taxa MÃ­nima):", {
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
        console.log("[calculatePrice] ðŸ’° CÃ¡lculo (DistÃ¢ncia):", {
          distanceKm,
          minimumKm,
          exceedKm,
          pricePerKm,
          minimumFee,
          distancePrice,
          finalPrice: `R$ ${finalPrice.toFixed(2)}`,
        });
      }

      // Ajuste de duraÃ§Ã£o (opcional, se configurado)
      // if (rule.pricing.pricePerMinute) ...

      const durationMinutes = Math.max(1, Math.ceil(durationInSeconds / 60)); // Uses injected time scalar

    const PlatformConfig = require("../models/PlatformConfig");
    let platformConfig = await PlatformConfig.findOne().sort({ createdAt: -1 });
    const feePercentage = platformConfig ? (platformConfig.appFeePercentage || 0) : 0;

    const baseRidePrice = parseFloat(minimumFee.toFixed(2));
    const distanceExtraPrice = parseFloat((finalPrice - minimumFee).toFixed(2));
    
    // Arredondamento para nÃºmeros "limpos" (mÃºltiplos de 0.10)
    const rawTotal = finalPrice + (finalPrice * (feePercentage / 100));
    const finalTotal = Math.round(rawTotal * 10) / 10;
    
    // Ajusta a taxa de serviÃ§o para que o total bata exatamente (Total - Base - DistÃ¢ncia)
    // Ajusta a taxa de serviço para que o total bata exatamente (Total - Base - Distância)
    const adjustedServiceFee = parseFloat((finalTotal - baseRidePrice - distanceExtraPrice).toFixed(2));

    // ==============================================================================
    // SMART LOGISTICS ENGINE INJECTION ⚡
    // ==============================================================================
    const { 
      deliveryType, 
      cargoSize, 
      priority, 
      needsHelper
    } = req.body;

    if (serviceType === "delivery" || deliveryType || cargoSize) {
      const PricingEngine = require("../services/pricing-engine");
      
      const smartCalculation = PricingEngine.calculate({
        basePriceRule: baseRidePrice > 0 ? baseRidePrice : 5.00,
        pricePerKmRule: pricePerKm > 0 ? pricePerKm : 1.50,
        distanceKm,
        vehicleType,
        deliveryType,
        cargoSize,
        priority: Number(priority || 0),
        needsHelper: Boolean(needsHelper),
        demandLevel: "medium"
      });

      console.log(`[calculatePrice] ✅ Preço FINAL Smart Engine: R$ ${smartCalculation.suggestedPrice}`);

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
          value: Math.round(distance * 1000) / 1000,
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
          value: Math.round(distance * 1000) / 1000,
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
      console.error("Erro ao calcular preÃ§o:", error);
      return sendError(res, 500, "Erro ao calcular preco", { details: error?.message, stack: process.env.NODE_ENV === "production" ? undefined : error?.stack });
    }
  }

  // Buscar motoristas prÃ³ximos (para exibir no mapa)
  async getNearbyDrivers(req, res) {
    try {
      const { latitude, longitude, radius, vehicleType, limit, cityId } = req.query;

      if (!latitude || !longitude) {
        return res
          .status(400)
          .json({ error: "Latitude e Longitude sÃ£o obrigatÃ³rios" });
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
        // Usa fallback se nÃ£o conseguir buscar a cidade
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
      console.error("Erro ao buscar motoristas prÃ³ximos:", error);
      return sendError(res, 500, "Erro interno", { details: error.message });
    }
  }

  async getAvailableScheduledRides(req, res) {
    try {
      const rides = await Ride.find({
        status: "scheduled",
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

      const ride = await Ride.findOneAndUpdate(
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
      ).populate("clientId", "name phone profilePhoto rating");

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
      
      const io = req.app.get("socketio");

      const ride = await Ride.findById(rideId).populate("clientId");
      if (!ride) {
        return sendError(res, 404, "Corrida não encontrada.");
      }

      // Valida se ainda está em negociação e permite aumento
      if (!ride.negotiation || !ride.negotiation.enabled || ["accepted", "driver_arriving", "arrived", "in_progress", "completed", "cancelled"].includes(ride.status)) {
        return sendError(res, 400, "Não é possível alterar a oferta desta corrida agora.");
      }

      const currentOffer = Number(ride.negotiation.clientOffer || ride.pricing.total || 0);
      const newOffer = toMoney(currentOffer + Number(incrementAmount || 2));

      ride.negotiation.clientOffer = newOffer;
      ride.pricing.total = newOffer;
      
      await ride.save();

      // Disparos em tempo real via sockets e push! ✨🏎️
      if (io) {
        io.to(`ride_${rideId}`).emit("ride-status-updated", ride);
        
        const formattedVal = `R$ ${Number(newOffer).toFixed(2).replace(".", ",")}`;
        
        // Canal global de alerta de aumento! 🔔
        io.emit("queue-ride-offer-increased", {
          rideId: ride._id,
          newOffer: newOffer,
          message: `🚀 OFERTA AUMENTADA! Um pedido subiu a oferta para ${formattedVal}!`
        });
        
        // Re-despacha com alta prioridade para motoristas no raio!
        await this.dispatchRideToNearbyDrivers(ride, io);
      }

      return res.json({ 
        success: true, 
        newOffer, 
        message: "Oferta aumentada com sucesso." 
      });

    } catch (error) {
      console.error("Erro em increaseOffer:", error);
      return sendError(res, 500, "Erro interno ao aumentar oferta", { details: error.message });
    }
  }
}

function buildRideRequestPayload(ride, extras = {}) {
  const negotiation = ride.negotiation || {};
  const enabled = Boolean(negotiation.enabled);
  const client = ride.clientId || {};
  return {
    rideId: ride._id,
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
    distanceToPickup: extras.distanceToPickup,
    payment: ride.payment || { method: { type: "cash" } },
    negotiation: enabled
      ? {
          enabled: true,
          clientOffer: negotiation.clientOffer ?? null,
          suggestedMinPrice: negotiation.suggestedMinPrice ?? null,
          finalAgreedPrice: negotiation.finalAgreedPrice ?? null,
        }
      : { enabled: false },
    negotiationSelected: Boolean(extras.negotiationSelected),
    client: {
      name: client.name,
      phone: client.phone,
      profilePhoto: client.profilePhoto,
      rating: client.rating || 5.0,
    },
  };
}
// FunÃ§Ã£o auxiliar para calcular distÃ¢ncia (Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
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
ratingProofMixin.attach(RideController, { Ride, DriverLocation });

module.exports = new RideController();


