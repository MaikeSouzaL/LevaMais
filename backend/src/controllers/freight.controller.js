const mongoose = require("mongoose");
const FreightRequest = require("../models/FreightRequest");
const Carrier = require("../models/Carrier");
const walletEscrow = require("../services/walletEscrow.service");
const { getRuntimeConfig } = require("../services/platformConfig.service");

// Frete sob demanda (Modo Transportadora / T3).

const ITEM_SIZES = new Set(["small", "medium", "large"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, max) {
  const t = String(value || "").trim();
  return t ? t.slice(0, max) : "";
}

function round2(v) {
  return Math.round((Number(v) || 0) * 100) / 100;
}

function normalizeContact(input = {}) {
  return {
    address: normalizeText(input.address, 300),
    latitude: Number(input.latitude) || null,
    longitude: Number(input.longitude) || null,
    contactName: normalizeText(input.contactName, 120),
    contactPhone: normalizeText(input.contactPhone, 40),
  };
}

async function computeFreightPricing(price) {
  const config = await getRuntimeConfig();
  const pct = Number(config?.plannedRoutes?.defaultCommissionPct) || 0;
  const safePrice = round2(Math.max(0, Number(price) || 0));
  const commissionAmount = round2((safePrice * pct) / 100);
  return {
    price: safePrice,
    commissionPct: pct,
    commissionAmount,
    driverPayout: round2(safePrice - commissionAmount),
  };
}

// ---------------------------------------------------------------------------
// CLIENTE
// ---------------------------------------------------------------------------

async function createRequest(req, res) {
  try {
    const { carrierId, pickup, dropoff, item, desiredDate, notes } = req.body || {};
    if (!mongoose.isValidObjectId(carrierId)) return sendError(res, 400, "carrierId invalido");

    const carrier = await Carrier.findById(carrierId).select("driverUserId status kyc.status");
    if (!carrier) return sendError(res, 404, "Transportadora nao encontrada");
    if (carrier.status !== "active" || carrier.kyc?.status !== "approved") {
      return sendError(res, 409, "Transportadora indisponivel no momento");
    }
    if (String(carrier.driverUserId) === String(req.user.id)) {
      return sendError(res, 400, "Voce nao pode solicitar frete para si mesmo");
    }

    const freight = await FreightRequest.create({
      clientId: req.user.id,
      carrierId,
      driverId: carrier.driverUserId,
      pickup: normalizeContact(pickup),
      dropoff: normalizeContact(dropoff),
      item: {
        description: normalizeText(item?.description, 300),
        size: ITEM_SIZES.has(String(item?.size)) ? String(item.size) : "small",
        weightKg: Math.max(0, Number(item?.weightKg) || 0),
        declaredValue: Math.max(0, Number(item?.declaredValue) || 0),
      },
      desiredDate: desiredDate ? new Date(desiredDate) : null,
      notes: normalizeText(notes, 500),
      status: "requested",
      statusHistory: [{ status: "requested", at: new Date(), note: "Frete solicitado" }],
    });

    try {
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) io.to(`client-${carrier.driverUserId}`).emit("freight-request-received", { freightId: freight._id });
    } catch (wsErr) {}

    return res.status(201).json({ success: true, data: freight, freight });
  } catch (error) {
    console.error("Erro ao solicitar frete:", error);
    return sendError(res, 500, "Erro ao solicitar frete", { details: error.message });
  }
}

async function listMine(req, res) {
  try {
    const query = { clientId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);
    const freights = await FreightRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("carrierId", "brandName slug rating")
      .lean();
    return res.json({ success: true, data: freights, freights });
  } catch (error) {
    return sendError(res, 500, "Erro ao listar fretes", { details: error.message });
  }
}

