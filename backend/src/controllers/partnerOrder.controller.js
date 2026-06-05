const mongoose = require("mongoose");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

async function listOrders(req, res) {
  try {
    const StoreOrder = mongoose.model("StoreOrder");
    const Store = mongoose.model("Store");
    const stores = await Store.find({ partnerId: req.partner._id }).select("_id");
    const storeIds = stores.map(s => s._id);
    const query = { storeId: { $in: storeIds } };
    if (req.query.status) query.status = String(req.query.status);
    const orders = await StoreOrder.find(query)
      .sort({ createdAt: -1 })
      .populate("clientId", "name phone profilePhoto")
      .populate("storeId", "name logo");
    return res.json({ success: true, data: orders, orders });
  } catch (error) {
    return sendError(res, 500, "Erro ao listar pedidos", { details: error.message });
  }
}

async function getOrder(req, res) {
  try {
    const StoreOrder = mongoose.model("StoreOrder");
    const Store = mongoose.model("Store");
    const order = await StoreOrder.findById(req.params.orderId)
      .populate("clientId", "name phone profilePhoto")
      .populate("storeId")
      .populate("rideId");
    if (!order) return sendError(res, 404, "Pedido nao encontrado");
    const store = await Store.findOne({ _id: order.storeId, partnerId: req.partner._id });
    if (!store) return sendError(res, 403, "Acesso negado a este pedido");
    return res.json({ success: true, data: order, order });
  } catch (error) {
    return sendError(res, 500, "Erro ao obter pedido", { details: error.message });
  }
}

async function acceptOrder(req, res) {
  try {
    const StoreOrder = mongoose.model("StoreOrder");
    const Store = mongoose.model("Store");
    const order = await StoreOrder.findById(req.params.orderId);
    if (!order) return sendError(res, 404, "Pedido nao encontrado");
    const store = await Store.findOne({ _id: order.storeId, partnerId: req.partner._id });
    if (!store) return sendError(res, 403, "Acesso negado");
    if (order.status !== "placed") return sendError(res, 400, "Pedido nao esta no estado para ser aceito");
    order.status = "accepted";
    order.sla = order.sla || {};
    order.sla.acceptedAt = new Date();
    order.statusHistory.push({ status: "accepted", at: new Date(), by: "partner" });
    await order.save();

    try {
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) {
        io.to(`client-${order.clientId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        if (req.partner.ownerUserId) {
          io.to(`client-${req.partner.ownerUserId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        }
      }
    } catch (wsErr) {}

    return res.json({ success: true, data: order, order });
  } catch (error) {
    return sendError(res, 500, "Erro ao aceitar pedido", { details: error.message });
  }
}

async function rejectOrder(req, res) {
  try {
    const StoreOrder = mongoose.model("StoreOrder");
    const Store = mongoose.model("Store");
    const walletEscrow = require("../services/walletEscrow.service");
    const order = await StoreOrder.findById(req.params.orderId);
    if (!order) return sendError(res, 404, "Pedido nao encontrado");
    const store = await Store.findOne({ _id: order.storeId, partnerId: req.partner._id });
    if (!store) return sendError(res, 403, "Acesso negado");
    if (order.status !== "placed") return sendError(res, 400, "Pedido nao pode ser rejeitado");
    order.status = "rejected";
    order.statusHistory.push({ status: "rejected", at: new Date(), by: "partner", note: req.body?.reason });
    await walletEscrow.refundOrder(order);
    await order.save();

    try {
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) {
        io.to(`client-${order.clientId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        if (req.partner.ownerUserId) {
          io.to(`client-${req.partner.ownerUserId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        }
      }
    } catch (wsErr) {}

    return res.json({ success: true, data: order, order });
  } catch (error) {
    return sendError(res, 500, "Erro ao rejeitar pedido", { details: error.message });
  }
}

