const Ride = require("../models/Ride");
const DriverLocation = require("../models/DriverLocation");
const User = require("../models/User");

// mixins (rating + proofs)
const ratingProofMixin = require("./ride.ratingProof.mixin");
const mongoose = require("mongoose");

class RideController {
  // Buscar corrida ativa do usuário autenticado
  async getActive(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;

      // Motorista: usa DriverLocation.currentRideId como fonte de verdade
      if (userType === "driver") {
        const DriverLocation = require("../models/DriverLocation");
        const dl = await DriverLocation.findOne({ driverId: userId });

        if (!dl?.currentRideId) {
          return res.json({ active: false, ride: null });
        }

        const ride = await Ride.findById(dl.currentRideId)
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto")
          .populate("purposeId");

        if (!ride) {
          return res.json({ active: false, ride: null });
        }

        // Se já finalizou/cancelou, considera sem corrida ativa
        if (["completed", "cancelled", "cancelled_by_client", "cancelled_by_driver", "cancelled_no_driver"].includes(ride.status)) {
          return res.json({ active: false, ride: null });
        }

        return res.json({ active: true, ride });
      }

      // Cliente (opcional): pega a última corrida não finalizada
      if (userType === "client") {
        const ride = await Ride.findOne({
          clientId: userId,
          status: { $nin: ["completed", "cancelled", "cancelled_by_client", "cancelled_by_driver", "cancelled_no_driver"] },
        })
          .sort({ createdAt: -1 })
          .populate("clientId", "name phone profilePhoto")
          .populate("driverId", "name phone profilePhoto")
          .populate("purposeId");

        if (!ride) return res.json({ active: false, ride: null });
        return res.json({ active: true, ride });
      }

      return res.json({ active: false, ride: null });
    } catch (error) {
      console.error("Erro ao buscar corrida ativa:", error);
      return res.status(500).json({
        error: "Erro ao buscar corrida ativa",
        details: error.message,
      });
    }
  }

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

      // Impedir múltiplas corridas ativas para o mesmo cliente (estilo Uber/99)
      const activeRide = await Ride.findOne({
        clientId,
        status: {
          $nin: [
            "completed",
            "cancelled",
            "cancelled_by_client",
            "cancelled_by_driver",
            "cancelled_no_driver",
          ],
        },
      }).select("_id status");

      if (activeRide?._id) {
        return res.status(400).json({
          error: "Você já possui uma corrida em andamento",
          rideId: activeRide._id,
          status: activeRide.status,
        });
      }

      // Criar a corrida
const PricingConfig = require("../models/PricingConfig"); // Import model

