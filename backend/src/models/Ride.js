const mongoose = require("mongoose");

const rideSchema = new mongoose.Schema(
  {
    // Cliente que solicitou a corrida
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cliente é obrigatório"],
    },
    // Motorista que aceitou a corrida
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Tipo de serviço
    serviceType: {
      type: String,
      enum: ["ride", "delivery"],
      required: true,
    },
    // Tipo de veículo
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      required: true,
    },
    // Categoria de CORRIDA escolhida (fluxo ride): moto | car_economy | car_comfort | car_luxury
    // Salvo para controle/relatórios na dashboard. Vazio para entregas.
    rideCategory: {
      type: String,
      enum: ["moto", "car_economy", "car_comfort", "car_luxury", null],
      default: null,
    },
    // Origem da entrega (Fase D): app comum | pedido de marketplace | reserva de rota planejada.
    // Aditivo e retrocompatível — entregas/corridas existentes ficam "app".
    sourceType: {
      type: String,
      enum: ["app", "marketplace", "planned_route", "freight"],
      default: "app",
      index: true,
    },
    // _id do StoreOrder ou RouteReservation que originou esta entrega.
    sourceRefId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    // Rota planejada à qual esta entrega pertence (maloteiro/bundling).
    plannedRouteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverRoute",
      default: null,
      index: true,
    },
    // Localização de origem
    pickup: {
      address: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
      contactName: String,
      details: String,
    },
    // Localização de destino
    dropoff: {
      address: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    // Paradas adicionais (futuro)
    stops: [
      {
        address: String,
        latitude: Number,
        longitude: Number,
        order: Number,
      },
    ],
    // Preços
    pricing: {
      basePrice: {
        type: Number,
        required: true,
      },
      distancePrice: {
        type: Number,
        required: true,
      },
      serviceFee: {
        type: Number,
        default: 0,
      },
      total: {
        type: Number,
        required: true,
      },
      subtotal: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      promotionCode: {
        type: String,
        trim: true,
      },
      currency: {
        type: String,
        default: "BRL",
      },
      // Taxa da plataforma (valor retido)
      platformFee: {
        type: Number,
        default: 0,
      },
      // Valor líquido do motorista
      driverValue: {
        type: Number,
        default: 0,
      },
    },
    // Detalhes da divisão de lucro (Split) - NOVO
    splitDetails: {
      platformConfigUsed: Number, // % usada (ex: 15%)
      totalAppFee: Number, // Valor total retido (ex: R$ 3,00)
      platformShare: Number, // Parte da plataforma (ex: R$ 1,50)
      representativeShare: Number, // Parte do rep (ex: R$ 1,50)
      representativeId: { type: mongoose.Schema.Types.ObjectId, ref: "Representative" }
    },
    // Contabilidade completa da taxa da plataforma
    platformFeeAccounting: {
      percentage: Number, // % aplicada
      amount: Number, // Valor em R$
      chargedTo: { type: String, enum: ["driver_wallet", "client", "platform"], default: "driver_wallet" },
      reserveTransactionId: String,
      chargeTransactionId: String,
      status: { type: String, enum: ["not_reserved", "reserved", "charged", "released", "failed"], default: "not_reserved" },
      reservedAt: Date,
      chargedAt: Date,
      releasedAt: Date,
    },
    // Distância e tempo estimado
    distance: {
      value: Number, // em metros
      text: String, // "5.2 km"
    },
    duration: {
      value: Number, // em segundos
      text: String, // "15 min"
    },
    // Rota planejada enviada no momento da criacao do pedido (A -> B)
    routeCoordinates: [
      {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
      },
    ],
    // Detalhes adicionais
    details: {
      itemType: String, // Para entregas
      cargoSize: {
        type: String,
        enum: ["small", "medium", "large"],
      },
      approximateWeightKg: Number,
      isFragile: Boolean,
      needsHelper: Boolean, // Precisa de ajudante
      priority: Number, // 0=Econômico, 1=Rápido, 2=Urgente
      pickupComplement: String,
      dropoffComplement: String,
      recipientName: String,
      recipientPhone: String,
      recipientInstructions: String,
      pickupPin: String,
      deliveryPin: String,
      insurance: {
        type: String,
        enum: ["none", "basic", "standard", "premium"],
        default: "none",
      },
      specialInstructions: String,
    },
    // Status da corrida
    status: {
      type: String,
      enum: [
        "scheduled", // Pedido agendado
        "requesting", // Cliente solicitou, buscando motorista
        "payment_pending", // Cliente escolheu oferta e precisa confirmar pagamento
        "payment_failed", // Falha ao confirmar pagamento
        "driver_assigned", // Motorista atribuído, aguardando aceitação
        "accepted", // Motorista aceitou
        "driver_arriving", // Motorista a caminho do local de origem
        "arrived", // Motorista chegou no local de origem
        "in_progress", // Corrida em andamento
        "completed", // Corrida finalizada
        "cancelled_by_client", // Cancelada pelo cliente
        "cancelled_by_driver", // Cancelada pelo motorista
        "cancelled_no_driver", // Cancelada - nenhum motorista encontrado
        "delivery_failed", // Entrega falhou no destino (ausente/endereço errado) → devolução
      ],
      default: "requesting",
    },
    // Histórico de status (para rastreabilidade)
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    // Tempos importantes
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    acceptedAt: Date,
    arrivedAt: Date,
    arrivedAtDropoff: Date,
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    // Falha de entrega no destino (destinatário ausente / endereço errado / recusou).
    deliveryFailure: {
      reason: {
        type: String,
        enum: ["recipient_absent", "wrong_address", "refused", "inaccessible", "other"],
      },
      reportedAt: Date,
      photoUrl: String,
      note: String,
      // Liquidação: cliente paga 100%; motorista recebe total×(1+bonus); plataforma absorve.
      clientCharged: { type: Number, default: 0 },
      driverPaid: { type: Number, default: 0 },
      chargedVia: { type: String, enum: ["wallet_hold", "pending_debt", "none"], default: "none" },
    },
    // Agendamento (futuro)
    scheduledFor: Date,
    // Negociacao de preco
    negotiation: {
      enabled: { type: Boolean, default: false },
      clientOffer: { type: Number, default: null },
      initialClientOffer: { type: Number, default: null },
      suggestedMinPrice: { type: Number, default: null },
      finalAgreedPrice: { type: Number, default: null },
      selectedDriverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      selectedAt: Date,
      offers: [
        {
          driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          amount: { type: Number, required: true },
          driverAmount: { type: Number, default: null },
          status: {
            type: String,
            enum: ["accepted", "countered", "rejected", "client_countered"],
            default: "countered",
          },
          message: String,
          // Métricas reais do motorista → ponto de coleta (Google driving, não linha reta).
          etaMinutes: { type: Number, default: null },
          distanceToPickupKm: { type: Number, default: null },
          distanceSource: { type: String, default: null }, // route_api | estimate
          vehicleType: { type: String, default: null },
          vehicleLabel: { type: String, default: null },
          createdAt: { type: Date, default: Date.now },
          updatedAt: Date,
        },
      ],
    },
    // Avaliação
    rating: {
      clientRating: {
        stars: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        tips: Number,
        createdAt: Date,
      },
      driverRating: {
        stars: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: Date,
      },
    },
    // Provas (entregas estilo iFood)
    proofs: {
      pickupPhoto: String, // data URL/base64 (MVP)
      pickupAt: Date,
      deliveryPhoto: String, // data URL/base64 (MVP)
      deliveryAt: Date,
      // Validação de PIN para coletas e entregas
      pickupPinValidated: { type: Boolean, default: false },
      pickupPinValidatedAt: Date,
      pickupPinAttempts: { type: Number, default: 0 },
      deliveryPinValidated: { type: Boolean, default: false },
      deliveryPinValidatedAt: Date,
      deliveryPinAttempts: { type: Number, default: 0 },
    },
    // Promocao aplicada no pedido
    promotion: {
      promotionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promotion",
        default: null,
      },
      code: { type: String, trim: true },
      discountType: {
        type: String,
        enum: ["fixed", "percentage"],
      },
      discountValue: { type: Number, default: 0 },
      discountAmount: { type: Number, default: 0 },
      appliedAt: Date,
    },

    // Pagamento
    payment: {
      method: {
        type: String,
        enum: ["cash", "card", "wallet", "pix"],
        default: "cash",
      },
      status: {
        type: String,
        enum: ["not_selected", "pre_selected", "pending", "processing", "authorized", "completed", "failed", "refunded"],
        default: "not_selected",
      },
      transactionId: String,
      pixCode: String,
      qrCodeData: String,
      paidAt: Date,
      confirmedAt: Date,
      selectedAt: Date,
      provider: { type: String, trim: true },
      failureReason: { type: String, trim: true },
      // Escrow do Saldo LevaPay (wallet): valor retido da carteira do cliente
      // no aceite e liberado ao motorista na conclusão (ou estornado no cancelamento).
      escrow: {
        status: {
          type: String,
          enum: ["none", "reserved", "released", "refunded", "failed"],
          default: "none",
        },
        amount: { type: Number, default: 0 },
        reservedAt: Date,
        releasedAt: Date,
        refundedAt: Date,
        reserveTxId: String,
        releaseTxId: String,
      },
    },
    // Taxa de cancelamento
    cancellationFee: {
      amount: {
        type: Number,
        default: 0,
      },
      reason: String,
      by: { type: String, enum: ["client", "driver", "system"] },
      driverShare: { type: Number, default: 0 },
      platformShare: { type: Number, default: 0 },
      freeWindow: { type: Boolean, default: false },
      chargedVia: {
        type: String,
        enum: ["wallet_hold", "pending_debt", "none"],
        default: "none",
      },
    },
    // Motoristas que rejeitaram (para não oferecer de novo)
    rejectedBy: [
      {
        driverId: mongoose.Schema.Types.ObjectId,
        rejectedAt: Date,
        reason: String,
      },
    ],
    // Indica se a corrida está na fila de espera pública para entregas/corridas
    isWaitingInQueue: {
      type: Boolean,
      default: false,
    },
    lastDispatchedAt: {
      type: Date,
      default: Date.now,
    },
    redispatchInterval: {
      type: Number,
      default: 60,
    },
    searchTimeoutSeconds: {
      type: Number,
      default: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para performance
rideSchema.index({ clientId: 1, createdAt: -1 });
rideSchema.index({ driverId: 1, createdAt: -1 });
rideSchema.index({ status: 1 });
rideSchema.index({ "pickup.latitude": 1, "pickup.longitude": 1 });

// Middleware para adicionar ao histórico de status
rideSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
    this._statusModified = true;
  }
  next();
});

