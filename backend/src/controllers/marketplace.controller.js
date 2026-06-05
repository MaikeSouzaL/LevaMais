const mongoose = require("mongoose");
const Category = require("../models/Category");
const Store = require("../models/Store");
const Partner = require("../models/Partner");
const StoreProduct = require("../models/StoreProduct");
const { isStoreOpenNow, buildReadiness } = require("./partner.controller");
const StoreOrder = require("../models/StoreOrder");
const Promotion = require("../models/Promotion");
const walletEscrow = require("../services/walletEscrow.service");
const { calculateDeliveryPricingSnapshot } = require("../services/delivery-pricing.service");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

async function getCategories(req, res) {
  try {
    const categories = await Category.find({ kind: "store", active: true })
      .sort({ order: 1, name: 1 })
      .lean();
    return res.json({ success: true, data: categories, categories });
  } catch (error) {
    console.error("Erro ao listar categorias de marketplace:", error);
    return sendError(res, 500, "Erro ao listar categorias", { details: error.message });
  }
}

async function getStores(req, res) {
  try {
    const { cityId, categoryId, lat, lng, q } = req.query || {};
    const query = { status: "active" };

    if (cityId && mongoose.isValidObjectId(cityId)) {
      query.cityId = cityId;
    }
    if (categoryId && mongoose.isValidObjectId(categoryId)) {
      query.categoryId = categoryId;
    }
    if (q) {
      const escaped = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.name = { $regex: escaped, $options: "i" };
    }

    if (lat && lng) {
      const latValue = parseFloat(lat);
      const lngValue = parseFloat(lng);
      if (!Number.isNaN(latValue) && !Number.isNaN(lngValue)) {
        query.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lngValue, latValue],
            },
            $maxDistance: 100000, // Raio máximo de 100km
          },
        };
      }
    }

    const storesRaw = await Store.find(query)
      .populate("categoryId", "name slug icon")
      .lean();

    // Buscar parceiros vinculados para checar o KYC e se o parceiro está ativo
    const partnerIds = [...new Set(storesRaw.map((s) => s.partnerId.toString()))];
    const partners = await Partner.find({ _id: { $in: partnerIds } }).lean();
    const partnerMap = new Map(partners.map((p) => [p._id.toString(), p]));

    const stores = storesRaw
      .map((store) => {
        const partner = partnerMap.get(store.partnerId.toString());
        if (!partner) return null;
        const readiness = buildReadiness(partner, store);
        return {
          ...store,
          readiness,
          openNow: readiness.openNow,
          canSell: readiness.canSell,
        };
      })
      .filter(Boolean);

    return res.json({ success: true, data: stores, stores });
  } catch (error) {
    console.error("Erro ao listar lojas de marketplace:", error);
    return sendError(res, 500, "Erro ao listar lojas", { details: error.message });
  }
}

async function getStoreBySlug(req, res) {
  try {
    const { slug } = req.params;
    if (!slug) return sendError(res, 400, "Slug e obrigatorio");

    const store = await Store.findOne({ slug: String(slug).toLowerCase() })
      .populate("categoryId", "name slug icon")
      .lean();

    if (!store) return sendError(res, 404, "Loja nao encontrada");

    const partner = await Partner.findById(store.partnerId).lean();
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    const readiness = buildReadiness(partner, store);
    return res.json({ success: true, data: { store, readiness }, store, readiness });
  } catch (error) {
    console.error("Erro ao buscar loja por slug:", error);
    return sendError(res, 500, "Erro ao buscar loja", { details: error.message });
  }
}

async function getStoreProducts(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "ID de loja invalido");
    }

    const products = await StoreProduct.find({ storeId: id, available: true })
      .populate("categoryId", "name slug")
      .sort({ order: 1, name: 1 })
      .lean();

    return res.json({ success: true, data: products, products });
  } catch (error) {
    console.error("Erro ao listar produtos da loja:", error);
    return sendError(res, 500, "Erro ao listar produtos da loja", { details: error.message });
  }
}

async function getProductDetail(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "ID de produto invalido");
    }

    const product = await StoreProduct.findOne({ _id: id, available: true })
      .populate("categoryId", "name slug")
      .lean();

    if (!product) return sendError(res, 404, "Produto nao encontrado ou inativo");

    return res.json({ success: true, data: product, product });
  } catch (error) {
    console.error("Erro ao obter detalhe do produto:", error);
    return sendError(res, 500, "Erro ao obter detalhe do produto", { details: error.message });
  }
}

