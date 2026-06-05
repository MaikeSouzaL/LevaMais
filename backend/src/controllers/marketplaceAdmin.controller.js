const mongoose = require("mongoose");
const crypto = require("crypto");
const Partner = require("../models/Partner");
const Store = require("../models/Store");
const Category = require("../models/Category");
const User = require("../models/User");
const { resolveStoreCommission } = require("../services/commission.service");

// Controller admin do Marketplace (Fase D / D1): parceiros, KYC, status, categorias e comissão.
// Todas as rotas exigem requireAdmin.

const PARTNER_STATUSES = new Set(["active", "paused", "under_review", "blocked"]);
const STORE_STATUSES = new Set(["active", "paused", "under_review", "blocked"]);
const KYC_ACTIONS = new Set(["approve", "reject", "suspend", "reset"]);
const CATEGORY_KINDS = new Set(["store", "product"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, maxLength) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : "";
}

function reviewerObjectId(req) {
  return mongoose.isValidObjectId(req.user?.id) ? req.user.id : undefined;
}

function parsePct(value) {
  // null/"" => limpa (herda). Número válido 0..100 => define.
  if (value === null || value === "" || value === undefined) return { clear: true };
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return { error: true };
  return { value: n };
}

function documentHash(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return crypto.createHash("sha256").update(digits).digest("hex");
}

function slugify(value) {
  return normalizeText(value, 80)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

async function buildUniqueStoreSlug(name) {
  const base = slugify(name) || `loja-${Date.now()}`;
  let candidate = base;
  let counter = 2;
  while (await Store.exists({ slug: candidate })) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function parseLocation(body = {}) {
  const rawLat = body.location?.latitude ?? body.latitude;
  const rawLng = body.location?.longitude ?? body.longitude;
  if (rawLat === undefined && rawLng === undefined) return undefined;

  const latitude = Number(rawLat);
  const longitude = Number(rawLng);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { error: "Latitude da loja invalida" };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Longitude da loja invalida" };
  }
  return { type: "Point", coordinates: [longitude, latitude] };
}

// ---------------------------------------------------------------------------
// Parceiros
// ---------------------------------------------------------------------------

async function listPartners(req, res) {
  try {
    const query = {};
    if (req.query.status && PARTNER_STATUSES.has(String(req.query.status))) {
      query.status = String(req.query.status);
    }
    if (req.query.kycStatus) {
      query["kyc.status"] = String(req.query.kycStatus);
    }
    if (req.query.q) {
      const term = normalizeText(req.query.q, 80);
      if (term) {
        query.$or = [
          { tradeName: new RegExp(term, "i") },
          { legalName: new RegExp(term, "i") },
        ];
      }
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const partners = await Partner.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("ownerUserId", "name email phone")
      .lean();

    return res.json({ success: true, data: partners, partners });
  } catch (error) {
    console.error("Erro ao listar parceiros:", error);
    return sendError(res, 500, "Erro ao listar parceiros", { details: error.message });
  }
}

async function getPartner(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "partnerId invalido");

    const partner = await Partner.findById(id)
      .populate("ownerUserId", "name email phone")
      .lean();
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    const stores = await Store.find({ partnerId: id })
      .select("name slug categoryId status commissionPct rating")
      .lean();

    return res.json({ success: true, data: { ...partner, stores }, partner: { ...partner, stores } });
  } catch (error) {
    console.error("Erro ao buscar parceiro:", error);
    return sendError(res, 500, "Erro ao buscar parceiro", { details: error.message });
  }
}

