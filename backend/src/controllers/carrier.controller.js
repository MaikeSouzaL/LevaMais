const mongoose = require("mongoose");
const Carrier = require("../models/Carrier");
const User = require("../models/User");

// Modo Transportadora (Fase D / T1). Motorista cria perfil + KYC; admin aprova.
// Gate: rotas recorrentes, frete sob demanda e perfil público exigem carrier active + KYC approved.

const CARRIER_STATUSES = new Set(["active", "paused", "under_review", "blocked"]);
const KYC_ACTIONS = new Set(["approve", "reject", "suspend", "reset"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, max) {
  const t = String(value || "").trim();
  return t ? t.slice(0, max) : "";
}

function reviewerObjectId(req) {
  return mongoose.isValidObjectId(req.user?.id) ? req.user.id : undefined;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

async function uniqueSlug(base) {
  const root = slugify(base) || "transportadora";
  let slug = root;
  let i = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await Carrier.exists({ slug })) {
    i += 1;
    slug = `${root}-${i}`;
  }
  return slug;
}

// Helper de gate — usado por rotas recorrentes/frete/perfil público.
async function isActiveCarrier(driverUserId) {
  const carrier = await Carrier.findOne({ driverUserId }).select("status kyc.status").lean();
  return !!carrier && carrier.status === "active" && carrier.kyc?.status === "approved";
}

// ---------------------------------------------------------------------------
// MOTORISTA
// ---------------------------------------------------------------------------

async function onboarding(req, res) {
  try {
    const existing = await Carrier.findOne({ driverUserId: req.user.id });
    if (existing) {
      return sendError(res, 409, "Voce ja possui uma transportadora", { carrierId: existing._id });
    }

    const brandName = normalizeText(req.body?.brandName, 120);
    if (!brandName) return sendError(res, 400, "Nome da transportadora e obrigatorio");

    const user = await User.findById(req.user.id).select("name email phone");
    const slug = await uniqueSlug(brandName);

    const serviceAreas = Array.isArray(req.body?.serviceAreas)
      ? req.body.serviceAreas.slice(0, 20).map((a) => ({
          cityId: mongoose.isValidObjectId(a?.cityId) ? a.cityId : null,
          label: normalizeText(a?.label, 120),
        }))
      : [];

    const carrier = await Carrier.create({
      driverUserId: req.user.id,
      brandName,
      slug,
      bio: normalizeText(req.body?.bio, 500),
      document: normalizeText(req.body?.document, 32),
      contact: {
        phone: normalizeText(req.body?.contact?.phone, 32) || user?.phone || "",
        whatsapp: normalizeText(req.body?.contact?.whatsapp, 32),
        email: normalizeText(req.body?.contact?.email, 160) || user?.email || "",
      },
      serviceAreas,
      pricing: {
        basePrice: Math.max(0, Number(req.body?.pricing?.basePrice) || 0),
        pricePerKg: Math.max(0, Number(req.body?.pricing?.pricePerKg) || 0),
      },
      status: "under_review",
      kyc: { status: "pending", submittedAt: new Date() },
    });

    return res.status(201).json({ success: true, data: carrier, carrier });
  } catch (error) {
    console.error("Erro no onboarding da transportadora:", error);
    return sendError(res, 500, "Erro ao criar transportadora", { details: error.message });
  }
}

async function getMe(req, res) {
  try {
    const carrier = await Carrier.findOne({ driverUserId: req.user.id }).lean();
    if (!carrier) return res.json({ success: true, data: null, carrier: null });
    return res.json({ success: true, data: carrier, carrier });
  } catch (error) {
    return sendError(res, 500, "Erro ao obter transportadora", { details: error.message });
  }
}

async function updateMe(req, res) {
  try {
    const carrier = await Carrier.findOne({ driverUserId: req.user.id });
    if (!carrier) return sendError(res, 404, "Transportadora nao encontrada");

    const { brandName, bio, logo, contact, serviceAreas, pricing } = req.body || {};
    if (brandName !== undefined) carrier.brandName = normalizeText(brandName, 120) || carrier.brandName;
    if (bio !== undefined) carrier.bio = normalizeText(bio, 500);
    if (logo !== undefined) carrier.logo = normalizeText(logo, 500);
    if (contact) {
      carrier.contact.phone = normalizeText(contact.phone, 32) || carrier.contact.phone;
      carrier.contact.whatsapp = normalizeText(contact.whatsapp, 32) || carrier.contact.whatsapp;
      carrier.contact.email = normalizeText(contact.email, 160) || carrier.contact.email;
    }
    if (Array.isArray(serviceAreas)) {
      carrier.serviceAreas = serviceAreas.slice(0, 20).map((a) => ({
        cityId: mongoose.isValidObjectId(a?.cityId) ? a.cityId : null,
        label: normalizeText(a?.label, 120),
      }));
    }
    if (pricing) {
      if (pricing.basePrice !== undefined) carrier.pricing.basePrice = Math.max(0, Number(pricing.basePrice) || 0);
      if (pricing.pricePerKg !== undefined) carrier.pricing.pricePerKg = Math.max(0, Number(pricing.pricePerKg) || 0);
    }

    await carrier.save();
    return res.json({ success: true, data: carrier, carrier });
  } catch (error) {
    return sendError(res, 500, "Erro ao atualizar transportadora", { details: error.message });
  }
}

// ---------------------------------------------------------------------------
// PÚBLICO (cliente) — descoberta de transportadoras (fatia do T4)
// ---------------------------------------------------------------------------

async function listPublic(req, res) {
  try {
    const query = { status: "active", "kyc.status": "approved" };
    if (req.query.city) {
      const term = normalizeText(req.query.city, 80);
      if (term) query["serviceAreas.label"] = new RegExp(term, "i");
    }
    const carriers = await Carrier.find(query)
      .select("brandName slug logo bio rating serviceAreas pricing")
      .sort({ "rating.average": -1, createdAt: -1 })
      .limit(50)
      .lean();
    return res.json({ success: true, data: carriers, carriers });
  } catch (error) {
    return sendError(res, 500, "Erro ao listar transportadoras", { details: error.message });
  }
}

async function getPublicProfile(req, res) {
  try {
    const slug = String(req.params.slug || "").toLowerCase().trim();
    if (!slug) return sendError(res, 400, "slug invalido");

    const carrier = await Carrier.findOne({ slug, status: "active", "kyc.status": "approved" })
      .select("brandName slug logo bio rating serviceAreas pricing stats driverUserId contact")
      .lean();
    if (!carrier) return sendError(res, 404, "Transportadora nao encontrada");

    const DriverRoute = mongoose.model("DriverRoute");
    const routes = await DriverRoute.find({
      driverId: carrier.driverUserId,
      status: "published",
      departAt: { $gte: new Date() },
    })
      .select("origin destination departAt capacity capacityUsed pricing vehicleType")
      .sort({ departAt: 1 })
      .limit(20)
      .lean();

    // Não expõe o telefone direto no perfil público; mantém só dados de marca.
    delete carrier.contact;
    return res.json({ success: true, data: { ...carrier, routes }, carrier: { ...carrier, routes } });
  } catch (error) {
    return sendError(res, 500, "Erro ao obter perfil da transportadora", { details: error.message });
  }
}

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------

async function listCarriers(req, res) {
  try {
    const query = {};
    if (req.query.status && CARRIER_STATUSES.has(String(req.query.status))) query.status = String(req.query.status);
    if (req.query.kycStatus) query["kyc.status"] = String(req.query.kycStatus);
    const carriers = await Carrier.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("driverUserId", "name email phone")
      .lean();
    return res.json({ success: true, data: carriers, carriers });
  } catch (error) {
    return sendError(res, 500, "Erro ao listar transportadoras", { details: error.message });
  }
}

async function getCarrier(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "carrierId invalido");
    const carrier = await Carrier.findById(id).populate("driverUserId", "name email phone").lean();
    if (!carrier) return sendError(res, 404, "Transportadora nao encontrada");
    return res.json({ success: true, data: carrier, carrier });
  } catch (error) {
    return sendError(res, 500, "Erro ao obter transportadora", { details: error.message });
  }
}

