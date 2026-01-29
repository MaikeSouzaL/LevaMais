const Ride = require("../models/Ride");
const DriverLocation = require("../models/DriverLocation");
const User = require("../models/User");

class RideController {
  // Criar uma nova solicitação de corrida
  async create(req, res) {
    try {
      const {
        serviceType,
        vehicleType,
        purposeId,
        pickup,
        dropoff,
        pricing,
        distance,
        duration,
        details,
      } = req.body;

      const clientId = req.user.id; // Do middleware de autenticação

      // Validações básicas
      if (!pickup || !dropoff) {
        return res.status(400).json({
          error: "Origem e destino são obrigatórios",
        });
      }

      // Resolver purposeId (o app pode mandar slug, ex.: "documents")
      let resolvedPurposeId = purposeId;
      try {
        const mongoose = require("mongoose");
        if (resolvedPurposeId && !mongoose.Types.ObjectId.isValid(resolvedPurposeId)) {
          const Purpose = require("../models/Purpose");
          const purpose = await Purpose.findOne({
            id: String(resolvedPurposeId),
            vehicleType: vehicleType,
          }).select("_id");
          resolvedPurposeId = purpose?._id;
        }
      } catch (e) {
        console.log("Aviso: não foi possível resolver purposeId", purposeId);
        resolvedPurposeId = undefined;
      }

      // Criar a corrida
      const ride = new Ride({
        clientId,
        serviceType,
        vehicleType,
        purposeId: resolvedPurposeId,
        pickup,
        dropoff,
        pricing,
        distance,
        duration,
        details,
        status: "requesting",
        requestedAt: new Date(),
      });

      // Calcular total
      ride.calculateTotal();

      await ride.save();

      // Popular dados do cliente
      await ride.populate("clientId", "name phone profilePhoto");

      // Iniciar busca por motorista (via WebSocket)
      const io = req.app.get("io");
      if (io) {
        // Encontrar motoristas disponíveis próximos
        const nearbyDrivers = await DriverLocation.findNearby(
          pickup.latitude,
          pickup.longitude,
          5000, // 5km
          vehicleType,
          10,
          serviceType,
        );

        console.log(
          `🔍 Encontrados ${nearbyDrivers.length} motoristas próximos`,
        );

        // Notificar motoristas disponíveis
        nearbyDrivers.forEach((driverLocation) => {
          io.to(`driver-${driverLocation.driverId}`).emit("new-ride-request", {
            rideId: ride._id,
            pickup: ride.pickup,
            dropoff: ride.dropoff,
            pricing: ride.pricing,
            distance: ride.distance,
            vehicleType: ride.vehicleType,
          });
        });

        // Definir timeout de 30s para cancelar se nenhum motorista aceitar
        setTimeout(async () => {
          const updatedRide = await Ride.findById(ride._id);
          if (updatedRide && updatedRide.status === "requesting") {
            updatedRide.status = "cancelled_no_driver";
            updatedRide.cancelledAt = new Date();
            await updatedRide.save();

            // Notificar cliente
            io.to(`client-${clientId}`).emit("ride-cancelled", {
              rideId: ride._id,
              reason: "no_driver_found",
            });
          }
        }, 30000);
      }

      res.status(201).json({
        message: "Corrida solicitada com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao criar corrida:", error);
      res.status(500).json({
        error: "Erro ao criar corrida",
        details: error.message,
      });
    }
  }

  // Motorista aceita a corrida
  async accept(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.id;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      if (ride.status !== "requesting") {
        return res.status(400).json({
          error: "Corrida não está mais disponível",
        });
      }

      // Verificar se motorista já rejeitou
      const alreadyRejected = ride.rejectedBy.some(
        (r) => r.driverId.toString() === driverId,
      );

      if (alreadyRejected) {
        return res.status(400).json({
          error: "Você já rejeitou esta corrida",
        });
      }

      // Atribuir motorista
      ride.driverId = driverId;
      ride.status = "accepted";
      ride.acceptedAt = new Date();
      await ride.save();

      // Atualizar localização do motorista
      await DriverLocation.findOneAndUpdate(
        { driverId },
        {
          status: "on_ride",
          currentRideId: ride._id,
        },
      );

      // Popular dados
      await ride.populate("driverId", "name phone profilePhoto");
      await ride.populate("clientId", "name phone profilePhoto");

      // Notificar cliente via WebSocket
      const io = req.app.get("io");
      if (io) {
        // Obter dados do motorista
        const driverLocation = await DriverLocation.findOne({ driverId });

        io.to(`client-${ride.clientId._id}`).emit("driver-found", {
          rideId: ride._id,
          driver: {
            id: ride.driverId._id,
            name: ride.driverId.name,
            phone: ride.driverId.phone,
            profilePhoto: ride.driverId.profilePhoto,
            rating: 4.8, // TODO: calcular rating real
            vehicle: driverLocation?.vehicle || {},
          },
          eta: ride.duration,
        });

        // Notificar outros motoristas que a corrida foi aceita
        io.emit("ride-taken", { rideId: ride._id });
      }

      res.json({
        message: "Corrida aceita com sucesso",
        ride,
      });
    } catch (error) {
      console.error("Erro ao aceitar corrida:", error);
      res.status(500).json({
        error: "Erro ao aceitar corrida",
        details: error.message,
      });
    }
  }

