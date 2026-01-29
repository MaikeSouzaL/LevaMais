const DriverLocation = require("../models/DriverLocation");

class DriverLocationController {
  // Atualizar localização do motorista
  async updateLocation(req, res) {
    try {
      const driverId = req.user.id;
      const {
        latitude,
        longitude,
        heading,
        speed,
        status,
        vehicleType,
        vehicle,
        serviceTypes,
      } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: "Latitude e longitude são obrigatórios",
        });
      }

      // Atualizar ou criar localização
      const driverLocation = await DriverLocation.findOneAndUpdate(
        { driverId },
        {
          location: {
            type: "Point",
            coordinates: [longitude, latitude], // MongoDB usa [lng, lat]
          },
          heading,
          speed,
          status: status || "available",
          vehicleType,
          vehicle,
          ...(serviceTypes && { serviceTypes }),
          lastUpdated: new Date(),
        },
        {
          new: true,
          upsert: true, // Criar se não existir
        },
      );

      // Broadcast atualização via WebSocket para clientes interessados
      const io = req.app.get("io");
      if (io && driverLocation.currentRideId) {
        // Se motorista está em corrida, notificar o cliente
        const Ride = require("../models/Ride");
        const ride = await Ride.findById(driverLocation.currentRideId);

        if (ride) {
          io.to(`client-${ride.clientId}`).emit("driver-location-updated", {
            rideId: ride._id,
            location: {
              latitude,
              longitude,
            },
            heading,
            speed,
          });
        }
      }

      res.json({
        message: "Localização atualizada",
        location: driverLocation,
      });
    } catch (error) {
      console.error("Erro ao atualizar localização:", error);
      res.status(500).json({
        error: "Erro ao atualizar localização",
        details: error.message,
      });
    }
  }

  // Buscar localização do motorista autenticado (para restaurar estado online/offline)
  async getMe(req, res) {
    try {
      const driverId = req.user.id;

      const location = await DriverLocation.findOne({ driverId }).populate(
        "driverId",
        "name phone profilePhoto",
      );

      if (!location) {
        return res.status(404).json({
          error: "Localização do motorista não encontrada",
        });
      }

      res.json(location);
    } catch (error) {
      console.error("Erro ao buscar localização do motorista:", error);
      res.status(500).json({
        error: "Erro ao buscar localização do motorista",
        details: error.message,
      });
    }
  }

  // Buscar localização de um motorista específico
  async getLocation(req, res) {
    try {
      const { driverId } = req.params;

      const location = await DriverLocation.findOne({ driverId }).populate(
        "driverId",
        "name phone profilePhoto",
      );

      if (!location) {
        return res.status(404).json({
          error: "Localização do motorista não encontrada",
        });
      }

      res.json(location);
    } catch (error) {
      console.error("Erro ao buscar localização:", error);
      res.status(500).json({
        error: "Erro ao buscar localização",
        details: error.message,
      });
    }
  }

  // Buscar todas as localizações (para dashboard admin)
  async getAllLocations(req, res) {
    try {
      const { status, vehicleType } = req.query;

      const query = {};

      if (status) {
        query.status = status;
      }

      if (vehicleType) {
        query.vehicleType = vehicleType;
      }

      const locations = await DriverLocation.find(query).populate(
        "driverId",
        "name phone profilePhoto email",
      );

      res.json({
        success: true,
        locations,
        count: locations.length,
      });
    } catch (error) {
      console.error("Erro ao buscar localizações:", error);
      res.status(500).json({
        error: "Erro ao buscar localizações",
        details: error.message,
      });
    }
  }

  // Buscar motoristas próximos (para debug/admin)
  async getNearby(req, res) {
    try {
      const {
        latitude,
        longitude,
        maxDistance = 5000,
        vehicleType,
      } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          error: "Latitude e longitude são obrigatórios",
        });
      }

      const drivers = await DriverLocation.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseInt(maxDistance),
        vehicleType,
      ).populate("driverId", "name phone profilePhoto");

      res.json({
        count: drivers.length,
        drivers,
      });
    } catch (error) {
      console.error("Erro ao buscar motoristas próximos:", error);
      res.status(500).json({
        error: "Erro ao buscar motoristas próximos",
        details: error.message,
      });
    }
  }

  // Atualizar status do motorista (online/offline)
  async updateStatus(req, res) {
    try {
      const driverId = req.user.id;
      const { status, acceptingRides, serviceTypes } = req.body;

      const driverLocation = await DriverLocation.findOneAndUpdate(
        { driverId },
        {
          status,
          ...(acceptingRides !== undefined && { acceptingRides }),
          ...(serviceTypes && { serviceTypes }),
        },
        { new: true },
      );

      if (!driverLocation) {
        return res.status(404).json({
          error: "Motorista não encontrado. Atualize sua localização primeiro.",
        });
      }

      res.json({
        message: "Status atualizado",
        location: driverLocation,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      res.status(500).json({
        error: "Erro ao atualizar status",
        details: error.message,
      });
    }
  }
}

module.exports = new DriverLocationController();