async function validateCart(req, res) {
  try {
    const { storeId, items } = req.body || {};
    if (!mongoose.isValidObjectId(storeId)) {
      return sendError(res, 400, "storeId invalido");
    }
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, "items deve ser uma lista nao vazia");
    }

    const store = await Store.findById(storeId).lean();
    if (!store) return sendError(res, 404, "Loja nao encontrada");

    const partner = await Partner.findById(store.partnerId).lean();
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    const readiness = buildReadiness(partner, store);
    if (!readiness.canSell) {
      return sendError(res, 400, `Loja fechada para vendas: ${readiness.reason}`, { readiness });
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { productId, quantity, modifiers, notes } = item;
      if (!mongoose.isValidObjectId(productId)) {
        return sendError(res, 400, `productId invalido: ${productId}`);
      }

      const product = await StoreProduct.findOne({ _id: productId, storeId, available: true }).lean();
      if (!product) {
        return sendError(res, 400, `Produto inativo ou nao pertence a loja: ${productId}`);
      }

      const q = Math.max(1, parseInt(quantity) || 1);
      let itemTotal = product.basePrice;

      const validatedModifiers = [];
      const modifierGroups = product.modifierGroups || [];
      const selectedModifiers = Array.isArray(modifiers) ? modifiers : [];

      for (const group of modifierGroups) {
        const selectedForGroup = selectedModifiers.filter((m) => m.groupName === group.name);
        if (selectedForGroup.length < group.min) {
          return sendError(res, 400, `Selecao minima para o grupo "${group.name}" do produto "${product.name}" e ${group.min}`);
        }
        if (selectedForGroup.length > group.max) {
          return sendError(res, 400, `Selecao maxima para o grupo "${group.name}" do produto "${product.name}" e ${group.max}`);
        }

        for (const sel of selectedForGroup) {
          const option = group.options.find((o) => o.name === sel.optionName && o.available);
          if (!option) {
            return sendError(res, 400, `Opcao "${sel.optionName}" invalida ou indisponivel no grupo "${group.name}"`);
          }
          itemTotal += option.priceDelta;
          validatedModifiers.push({
            groupName: group.name,
            optionName: option.name,
            priceDelta: option.priceDelta,
          });
        }
      }

      const lineTotal = itemTotal * q;
      subtotal += lineTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: q,
        basePrice: product.basePrice,
        modifiers: validatedModifiers,
        lineTotal,
        notes: notes ? String(notes).slice(0, 200) : "",
      });
    }

    if (subtotal < store.minOrderValue) {
      return sendError(
        res,
        400,
        `Valor do pedido abaixo do minimo exigido pela loja (Minimo: R$ ${store.minOrderValue.toFixed(2)})`,
      );
    }

    const deliveryFee = 0; // Calculado em D4/D5
    const serviceFee = 0;
    const total = subtotal + deliveryFee + serviceFee;

    const data = {
      storeId: store._id,
      storeName: store.name,
      items: validatedItems,
      pricing: {
        subtotal,
        deliveryFee,
        serviceFee,
        total,
      },
    };

    return res.json({ success: true, data, ...data });
  } catch (error) {
    console.error("Erro ao validar carrinho:", error);
    return sendError(res, 500, "Erro ao validar carrinho", { details: error.message });
  }
}

