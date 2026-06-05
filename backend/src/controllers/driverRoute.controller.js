const mongoose = require("mongoose");
const DriverRoute = require("../models/DriverRoute");
const RouteReservation = require("../models/RouteReservation");
const { computeReservationPricing } = require("../services/routePricing.service");
const walletEscrow = require("../services/walletEscrow.service");

// Rotas planejadas / maloteiro (Fase D7–D9).
// Motorista publica/edita/executa rotas; cliente descobre e reserva espaço.
// O pagamento usa o escrow LevaPay (hold na reserva, release na entrega).

const VEHICLE_TYPES = new Set(["motorcycle", "car", "van", "truck"]);
const ITEM_SIZES = new Set(["small", "medium", "large"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, max) {
  const t = String(value || "").trim();
  return t ? t.slice(0, max) : "";
}

function toGeoPoint(input = {}) {
  const point = {
    cityId: mongoose.isValidObjectId(input.cityId) ? input.cityId : null,
    label: normalizeText(input.label, 120),
  };
  const lng = Number(input?.location?.coordinates?.[0] ?? input.longitude);
  const lat = Number(input?.location?.coordinates?.[1] ?? input.latitude);
  if (Number.isFinite(lng) && Number.isFinite(lat)) {
    point.location = { type: "Point", coordinates: [lng, lat] };
  }
  return point;
}

function isFuture(date) {
  const d = new Date(date);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
}

// Alerta "rota útil": notifica clientes nas cidades de origem/destino/waypoints (best-effort).
async function notifyClientsAboutRoute(route) {
  try {
    const User = mongoose.model("User");
    const push = require("../services/push-notification.service");
    const labels = [route.origin?.label, route.destination?.label, ...((route.waypoints || []).map((w) => w.label))]
      .map((l) => String(l || "").trim())
      .filter(Boolean);
    if (!labels.length) return;

    const regexes = labels.map((l) => new RegExp("^" + l.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i"));
    const clients = await User.find({
      userType: "client",
      isActive: true,
      expoPushToken: { $exists: true, $nin: [null, ""] },
      city: { $in: regexes },
    })
      .select("_id name expoPushToken")
      .limit(80);

    const title = "Nova rota disponível 📦";
    const body = `Motorista saindo de ${route.origin?.label} para ${route.destination?.label}. Aproveite para enviar uma encomenda.`;
    await Promise.all(
      clients.map((c) =>
        push.sendPushToUser(c, title, body, { type: "route_published", routeId: String(route._id) }).catch(() => {}),
      ),
    );
  } catch (e) {
    console.error("notifyClientsAboutRoute:", e.message);
  }
}

// ---------------------------------------------------------------------------
// MOTORISTA — publicação e gestão de rotas
// ---------------------------------------------------------------------------

async function publishRoute(req, res) {
  try {
    const { vehicleType, origin, destination, waypoints, departAt, arriveEstimateAt, capacity, pricing } = req.body || {};

    if (!VEHICLE_TYPES.has(String(vehicleType))) return sendError(res, 400, "Tipo de veiculo invalido");
    if (!isFuture(departAt)) return sendError(res, 400, "A rota nao pode partir no passado");

    const originPoint = toGeoPoint(origin);
    const destPoint = toGeoPoint(destination);
    if (!originPoint.label && !originPoint.cityId) return sendError(res, 400, "Origem e obrigatoria");
    if (!destPoint.label && !destPoint.cityId) return sendError(res, 400, "Destino e obrigatorio");

    const route = await DriverRoute.create({
      driverId: req.user.id,
      vehicleType,
      origin: originPoint,
      destination: destPoint,
      waypoints: Array.isArray(waypoints) ? waypoints.slice(0, 10).map(toGeoPoint) : [],
      departAt: new Date(departAt),
      arriveEstimateAt: arriveEstimateAt ? new Date(arriveEstimateAt) : null,
      capacity: {
        maxItems: Math.max(1, Number(capacity?.maxItems) || 10),
        maxWeightKg: Math.max(0, Number(capacity?.maxWeightKg) || 50),
        maxVolumeL: Math.max(0, Number(capacity?.maxVolumeL) || 100),
        acceptedItemTypes: Array.isArray(capacity?.acceptedItemTypes) ? capacity.acceptedItemTypes : [],
      },
      pricing: {
        basePrice: Math.max(0, Number(pricing?.basePrice) || 0),
        pricePerKg: Math.max(0, Number(pricing?.pricePerKg) || 0),
        sizeMultipliers: {
          small: Number(pricing?.sizeMultipliers?.small) || 1,
          medium: Number(pricing?.sizeMultipliers?.medium) || 1.2,
          large: Number(pricing?.sizeMultipliers?.large) || 1.5,
        },
      },
      status: "published",
      statusHistory: [{ status: "published", at: new Date(), note: "Rota publicada" }],
    });

    notifyClientsAboutRoute(route).catch(() => {}); // fire-and-forget

    return res.status(201).json({ success: true, data: route, route });
  } catch (error) {
    console.error("Erro ao publicar rota:", error);
    return sendError(res, 500, "Erro ao publicar rota", { details: error.message });
  }
}

async function listMyRoutes(req, res) {
  try {
    const query = { driverId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);
    const routes = await DriverRoute.find(query).sort({ departAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: routes, routes });
  } catch (error) {
    console.error("Erro ao listar rotas:", error);
    return sendError(res, 500, "Erro ao listar rotas", { details: error.message });
  }
}

async function updateRoute(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "routeId invalido");
    const route = await DriverRoute.findOne({ _id: id, driverId: req.user.id });
    if (!route) return sendError(res, 404, "Rota nao encontrada");
    if (!["draft", "published"].includes(route.status)) {
      return sendError(res, 409, "Rota nao pode ser editada neste estado");
    }
    const accepted = await RouteReservation.countDocuments({ routeId: id, status: { $in: ["accepted", "awaiting_pickup", "in_transit"] } });
    if (accepted > 0) return sendError(res, 409, "Rota com reservas aceitas nao pode ser editada");

    const { departAt, capacity, pricing, arriveEstimateAt } = req.body || {};
    if (departAt !== undefined) {
      if (!isFuture(departAt)) return sendError(res, 400, "A rota nao pode partir no passado");
      route.departAt = new Date(departAt);
    }
    if (arriveEstimateAt !== undefined) route.arriveEstimateAt = arriveEstimateAt ? new Date(arriveEstimateAt) : null;
    if (capacity) {
      if (capacity.maxItems !== undefined) route.capacity.maxItems = Math.max(1, Number(capacity.maxItems) || route.capacity.maxItems);
      if (capacity.maxWeightKg !== undefined) route.capacity.maxWeightKg = Math.max(0, Number(capacity.maxWeightKg) || 0);
      if (capacity.maxVolumeL !== undefined) route.capacity.maxVolumeL = Math.max(0, Number(capacity.maxVolumeL) || 0);
    }
    if (pricing) {
      if (pricing.basePrice !== undefined) route.pricing.basePrice = Math.max(0, Number(pricing.basePrice) || 0);
      if (pricing.pricePerKg !== undefined) route.pricing.pricePerKg = Math.max(0, Number(pricing.pricePerKg) || 0);
    }
    await route.save();
    return res.json({ success: true, data: route, route });
  } catch (error) {
    console.error("Erro ao editar rota:", error);
    return sendError(res, 500, "Erro ao editar rota", { details: error.message });
  }
}

async function cancelRoute(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "routeId invalido");
    const route = await DriverRoute.findOne({ _id: id, driverId: req.user.id });
    if (!route) return sendError(res, 404, "Rota nao encontrada");
    if (["completed", "cancelled"].includes(route.status)) {
      return sendError(res, 409, "Rota ja finalizada/cancelada");
    }

    // Estorna todas as reservas ativas
    const reservations = await RouteReservation.find({
      routeId: id,
      status: { $in: ["requested", "accepted", "awaiting_pickup"] },
    });
    const Ride = mongoose.model("Ride");
    for (const r of reservations) {
      if (r.rideId) {
        const ride = await Ride.findById(r.rideId);
        if (ride && ride.status !== "completed") {
          ride.status = "cancelled_by_driver"; // hook → refundReservation
          await ride.save();
          continue;
        }
      }
      await walletEscrow.refundReservation(r);
      r.status = "refunded";
      r.statusHistory.push({ status: "refunded", at: new Date(), note: "Rota cancelada pelo motorista" });
      await r.save();
    }

    route.status = "cancelled";
    route.statusHistory.push({ status: "cancelled", at: new Date(), note: normalizeText(req.body?.reason, 300) || "Cancelada pelo motorista" });
    await route.save();
    return res.json({ success: true, data: route, route, refundedReservations: reservations.length });
  } catch (error) {
    console.error("Erro ao cancelar rota:", error);
    return sendError(res, 500, "Erro ao cancelar rota", { details: error.message });
  }
}