async function createPartner(req, res) {
  try {
    const { ownerUserId, legalName, tradeName, document, contact } = req.body || {};

    if (!mongoose.isValidObjectId(ownerUserId)) {
      return sendError(res, 400, "ownerUserId invalido");
    }
    const owner = await User.findById(ownerUserId).select("_id email name");
    if (!owner) return sendError(res, 404, "Usuario responsavel nao encontrado");

    const normalizedTrade = normalizeText(tradeName, 120);
    const normalizedLegal = normalizeText(legalName, 160);
    if (!normalizedTrade) return sendError(res, 400, "Nome fantasia e obrigatorio");
    if (!normalizedLegal) return sendError(res, 400, "Razao social e obrigatoria");

    const existing = await Partner.findOne({ ownerUserId });
    if (existing) {
      return sendError(res, 409, "Este usuario ja possui um parceiro vinculado", {
        partnerId: existing._id,
      });
    }
    const normalizedDocument = normalizeText(document, 32);
    const hash = documentHash(normalizedDocument);
    if (hash) {
      const existingDocument = await Partner.findOne({ documentHash: hash }).select("_id");
      if (existingDocument) {
        return sendError(res, 409, "Ja existe parceiro cadastrado com este documento", {
          partnerId: existingDocument._id,
        });
      }
    }

    const partner = await Partner.create({
      ownerUserId,
      legalName: normalizedLegal,
      tradeName: normalizedTrade,
      document: normalizedDocument,
      documentHash: hash || undefined,
      contact: {
        email: normalizeText(contact?.email, 160) || owner.email,
        phone: normalizeText(contact?.phone, 32),
        whatsapp: normalizeText(contact?.whatsapp, 32),
      },
      status: "under_review",
      kyc: { status: "pending", submittedAt: new Date() },
    });

    return res.status(201).json({ success: true, data: partner, partner });
  } catch (error) {
    console.error("Erro ao criar parceiro:", error);
    return sendError(res, 500, "Erro ao criar parceiro", { details: error.message });
  }
}

async function updatePartnerKyc(req, res) {
  try {
    const { id } = req.params;
    const { action, reason } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "partnerId invalido");
    if (!KYC_ACTIONS.has(String(action))) {
      return sendError(res, 400, "Acao de KYC invalida (approve|reject|suspend|reset)");
    }
    if ((action === "reject" || action === "suspend") && !normalizeText(reason, 500)) {
      return sendError(res, 400, "Motivo e obrigatorio para reprovar ou suspender KYC");
    }

    const partner = await Partner.findById(id);
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    const normalizedReason = normalizeText(reason, 500);
    const map = {
      approve: "approved",
      reject: "rejected",
      suspend: "suspended",
      reset: "pending",
    };
    partner.kyc.status = map[action];
    partner.kyc.rejectionReason = action === "reject" || action === "suspend" ? normalizedReason : "";
    partner.kyc.reviewedAt = new Date();
    const reviewerId = reviewerObjectId(req);
    if (reviewerId) partner.kyc.reviewedBy = reviewerId;
    partner.kyc.reviewHistory.push({
      action,
      reason: normalizedReason,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    });

    // Conveniência: aprovar KYC ativa parceiro em análise; suspender pausa.
    if (action === "approve" && partner.status === "under_review") {
      partner.status = "active";
    }
    if (action === "suspend" && partner.status === "active") {
      partner.status = "paused";
    }

    await partner.save();
    return res.json({ success: true, data: partner, partner });
  } catch (error) {
    console.error("Erro ao atualizar KYC do parceiro:", error);
    return sendError(res, 500, "Erro ao atualizar KYC", { details: error.message });
  }
}

async function updatePartnerStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "partnerId invalido");
    if (!PARTNER_STATUSES.has(String(status))) {
      return sendError(res, 400, "Status de parceiro invalido");
    }

    const partner = await Partner.findById(id);
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    partner.status = String(status);
    partner.statusReason = normalizeText(reason, 500);

    // Pausar/bloquear o parceiro pausa as lojas dele (some para o cliente).
    if (status === "blocked" || status === "paused") {
      await Store.updateMany(
        { partnerId: id, status: "active" },
        { $set: { status: "paused" } },
      );
    }

    await partner.save();
    return res.json({ success: true, data: partner, partner });
  } catch (error) {
    console.error("Erro ao atualizar status do parceiro:", error);
    return sendError(res, 500, "Erro ao atualizar status", { details: error.message });
  }
}

// ---------------------------------------------------------------------------
// Categorias (incl. comissão padrão)
// ---------------------------------------------------------------------------

