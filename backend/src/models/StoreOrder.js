const mongoose = require("mongoose");

// Pedido de marketplace — Fase D.
// Entidade comercial que produz uma entrega (Ride serviceType="delivery") na transição "ready".
// O hold do escrow fica AQUI (dinheiro retido no checkout, antes de existir o Ride).
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreProduct" },
    name: { type: String, required: true },
    quantity: { type: Number, min: 1, default: 1 },
    basePrice: { type: Number, min: 0, default: 0 },
    modifiers: [
      {
        groupName: String,
        optionName: String,
        priceDelta: { type: Number, default: 0 },
      },
    ],
    lineTotal: { type: Number, min: 0, default: 0 }, // (basePrice + Σ deltas) × quantity
    notes: { type: String, default: "" },
  },
  { _id: false },
);

const storeOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true }, // legível: "LM-240601-0042"
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cliente é obrigatório"],
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: [true, "Loja é obrigatória"],
      index: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      index: true,
      default: null,
    },
    // Snapshot imutável do carrinho (preços congelados na criação)
    items: { type: [orderItemSchema], default: [] },
    pricing: {
      subtotal: { type: Number, default: 0 }, // Σ lineTotal
      deliveryFee: { type: Number, default: 0 }, // copiado do Ride gerado
      serviceFee: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 }, // cupom (reusa Promotion)
      promotionCode: { type: String, default: "" },
      total: { type: Number, default: 0 }, // cobrado do cliente
      currency: { type: String, default: "BRL" },
      // Comissão da PLATAFORMA sobre o pedido (resolvida: Store > Category > PlatformConfig)
      commissionPct: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 }, // = subtotal × pct
      partnerPayout: { type: Number, default: 0 }, // = subtotal − commissionAmount
    },
    payment: {
      method: {
        type: String,
        enum: ["wallet", "pix", "card", "cash"],
        default: "wallet",
      },
      // MESMA forma do Ride.payment.escrow (reuso do walletEscrow.service)
      escrow: {
        status: {
          type: String,
          enum: ["none", "reserved", "released", "refunded", "failed"],
          default: "none",
        },
        amount: { type: Number, default: 0 },
        reservedAt: { type: Date, default: null },
        releasedAt: { type: Date, default: null },
        refundedAt: { type: Date, default: null },
      },
      payoutStatus: {
        type: String,
        enum: ["pending", "released", "held"],
        default: "pending",
      },
      payoutAt: { type: Date, default: null },
    },
    // Vínculo com a entrega executada (motor Ride)
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
      index: true,
    },
    deliveryMode: {
      type: String,
      enum: ["platform", "takeaway"],
      default: "platform",
    },
    address: {
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
      zipCode: String,
      latitude: Number,
      longitude: Number,
      recipientName: String,
      recipientPhone: String,
    },
    scheduledFor: { type: Date, default: null }, // pedido futuro
    status: {
      type: String,
      enum: [
        "pending_payment",
        "placed",
        "accepted",
        "preparing",
        "ready",
        "awaiting_courier",
        "in_delivery",
        "delivered",
        "completed",
        "rejected",
        "cancelled",
        "refunded",
      ],
      default: "pending_payment",
      index: true,
    },
    statusHistory: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: String,
        note: String,
      },
    ],
    sla: {
      acceptedAt: { type: Date, default: null },
      readyAt: { type: Date, default: null },
      promisedReadyAt: { type: Date, default: null },
      deliveredAt: { type: Date, default: null },
    },
    rating: {
      stars: { type: Number, min: 0, max: 5, default: null },
      comment: { type: String, default: "" },
      createdAt: { type: Date, default: null },
    },
  },
  { timestamps: true },
);

storeOrderSchema.index({ clientId: 1, status: 1, createdAt: -1 });
storeOrderSchema.index({ storeId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("StoreOrder", storeOrderSchema);