async function getRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "freightId invalido");
    const freight = await FreightRequest.findById(id).populate("carrierId", "brandName slug rating").lean();
    if (!freight) return sendError(res, 404, "Frete nao encontrado");
    const mine = String(freight.clientId) === String(req.user.id) || String(freight.driverId) === String(req.user.id);
    if (!mine) return sendError(res, 403, "Voce nao participa deste frete");
    return res.json({ success: true, data: freight, freight });
  } catch (error) {
    return sendError(res, 500, "Erro ao obter frete", { details: error.message });
  }
}

async function acceptQuote(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "freightId invalido");
    const freight = await FreightRequest.findOne({ _id: id, clientId: req.user.id });
    if (!freight) return sendError(res, 404, "Frete nao encontrado");
    if (freight.status !== "quoted") return sendError(res, 409, "Frete nao tem cotacao para aceitar");

    const pricing = await computeFreightPricing(freight.quote?.price || 0);
    if (pricing.price <= 0) return sendError(res, 400, "Cotacao invalida");
    freight.pricing = pricing;

    try {
      await walletEscrow.reserveFreight(freight);
    } catch (escrowErr) {
      return sendError(res, 400, escrowErr.message || "Erro ao reter saldo LevaPay", {
        code: escrowErr.code || "ESCROW_ERROR",
        required: escrowErr.required,
        available: escrowErr.available,
      });
    }

    // Cria a entrega (Ride) vinculada — herda tracking, PIN/foto e disputas.
    const Ride = mongoose.model("Ride");
    const gen = () => Math.floor(1000 + Math.random() * 9000).toString();
    const ride = new Ride({
      clientId: freight.clientId,
      driverId: freight.driverId,
      serviceType: "delivery",
      vehicleType: "motorcycle",
      sourceType: "freight",
      sourceRefId: freight._id,
      pickup: {
        address: freight.pickup?.address || "Coleta",
        latitude: Number(freight.pickup?.latitude) || 0,
        longitude: Number(freight.pickup?.longitude) || 0,
      },
      dropoff: {
        address: freight.dropoff?.address || "Entrega",
        latitude: Number(freight.dropoff?.latitude) || 0,
        longitude: Number(freight.dropoff?.longitude) || 0,
      },
      pricing: {
        total: pricing.price,
        subtotal: pricing.price,
        driverValue: pricing.driverPayout,
        platformFee: pricing.commissionAmount,
      },
      details: {
        itemType: "freight",
        pickupPin: gen(),
        deliveryPin: gen(),
        recipientName: freight.dropoff?.contactName || "",
        recipientPhone: freight.dropoff?.contactPhone || "",
      },
      status: "accepted",
    });
    await ride.save();

    freight.rideId = ride._id;
    freight.status = "accepted";
    freight.statusHistory.push({ status: "accepted", at: new Date(), note: "Cotacao aceita e paga (hold)" });
    await freight.save();

    return res.json({ success: true, data: freight, freight, rideId: ride._id });
  } catch (error) {
    console.error("Erro ao aceitar cotacao:", error);
    return sendError(res, 500, "Erro ao aceitar cotacao", { details: error.message });
  }
}

async function cancelRequest(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "freightId invalido");
    const freight = await FreightRequest.findOne({ _id: id, clientId: req.user.id });
    if (!freight) return sendError(res, 404, "Frete nao encontrado");
    if (!["requested", "quoted", "accepted"].includes(freight.status)) {
      return sendError(res, 409, "Frete nao pode ser cancelado neste estado");
    }

    if (freight.rideId) {
      const Ride = mongoose.model("Ride");
      const ride = await Ride.findById(freight.rideId);
      if (ride && ride.status !== "completed") {
        ride.status = "cancelled_by_client"; // hook → refundFreight + status refunded
        await ride.save();
      }
    } else {
      freight.status = "cancelled";
      freight.statusHistory.push({ status: "cancelled", at: new Date(), note: "Cancelado pelo cliente" });
      await freight.save();
    }
    const fresh = await FreightRequest.findById(id);
    return res.json({ success: true, data: fresh, freight: fresh });
  } catch (error) {
    return sendError(res, 500, "Erro ao cancelar frete", { details: error.message });
  }
}