async function prepareOrder(req, res) {
  try {
    const StoreOrder = mongoose.model("StoreOrder");
    const Store = mongoose.model("Store");
    const order = await StoreOrder.findById(req.params.orderId);
    if (!order) return sendError(res, 404, "Pedido nao encontrado");
    const store = await Store.findOne({ _id: order.storeId, partnerId: req.partner._id });
    if (!store) return sendError(res, 403, "Acesso negado");
    if (order.status !== "accepted") return sendError(res, 400, "Pedido nao foi aceito ainda");
    order.status = "preparing";
    order.statusHistory.push({ status: "preparing", at: new Date(), by: "partner" });
    await order.save();

    try {
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) {
        io.to(`client-${order.clientId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        if (req.partner.ownerUserId) {
          io.to(`client-${req.partner.ownerUserId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        }
      }
    } catch (wsErr) {}

    return res.json({ success: true, data: order, order });
  } catch (error) {
    return sendError(res, 500, "Erro ao preparar pedido", { details: error.message });
  }
}

async function readyOrder(req, res) {
  try {
    const StoreOrder = mongoose.model("StoreOrder");
    const Store = mongoose.model("Store");
    const Ride = mongoose.model("Ride");
    const order = await StoreOrder.findById(req.params.orderId);
    if (!order) return sendError(res, 404, "Pedido nao encontrado");
    const store = await Store.findById(order.storeId);
    if (!store || String(store.partnerId) !== String(req.partner._id)) return sendError(res, 403, "Acesso negado");
    if (order.status !== "preparing") return sendError(res, 400, "Pedido nao esta em preparacao");

    order.status = "ready";
    order.sla = order.sla || {};
    order.sla.readyAt = new Date();
    order.statusHistory.push({ status: "ready", at: new Date(), by: "partner" });

    if (order.deliveryMode !== "takeaway") {
      const ride = new Ride({
        clientId: order.clientId,
        serviceType: "delivery",
        vehicleType: "motorcycle",
        sourceType: "marketplace",
        sourceRefId: order._id,
        pickup: {
          address: store.address ? `${store.address.street || ""}, ${store.address.number || ""} - ${store.address.city || ""}` : "Endereço da Loja",
          latitude: store.location?.coordinates?.[1] || 0,
          longitude: store.location?.coordinates?.[0] || 0
        },
        dropoff: {
          address: order.address ? `${order.address.street || ""}, ${order.address.number || ""} - ${order.address.city || ""}` : "Endereço do Cliente",
          latitude: order.address?.latitude ?? (store.location?.coordinates?.[1] || 0),
          longitude: order.address?.longitude ?? (store.location?.coordinates?.[0] || 0)
        },
        pricing: {
          basePrice: order.pricing.deliveryFee || 0,
          distancePrice: 0,
          serviceFee: 0,
          total: order.pricing.deliveryFee || 0,
          subtotal: order.pricing.deliveryFee || 0,
          platformFee: (order.pricing.deliveryFee || 0) * 0.15,
          driverValue: (order.pricing.deliveryFee || 0) * 0.85
        },
        details: {
          itemType: "marketplace_order",
          pickupPin: Math.floor(1000 + Math.random() * 9000).toString(),
          deliveryPin: Math.floor(1000 + Math.random() * 9000).toString(),
          recipientName: order.address?.recipientName || "",
          recipientPhone: order.address?.recipientPhone || ""
        },
        status: "requesting"
      });

      await ride.save();
      order.rideId = ride._id;

      const rideController = require("./ride.controller");
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) {
        await rideController.dispatchRideToNearbyDrivers(ride, io).catch(console.error);
      }
    }

    await order.save();

    try {
      const io = req.app.get("io") || require("../config/websocket").getIO();
      if (io) {
        io.to(`client-${order.clientId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        if (req.partner.ownerUserId) {
          io.to(`client-${req.partner.ownerUserId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
        }
      }
    } catch (wsErr) {}

    return res.json({ success: true, data: order, order });
  } catch (error) {
    console.error("Erro ao marcar como pronto:", error);
    return sendError(res, 500, "Erro ao concluir preparacao", { details: error.message });
  }
}

module.exports = {
  listOrders,
  getOrder,
  acceptOrder,
  rejectOrder,
  prepareOrder,
  readyOrder,
};