async function startRoute(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "routeId invalido");
    const route = await DriverRoute.findOne({ _id: id, driverId: req.user.id });
    if (!route) return sendError(res, 404, "Rota nao encontrada");
    if (route.status !== "published") return sendError(res, 409, "Rota nao pode iniciar neste estado");

    route.status = "in_transit";
    route.statusHistory.push({ status: "in_transit", at: new Date(), note: "Rota iniciada" });
    await route.save();

    await RouteReservation.updateMany(
      { routeId: id, status: "accepted" },
      { $set: { status: "awaiting_pickup" } },
    );
    return res.json({ success: true, data: route, route });
  } catch (error) {
    console.error("Erro ao iniciar rota:", error);
    return sendError(res, 500, "Erro ao iniciar rota", { details: error.message });
  }
}

// ---------------------------------------------------------------------------
// MOTORISTA — reservas recebidas
// ---------------------------------------------------------------------------

async function listRouteReservations(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "routeId invalido");
    const route = await DriverRoute.findOne({ _id: id, driverId: req.user.id }).select("_id");
    if (!route) return sendError(res, 404, "Rota nao encontrada");
    const reservations = await RouteReservation.find({ routeId: id })
      .sort({ createdAt: -1 })
      .populate("clientId", "name phone")
      .lean();
    return res.json({ success: true, data: reservations, reservations });
  } catch (error) {
    console.error("Erro ao listar reservas:", error);
    return sendError(res, 500, "Erro ao listar reservas", { details: error.message });
  }
}

