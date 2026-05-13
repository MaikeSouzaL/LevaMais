const mongoose = require("mongoose");

const driverLocationSchema = new mongoose.Schema(
  {
    // Motorista
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Cada motorista tem apenas uma localização ativa
    },
    // Localização atual
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    // Endereço formatado (opcional, para cache)
    address: {
      type: String,
    },
    // Status do motorista
    status: {
      type: String,
      enum: ["offline", "available", "busy", "on_ride"],
      default: "offline",
    },
    // Tipo de veículo do motorista
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      required: true,
    },
    // Dados do veículo
    vehicle: {
      plate: String,
      model: String,
      color: String,
      year: Number,
    },
    // Heading (direção) em graus (0-360)
    heading: {
      type: Number,
      min: 0,
      max: 360,
    },
    // Velocidade em km/h
    speed: {
      type: Number,
      default: 0,
    },
    // Corrida atual (se estiver em corrida)
    currentRideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
    },
    // Última atualização de localização
    lastUpdated: {
      type: Date,
      default: Date.now,
    },

    // Tipos de serviço que o motorista aceita
    serviceTypes: {
      type: [String],
      enum: ["ride", "delivery"],
      default: ["ride", "delivery"],
    },
    // Raio máximo configurado pelo motorista (KM)
    searchRadiusKm: {
      type: Number,
      default: 15,
    },
  },
  {
    timestamps: true,
  },
);

// Índice geoespacial para busca por proximidade
driverLocationSchema.index({ location: "2dsphere" });
driverLocationSchema.index({ status: 1, vehicleType: 1, serviceTypes: 1 });

// Middleware para atualizar lastUpdated
driverLocationSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

// Método para encontrar motoristas próximos
driverLocationSchema.statics.findNearby = async function (
  latitude,
  longitude,
  maxDistance = 5000, 
  vehicleType,
  limit = 10,
  serviceType,
) {
  const pipeline = [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        distanceField: "calculatedDistance", 
        maxDistance: Math.max(maxDistance, 300000), 
        spherical: true,
        query: {
          status: "available",
          ...(vehicleType && { vehicleType }),
          ...(serviceType && { serviceTypes: serviceType }),
        },
      },
    },
    {
      $addFields: {
        driverMaxRangeMeters: { 
          $multiply: [ { $ifNull: ["$searchRadiusKm", 15] }, 1000 ] 
        }
      }
    },
    {
      $match: {
        $expr: {
          $lte: ["$calculatedDistance", "$driverMaxRangeMeters"]
        }
      }
    },
    { $limit: limit }
  ];

  const results = await this.aggregate(pipeline);
  return results.map(doc => this.hydrate(doc));
};

// Método para calcular distância até um ponto
driverLocationSchema.methods.distanceTo = function (latitude, longitude) {
  try {
    if (!this.location || !Array.isArray(this.location.coordinates) || this.location.coordinates.length < 2) {
      return 0;
    }
    const [driverLng, driverLat] = this.location.coordinates;
    if (driverLng == null || driverLat == null || Number.isNaN(driverLng) || Number.isNaN(driverLat)) {
      return 0;
    }

    // Fórmula de Haversine para calcular distância
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (driverLat * Math.PI) / 180;
    const φ2 = (latitude * Math.PI) / 180;
    const Δφ = ((latitude - driverLat) * Math.PI) / 180;
    const Δλ = ((longitude - driverLng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distância em metros
  } catch (error) {
    console.error("Erro no cálculo de distância do motorista:", error);
    return 0;
  }
};

const DriverLocation = mongoose.model("DriverLocation", driverLocationSchema);

module.exports = DriverLocation;