// ... inside create method ...
      
      // Busca configuração de preço vigente
      const config = await PricingConfig.findOne().sort({ createdAt: -1 });
      const platformFeePercentage = config?.platformSettings?.platformFeePercentage || 20; // Default 20% if no config

      const total = pricing.total;
      const platformFee = total * (platformFeePercentage / 100);
      const driverValue = total - platformFee;

      // Adiciona calculos ao objeto de pricing
      pricing.platformFee = platformFee;
      pricing.driverValue = driverValue;

      const ride = new Ride({
        clientId: req.user.id,
        serviceType,
        vehicleType,
        purposeId: resolvedPurposeId,
        pickup,
        dropoff,
        pricing, // pricing agora inclui platformFee e driverValue
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

        // Matching simples (MVP): oferece para o motorista mais próximo primeiro.
        // Evita “spam” em vários motoristas e reduz corrida dupla.
        const triedDrivers = [];

        async function offerNextDriver() {
          // Recarrega corrida para garantir estado atual
          const fresh = await Ride.findById(ride._id);
          if (!fresh) return;

          // Se já mudou de status, não oferece mais
          if (!["requesting", "driver_assigned"].includes(fresh.status)) return;
          if (fresh.status === "accepted") return;

          // Seleciona próximo motorista (lista já vem ordenada por proximidade)
          const next = nearbyDrivers.find((d) => {
            const id = String(d.driverId);
            return !triedDrivers.includes(id);
          });

          if (!next) return;

          // Se havia um motorista reservado antes, avisa que expirou
          const previousDriverId = fresh.driverId ? String(fresh.driverId) : null;

          triedDrivers.push(String(next.driverId));

          // Reserva a corrida para esse motorista (aguardando aceitação)
          fresh.driverId = next.driverId;
          fresh.status = "driver_assigned";
          await fresh.save();

          if (previousDriverId && previousDriverId !== String(next.driverId)) {
            io.to(`driver-${previousDriverId}`).emit("ride-expired", {
              rideId: fresh._id,
            });
          }

          io.to(`driver-${next.driverId}`).emit("new-ride-request", {
            rideId: fresh._id,
            pickup: fresh.pickup,
            dropoff: fresh.dropoff,
            pricing: fresh.pricing,
            distance: fresh.distance,
            vehicleType: fresh.vehicleType,
          });

          // Se não aceitar em 7s, marca tentativa e passa para o próximo
          setTimeout(async () => {
            const check = await Ride.findById(fresh._id);
            if (!check) return;
            if (check.status === "accepted") return;

            // Só expira se ainda estiver reservado para o mesmo motorista
            if (
              check.status === "driver_assigned" &&
              check.driverId &&
              String(check.driverId) === String(next.driverId)
            ) {
              // registra como "tentado" (para não oferecer de novo)
              check.rejectedBy.push({
                driverId: next.driverId,
                rejectedAt: new Date(),
                reason: "timeout",
              });

              check.status = "requesting";
              check.driverId = null;
              await check.save();

              io.to(`driver-${next.driverId}`).emit("ride-expired", {
                rideId: check._id,
              });

              await offerNextDriver();
            }
          }, 7000);
        }

        // Começa oferecendo para o primeiro motorista
        if (nearbyDrivers.length > 0) {
          offerNextDriver().catch(() => {});
        }

        // Definir timeout de 30s para cancelar se nenhum motorista aceitar
        setTimeout(async () => {
          const updatedRide = await Ride.findById(ride._id);
          if (
            updatedRide &&
            ["requesting", "driver_assigned"].includes(updatedRide.status)
          ) {
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

      // Impedir aceitar se o motorista já estiver em corrida
      const driverLocation = await DriverLocation.findOne({ driverId });
      if (driverLocation?.currentRideId) {
        return res.status(400).json({
          error: "Você já possui uma corrida ativa",
          currentRideId: driverLocation.currentRideId,
        });
      }

      // 1) Tenta “travar” o motorista (evita ele aceitar duas corridas em paralelo)
      const lockedDriver = await DriverLocation.findOneAndUpdate(
        {
          driverId,
          $or: [{ currentRideId: null }, { currentRideId: { $exists: false } }],
        },
        { status: "on_ride", currentRideId: rideId },
        { new: true },
      );

      if (!lockedDriver) {
        return res.status(400).json({
          error: "Você já possui uma corrida ativa",
        });
      }

      // 2) Aceite atômico da corrida (evita dois motoristas aceitarem ao mesmo tempo)
      const now = new Date();
      const ride = await Ride.findOneAndUpdate(
        {
          _id: rideId,
          status: { $in: ["requesting", "driver_assigned"] },
          "rejectedBy.driverId": { $ne: driverId },
          $or: [
            // ainda não reservada
            { status: "requesting", driverId: null },
            // reservada para este motorista
            { status: "driver_assigned", driverId: driverId },
          ],
        },
        {
          driverId,
          status: "accepted",
          acceptedAt: now,
        },
        { new: true },
      );

      if (!ride) {
        // Libera o motorista caso a corrida não esteja mais disponível
        await DriverLocation.findOneAndUpdate(
          { driverId, currentRideId: rideId },
          { status: "available", currentRideId: null },
        );

        return res.status(400).json({
          error: "Corrida não está mais disponível",
        });
      }

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

      // Se a corrida estava reservada para este motorista, libera e tenta o próximo
      const isAssignedToMe =
        ride.status === "driver_assigned" &&
        ride.driverId &&
        ride.driverId.toString() === driverId.toString();

      if (isAssignedToMe) {
        ride.status = "requesting";
        ride.driverId = null;
      }

      await ride.save();

      // Tenta oferecer para o próximo motorista (MVP)
      const io = req.app.get("io");
      if (io && ["requesting", "driver_assigned"].includes(ride.status)) {
        const nearbyDrivers = await DriverLocation.findNearby(
          ride.pickup.latitude,
          ride.pickup.longitude,
          5000,
          ride.vehicleType,
          10,
          ride.serviceType,
        );

        const next = nearbyDrivers.find((d) => {
          const id = String(d.driverId);
          const rejected = ride.rejectedBy?.some(
            (r) => String(r.driverId) === id,
          );
          return !rejected;
        });

        if (next) {
          ride.driverId = next.driverId;
          ride.status = "driver_assigned";
          await ride.save();

          io.to(`driver-${next.driverId}`).emit("new-ride-request", {
            rideId: ride._id,
            pickup: ride.pickup,
            dropoff: ride.dropoff,
            pricing: ride.pricing,
            distance: ride.distance,
            vehicleType: ride.vehicleType,
          });
        }
      }

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
      const userIdStr = String(userId);
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
      const isClient = ride.clientId?.toString() === userIdStr;
      const isDriver = ride.driverId?.toString() === userIdStr;

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
      const driverIdStr = String(driverId);

      const ride = await Ride.findById(rideId);

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      if (ride.driverId?.toString() !== driverIdStr) {
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
      const userIdStr = String(userId);

      const ride = await Ride.findById(rideId)
        .populate("clientId", "name phone profilePhoto")
        .populate("driverId", "name phone profilePhoto")
        .populate("purposeId");

      if (!ride) {
        return res.status(404).json({ error: "Corrida não encontrada" });
      }

      // Verificar permissão
      const isClient = ride.clientId?._id?.toString() === userIdStr;
      const isDriver = ride.driverId?._id?.toString() === userIdStr;

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

      // Force cast to ObjectId for $or queries to ensure safety
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const query = {
        $or: [{ clientId: userObjectId }, { driverId: userObjectId }],
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

  // Estatísticas do motorista (Ganhos de hoje, Meta)
  async getDriverStats(req, res) {
    try {
      const driverId = req.user.id;
      const { startOfDay, endOfDay } = require("date-fns");
      
      const now = new Date();
      // Considerando fuso horário local simples (ideal seria receber timezone do client)
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);

      const stats = await Ride.aggregate([
        {
          $match: {
            driverId: new mongoose.Types.ObjectId(driverId),
            status: "completed",
            completedAt: { $gte: todayStart, $lte: todayEnd },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$pricing.total" },
            ridesCount: { $sum: 1 },
          },
        },
      ]);

      const result = stats[0] || { totalEarnings: 0, ridesCount: 0 };

      // Meta diária hardcoded por enquanto (gamification MVP)
      const dailyGoal = 10;
      
      // Simular um bônus de R$ 20 se atingir a meta
      const bonusAmount = result.ridesCount >= dailyGoal ? 20 : 0;
      
      // Deduzir taxa do app (ex: 20%) para mostrar lucro líquido estimado
      // (ajuste conforme regra real. Aqui assumindo que pricing.total é o valor BRUTO e motorista fica com 80%)
      const driverShare = result.totalEarnings * 0.8; 

      res.json({
        earnings: driverShare,
        rides: result.ridesCount,
        goal: dailyGoal,
        bonus: bonusAmount,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({
         earnings: 0,
         rides: 0,
         goal: 10,
         bonus: 0
      });
    }
  }

  // Histórico de ganhos (últimos 7 dias)
  async getEarningsHistory(req, res) {
    try {
      const driverId = req.user.id;
      const { period = "week" } = req.query; // 'day', 'week', 'month'
      const driverObjectId = new mongoose.Types.ObjectId(driverId);
      
      let startDate = new Date();
      let groupByFormat = ""; // Format for $dateToString
      
      // Configure Date Range and Grouping
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0); // Start of today
        groupByFormat = "%H:00"; // Group by Hour
      } else if (period === "month") {
        startDate.setDate(1); // Start of current month
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = "%Y-%m-%d"; // Group by Day
      } else {
        // Default: Week
        startDate.setDate(startDate.getDate() - 6); // Last 7 days
        startDate.setHours(0, 0, 0, 0);
        groupByFormat = "%Y-%m-%d"; // Group by Day
      }

      const stats = await Ride.aggregate([
        {
          $match: {
            driverId: driverObjectId,
            status: "completed",
            completedAt: { $gte: startDate },
          },
        },
        {
          $project: {
            // Adjust timzone MVP Fix: UTC-3 hardcoded
            localDate: { $subtract: ["$completedAt", 1000 * 60 * 60 * 3] }, 
            // Use valor salvo ou calcula 80% fallback para legados
            val: { $ifNull: ["$pricing.driverValue", { $multiply: ["$pricing.total", 0.8] }] }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: groupByFormat, date: "$localDate" } },
            total: { $sum: "$val" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill missing slots (Gap Filling)
      const result = [];
      const now = new Date();
      const current = new Date(startDate);

      if (period === "day") {
          // 00:00 to 23:00
          for (let i = 0; i < 24; i++) {
              const hourLabel = `${String(i).padStart(2, '0')}:00`;
              const match = stats.find(s => s._id === hourLabel);
              result.push({
                  label: hourLabel,
                  value: match ? match.total : 0, // Valor já é liquido do motorista
                  count: match ? match.count : 0
              });
          }
      } else if (period === "week" || period === "month") {
          // Fill days until today
          while (current <= now) {
              const dateKey = current.toISOString().split("T")[0]; // YYYY-MM-DD
              const match = stats.find(s => s._id === dateKey);
              
              // Format Label
              let label = "";
              if (period === "week") {
                 const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                 label = days[current.getDay()];
              } else {
                 label = `${current.getDate()}/${current.getMonth() + 1}`;
              }

              result.push({
                  label: label, 
                  fullDate: dateKey,
                  value: match ? match.total : 0, // Valor já é liquido
                  count: match ? match.count : 0
              });
              
              current.setDate(current.getDate() + 1);
          }
      }

      res.json(result);
    } catch (error) {
      console.error("Erro ao buscar histórico de ganhos:", error);
      res.status(500).json({ error: "Erro interno ao buscar dados" });
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

      const mongoose = require("mongoose");

      // Distância Haversine em metros
      const distance = haversineDistance(
        pickup.latitude,
        pickup.longitude,
        dropoff.latitude,
        dropoff.longitude,
      );
      const distanceKm = distance / 1000;

      // 1) Preferir PricingConfig (o que o admin edita no leva-mais-web)
      //    -> vehiclePricing + peakHours + purposePricing
      const PricingConfig = require("../models/PricingConfig");
      const Purpose = require("../models/Purpose");

      const config = await PricingConfig.findOne().sort({ updatedAt: -1 });

      // Resolver purpose (aceita ObjectId OU slug)
      let purposeDoc = null;
      if (purposeId) {
        if (mongoose.Types.ObjectId.isValid(purposeId)) {
          purposeDoc = await Purpose.findById(purposeId).select("_id id title");
        } else {
          purposeDoc = await Purpose.findOne({
            id: String(purposeId),
            vehicleType: vehicleType,
          }).select("_id id title");
        }
      }

      // helpers
      const isTimeInRangeSimple = (current, start, end) =>
        isTimeInRange(current, start, end);

      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      const weekday = now.getDay();

      if (config && Array.isArray(config.vehiclePricing)) {
        const vp = config.vehiclePricing.find(
          (v) => v.vehicleType === vehicleType && v.enabled !== false,
        );

        if (!vp) {
          return res.status(400).json({
            error:
              "Nenhuma configuração de preço ativa encontrada para este tipo de veículo",
          });
        }

        const pricePerKm = Number(vp.pricePerKm || 0);
        const minimumKm = Number(vp.minimumKm || 0);
        const minimumFee = Number(vp.minimumFee || 0);

        const durationMinutes = Math.max(1, Math.ceil((distanceKm / 30) * 60));

        // Regra solicitada:
        // - Se distância <= km mínimo → cobra apenas a taxa mínima
        // - Se exceder → taxa mínima + excedente * preço/km
        const exceedKm = Math.max(distanceKm - minimumKm, 0);
        const distancePrice = exceedKm * pricePerKm;
        let subtotal = minimumFee + distancePrice;

        // 2) Ajuste por purpose (se configurado)
        let purposeFixed = 0;
        let purposePct = 0;
        if (
          purposeDoc?._id &&
          Array.isArray(config.purposePricing) &&
          config.purposePricing.length > 0
        ) {
          const pp = config.purposePricing.find((p) => {
            if (!p?.enabled) return false;
            // compara ObjectId string
            return String(p.purposeId) === String(purposeDoc._id);
          });
          if (pp) {
            purposeFixed = Number(pp.additionalFixed || 0);
            purposePct = Number(pp.additionalPercentage || 0);
          }
        }

        if (purposeFixed) subtotal += purposeFixed;
        if (purposePct) subtotal += (subtotal * purposePct) / 100;

        // 3) Peak hour multiplier (se existir)
        let peakMultiplier = 1;
        if (Array.isArray(config.peakHours)) {
          const match = config.peakHours.find(
            (p) =>
              p.enabled &&
              Array.isArray(p.dayOfWeek) &&
              p.dayOfWeek.includes(weekday) &&
              isTimeInRangeSimple(hhmm, p.startTime, p.endTime),
          );
          if (match?.multiplier) peakMultiplier = Number(match.multiplier) || 1;
        }

        const total = subtotal * peakMultiplier;

        return res.json({
          pricing: {
            basePrice: 0,
            distancePrice: parseFloat(distancePrice.toFixed(2)),
            serviceFee: 0,
            total: parseFloat(total.toFixed(2)),
            currency: "BRL",
            // extras úteis pro app/debug
            breakdown: {
              minimumFee: parseFloat(minimumFee.toFixed(2)),
              minimumKm,
              exceedKm: parseFloat(exceedKm.toFixed(3)),
              purposeFixed: parseFloat(purposeFixed.toFixed(2)),
              purposePct,
              peakMultiplier,
            },
          },
          distance: {
            value: Math.round(distance * 1000) / 1000,
            text: `${distanceKm.toFixed(1)} km`,
          },
          duration: {
            value: durationMinutes * 60,
            text: `${durationMinutes} min`,
          },
          purpose: purposeDoc
            ? { id: purposeDoc.id, title: purposeDoc.title }
            : undefined,
        });
      }

      // 4) Fallback: PricingRule (legado)
      const PricingRule = require("../models/PricingRule");
      const ruleFilter = {
        vehicleCategory: vehicleType,
        active: true,
      };
      if (cityId && mongoose.Types.ObjectId.isValid(cityId)) {
        ruleFilter.cityId = cityId;
      }
      if (purposeDoc?._id) {
        ruleFilter.purposeId = purposeDoc._id;
      }

      let rule = await PricingRule.findOne(ruleFilter).sort({ priority: -1 });
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

      const minimumKm = Number(rule.pricing.minimumKm || 0);
      const minimumFee = Number(rule.pricing.minimumFee || 0);
      const pricePerKm = Number(rule.pricing.pricePerKm || 0);

      const exceedKm = Math.max(distanceKm - minimumKm, 0);
      const distancePrice = exceedKm * pricePerKm;
      const subtotal = minimumFee + distancePrice;

      res.json({
        pricing: {
          basePrice: 0,
          distancePrice: parseFloat(distancePrice.toFixed(2)),
          serviceFee: 0,
          total: parseFloat(subtotal.toFixed(2)),
          currency: "BRL",
        },
        distance: {
          value: Math.round(distance),
          text: `${distanceKm.toFixed(1)} km`,
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

// attach extra handlers
ratingProofMixin.attach(RideController, { Ride, DriverLocation });

module.exports = new RideController();