// Sincronizar status do Ride com o StoreOrder correspondente
rideSchema.post("save", async function (doc) {
  if (doc._statusModified && doc.sourceType === "marketplace" && doc.sourceRefId) {
    try {
      const StoreOrder = mongoose.model("StoreOrder");
      const order = await StoreOrder.findById(doc.sourceRefId);
      if (order) {
        let nextStatus = order.status;

        if (["accepted", "driver_assigned", "driver_arriving", "arrived"].includes(doc.status)) {
          nextStatus = "awaiting_courier";
        } else if (doc.status === "in_progress") {
          nextStatus = "in_delivery";
        } else if (doc.status === "completed") {
          nextStatus = "delivered";
        } else if ([
          "cancelled_by_client",
          "cancelled_by_driver",
          "cancelled_no_driver",
          "delivery_failed"
        ].includes(doc.status)) {
          nextStatus = "refunded";
        }

        if (nextStatus !== order.status) {
          order.status = nextStatus;
          order.statusHistory.push({
            status: nextStatus,
            at: new Date(),
            by: "system",
            note: `Status sincronizado com a entrega (${doc.status})`
          });

          if (nextStatus === "delivered") {
            order.status = "completed";
            order.statusHistory.push({
              status: "completed",
              at: new Date(),
              by: "system",
              note: "Finalizado automaticamente com a entrega concluida"
            });
            order.sla = order.sla || {};
            order.sla.deliveredAt = new Date();
            const walletEscrow = require("../services/walletEscrow.service");
            await walletEscrow.releaseOrder(order);
          } else if (nextStatus === "refunded") {
            const walletEscrow = require("../services/walletEscrow.service");
            await walletEscrow.refundOrder(order);
          }

          await order.save();

          try {
            const io = require("../config/websocket").getIO();
            if (io) {
              io.to(`client-${order.clientId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
              const Partner = mongoose.model("Partner");
              const partner = await Partner.findById(order.partnerId).select("ownerUserId");
              if (partner && partner.ownerUserId) {
                io.to(`client-${partner.ownerUserId}`).emit("order-status-updated", { orderId: order._id, status: order.status });
              }
            }
          } catch (wsErr) {}
        }
      }
    } catch (err) {
      console.error("Erro no post-save do Ride para Marketplace:", err);
    }
  }
});

// Sincronizar status do Ride com a RouteReservation (rotas planejadas / maloteiro)
rideSchema.post("save", async function (doc) {
  if (doc._statusModified && doc.sourceType === "planned_route" && doc.sourceRefId) {
    try {
      const RouteReservation = mongoose.model("RouteReservation");
      const reservation = await RouteReservation.findById(doc.sourceRefId);
      if (!reservation) return;

      const walletEscrow = require("../services/walletEscrow.service");
      let next = reservation.status;

      if (doc.status === "in_progress") {
        next = "in_transit";
      } else if (doc.status === "completed") {
        next = "completed";
      } else if ([
        "cancelled_by_client",
        "cancelled_by_driver",
        "cancelled_no_driver",
        "delivery_failed",
      ].includes(doc.status)) {
        next = "refunded";
      }

      if (next !== reservation.status) {
        if (next === "completed") {
          reservation.status = "delivered";
          reservation.statusHistory.push({ status: "delivered", at: new Date(), note: `Entrega concluída (${doc.status})` });
          reservation.status = "completed";
          reservation.statusHistory.push({ status: "completed", at: new Date(), note: "Pagamento liberado ao motorista" });
          await walletEscrow.releaseReservation(reservation);
        } else if (next === "refunded") {
          reservation.status = "refunded";
          reservation.statusHistory.push({ status: "refunded", at: new Date(), note: `Reserva estornada (${doc.status})` });
          await walletEscrow.refundReservation(reservation);
        } else {
          reservation.status = next;
          reservation.statusHistory.push({ status: next, at: new Date(), note: `Status sincronizado com a entrega (${doc.status})` });
        }
        await reservation.save();

        try {
          const io = require("../config/websocket").getIO();
          if (io) {
            io.to(`client-${reservation.clientId}`).emit("reservation-status-updated", { reservationId: reservation._id, status: reservation.status });
            if (reservation.driverId) {
              io.to(`client-${reservation.driverId}`).emit("reservation-status-updated", { reservationId: reservation._id, status: reservation.status });
            }
          }
        } catch (wsErr) {}
      }
    } catch (err) {
      console.error("Erro no post-save do Ride para Rota Planejada:", err);
    }
  }
});

// Sincronizar status do Ride com o FreightRequest (frete sob demanda / transportadora)
rideSchema.post("save", async function (doc) {
  if (doc._statusModified && doc.sourceType === "freight" && doc.sourceRefId) {
    try {
      const FreightRequest = mongoose.model("FreightRequest");
      const freight = await FreightRequest.findById(doc.sourceRefId);
      if (!freight) return;

      const walletEscrow = require("../services/walletEscrow.service");
      let next = freight.status;

      if (doc.status === "in_progress") {
        next = "in_transit";
      } else if (doc.status === "completed") {
        next = "completed";
      } else if ([
        "cancelled_by_client",
        "cancelled_by_driver",
        "cancelled_no_driver",
        "delivery_failed",
      ].includes(doc.status)) {
        next = "refunded";
      }

      if (next !== freight.status) {
        if (next === "completed") {
          freight.status = "delivered";
          freight.statusHistory.push({ status: "delivered", at: new Date(), note: `Entrega concluída (${doc.status})` });
          freight.status = "completed";
          freight.statusHistory.push({ status: "completed", at: new Date(), note: "Pagamento liberado ao motorista" });
          await walletEscrow.releaseFreight(freight);
        } else if (next === "refunded") {
          freight.status = "refunded";
          freight.statusHistory.push({ status: "refunded", at: new Date(), note: `Frete estornado (${doc.status})` });
          await walletEscrow.refundFreight(freight);
        } else {
          freight.status = next;
          freight.statusHistory.push({ status: next, at: new Date(), note: `Status sincronizado com a entrega (${doc.status})` });
        }
        await freight.save();

        try {
          const io = require("../config/websocket").getIO();
          if (io) {
            io.to(`client-${freight.clientId}`).emit("freight-status-updated", { freightId: freight._id, status: freight.status });
            if (freight.driverId) {
              io.to(`client-${freight.driverId}`).emit("freight-status-updated", { freightId: freight._id, status: freight.status });
            }
          }
        } catch (wsErr) {}
      }
    } catch (err) {
      console.error("Erro no post-save do Ride para Frete:", err);
    }
  }
});

// Método para calcular preço total
rideSchema.methods.calculateTotal = function () {
  const { basePrice, distancePrice, serviceFee } = this.pricing;
  const subtotal = Number(basePrice || 0) + Number(distancePrice || 0) + Number(serviceFee || 0);
  const discount = Number(this.pricing?.discountAmount || 0);
  this.pricing.subtotal = subtotal;
  this.pricing.total = Math.max(0, subtotal - discount);
  return this.pricing.total;
};

// Determina a fase de cancelamento com base no status atual
rideSchema.methods.getCancellationPhase = function () {
  const beforePickupStatuses = [
    "scheduled", "requesting", "payment_pending", "driver_assigned", "accepted"
  ];
  const afterPickupStatuses = [
    "driver_arriving", "arrived"
  ];
  // in_progress = during delivery

  if (beforePickupStatuses.includes(this.status)) return "beforePickup";
  if (afterPickupStatuses.includes(this.status)) return "afterPickup";
  if (this.status === "in_progress") return "duringDelivery";
  return null; // já cancelado ou completed
};

// Método para verificar se pode ser cancelada
rideSchema.methods.canBeCancelled = function () {
  const cancellableStatuses = [
    "scheduled",
    "requesting",
    "payment_pending",
    "driver_assigned",
    "accepted",
    "driver_arriving",
    "arrived",
    "in_progress",
  ];
  return cancellableStatuses.includes(this.status);
};

// Método para calcular taxa de cancelamento usando regras de configuracao
// Aceita um objeto config opcional com as regras de cancelamento
rideSchema.methods.calculateCancellationFee = function (platformConfig) {
  const total = Number(this.pricing?.total || 0);
  const phase = this.getCancellationPhase();
  if (!phase) return 0;

  // Fallback defaults caso nao tenha config
  const defaults = {
    beforePickup: { enabled: true, feePercentage: 10, minFee: 5, maxFee: 50 },
    afterPickup: { enabled: true, feePercentage: 50, minFee: 20, maxFee: 200 },
    duringDelivery: { enabled: false, feePercentage: 80, minFee: 30, maxFee: 500 },
  };

  const rules = (platformConfig?.cancellationRules?.[phase]) || defaults[phase];

  if (rules.enabled === false) return 0;

  const percentage = Number(rules.feePercentage || 10);
  const minFee = Number(rules.minFee || 0);
  const maxFee = Number(rules.maxFee || Infinity);

  let fee = total * (percentage / 100);
  fee = Math.max(fee, minFee);
  fee = Math.min(fee, maxFee);

  return Math.round(fee * 100) / 100;
};

// Taxa de cancelamento do fluxo de LANCE.
// Regra POR SERVIÇO:
//  • Corrida: grátis se cancelado por motorista/sistema, sem motorista comprometido,
//    ou dentro da janela grátis (2 min após o aceite); senão feePct% do total (20%).
//  • Entrega: igual antes da coleta; APÓS a coleta (status in_progress) NÃO há janela
//    grátis e cobra collectedFeePct% (50%) — o entregador devolve o pacote à origem.
// Split motorista/plataforma padrão 80/20.
rideSchema.methods.computeBidCancellationFee = function (opts = {}) {
  const freeWindowSec = Number(opts.freeWindowSec ?? 120);
  const feePct = Number(opts.feePct ?? 20);
  const collectedFeePct = Number(opts.collectedFeePct ?? 50);
  const driverSharePct = Number(opts.driverSharePct ?? 80);
  const byClient = opts.byClient !== false;

  const round = (n) => Math.round(Number(n || 0) * 100) / 100;
  const total = Number(this.pricing?.total || 0);
  const none = { fee: 0, driverShare: 0, platformShare: 0, free: true };

  if (!byClient) return { ...none, reason: "not_client" };

  // Só há taxa se um motorista já estava comprometido.
  const committed = ["driver_assigned", "accepted", "driver_arriving", "arrived", "in_progress"];
  if (!committed.includes(this.status)) return { ...none, reason: "no_committed_driver" };

  const isDelivery = this.serviceType === "delivery" || this.serviceType === "frete";
  const collected = isDelivery && this.status === "in_progress";

  const buildFee = (pct, reason) => {
    const fee = round(total * (pct / 100));
    if (fee <= 0) return { ...none, reason: "zero_fee" };
    const driverShare = round(fee * (driverSharePct / 100));
    return { fee, driverShare, platformShare: round(fee - driverShare), free: false, reason };
  };

  // Entrega pós-coleta: sem janela grátis, taxa de retorno (collectedFeePct).
  if (collected) return buildFee(collectedFeePct, "delivery_collected");

  // Antes da coleta (corrida ou entrega): janela grátis + feePct.
  const ref =
    this.acceptedAt ||
    this.payment?.escrow?.reservedAt ||
    this.negotiation?.selectedAt ||
    this.updatedAt;
  const elapsedSec = ref ? (Date.now() - new Date(ref).getTime()) / 1000 : Infinity;
  if (elapsedSec <= freeWindowSec) return { ...none, reason: "within_free_window" };

  return buildFee(feePct, "charged");
};

// Verifica se cancelamento nesta fase exige suporte (devolução do pacote)
rideSchema.methods.cancellationRequiresSupport = function (platformConfig) {
  const phase = this.getCancellationPhase();
  if (!phase) return false;
  const rules = platformConfig?.cancellationRules?.[phase];
  return rules?.requireSupport === true;
};

const Ride = mongoose.model("Ride", rideSchema);

module.exports = Ride;
