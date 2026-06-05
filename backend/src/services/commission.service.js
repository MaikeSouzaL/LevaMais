const Store = require("../models/Store");
const Category = require("../models/Category");
const { getRuntimeConfig } = require("./platformConfig.service");

// Resolução e cálculo da comissão do marketplace (Fase D).
// Precedência: Store.commissionPct > Category.defaultCommissionPct > PlatformConfig.marketplace.defaultCommissionPct.
// Usado na config admin (D1) e na captura do pedido (D4).

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function isValidPct(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0;
}

// Resolve o percentual aplicável a partir de objetos já carregados.
function resolveCommissionPct({ store, category, config } = {}) {
  if (store && isValidPct(store.commissionPct)) return Number(store.commissionPct);
  if (category && isValidPct(category.defaultCommissionPct)) return Number(category.defaultCommissionPct);
  const fallback = config?.marketplace?.defaultCommissionPct;
  return isValidPct(fallback) ? Number(fallback) : 12;
}

// Quebra a comissão sobre a base (subtotal por padrão) e calcula o repasse ao parceiro.
function computeCommission(base, pct) {
  const safeBase = Math.max(0, Number(base) || 0);
  const safePct = Math.max(0, Number(pct) || 0);
  const commissionAmount = round2((safeBase * safePct) / 100);
  return {
    commissionPct: safePct,
    commissionAmount,
    partnerPayout: round2(safeBase - commissionAmount),
  };
}

// Resolve a comissão de uma loja consultando Store + Category + PlatformConfig.
// Retorna { pct, source } para exibir no admin de onde veio o percentual.
async function resolveStoreCommission(storeId) {
  const store = await Store.findById(storeId).select("commissionPct categoryId").lean();
  if (!store) return null;

  if (isValidPct(store.commissionPct)) {
    return { pct: Number(store.commissionPct), source: "store" };
  }

  let category = null;
  if (store.categoryId) {
    category = await Category.findById(store.categoryId).select("defaultCommissionPct").lean();
    if (category && isValidPct(category.defaultCommissionPct)) {
      return { pct: Number(category.defaultCommissionPct), source: "category" };
    }
  }

  const config = await getRuntimeConfig();
  return {
    pct: resolveCommissionPct({ store, category, config }),
    source: "platform",
  };
}

module.exports = {
  round2,
  isValidPct,
  resolveCommissionPct,
  computeCommission,
  resolveStoreCommission,
};
