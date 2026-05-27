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
      paidAt: Date,
      confirmedAt: Date,
      selectedAt: Date,
      provider: { type: String, trim: true },
      failureReason: { type: String, trim: true },
    },
    // Taxa de cancelamento
    cancellationFee: {
      amount: {
        type: Number,
        default: 0,
      },
      reason: String,
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
  }
  next();
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

// Verifica se cancelamento nesta fase exige suporte (devolução do pacote)
rideSchema.methods.cancellationRequiresSupport = function (platformConfig) {
  const phase = this.getCancellationPhase();
  if (!phase) return false;
  const rules = platformConfig?.cancellationRules?.[phase];
  return rules?.requireSupport === true;
};

const Ride = mongoose.model("Ride", rideSchema);

module.exports = Ride;