// ---------------------------------------------------------------------------
// TRANSPORTADORA (motorista)
// ---------------------------------------------------------------------------

async function listIncoming(req, res) {
  try {
    const query = { driverId: req.user.id };
    if (req.query.status) query.status = String(req.query.status);
    const freights = await FreightRequest.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("clientId", "name phone")
      .lean();
    return res.json({ success: true, data: freights, freights });
  } catch (error) {
    return sendError(res, 500, "Erro ao listar fretes recebidos", { details: error.message });
  }
}

async function quote(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "freightId invalido");
    const freight = await FreightRequest.findOne({ _id: id, driverId: req.user.id });
    if (!freight) return sendError(res, 404, "Frete nao encontrado");
    if (!["requested", "quoted"].includes(freight.status)) return sendError(res, 409, "Frete nao pode ser cotado neste estado");

    const price = round2(Number(req.body?.price));
    if (!(price > 0)) return sendError(res, 400, "Informe um preco valido");

    freight.quote = { price, message: normalizeText(req.body?.message, 300), quotedAt: new Date() };
    freight.status = "quoted";
    freight.statusHistory.push({ status: "quoted", at: new Date(), note: `Cotado: R$ ${price.toFixed(2)}` });
    await freight.save();

    try {
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) io.to(`client-${freight.clientId}`).emit("freight-status-updated", { freightId: freight._id, status: "quoted" });
    } catch (wsErr) {}

    return res.json({ success: true, data: freight, freight });
  } catch (error) {
    return sendError(res, 500, "Erro ao cotar frete", { details: error.message });
  }
}

async function reject(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "freightId invalido");
    const freight = await FreightRequest.findOne({ _id: id, driverId: req.user.id });
    if (!freight) return sendError(res, 404, "Frete nao encontrado");
    if (!["requested", "quoted"].includes(freight.status)) return sendError(res, 409, "Frete nao pode ser recusado neste estado");
    freight.status = "rejected";
    freight.statusHistory.push({ status: "rejected", at: new Date(), note: normalizeText(req.body?.reason, 300) || "Recusado pela transportadora" });
    await freight.save();
    return res.json({ success: true, data: freight, freight });
  } catch (error) {
    return sendError(res, 500, "Erro ao recusar frete", { details: error.message });
  }
}

async function setStage(req, res, stage) {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "freightId invalido");
  const freight = await FreightRequest.findOne({ _id: id, driverId: req.user.id });
  if (!freight) return sendError(res, 404, "Frete nao encontrado");

  const Ride = mongoose.model("Ride");
  const ride = freight.rideId ? await Ride.findById(freight.rideId) : null;

  if (stage === "in_transit") {
    if (!["accepted"].includes(freight.status)) return sendError(res, 409, "Frete nao esta pronto para coleta");
    if (ride) { ride.status = "in_progress"; await ride.save(); }
    const fresh = await FreightRequest.findById(id);
    return res.json({ success: true, data: fresh, freight: fresh });
  }
  if (stage === "delivered") {
    if (!["in_transit", "accepted"].includes(freight.status)) return sendError(res, 409, "Frete nao pode ser entregue neste estado");
    if (ride) { ride.status = "completed"; await ride.save(); } // hook → release
    const fresh = await FreightRequest.findById(id);
    return res.json({ success: true, data: fresh, freight: fresh });
  }
  return sendError(res, 400, "Etapa invalida");
}

const pickup = (req, res) => setStage(req, res, "in_transit");
const deliver = (req, res) => setStage(req, res, "delivered");

module.exports = {
  createRequest,
  listMine,
  getRequest,
  acceptQuote,
  cancelRequest,
  listIncoming,
  quote,
  reject,
  pickup,
  deliver,
};
