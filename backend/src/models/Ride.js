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
    // Finalidade (purpose)
    purposeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purpose",
      default: null,
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
      currency: {
        type: String,
        default: "BRL",
      },
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
    // Detalhes adicionais
    details: {
      itemType: String, // Para entregas
      needsHelper: Boolean, // Precisa de ajudante
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
        "requesting", // Cliente solicitou, buscando motorista
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
    startedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    // Agendamento (futuro)
    scheduledFor: Date,
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
        enum: ["pending", "processing", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      paidAt: Date,
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
  this.pricing.total = basePrice + distancePrice + serviceFee;
  return this.pricing.total;
};

// Método para verificar se pode ser cancelada
rideSchema.methods.canBeCancelled = function () {
  const cancellableStatuses = [
    "requesting",
    "driver_assigned",
    "accepted",
    "driver_arriving",
  ];
  return cancellableStatuses.includes(this.status);
};

// Método para calcular taxa de cancelamento
rideSchema.methods.calculateCancellationFee = function () {
  // Se motorista já aceitou, cobra taxa
  if (["accepted", "driver_arriving", "arrived"].includes(this.status)) {
    return this.pricing.total * 0.3; // 30% do valor
  }
  return 0;
};

const Ride = mongoose.model("Ride", rideSchema);

module.exports = Ride;
