const mongoose = require("mongoose");
const crypto = require("crypto");
const Partner = require("../models/Partner");
const Store = require("../models/Store");
const StoreProduct = require("../models/StoreProduct");
const Category = require("../models/Category");

const DELIVERY_MODES = new Set(["platform", "pickup", "both"]);
const OVERRIDES = new Set(["auto", "force_open", "force_closed"]);
const UNITS = new Set(["unit", "kg", "g", "l", "ml", "service"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function normalizeText(value, maxLength) {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : "";
}

function normalizeNumber(value, fallback, min = 0, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

function documentHash(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return crypto.createHash("sha256").update(digits).digest("hex");
}

function normalizeHours(hours) {
  if (hours === undefined) return undefined;
  if (!Array.isArray(hours)) return { error: "hours deve ser uma lista" };

  const normalized = [];
  for (const item of hours.slice(0, 21)) {
    const weekday = Number(item?.weekday);
    const open = normalizeText(item?.open, 5);
    const close = normalizeText(item?.close, 5);
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return { error: "weekday deve estar entre 0 e 6" };
    }
    if (!/^\d{2}:\d{2}$/.test(open) || !/^\d{2}:\d{2}$/.test(close) || open >= close) {
      return { error: "Horario invalido. Use HH:mm e fechamento apos abertura" };
    }
    normalized.push({ weekday, open, close });
  }
  return normalized;
}

function isStoreOpenNow(store, now = new Date()) {
  if (store.isOpenManualOverride === "force_open") return true;
  if (store.isOpenManualOverride === "force_closed") return false;

  const weekday = now.getDay();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const current = `${hh}:${mm}`;
  return (store.hours || []).some((h) => h.weekday === weekday && h.open <= current && h.close > current);
}

function buildReadiness(partner, store) {
  const activePartner = partner.status === "active" && partner.kyc?.status === "approved";
  const activeStore = store.status === "active";
  const openNow = isStoreOpenNow(store);
  const canSell = activePartner && activeStore && openNow;

  return {
    canSell,
    activePartner,
    activeStore,
    openNow,
    reason: canSell
      ? ""
      : !activePartner
        ? "Parceiro precisa estar ativo e com KYC aprovado"
        : !activeStore
          ? "Loja precisa estar ativa"
          : "Loja esta fora do horario de funcionamento",
  };
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return undefined;
  return tags.map((tag) => normalizeText(tag, 32)).filter(Boolean).slice(0, 12);
}

function normalizeAddress(address = {}) {
  return {
    street: normalizeText(address.street, 120),
    number: normalizeText(address.number, 20),
    complement: normalizeText(address.complement, 80),
    neighborhood: normalizeText(address.neighborhood, 80),
    city: normalizeText(address.city, 80),
    state: normalizeText(address.state, 2).toUpperCase(),
    zipCode: normalizeText(address.zipCode, 16),
  };
}

function normalizeModifierGroups(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) return { error: "modifierGroups deve ser uma lista" };

  const groups = [];
  for (const group of value.slice(0, 20)) {
    const name = normalizeText(group?.name, 80);
    if (!name) return { error: "Grupo de adicional precisa de nome" };
    const min = normalizeNumber(group?.min, 0, 0, 99);
    const max = normalizeNumber(group?.max, 1, 1, 99);
    if (max < min) return { error: "max do adicional nao pode ser menor que min" };

    const options = Array.isArray(group?.options) ? group.options.slice(0, 100) : [];
    groups.push({
      name,
      min,
      max,
      options: options.map((option) => ({
        name: normalizeText(option?.name, 80),
        priceDelta: normalizeNumber(option?.priceDelta, 0, -99999, 99999),
        available: option?.available !== false,
      })).filter((option) => option.name),
    });
  }
  return groups;
}

async function resolvePartner(req, res, next) {
  try {
    const partner = await Partner.findOne({ ownerUserId: req.user.id });
    if (!partner) {
      return sendError(res, 403, "Usuario nao possui parceiro vinculado");
    }
    req.partner = partner;
    return next();
  } catch (error) {
    console.error("Erro ao resolver parceiro:", error);
    return sendError(res, 500, "Erro ao resolver parceiro", { details: error.message });
  }
}

async function getOwnedStore(partnerId, storeId) {
  if (!mongoose.isValidObjectId(storeId)) return null;
  return Store.findOne({ _id: storeId, partnerId });
}

async function validateProductCategory(categoryId) {
  if (!categoryId) return null;
  if (!mongoose.isValidObjectId(categoryId)) return { error: "categoryId invalido" };
  const category = await Category.findById(categoryId).select("_id kind active");
  if (!category || category.kind !== "product" || category.active === false) {
    return { error: "Categoria de produto invalida ou inativa" };
  }
  return category._id;
}

async function createOnboarding(req, res) {
  try {
    const { legalName, tradeName, document, contact, payout } = req.body || {};
    const normalizedLegal = normalizeText(legalName, 160);
    const normalizedTrade = normalizeText(tradeName, 120);
    if (!normalizedLegal) return sendError(res, 400, "Razao social e obrigatoria");
    if (!normalizedTrade) return sendError(res, 400, "Nome fantasia e obrigatorio");

    const existing = await Partner.findOne({ ownerUserId: req.user.id });
    if (existing) {
      return sendError(res, 409, "Usuario ja possui parceiro vinculado", { partner: existing });
    }

    const normalizedDocument = normalizeText(document, 32);
    const hash = documentHash(normalizedDocument);
    if (hash && await Partner.exists({ documentHash: hash })) {
      return sendError(res, 409, "Ja existe parceiro cadastrado com este documento");
    }

    const partner = await Partner.create({
      ownerUserId: req.user.id,
      legalName: normalizedLegal,
      tradeName: normalizedTrade,
      document: normalizedDocument,
      documentHash: hash || undefined,
      contact: {
        email: normalizeText(contact?.email, 160) || req.user.email,
        phone: normalizeText(contact?.phone, 32),
        whatsapp: normalizeText(contact?.whatsapp, 32),
      },
      payout: {
        method: payout?.method === "pix" ? "pix" : "wallet",
        pixKey: normalizeText(payout?.pixKey, 160),
      },
      status: "under_review",
      kyc: { status: "pending", submittedAt: new Date() },
    });

    return res.status(201).json({ success: true, data: partner, partner });
  } catch (error) {
    console.error("Erro no onboarding do parceiro:", error);
    return sendError(res, 500, "Erro no onboarding do parceiro", { details: error.message });
  }
}

async function getMe(req, res) {
  const stores = await Store.find({ partnerId: req.partner._id })
    .sort({ createdAt: -1 })
    .populate("categoryId", "name slug icon")
    .lean();
  return res.json({ success: true, data: { partner: req.partner, stores }, partner: req.partner, stores });
}

async function getStore(req, res) {
  const store = await getOwnedStore(req.partner._id, req.params.storeId);
  if (!store) return sendError(res, 404, "Loja nao encontrada");
  const readiness = buildReadiness(req.partner, store);
  return res.json({ success: true, data: { store, readiness }, store, readiness });
}

async function updateStore(req, res) {
  try {
    const store = await getOwnedStore(req.partner._id, req.params.storeId);
    if (!store) return sendError(res, 404, "Loja nao encontrada");

    const body = req.body || {};
    const hours = normalizeHours(body.hours);
    if (hours?.error) return sendError(res, 400, hours.error);

    if (body.description !== undefined) store.description = normalizeText(body.description, 500);
    if (body.logo !== undefined) store.logo = normalizeText(body.logo, 500);
    if (body.cover !== undefined) store.cover = normalizeText(body.cover, 500);
    if (body.address !== undefined) store.address = normalizeAddress(body.address);
    if (hours !== undefined) store.hours = hours;
    if (body.prepTimeMinutes !== undefined) {
      store.prepTimeMinutes = normalizeNumber(body.prepTimeMinutes, store.prepTimeMinutes, 0, 240);
    }
    if (body.minOrderValue !== undefined) {
      store.minOrderValue = normalizeNumber(body.minOrderValue, store.minOrderValue, 0, 999999);
    }
    if (body.deliveryMode !== undefined) {
      if (!DELIVERY_MODES.has(String(body.deliveryMode))) return sendError(res, 400, "deliveryMode invalido");
      store.deliveryMode = String(body.deliveryMode);
    }
    const tags = normalizeTags(body.tags);
    if (tags !== undefined) store.tags = tags;

    await store.save();
    const readiness = buildReadiness(req.partner, store);
    return res.json({ success: true, data: { store, readiness }, store, readiness });
  } catch (error) {
    console.error("Erro ao atualizar loja do parceiro:", error);
    return sendError(res, 500, "Erro ao atualizar loja", { details: error.message });
  }
}

async function updateAvailability(req, res) {
  const store = await getOwnedStore(req.partner._id, req.params.storeId);
  if (!store) return sendError(res, 404, "Loja nao encontrada");

  const override = String(req.body?.isOpenManualOverride || req.body?.availability || "");
  if (!OVERRIDES.has(override)) return sendError(res, 400, "Disponibilidade invalida");
  store.isOpenManualOverride = override;
  await store.save();

  const readiness = buildReadiness(req.partner, store);
  return res.json({ success: true, data: { store, readiness }, store, readiness });
}

async function listProducts(req, res) {
  const store = await getOwnedStore(req.partner._id, req.params.storeId);
  if (!store) return sendError(res, 404, "Loja nao encontrada");
  const products = await StoreProduct.find({ storeId: store._id })
    .sort({ order: 1, name: 1 })
    .populate("categoryId", "name slug")
    .lean();
  return res.json({ success: true, data: products, products });
}

async function createProduct(req, res) {
  try {
    const store = await getOwnedStore(req.partner._id, req.params.storeId);
    if (!store) return sendError(res, 404, "Loja nao encontrada");

    const name = normalizeText(req.body?.name, 120);
    const basePrice = Number(req.body?.basePrice);
    if (!name) return sendError(res, 400, "Nome do produto e obrigatorio");
    if (!Number.isFinite(basePrice) || basePrice < 0) return sendError(res, 400, "Preco base invalido");

    const categoryId = await validateProductCategory(req.body?.categoryId);
    if (categoryId?.error) return sendError(res, 400, categoryId.error);
    const modifierGroups = normalizeModifierGroups(req.body?.modifierGroups);
    if (modifierGroups?.error) return sendError(res, 400, modifierGroups.error);
    const unit = UNITS.has(String(req.body?.unit)) ? String(req.body.unit) : "unit";

    const product = await StoreProduct.create({
      storeId: store._id,
      categoryId,
      name,
      description: normalizeText(req.body?.description, 1000),
      photo: normalizeText(req.body?.photo, 500),
      basePrice,
      unit,
      sku: normalizeText(req.body?.sku, 80),
      modifierGroups: modifierGroups || [],
      requiresConfirmation: Boolean(req.body?.requiresConfirmation),
      available: req.body?.available !== false,
      stock: req.body?.stock === null ? null : normalizeNumber(req.body?.stock, null, 0, 999999),
      order: normalizeNumber(req.body?.order, 0, -9999, 9999),
    });

    return res.status(201).json({ success: true, data: product, product });
  } catch (error) {
    console.error("Erro ao criar produto do parceiro:", error);
    return sendError(res, 500, "Erro ao criar produto", { details: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return sendError(res, 400, "productId invalido");
    const product = await StoreProduct.findById(req.params.productId);
    if (!product) return sendError(res, 404, "Produto nao encontrado");

    const store = await getOwnedStore(req.partner._id, product.storeId);
    if (!store) return sendError(res, 403, "Produto nao pertence a este parceiro");

    const body = req.body || {};
    if (body.categoryId !== undefined) {
      const categoryId = await validateProductCategory(body.categoryId);
      if (categoryId?.error) return sendError(res, 400, categoryId.error);
      product.categoryId = categoryId;
    }
    const modifierGroups = normalizeModifierGroups(body.modifierGroups);
    if (modifierGroups?.error) return sendError(res, 400, modifierGroups.error);

    if (body.name !== undefined) product.name = normalizeText(body.name, 120) || product.name;
    if (body.description !== undefined) product.description = normalizeText(body.description, 1000);
    if (body.photo !== undefined) product.photo = normalizeText(body.photo, 500);
    if (body.basePrice !== undefined) {
      const basePrice = Number(body.basePrice);
      if (!Number.isFinite(basePrice) || basePrice < 0) return sendError(res, 400, "Preco base invalido");
      product.basePrice = basePrice;
    }
    if (body.unit !== undefined) {
      if (!UNITS.has(String(body.unit))) return sendError(res, 400, "Unidade invalida");
      product.unit = String(body.unit);
    }
    if (body.sku !== undefined) product.sku = normalizeText(body.sku, 80);
    if (modifierGroups !== undefined) product.modifierGroups = modifierGroups;
    if (body.requiresConfirmation !== undefined) product.requiresConfirmation = Boolean(body.requiresConfirmation);
    if (body.available !== undefined) product.available = Boolean(body.available);
    if (body.stock !== undefined) product.stock = body.stock === null ? null : normalizeNumber(body.stock, null, 0, 999999);
    if (body.order !== undefined) product.order = normalizeNumber(body.order, 0, -9999, 9999);

    await product.save();
    return res.json({ success: true, data: product, product });
  } catch (error) {
    console.error("Erro ao atualizar produto do parceiro:", error);
    return sendError(res, 500, "Erro ao atualizar produto", { details: error.message });
  }
}

async function deleteProduct(req, res) {
  if (!mongoose.isValidObjectId(req.params.productId)) return sendError(res, 400, "productId invalido");
  const product = await StoreProduct.findById(req.params.productId);
  if (!product) return sendError(res, 404, "Produto nao encontrado");

  const store = await getOwnedStore(req.partner._id, product.storeId);
  if (!store) return sendError(res, 403, "Produto nao pertence a este parceiro");
  product.available = false;
  await product.save();
  return res.json({ success: true, data: product, product });
}

module.exports = {
  resolvePartner,
  createOnboarding,
  getMe,
  getStore,
  updateStore,
  updateAvailability,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  isStoreOpenNow,
  buildReadiness,
};