async function listCategories(req, res) {
  try {
    const query = {};
    if (req.query.kind && CATEGORY_KINDS.has(String(req.query.kind))) {
      query.kind = String(req.query.kind);
    }
    const categories = await Category.find(query).sort({ kind: 1, order: 1, name: 1 }).lean();
    return res.json({ success: true, data: categories, categories });
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    return sendError(res, 500, "Erro ao listar categorias", { details: error.message });
  }
}

async function createCategory(req, res) {
  try {
    const { slug, name, kind, parentId, icon, order, defaultCommissionPct } = req.body || {};
    const normalizedSlug = normalizeText(slug, 60).toLowerCase().replace(/\s+/g, "-");
    const normalizedName = normalizeText(name, 80);
    if (!normalizedSlug) return sendError(res, 400, "slug e obrigatorio");
    if (!normalizedName) return sendError(res, 400, "nome e obrigatorio");
    if (kind && !CATEGORY_KINDS.has(String(kind))) return sendError(res, 400, "kind invalido");

    const pct = parsePct(defaultCommissionPct);
    if (pct.error) return sendError(res, 400, "defaultCommissionPct deve ser 0..100");

    const exists = await Category.findOne({ slug: normalizedSlug });
    if (exists) return sendError(res, 409, "Ja existe categoria com este slug");

    const category = await Category.create({
      slug: normalizedSlug,
      name: normalizedName,
      kind: kind || "store",
      parentId: mongoose.isValidObjectId(parentId) ? parentId : null,
      icon: normalizeText(icon, 40) || "store",
      order: Number(order) || 0,
      defaultCommissionPct: pct.clear ? null : pct.value,
    });

    return res.status(201).json({ success: true, data: category, category });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return sendError(res, 500, "Erro ao criar categoria", { details: error.message });
  }
}

async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "categoryId invalido");

    const category = await Category.findById(id);
    if (!category) return sendError(res, 404, "Categoria nao encontrada");

    const { name, icon, order, active, defaultCommissionPct } = req.body || {};
    if (name !== undefined) category.name = normalizeText(name, 80) || category.name;
    if (icon !== undefined) category.icon = normalizeText(icon, 40) || category.icon;
    if (order !== undefined) category.order = Number(order) || 0;
    if (active !== undefined) category.active = Boolean(active);
    if (defaultCommissionPct !== undefined) {
      const pct = parsePct(defaultCommissionPct);
      if (pct.error) return sendError(res, 400, "defaultCommissionPct deve ser 0..100");
      category.defaultCommissionPct = pct.clear ? null : pct.value;
    }

    await category.save();
    return res.json({ success: true, data: category, category });
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return sendError(res, 500, "Erro ao atualizar categoria", { details: error.message });
  }
}

// ---------------------------------------------------------------------------
// Lojas — comissão override + listagem
// ---------------------------------------------------------------------------

async function listStores(req, res) {
  try {
    const query = {};
    if (req.query.partnerId && mongoose.isValidObjectId(req.query.partnerId)) {
      query.partnerId = req.query.partnerId;
    }
    if (req.query.status) query.status = String(req.query.status);

    const stores = await Store.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("categoryId", "name slug defaultCommissionPct")
      .lean();

    return res.json({ success: true, data: stores, stores });
  } catch (error) {
    console.error("Erro ao listar lojas:", error);
    return sendError(res, 500, "Erro ao listar lojas", { details: error.message });
  }
}