  // Motorista rejeita a corrida
  async reject(req, res) {
    try {
      const { rideId } = req.params;
      const driverId = req.user.id;
      const { reason } = req.body;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      // Adicionar à lista de rejeitados
      ride.rejectedBy.push({
        driverId,
        rejectedAt: new Date(),
        reason,
      });

      await ride.save();

      res.json({
        message: "Corrida rejeitada",
      });
    } catch (error) {
      console.error("Erro ao rejeitar corrida:", error);
      res.status(500).json({
        error: "Erro ao rejeitar corrida",
        details: error.message,
      });
    }
  }

  // Cancelar corrida (cliente ou motorista)
  async cancel(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;
      const { reason } = req.body;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      if (!ride.canBeCancelled()) {
        return res.status(400).json({
          error: "Corrida não pode ser cancelada neste momento",
        });
      }

      // Verificar quem está cancelando
      const isClient = ride.clientId.toString() === userId;
      const isDriver = ride.driverId?.toString() === userId;

      if (!isClient && !isDriver) {
        return res.status(403).json({
          error: "Você não tem permissão para cancelar esta corrida",
        });
      }

      // Calcular taxa de cancelamento
      const cancellationFee = ride.calculateCancellationFee();

      ride.status = isClient ? "cancelled_by_client" : "cancelled_by_driver";
      ride.cancelledAt = new Date();
      ride.cancellationFee = {
        amount: cancellationFee,
        reason,
      };

      await ride.save();

      // Liberar motorista
      if (ride.driverId) {
        await DriverLocation.findOneAndUpdate(
          { driverId: ride.driverId },
          {
            status: "available",
            currentRideId: null,
          },
        );
      }

      // Notificar via WebSocket
      const io = req.app.get("io");
      if (io) {
        const targetId = isClient ? ride.driverId : ride.clientId;
        const targetType = isClient ? "driver" : "client";

        if (targetId) {
          io.to(`${targetType}-${targetId}`).emit("ride-cancelled", {
            rideId: ride._id,
            cancelledBy: isClient ? "client" : "driver",
            reason,
            cancellationFee,
          });
        }
      }

      res.json({
        message: "Corrida cancelada",
        cancellationFee,
      });
    } catch (error) {
      console.error("Erro ao cancelar corrida:", error);
      res.status(500).json({
        error: "Erro ao cancelar corrida",
        details: error.message,
      });
    }
  }

  // Atualizar status da corrida
  async updateStatus(req, res) {
    try {
      const { rideId } = req.params;
      const { status } = req.body;
      const driverId = req.user.id;

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      if (ride.driverId.toString() !== driverId) {
        return res.status(403).json({
          error: "Apenas o motorista pode atualizar o status",
        });
      }

      ride.status = status;

      // Atualizar timestamps específicos
      if (status === "arrived") {
        ride.arrivedAt = new Date();
      } else if (status === "in_progress") {
        ride.startedAt = new Date();
      } else if (status === "completed") {
        ride.completedAt = new Date();
        // Liberar motorista
        await DriverLocation.findOneAndUpdate(
          { driverId },
          {
            status: "available",
            currentRideId: null,
          },
        );
      }

      await ride.save();

      // Notificar cliente
      const io = req.app.get("io");
      if (io) {
        io.to(`client-${ride.clientId}`).emit("ride-status-updated", {
          rideId: ride._id,
          status: ride.status,
        });
      }

      res.json({
        message: "Status atualizado",
        ride,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({
        error: "Erro ao atualizar status",
        details: error.message,
      });
    }
  }

  // Buscar corrida por ID
  async getById(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;

      const ride = await Ride.findById(rideId)
        .populate("clientId", "name phone profilePhoto")
        .populate("driverId", "name phone profilePhoto")
        .populate("purposeId");

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      // Verificar permissão
      const isClient = ride.clientId._id.toString() === userId;
      const isDriver = ride.driverId?._id.toString() === userId;

      if (!isClient && !isDriver) {
        return res.status(403).json({
          error: "Você não tem permissão para ver esta corrida",
        });
      }

      res.json(ride);
    } catch (error) {
      console.error("Erro ao buscar corrida:", error);
      res.status(500).json({
        error: "Erro ao buscar corrida",
        details: error.message,
      });
    }
  }

  // Histórico de corridas
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20, page = 1 } = req.query;

      const query = {
        $or: [{ clientId: userId }, { driverId: userId }],
      };

      if (status) {
        query.status = status;
      }

      const rides = await Ride.find(query)
        .populate("clientId", "name phone profilePhoto")
        .populate("driverId", "name phone profilePhoto")
        .populate("purposeId")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await Ride.countDocuments(query);

      res.json({
        rides,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      res.status(500).json({
        error: "Erro ao buscar histórico",
        details: error.message,
      });
    }
  }

  // Calcular preço (antes de criar a corrida)
  async calculatePrice(req, res) {
    try {
      const { pickup, dropoff, vehicleType, purposeId, cityId } = req.body;

      if (!pickup || !dropoff) {
        return res.status(400).json({
          error: "Origem e destino são obrigatórios",
        });
      }

      // Buscar regra de preço no MongoDB
      const PricingRule = require("../models/PricingRule");
      const ruleFilter = {
        vehicleCategory: vehicleType,
        active: true,
      };
      const mongoose = require("mongoose");
      if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
        ruleFilter.cityId = cityId;
      }

      // purposeId pode vir como ObjectId OU como slug (ex.: "documents") vindo do app.
      if (purposeId) {
        if (mongoose.Types.ObjectId.isValid(purposeId)) {
          ruleFilter.purposeId = purposeId;
        } else {
          try {
            const Purpose = require("../models/Purpose");
            const purpose = await Purpose.findOne({
              id: String(purposeId),
              vehicleType: vehicleType,
            }).select("_id");

            if (purpose?._id) {
              ruleFilter.purposeId = purpose._id;
            }
          } catch (e) {
            console.log(
              "Aviso: não foi possível resolver purposeId",
              purposeId,
            );
          }
        }
      }

      // 1) Tenta regra mais específica (com purposeId, se vier)
      let rule = await PricingRule.findOne(ruleFilter).sort({ priority: -1 });

      // 2) Fallback: se veio purposeId mas não existe regra por purpose,
      // tenta a regra genérica (sem purposeId).
      if (!rule && ruleFilter.purposeId) {
        const fallbackFilter = { ...ruleFilter };
        delete fallbackFilter.purposeId;
        rule = await PricingRule.findOne(fallbackFilter).sort({ priority: -1 });
      }

      if (!rule) {
        return res.status(400).json({
          error:
            "Nenhuma regra de preço ativa encontrada para os parâmetros informados",
        });
      }

      // Distância Haversine em metros
      const distance = haversineDistance(
        pickup.latitude,
        pickup.longitude,
        dropoff.latitude,
        dropoff.longitude,
      );

      const distanceKm = distance / 1000;
      const basePrice = rule.pricing.basePrice;
      const distancePrice = distanceKm * rule.pricing.pricePerKm;

      // Estimar duração: velocidade média 30 km/h
      const durationMinutes = Math.max(1, Math.ceil((distanceKm / 30) * 60));
      const timePrice = durationMinutes * rule.pricing.pricePerMinute;

      let subtotal = basePrice + distancePrice + timePrice;

      // Aplicar preço mínimo
      if (subtotal < rule.pricing.minimumPrice) {
        subtotal = rule.pricing.minimumPrice;
      }

      // Aplicar taxas adicionais habilitadas (percentuais sobre subtotal)
      let extraFeesPercentage = 0;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      const weekday = now.getDay(); // 0-6

      const { fees } = rule;
      if (fees?.nightFee?.enabled) {
        if (
          isTimeInRange(hhmm, fees.nightFee.startTime, fees.nightFee.endTime)
        ) {
          extraFeesPercentage += fees.nightFee.percentage || 0;
        }
      }
      if (
        fees?.peakHourFee?.enabled &&
        Array.isArray(fees.peakHourFee.periods)
      ) {
        for (const p of fees.peakHourFee.periods) {
          if (
            Array.isArray(p.days) &&
            p.days.includes(weekday) &&
            isTimeInRange(hhmm, p.startTime, p.endTime)
          ) {
            extraFeesPercentage += fees.peakHourFee.percentage || 0;
            break;
          }
        }
      }
      if (fees?.weatherFee?.enabled) {
        extraFeesPercentage += fees.weatherFee.percentage || 0;
      }
      if (fees?.holidayFee?.enabled) {
        extraFeesPercentage += fees.holidayFee.percentage || 0;
      }

      const extraFees = (subtotal * extraFeesPercentage) / 100;
      const total = subtotal + extraFees;

      res.json({
        pricing: {
          basePrice: parseFloat(basePrice.toFixed(2)),
          distancePrice: parseFloat(distancePrice.toFixed(2)),
          timePrice: parseFloat(timePrice.toFixed(2)),
          extraFees: parseFloat(extraFees.toFixed(2)),
          subtotal: parseFloat(subtotal.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          currency: "BRL",
        },
        distance: {
          value: Math.round(distance),
          text: `${(distance / 1000).toFixed(1)} km`,
        },
        duration: {
          value: durationMinutes * 60,
          text: `${durationMinutes} min`,
        },
      });
    } catch (error) {
      console.error("Erro ao calcular preço:", error);
      res.status(500).json({
        error: "Erro ao calcular preço",
        details: error?.message,
        stack: process.env.NODE_ENV === "production" ? undefined : error?.stack,
      });
    }
  }
}

// Função auxiliar para calcular distância (Haversine)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Checks if a time (HH:mm) is within a range (HH:mm..HH:mm).
 * Supports overnight ranges (e.g. 22:00 -> 06:00).
 */
function isTimeInRange(current, start, end) {
  try {
    if (!current || !start || !end) return false;

    const toMinutes = (hhmm) => {
      const [h, m] = String(hhmm)
        .split(":")
        .map((v) => parseInt(v, 10));
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    const c = toMinutes(current);
    const s = toMinutes(start);
    const e = toMinutes(end);

    if (c == null || s == null || e == null) return false;

    // normal range
    if (s <= e) return c >= s && c <= e;

    // overnight (e.g. 22:00-06:00)
    return c >= s || c <= e;
  } catch {
    return false;
  }
}

module.exports = new RideController();