function fitsCapacity(route, item) {
  const used = route.capacityUsed || { items: 0, weightKg: 0, volumeL: 0 };
  const cap = route.capacity || {};
  if ((used.items || 0) + 1 > (cap.maxItems || 0)) return false;
  if ((used.weightKg || 0) + (Number(item?.weightKg) || 0) > (cap.maxWeightKg || 0)) return false;
  return true;
}

async function acceptReservation(req, res) {
  try {
    const { reservationId } = req.params;
    if (!mongoose.isValidObjectId(reservationId)) return sendError(res, 400, "reservationId invalido");
    const reservation = await RouteReservation.findById(reservationId);
    if (!reservation) return sendError(res, 404, "Reserva nao encontrada");

    const route = await DriverRoute.findOne({ _id: reservation.routeId, driverId: req.user.id });
    if (!route) return sendError(res, 403, "Reserva nao pertence a uma rota sua");
    if (reservation.status !== "requested") return sendError(res, 409, "Reserva nao esta pendente");
    if (!fitsCapacity(route, reservation.item)) {
      return sendError(res, 409, "Capacidade da rota insuficiente para esta reserva");
    }

    reservation.status = "accepted";
    reservation.driverId = req.user.id;
    reservation.statusHistory.push({ status: "accepted", at: new Date(), note: "Aceita pelo motorista" });

    // Cria a entrega (Ride) vinculada — herda tracking ao vivo, PIN/foto-prova e disputas do motor existente.
    const Ride = mongoose.model("Ride");
    const gen = () => Math.floor(1000 + Math.random() * 9000).toString();
    const ride = new Ride({
      clientId: reservation.clientId,
      driverId: req.user.id,
      serviceType: "delivery",
      vehicleType: route.vehicleType || "motorcycle",
      sourceType: "planned_route",
      sourceRefId: reservation._id,
      plannedRouteId: route._id,
      pickup: {
        address: reservation.pickup?.address || route.origin?.label || "Coleta",
        latitude: Number(reservation.pickup?.latitude) || 0,
        longitude: Number(reservation.pickup?.longitude) || 0,
      },
      dropoff: {
        address: reservation.dropoff?.address || route.destination?.label || "Entrega",
        latitude: Number(reservation.dropoff?.latitude) || 0,
        longitude: Number(reservation.dropoff?.longitude) || 0,
      },
      pricing: {
        total: reservation.pricing?.price || 0,
        subtotal: reservation.pricing?.price || 0,
        driverValue: reservation.pricing?.driverPayout || 0,
        platformFee: reservation.pricing?.commissionAmount || 0,
      },
      details: {
        itemType: "planned_route_reservation",
        pickupPin: gen(),
        deliveryPin: gen(),
        recipientName: reservation.dropoff?.contactName || "",
        recipientPhone: reservation.dropoff?.contactPhone || "",
      },
      status: "accepted",
    });
    await ride.save();
    reservation.rideId = ride._id;
    await reservation.save();

    route.capacityUsed = route.capacityUsed || { items: 0, weightKg: 0, volumeL: 0 };
    route.capacityUsed.items += 1;
    route.capacityUsed.weightKg += Number(reservation.item?.weightKg) || 0;
    await route.save();

    const fresh = await RouteReservation.findById(reservation._id);
    return res.json({ success: true, data: fresh, reservation: fresh, rideId: ride._id });
  } catch (error) {
    console.error("Erro ao aceitar reserva:", error);
    return sendError(res, 500, "Erro ao aceitar reserva", { details: error.message });
  }
}