async function createOrder(req, res) {
  try {
    const userId = req.user.id;
    const {
      storeId,
      items,
      paymentMethod = "wallet",
      deliveryMode = "platform",
      address,
      promotionCode,
      scheduledFor,
    } = req.body || {};

    if (!mongoose.isValidObjectId(storeId)) {
      return sendError(res, 400, "storeId invalido");
    }
    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, 400, "items deve ser uma lista nao vazia");
    }

    const store = await Store.findById(storeId);
    if (!store) return sendError(res, 404, "Loja nao encontrada");

    const partner = await Partner.findById(store.partnerId).lean();
    if (!partner) return sendError(res, 404, "Parceiro nao encontrado");

    const readiness = buildReadiness(partner, store);
    if (!readiness.canSell) {
      return sendError(res, 400, `Loja fechada para vendas: ${readiness.reason}`, { readiness });
    }

    if (deliveryMode === "platform") {
      if (!address || !Number.isFinite(address.latitude) || !Number.isFinite(address.longitude)) {
        return sendError(res, 400, "Coordenadas de entrega (latitude/longitude) sao obrigatorias para entrega via plataforma");
      }
    }

    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const { productId, quantity, modifiers, notes } = item;
      if (!mongoose.isValidObjectId(productId)) {
        return sendError(res, 400, `productId invalido: ${productId}`);
      }

      const product = await StoreProduct.findOne({ _id: productId, storeId, available: true }).lean();
      if (!product) {
        return sendError(res, 400, `Produto inativo ou nao pertence a loja: ${productId}`);
      }

      const q = Math.max(1, parseInt(quantity) || 1);
      let itemTotal = product.basePrice;

      const validatedModifiers = [];
      const modifierGroups = product.modifierGroups || [];
      const selectedModifiers = Array.isArray(modifiers) ? modifiers : [];

      for (const group of modifierGroups) {
        const selectedForGroup = selectedModifiers.filter((m) => m.groupName === group.name);
        if (selectedForGroup.length < group.min) {
          return sendError(res, 400, `Selecao minima para o grupo "${group.name}" do produto "${product.name}" e ${group.min}`);
        }
        if (selectedForGroup.length > group.max) {
          return sendError(res, 400, `Selecao maxima para o grupo "${group.name}" do produto "${product.name}" e ${group.max}`);
        }

        for (const sel of selectedForGroup) {
          const option = group.options.find((o) => o.name === sel.optionName && o.available);
          if (!option) {
            return sendError(res, 400, `Opcao "${sel.optionName}" invalida ou indisponivel no grupo "${group.name}"`);
          }
          itemTotal += option.priceDelta;
          validatedModifiers.push({
            groupName: group.name,
            optionName: option.name,
            priceDelta: option.priceDelta,
          });
        }
      }

      const lineTotal = itemTotal * q;
      subtotal += lineTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        quantity: q,
        basePrice: product.basePrice,
        modifiers: validatedModifiers,
        lineTotal,
        notes: notes ? String(notes).slice(0, 200) : "",
      });
    }

    if (subtotal < store.minOrderValue) {
      return sendError(
        res,
        400,
        `Valor do pedido abaixo do minimo exigido pela loja (Minimo: R$ ${store.minOrderValue.toFixed(2)})`
      );
    }

    // 1) Calculo da taxa de entrega
    let deliveryFee = 0;
    if (deliveryMode === "platform") {
      try {
        const pricing = await calculateDeliveryPricingSnapshot({
          serviceType: "delivery",
          vehicleType: "motorcycle",
          pickup: {
            latitude: store.location.coordinates[1],
            longitude: store.location.coordinates[0],
          },
          dropoff: {
            latitude: address.latitude,
            longitude: address.longitude,
          },
        });
        deliveryFee = pricing?.pricing?.total || 0;
      } catch (err) {
        console.warn("[createOrder] Falha ao calcular frete no Maps, usando fallback de R$ 5.00:", err.message);
        deliveryFee = 5.00;
      }
    }

    // 2) Validacao de Cupom
    let discountAmount = 0;
    let promoCodeNormalized = "";
    let promotion = null;
    if (promotionCode) {
      promoCodeNormalized = String(promotionCode).trim().toUpperCase();
      promotion = await Promotion.findOne({ code: promoCodeNormalized });
      if (!promotion) {
        return sendError(res, 400, "Cupom invalido ou nao encontrado");
      }
      if (!promotion.isActive) {
        return sendError(res, 400, "Cupom inativo ou expirado");
      }
      if (promotion.startsAt && new Date(promotion.startsAt) > new Date()) {
        return sendError(res, 400, "Cupom inativo ou expirado");
      }
      if (promotion.endsAt && new Date(promotion.endsAt) < new Date()) {
        return sendError(res, 400, "Cupom inativo ou expirado");
      }
      if (Array.isArray(promotion.serviceTypes) && promotion.serviceTypes.length > 0 && !promotion.serviceTypes.includes("marketplace")) {
        return sendError(res, 400, "Cupom nao e valido para marketplace");
      }
      if (promotion.storeId && String(promotion.storeId) !== String(storeId)) {
        return sendError(res, 400, "Cupom nao e valido para esta loja");
      }
      if (promotion.categoryId && String(promotion.categoryId) !== String(store.categoryId)) {
        return sendError(res, 400, "Cupom nao e valido para esta categoria");
      }
      if (subtotal < Number(promotion.minOrderValue || 0)) {
        return sendError(res, 400, `Valor minimo de subtotal para usar este cupom: R$ ${Number(promotion.minOrderValue || 0).toFixed(2)}`);
      }
      if (Number.isFinite(Number(promotion.usageLimit)) && Number(promotion.usageLimit) >= 0 && Number(promotion.usageCount || 0) >= Number(promotion.usageLimit)) {
        return sendError(res, 400, "Cupom esgotado");
      }

      // Contar uso do usuario
      let rideCount = 0;
      try {
        const Ride = require("../models/Ride");
        rideCount = await Ride.countDocuments({
          clientId: userId,
          "promotion.promotionId": promotion._id,
        });
      } catch (e) {}

      const orderCount = await StoreOrder.countDocuments({
        clientId: userId,
        "pricing.promotionCode": promotion.code,
        status: { $nin: ["cancelled", "refunded"] },
      });

      if (Number.isFinite(Number(promotion.perUserLimit)) && Number(promotion.perUserLimit) > 0 && (rideCount + orderCount) >= Number(promotion.perUserLimit)) {
        return sendError(res, 400, "Limite de uso deste cupom atingido");
      }

      // Calcula desconto
      if (promotion.discountType === "percentage") {
        const pct = Number(promotion.discountValue || 0);
        discountAmount = walletEscrow.toMoney(subtotal * (pct / 100));
        if (promotion.maxDiscount && promotion.maxDiscount > 0) {
          discountAmount = walletEscrow.toMoney(Math.min(discountAmount, promotion.maxDiscount));
        }
      } else {
        discountAmount = walletEscrow.toMoney(Math.min(subtotal, Number(promotion.discountValue || 0)));
      }
    }

    // 3) Taxa de comissao e Payout do parceiro
    const category = await Category.findById(store.categoryId).lean();
    const commissionPct = store.commissionPct != null
      ? store.commissionPct
      : (category?.defaultCommissionPct != null ? category.defaultCommissionPct : 12);
    const commissionAmount = walletEscrow.toMoney(subtotal * (commissionPct / 100));
    const partnerPayout = walletEscrow.toMoney(subtotal - commissionAmount);

    const total = walletEscrow.toMoney(Math.max(0, subtotal + deliveryFee - discountAmount));

    // 4) Gerar numero do pedido unico
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const orderNumber = `LM-${yy}${mm}${dd}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = new StoreOrder({
      orderNumber,
      clientId: userId,
      storeId,
      partnerId: store.partnerId,
      items: validatedItems,
      deliveryMode,
      address,
      pricing: {
        subtotal,
        deliveryFee,
        serviceFee: 0,
        discountAmount,
        promotionCode: promotion ? promotion.code : "",
        total,
        currency: "BRL",
        commissionPct,
        commissionAmount,
        partnerPayout,
      },
      payment: {
        method: paymentMethod,
        escrow: {
          status: "none",
          amount: total,
        },
        payoutStatus: "pending",
      },
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: "pending_payment",
      statusHistory: [
        { status: "pending_payment", at: new Date(), by: "system", note: "Pedido iniciado pelo cliente" }
      ],
    });

    // 5) Reter saldo do cliente LevaPay se pagamento for wallet
    if (paymentMethod === "wallet") {
      try {
        await walletEscrow.reserveOrder(order);
      } catch (escrowErr) {
        return sendError(res, 400, escrowErr.message || "Erro ao reter saldo LevaPay", {
          code: escrowErr.code || "ESCROW_ERROR"
        });
      }
    }

    // Passar status para colocado
    order.status = "placed";
    order.statusHistory.push({
      status: "placed",
      at: new Date(),
      by: "system",
      note: "Pagamento confirmado. Aguardando aceitacao do parceiro."
    });

    await order.save();

    // Atualiza uso do cupom
    if (promotion) {
      await Promotion.findByIdAndUpdate(promotion._id, { $inc: { usageCount: 1 } });
    }

    return res.json({ success: true, data: order, order });
  } catch (error) {
    console.error("Erro ao realizar checkout de pedido de marketplace:", error);
    return sendError(res, 500, "Erro ao realizar checkout", { details: error.message });
  }
}

async function listOrders(req, res) {
  try {
    const userId = req.user.id;
    const orders = await StoreOrder.find({ clientId: userId })
      .populate("storeId", "name slug logo cover tags")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: orders, orders });
  } catch (error) {
    console.error("Erro ao listar pedidos do cliente:", error);
    return sendError(res, 500, "Erro ao listar pedidos", { details: error.message });
  }
}

async function getOrder(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendError(res, 400, "ID de pedido invalido");
    }

    const order = await StoreOrder.findOne({ _id: id, clientId: userId })
      .populate("storeId", "name slug logo cover tags phone address location")
      .populate("partnerId", "legalName tradeName contact")
      .lean();

    if (!order) {
      return sendError(res, 404, "Pedido nao encontrado");
    }

    return res.json({ success: true, data: order, order });
  } catch (error) {
    console.error("Erro ao buscar detalhes do pedido:", error);
    return sendError(res, 500, "Erro ao buscar detalhes do pedido", { details: error.message });
  }
}

module.exports = {
  getCategories,
  getStores,
  getStoreBySlug,
  getStoreProducts,
  getProductDetail,
  validateCart,
  createOrder,
  listOrders,
  getOrder,
};