async function createStore(req, res) {
  try {
    const {
      partnerId,
      categoryId,
      name,
      description,
      address,
      cityId,
      commissionPct,
      minOrderValue,
      prepTimeMinutes,
      deliveryMode,
    } = req.body || {};

    if (!mongoose.isValidObjectId(partnerId)) return sendError(res, 400, "partnerId invalido");
    if (!mongoose.isValidObjectId(categoryId)) return sendError(res, 400, "categoryId invalido");

    const partner = await Partner.findById(partnerId).select("_id status");
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    const category = await Category.findById(categoryId).select("_id kind active");
    if (!category || category.kind !== "store" || category.active === false) {
      return sendError(res, 400, "Categoria de loja invalida ou inativa");
    }

    const normalizedName = normalizeText(name, 120);
    if (!normalizedName) return sendError(res, 400, "Nome da loja e obrigatorio");

    const pct = parsePct(commissionPct);
    if (pct.error) return sendError(res, 400, "commissionPct deve ser 0..100 (ou null para herdar)");

    const location = parseLocation(req.body);
    if (location?.error) return sendError(res, 400, location.error);

    const store = await Store.create({
      partnerId,
      categoryId,
      name: normalizedName,
      slug: await buildUniqueStoreSlug(normalizedName),
      description: normalizeText(description, 500),
      address: {
        street: normalizeText(address?.street, 120),
        number: normalizeText(address?.number, 20),
        complement: normalizeText(address?.complement, 80),
        neighborhood: normalizeText(address?.neighborhood, 80),
        city: normalizeText(address?.city, 80),
        state: normalizeText(address?.state, 2).toUpperCase(),
        zipCode: normalizeText(address?.zipCode, 16),
      },
      location,
      cityId: mongoose.isValidObjectId(cityId) ? cityId : null,
      commissionPct: pct.clear ? null : pct.value,
      minOrderValue: Math.max(0, Number(minOrderValue) || 0),
      prepTimeMinutes: Math.max(0, Number(prepTimeMinutes) || 25),
      deliveryMode: ["platform", "pickup", "both"].includes(deliveryMode) ? deliveryMode : "platform",
      status: partner.status === "active" ? "under_review" : "under_review",
    });

    return res.status(201).json({ success: true, data: store, store });
  } catch (error) {
    console.error("Erro ao criar loja:", error);
    return sendError(res, 500, "Erro ao criar loja", { details: error.message });
  }
}

async function updateStoreStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "storeId invalido");
    if (!STORE_STATUSES.has(String(status))) return sendError(res, 400, "Status de loja invalido");

    const store = await Store.findById(id);
    if (!store) return sendError(res, 404, "Loja nao encontrada");

    const partner = await Partner.findById(store.partnerId).select("status kyc.status");
    if (status === "active" && (!partner || partner.status !== "active" || partner.kyc?.status !== "approved")) {
      return sendError(res, 400, "A loja so pode ser ativada com parceiro ativo e KYC aprovado");
    }

    store.status = String(status);
    await store.save();
    return res.json({ success: true, data: store, store });
  } catch (error) {
    console.error("Erro ao atualizar status da loja:", error);
    return sendError(res, 500, "Erro ao atualizar status da loja", { details: error.message });
  }
}

async function setStoreCommission(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return sendError(res, 400, "storeId invalido");

    const pct = parsePct(req.body?.commissionPct);
    if (pct.error) return sendError(res, 400, "commissionPct deve ser 0..100 (ou null para herdar)");

    const store = await Store.findById(id);
    if (!store) return sendError(res, 404, "Loja nao encontrada");

    store.commissionPct = pct.clear ? null : pct.value;
    await store.save();

    const resolved = await resolveStoreCommission(id);
    return res.json({ success: true, data: store, store, resolved });
  } catch (error) {
    console.error("Erro ao definir comissao da loja:", error);
    return sendError(res, 500, "Erro ao definir comissao", { details: error.message });
  }
}

// Pré-visualiza a comissão efetiva de uma loja (de onde vem o percentual).
async function previewStoreCommission(req, res) {
  try {
    const { storeId } = req.query;
    if (!mongoose.isValidObjectId(storeId)) return sendError(res, 400, "storeId invalido");
    const resolved = await resolveStoreCommission(storeId);
    if (!resolved) return sendError(res, 404, "Loja nao encontrada");
    return res.json({ success: true, data: resolved, resolved });
  } catch (error) {
    console.error("Erro ao resolver comissao:", error);
    return sendError(res, 500, "Erro ao resolver comissao", { details: error.message });
  }
}

module.exports = {
  listPartners,
  getPartner,
  createPartner,
  updatePartnerKyc,
  updatePartnerStatus,
  listCategories,
  createCategory,
  updateCategory,
  listStores,
  createStore,
  updateStoreStatus,
  setStoreCommission,
  previewStoreCommission,
};