async function reviewKyc(req, res) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "carrierId invalido");
    if (!KYC_ACTIONS.has(String(action))) return sendError(res, 400, "Acao de KYC invalida");

    const carrier = await Carrier.findById(id);
    if (!carrier) return sendError(res, 404, "Transportadora nao encontrada");

    const normalizedReason = normalizeText(reason, 500);
    const map = { approve: "approved", reject: "rejected", suspend: "suspended", reset: "pending" };
    carrier.kyc.status = map[action];
    carrier.kyc.rejectionReason = action === "reject" || action === "suspend" ? normalizedReason : "";
    carrier.kyc.reviewedAt = new Date();
    const reviewerId = reviewerObjectId(req);
    if (reviewerId) carrier.kyc.reviewedBy = reviewerId;
    carrier.kyc.reviewHistory.push({ action, reason: normalizedReason, reviewedBy: reviewerId, reviewedAt: new Date() });

    if (action === "approve" && carrier.status === "under_review") carrier.status = "active";
    if (action === "suspend" && carrier.status === "active") carrier.status = "paused";

    await carrier.save();
    return res.json({ success: true, data: carrier, carrier });
  } catch (error) {
    return sendError(res, 500, "Erro ao revisar KYC", { details: error.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "carrierId invalido");
    if (!CARRIER_STATUSES.has(String(status))) return sendError(res, 400, "Status invalido");

    const carrier = await Carrier.findById(id);
    if (!carrier) return sendError(res, 404, "Transportadora nao encontrada");
    carrier.status = String(status);
    carrier.statusReason = normalizeText(reason, 500);
    await carrier.save();
    return res.json({ success: true, data: carrier, carrier });
  } catch (error) {
    return sendError(res, 500, "Erro ao atualizar status", { details: error.message });
  }
}

module.exports = {
  isActiveCarrier,
  onboarding,
  getMe,
  updateMe,
  listPublic,
  getPublicProfile,
  listCarriers,
  getCarrier,
  reviewKyc,
  updateStatus,
};