async function rejectReservation(req, res) {
  try {
    const { reservationId } = req.params;
    if (!mongoose.isValidObjectId(reservationId)) return sendError(res, 400, "reservationId invalido");
    const reservation = await RouteReservation.findById(reservationId);
    if (!reservation) return sendError(res, 404, "Reserva nao encontrada");
    const route = await DriverRoute.findOne({ _id: reservation.routeId, driverId: req.user.id });
    if (!route) return sendError(res, 403, "Reserva nao pertence a uma rota sua");
    if (!["requested", "accepted"].includes(reservation.status)) {
      return sendError(res, 409, "Reserva nao pode ser recusada neste estado");
    }

    const wasAccepted = reservation.status === "accepted";
    if (reservation.rideId) {
      const Ride = mongoose.model("Ride");
      const ride = await Ride.findById(reservation.rideId);
      if (ride && ride.status !== "completed") {
        ride.status = "cancelled_by_driver"; // hook → refundReservation + status refunded
        await ride.save();
      }
    } else {
      await walletEscrow.refundReservation(reservation);
      reservation.status = "rejected";
      reservation.statusHistory.push({ status: "rejected", at: new Date(), note: normalizeText(req.body?.reason, 300) || "Recusada pelo motorista" });
      await reservation.save();
    }

    if (wasAccepted) {
      route.capacityUsed.items = Math.max(0, (route.capacityUsed.items || 0) - 1);
      route.capacityUsed.weightKg = Math.max(0, (route.capacityUsed.weightKg || 0) - (Number(reservation.item?.weightKg) || 0));
      await route.save();
    }
    const fresh = await RouteReservation.findById(reservation._id);
    return res.json({ success: true, data: fresh, reservation: fresh });
  } catch (error) {
    console.error("Erro ao recusar reserva:", error);
    return sendError(res, 500, "Erro ao recusar reserva", { details: error.message });
  }
}

async function setReservationStage(req, res, stage) {
  const { reservationId } = req.params;
  if (!mongoose.isValidObjectId(reservationId)) return sendError(res, 400, "reservationId invalido");
  const reservation = await RouteReservation.findById(reservationId);
  if (!reservation) return sendError(res, 404, "Reserva nao encontrada");
  const route = await DriverRoute.findOne({ _id: reservation.routeId, driverId: req.user.id });
  if (!route) return sendError(res, 403, "Reserva nao pertence a uma rota sua");

  const Ride = mongoose.model("Ride");
  const ride = reservation.rideId ? await Ride.findById(reservation.rideId) : null;

  if (stage === "in_transit") {
    if (!["accepted", "awaiting_pickup"].includes(reservation.status)) {
      return sendError(res, 409, "Reserva nao esta pronta para coleta");
    }
    if (ride) {
      ride.status = "in_progress"; // hook sincroniza reserva → in_transit
      await ride.save();
    } else {
      reservation.status = "in_transit";
      reservation.statusHistory.push({ status: "in_transit", at: new Date(), note: "Coletada" });
      await reservation.save();
    }
    const fresh = await RouteReservation.findById(reservationId);
    return res.json({ success: true, data: fresh, reservation: fresh });
  }

  if (stage === "delivered") {
    if (!["in_transit", "awaiting_pickup", "accepted"].includes(reservation.status)) {
      return sendError(res, 409, "Reserva nao pode ser entregue neste estado");
    }
    if (ride) {
      ride.status = "completed"; // hook conclui a reserva + libera o pagamento (releaseReservation)
      await ride.save();
    } else {
      await walletEscrow.releaseReservation(reservation);
      reservation.status = "completed";
      reservation.statusHistory.push({ status: "delivered", at: new Date(), note: "Entregue" });
      reservation.statusHistory.push({ status: "completed", at: new Date(), note: "Pagamento liberado ao motorista" });
      await reservation.save();
    }
    const fresh = await RouteReservation.findById(reservationId);
    return res.json({ success: true, data: fresh, reservation: fresh });
  }

  return sendError(res, 400, "Etapa invalida");
}

