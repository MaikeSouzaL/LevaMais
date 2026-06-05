const mongoose = require("mongoose");
const Dispute = require("../models/Dispute");
const Ride = require("../models/Ride");

const CATEGORIES = new Set([
  "payment",
  "safety",
  "delivery_problem",
  "cancellation_fee",
  "route",
  "behavior",
  "other",
]);
const STATUSES = new Set(["open", "in_review", "resolved", "rejected", "cancelled"]);
const SEVERITIES = new Set(["low", "medium", "high", "critical"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, maxLength) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : "";
}

function isAdmin(req) {
  return String(req.user?.userType || "").toLowerCase() === "admin";
}

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function reviewerObjectId(req) {
  return mongoose.isValidObjectId(req.user?.id) ? req.user.id : undefined;
}

async function resolveParticipantRide(req, rideId) {
  if (!mongoose.isValidObjectId(rideId)) {
    return { error: { status: 400, message: "rideId invalido" } };
  }

  const ride = await Ride.findById(rideId).select("clientId driverId status serviceType");
  if (!ride) return { error: { status: 404, message: "Corrida ou entrega nao encontrada" } };

  const userId = req.user?.id;
  const participant = sameId(ride.clientId, userId) || sameId(ride.driverId, userId);
  if (!participant && !isAdmin(req)) {
    return { error: { status: 403, message: "Voce nao participa desta corrida ou entrega" } };
  }

  return { ride };
}

async function createDispute(req, res) {
  try {
    const { rideId, category, description, severity, evidenceUrls } = req.body || {};
    const normalizedCategory = String(category || "").trim();
    const normalizedSeverity = String(severity || "medium").trim();
    const normalizedDescription = normalizeText(description, 3000);

    if (!CATEGORIES.has(normalizedCategory)) {
      return sendError(res, 400, "Categoria de disputa invalida");
    }
    if (!SEVERITIES.has(normalizedSeverity)) {
      return sendError(res, 400, "Severidade invalida");
    }
    if (normalizedDescription.length < 20) {
      return sendError(res, 400, "Descreva o problema com pelo menos 20 caracteres");
    }

    const { ride, error } = await resolveParticipantRide(req, rideId);
    if (error) return sendError(res, error.status, error.message);

    const existing = await Dispute.findOne({
      rideId,
      openedBy: req.user.id,
      category: normalizedCategory,
      status: { $in: ["open", "in_review"] },
    });
    if (existing) {
      return sendError(res, 409, "Ja existe uma disputa aberta para este motivo", {
        disputeId: existing._id,
      });
    }

    const evidence = Array.isArray(evidenceUrls)
      ? evidenceUrls.map((url) => normalizeText(url, 500)).filter(Boolean).slice(0, 8)
      : [];

    const dispute = await Dispute.create({
      rideId: ride._id,
      openedBy: req.user.id,
      clientId: ride.clientId,
      driverId: ride.driverId,
      category: normalizedCategory,
      severity: normalizedSeverity,
      description: normalizedDescription,
      messages: [{
        authorId: req.user.id,
        authorType: req.user.userType,
        message: normalizedDescription,
        evidenceUrls: evidence,
      }],
    });

    return res.status(201).json({ success: true, data: dispute, dispute });
  } catch (error) {
    console.error("Erro ao criar disputa:", error);
    return sendError(res, 500, "Erro ao criar disputa", { details: error.message });
  }
}

async function listMyDisputes(req, res) {
  try {
    const query = isAdmin(req)
      ? {}
      : { $or: [{ openedBy: req.user.id }, { clientId: req.user.id }, { driverId: req.user.id }] };

    if (req.query.status && STATUSES.has(String(req.query.status))) {
      query.status = String(req.query.status);
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const disputes = await Dispute.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("rideId", "status serviceType pickup dropoff pricing")
      .lean();

    return res.json({ success: true, data: disputes, disputes });
  } catch (error) {
    console.error("Erro ao listar disputas:", error);
    return sendError(res, 500, "Erro ao listar disputas", { details: error.message });
  }
}

async function updateDisputeByAdmin(req, res) {
  try {
    const { id } = req.params;
    const { status, severity, resolutionSummary, amountAdjusted } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "disputeId invalido");

    const dispute = await Dispute.findById(id);
    if (!dispute) return sendError(res, 404, "Disputa nao encontrada");

    if (status !== undefined) {
      const normalizedStatus = String(status);
      if (!STATUSES.has(normalizedStatus)) return sendError(res, 400, "Status de disputa invalido");
      dispute.status = normalizedStatus;
    }
    if (severity !== undefined) {
      const normalizedSeverity = String(severity);
      if (!SEVERITIES.has(normalizedSeverity)) return sendError(res, 400, "Severidade invalida");
      dispute.severity = normalizedSeverity;
    }
    if (resolutionSummary !== undefined || amountAdjusted !== undefined) {
      dispute.resolution = dispute.resolution || {};
      dispute.resolution.summary = normalizeText(resolutionSummary, 3000);
      dispute.resolution.amountAdjusted = Number(amountAdjusted || 0);
      dispute.resolution.resolvedAt = new Date();
      const reviewerId = reviewerObjectId(req);
      if (reviewerId) dispute.resolution.resolvedBy = reviewerId;
      if (!status) dispute.status = "resolved";
    }

    await dispute.save();
    return res.json({ success: true, data: dispute, dispute });
  } catch (error) {
    console.error("Erro ao atualizar disputa:", error);
    return sendError(res, 500, "Erro ao atualizar disputa", { details: error.message });
  }
}

module.exports = {
  createDispute,
  listMyDisputes,
  updateDisputeByAdmin,
};
