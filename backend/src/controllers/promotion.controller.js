const Ride = require("../models/Ride");
const Promotion = require("../models/Promotion");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function normalizeCode(rawCode) {
  return String(rawCode || "")
    .trim()
    .toUpperCase();
}

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function isPromotionActiveNow(promotion, now = new Date()) {
  if (!promotion || !promotion.isActive) return false;
  if (promotion.startsAt && new Date(promotion.startsAt) > now) return false;
  if (promotion.endsAt && new Date(promotion.endsAt) < now) return false;
  return true;
}

function computeDiscount(promotion, amount) {
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

async function countUserUsage(promotion, userId) {
  const rideCount = await Ride.countDocuments({
    clientId: userId,
    "promotion.promotionId": promotion._id,
  });
  let orderCount = 0;
  try {
    const StoreOrder = require("../models/StoreOrder");
    orderCount = await StoreOrder.countDocuments({
      clientId: userId,
      "pricing.promotionCode": promotion.code,
      status: { $nin: ["cancelled", "refunded"] },
    });
  } catch (err) {
    console.error("Erro ao contar uso de cupom no StoreOrder:", err);
  }
  return rideCount + orderCount;
}

async function ensureDefaultPromotions() {
  const count = await Promotion.countDocuments();
  if (count > 0) return;

  const defaults = [
    {
      code: "LEVA10",
      title: "Leva 10",
      description: "R$ 10 de desconto na proxima corrida",
      discountType: "fixed",
      discountValue: 10,
      minOrderValue: 20,
      perUserLimit: 1,
    },
    {
      code: "ENTREGA5",
      title: "Entrega 5",
      description: "R$ 5 de desconto para entregas",
      discountType: "fixed",
      discountValue: 5,
      minOrderValue: 15,
      serviceTypes: ["delivery"],
      perUserLimit: 2,
    },
    {
      code: "VOLTEI",
      title: "Voltei",
      description: "8% off para clientes recorrentes",
      discountType: "percentage",
      discountValue: 8,
      maxDiscount: 20,
      minOrderValue: 25,
      perUserLimit: 3,
    },
  ];

  await Promotion.insertMany(defaults, { ordered: false });
}

class PromotionController {
  async list(req, res) {
    try {
      await ensureDefaultPromotions();

      const now = new Date();
      const promotions = await Promotion.find({ isActive: true }).sort({
        createdAt: -1,
      });

      const eligible = promotions.filter((promotion) =>
        isPromotionActiveNow(promotion, now),
      );

      const payload = eligible.map((promotion) => ({
        code: promotion.code,
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        maxDiscount: promotion.maxDiscount,
        minOrderValue: promotion.minOrderValue,
        serviceTypes: promotion.serviceTypes || [],
      }));

      return res.json({
        success: true,
        promotions: payload,
      });
    } catch (error) {
      console.error("Erro ao listar promocoes:", error);
      return sendError(res, 500, "Erro ao listar promocoes", {
        details: error.message,
      });
    }
  }

  async validate(req, res) {
    try {
      await ensureDefaultPromotions();

      const userId = req.user.id;
      const code = normalizeCode(req.params.code);
      const amount = Number(req.query.amount);
      const hasAmount = Number.isFinite(amount) && amount > 0;
      const serviceType = String(req.query.serviceType || "")
        .trim()
        .toLowerCase();

      if (!code) {
        return sendError(res, 400, "Codigo promocional invalido");
      }
      const promotion = await Promotion.findOne({ code });
      if (!promotion) {
        return sendError(res, 404, "Cupom nao encontrado");
      }

      if (!isPromotionActiveNow(promotion)) {
        return sendError(res, 400, "Cupom inativo ou expirado");
      }

      if (
        Array.isArray(promotion.serviceTypes) &&
        promotion.serviceTypes.length > 0 &&
        serviceType &&
        !promotion.serviceTypes.includes(serviceType)
      ) {
        return sendError(res, 400, "Cupom nao e valido para este servico");
      }

      const queryStoreId = req.query.storeId;
      const queryCategoryId = req.query.categoryId;

      if (promotion.storeId && queryStoreId && String(promotion.storeId) !== String(queryStoreId)) {
        return sendError(res, 400, "Cupom nao e valido para esta loja");
      }
      if (promotion.categoryId && queryCategoryId && String(promotion.categoryId) !== String(queryCategoryId)) {
        return sendError(res, 400, "Cupom nao e valido para esta categoria");
      }

      const referenceAmount = hasAmount
        ? amount
        : Math.max(Number(promotion.minOrderValue || 0), 50);

      if (hasAmount && referenceAmount < Number(promotion.minOrderValue || 0)) {
        return sendError(
          res,
          400,
          `Valor minimo para este cupom: R$ ${Number(
            promotion.minOrderValue || 0,
          ).toFixed(2)}`,
        );
      }

      if (
        Number.isFinite(Number(promotion.usageLimit)) &&
        Number(promotion.usageLimit) >= 0 &&
        Number(promotion.usageCount || 0) >= Number(promotion.usageLimit)
      ) {
        return sendError(res, 400, "Cupom esgotado");
      }

      const userUsageCount = await countUserUsage(promotion, userId);
      if (
        Number.isFinite(Number(promotion.perUserLimit)) &&
        Number(promotion.perUserLimit) > 0 &&
        userUsageCount >= Number(promotion.perUserLimit)
      ) {
        return sendError(res, 400, "Limite de uso deste cupom atingido");
      }

      const discount = computeDiscount(promotion, referenceAmount);
      const finalAmount = toMoney(Math.max(0, referenceAmount - discount));

      return res.json({
        success: true,
        promotion: {
          code: promotion.code,
          title: promotion.title,
          description: promotion.description,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          discountAmount: discount,
          finalAmount,
          referenceAmount,
          hasAmount,
        },
      });
    } catch (error) {
      console.error("Erro ao validar promocao:", error);
      return sendError(res, 500, "Erro ao validar promocao", {
        details: error.message,
      });
    }
  }
}

module.exports = new PromotionController();