const pickupReservation = (req, res) => setReservationStage(req, res, "in_transit");
const deliverReservation = (req, res) => setReservationStage(req, res, "delivered");

// ---------------------------------------------------------------------------
// CLIENTE — descoberta e reserva
// ---------------------------------------------------------------------------

async function discoverRoutes(req, res) {
  try {
    const query = { status: "published", departAt: { $gte: new Date() } };
    const { cityId, originCityId, destinationCityId } = req.query;
    const or = [];
    if (mongoose.isValidObjectId(originCityId)) or.push({ "origin.cityId": originCityId });
    if (mongoose.isValidObjectId(destinationCityId)) or.push({ "destination.cityId": destinationCityId });
    if (mongoose.isValidObjectId(cityId)) {
      or.push({ "origin.cityId": cityId }, { "destination.cityId": cityId }, { "waypoints.cityId": cityId });
    }
    if (or.length) query.$or = or;

    if (req.query.date) {
      const d = new Date(req.query.date);
      if (!Number.isNaN(d.getTime())) {
        const start = new Date(d.setHours(0, 0, 0, 0));
        const end = new Date(new Date(start).setHours(23, 59, 59, 999));
        query.departAt = { $gte: new Date(Math.max(start.getTime(), Date.now())), $lte: end };
      }
    }

    let routes = await DriverRoute.find(query)
      .sort({ departAt: 1 })
      .limit(80)
      .populate("driverId", "name rating vehicleType")
      .lean();

    // Só mostra rotas com capacidade disponível
    routes = routes.filter((r) => (r.capacityUsed?.items || 0) < (r.capacity?.maxItems || 0));

    return res.json({ success: true, data: routes, routes });
  } catch (error) {
    console.error("Erro ao descobrir rotas:", error);
    return sendError(res, 500, "Erro ao descobrir rotas", { details: error.message });
  }
}

async function getRoute(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "routeId invalido");
    const route = await DriverRoute.findById(id).populate("driverId", "name rating vehicleType").lean();
    if (!route) return sendError(res, 404, "Rota nao encontrada");
    return res.json({ success: true, data: route, route });
  } catch (error) {
    console.error("Erro ao buscar rota:", error);
    return sendError(res, 500, "Erro ao buscar rota", { details: error.message });
  }
}

async function createReservation(req, res) {
  try {
    const { routeId, item, pickup, dropoff, withInsurance } = req.body || {};
    if (!mongoose.isValidObjectId(routeId)) return sendError(res, 400, "routeId invalido");

    const route = await DriverRoute.findById(routeId);
    if (!route) return sendError(res, 404, "Rota nao encontrada");
    if (route.status !== "published") return sendError(res, 409, "Rota indisponivel para reserva");
    if (String(route.driverId) === String(req.user.id)) return sendError(res, 400, "Voce nao pode reservar a propria rota");

    const normItem = {
      type: normalizeText(item?.type, 40),
      description: normalizeText(item?.description, 300),
      size: ITEM_SIZES.has(String(item?.size)) ? String(item.size) : "small",
      weightKg: Math.max(0, Number(item?.weightKg) || 0),
      declaredValue: Math.max(0, Number(item?.declaredValue) || 0),
    };
    if (!fitsCapacity(route, normItem)) return sendError(res, 409, "Rota sem capacidade para este item");

    const pricing = await computeReservationPricing(route, normItem, { withInsurance: !!withInsurance });
    if (pricing.price <= 0) return sendError(res, 400, "Preco da reserva invalido");

    const reservation = new RouteReservation({
      routeId,
      clientId: req.user.id,
      driverId: route.driverId,
      item: normItem,
      pickup: {
        address: normalizeText(pickup?.address, 300),
        latitude: Number(pickup?.latitude) || null,
        longitude: Number(pickup?.longitude) || null,
        contactName: normalizeText(pickup?.contactName, 120),
        contactPhone: normalizeText(pickup?.contactPhone, 40),
      },
      dropoff: {
        address: normalizeText(dropoff?.address, 300),
        latitude: Number(dropoff?.latitude) || null,
        longitude: Number(dropoff?.longitude) || null,
        contactName: normalizeText(dropoff?.contactName, 120),
        contactPhone: normalizeText(dropoff?.contactPhone, 40),
      },
      pricing: {
        price: pricing.price,
        commissionPct: pricing.commissionPct,
        commissionAmount: pricing.commissionAmount,
        driverPayout: pricing.driverPayout,
      },
      payment: { method: "wallet", escrow: { status: "none" } },
      status: "requested",
      statusHistory: [{ status: "requested", at: new Date(), note: "Reserva solicitada" }],
    });

    try {
      await walletEscrow.reserveReservation(reservation);
    } catch (escrowErr) {
      return sendError(res, 400, escrowErr.message || "Erro ao reter saldo LevaPay", {
        code: escrowErr.code || "ESCROW_ERROR",
        required: escrowErr.required,
        available: escrowErr.available,
      });
    }

    await reservation.save();
    return res.status(201).json({ success: true, data: reservation, reservation });
  } catch (error) {
    console.error("Erro ao criar reserva:", error);
    return sendError(res, 500, "Erro ao criar reserva", { details: error.message });
  }
}

async function listMyReservations(req, res) {
  try {
    const query = { clientId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);
    const reservations = await RouteReservation.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("routeId", "origin destination departAt status vehicleType")
      .lean();
    return res.json({ success: true, data: reservations, reservations });
  } catch (error) {
    console.error("Erro ao listar reservas do cliente:", error);
    return sendError(res, 500, "Erro ao listar reservas", { details: error.message });
  }
}

async function getReservation(req, res) {
  try {
    const { reservationId } = req.params;
    if (!mongoose.isValidObjectId(reservationId)) return sendError(res, 400, "reservationId invalido");
    const reservation = await RouteReservation.findById(reservationId)
      .populate("routeId", "origin destination departAt status vehicleType driverId")
      .lean();
    if (!reservation) return sendError(res, 404, "Reserva nao encontrada");
    const mine = String(reservation.clientId) === String(req.user.id) || String(reservation.driverId) === String(req.user.id);
    if (!mine) return sendError(res, 403, "Voce nao participa desta reserva");
    return res.json({ success: true, data: reservation, reservation });
  } catch (error) {
    console.error("Erro ao buscar reserva:", error);
    return sendError(res, 500, "Erro ao buscar reserva", { details: error.message });
  }
}

async function cancelReservation(req, res) {
  try {
    const { reservationId } = req.params;
    if (!mongoose.isValidObjectId(reservationId)) return sendError(res, 400, "reservationId invalido");
    const reservation = await RouteReservation.findOne({ _id: reservationId, clientId: req.user.id });
    if (!reservation) return sendError(res, 404, "Reserva nao encontrada");
    if (!["requested", "accepted", "awaiting_pickup"].includes(reservation.status)) {
      return sendError(res, 409, "Reserva nao pode ser cancelada neste estado");
    }

    const wasAccepted = ["accepted", "awaiting_pickup"].includes(reservation.status);
    if (reservation.rideId) {
      const Ride = mongoose.model("Ride");
      const ride = await Ride.findById(reservation.rideId);
      if (ride && ride.status !== "completed") {
        ride.status = "cancelled_by_client"; // hook → refundReservation + status refunded
        await ride.save();
      }
    } else {
      await walletEscrow.refundReservation(reservation);
      reservation.status = "cancelled";
      reservation.statusHistory.push({ status: "cancelled", at: new Date(), note: "Cancelada pelo cliente" });
      await reservation.save();
    }

    if (wasAccepted) {
      const route = await DriverRoute.findById(reservation.routeId);
      if (route) {
        route.capacityUsed.items = Math.max(0, (route.capacityUsed.items || 0) - 1);
        route.capacityUsed.weightKg = Math.max(0, (route.capacityUsed.weightKg || 0) - (Number(reservation.item?.weightKg) || 0));
        await route.save();
      }
    }
    const fresh = await RouteReservation.findById(reservation._id);
    return res.json({ success: true, data: fresh, reservation: fresh });
  } catch (error) {
    console.error("Erro ao cancelar reserva:", error);
    return sendError(res, 500, "Erro ao cancelar reserva", { details: error.message });
  }
}

module.exports = {
  // motorista
  publishRoute,
  listMyRoutes,
  updateRoute,
  cancelRoute,
  startRoute,
  listRouteReservations,
  acceptReservation,
  rejectReservation,
  pickupReservation,
  deliverReservation,
  // cliente
  discoverRoutes,
  getRoute,
  createReservation,
  listMyReservations,
  getReservation,
  cancelReservation,
};
