const DriverLocation = require("../models/DriverLocation");
const User = require("../models/User");

const DRIVER_STATUSES = new Set(["offline", "available", "busy", "on_ride"]);
const VEHICLE_TYPES = new Set(["motorcycle", "car", "van", "truck"]);
const SERVICE_TYPES = new Set(["ride", "delivery"]);

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function parseCoordinate(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function parseOptionalNumber(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeServiceTypes(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return null;

  const normalized = [...new Set(raw.map((item) => String(item || "").trim().toLowerCase()))]
    .filter((item) => SERVICE_TYPES.has(item));

  if (!normalized.length) return null;
  return normalized;
}

function normalizeStatus(value) {
  if (value === undefined || value === null || value === "") return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (!DRIVER_STATUSES.has(normalized)) return null;
  return normalized;
}

function normalizeVehicleType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!VEHICLE_TYPES.has(normalized)) return null;
  return normalized;
}

function isDriverOrAdmin(req) {
  const type = String(req?.user?.userType || "").toLowerCase();
  return type === "driver" || type === "admin";
}

class DriverLocationController {
  async updateLocation(req, res) {
    try {
      if (!isDriverOrAdmin(req)) {
        return sendError(res, 403, "Apenas motoristas podem atualizar localizacao");
      }

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

      const latValue = parseCoordinate(latitude, -90, 90);
      const lngValue = parseCoordinate(longitude, -180, 180);

      if (latValue === null || lngValue === null) {
        return sendError(res, 400, "Latitude e longitude invalidas");
      }

      const normalizedVehicleType = normalizeVehicleType(vehicleType);
      if (!normalizedVehicleType) {
        return sendError(res, 400, "Tipo de veiculo invalido");
      }

      const normalizedStatus = normalizeStatus(status);
      if (normalizedStatus === null) {
        return sendError(res, 400, "Status de motorista invalido");
      }

      const normalizedServiceTypes = normalizeServiceTypes(serviceTypes);
      if (normalizedServiceTypes === null) {
        return sendError(res, 400, "Tipos de servico invalidos");
      }

      const headingValue = parseOptionalNumber(heading);
      if (headingValue === null || headingValue < 0 || headingValue > 360) {
        return sendError(res, 400, "Heading invalido");
      }

      const speedValue = parseOptionalNumber(speed);
      if (speedValue === null || speedValue < 0) {
        return sendError(res, 400, "Velocidade invalida");
      }

      const updatePayload = {
        location: {
          type: "Point",
          coordinates: [lngValue, latValue],
        },
        status: normalizedStatus || "available",
        vehicleType: normalizedVehicleType,
        lastUpdated: new Date(),
      };

      if (headingValue !== undefined) updatePayload.heading = headingValue;
      if (speedValue !== undefined) updatePayload.speed = speedValue;
      if (vehicle && typeof vehicle === "object") updatePayload.vehicle = vehicle;
      if (normalizedServiceTypes) updatePayload.serviceTypes = normalizedServiceTypes;

      const driverLocation = await DriverLocation.findOneAndUpdate(
        { driverId },
        updatePayload,
        {
          new: true,
          upsert: true,
          runValidators: true,
        },
      );

      const io = req.app.get("io");
      if (io && driverLocation.currentRideId) {
        const Ride = require("../models/Ride");
        const ride = await Ride.findById(driverLocation.currentRideId);

        if (ride) {
          io.to(`client-${ride.clientId}`).emit("driver-location-updated", {
            rideId: ride._id,
            location: {
              latitude: latValue,
              longitude: lngValue,
            },
            heading: headingValue,
            speed: speedValue,
          });
        }
      }

      try {
        const user = await User.findById(driverId);
        if (user) {
          const todayStr = new Date().toISOString().split("T")[0];
          
          if (!user.onlineStats) {
            user.onlineStats = {
              totalSecondsToday: 0,
              lastHeartbeatAt: new Date(),
              activeDateStr: todayStr,
              isOnline: false,
            };
          }

          // Se mudou o dia no fuso UTC/ISO, reseta o acumulador
          if (user.onlineStats.activeDateStr !== todayStr) {
            user.onlineStats.totalSecondsToday = 0;
            user.onlineStats.lastHeartbeatAt = new Date();
            user.onlineStats.activeDateStr = todayStr;
            user.onlineStats.isOnline = normalizedStatus !== "offline";
          } else {
            const wasOnline = Boolean(user.onlineStats.isOnline);
            const isNowOnline = normalizedStatus !== "offline";

            // Calcula tempo real transcorrido desde a última batida de coração
            const last = new Date(user.onlineStats.lastHeartbeatAt).getTime();
            const diffMs = Date.now() - last;
            const diffSec = Math.floor(diffMs / 1000);

            // 💡 REGRA MATEMÁTICA ABSOLUTA: Só acumula tempo se o status ANTERIOR era ONLINE!
            // Impede o acúmulo de períodos offline e captura os segundos finais ao ficar offline.
            if (wasOnline && diffSec > 0 && diffSec < 60) {
              user.onlineStats.totalSecondsToday += diffSec;
            }

            // Atualiza referências de estado para a próxima rodada
            user.onlineStats.lastHeartbeatAt = new Date();
            user.onlineStats.isOnline = isNowOnline;
          }
          
          await user.save();

          // 📡 Emitir atualizaÃ§Ã£o em tempo real via Socket para esse motorista
          const io = req.app.get("io");
          if (io) {
            io.to(`driver-${driverId}`).emit("online_time_updated", {
              totalSecondsToday: user.onlineStats.totalSecondsToday,
            });
          }
        }
      } catch (err) {
        console.error("Erro ao atualizar batida de coraÃ§Ã£o do tempo online:", err);
      }

      return res.json({
        message: "Localizacao atualizada",
        location: driverLocation,
      });
    } catch (error) {
      console.error("Erro ao atualizar localizacao:", error);
      return sendError(res, 500, "Erro ao atualizar localizacao");
    }
  }

  async getMe(req, res) {
    try {
      if (!isDriverOrAdmin(req)) {
        return sendError(res, 403, "Apenas motoristas podem consultar esta rota");
      }

      const driverId = req.user.id;
      const location = await DriverLocation.findOne({ driverId }).populate(
        "driverId",
        "name phone profilePhoto",
      );

      if (!location) {
        return sendError(res, 404, "Localizacao do motorista nao encontrada");
      }

      return res.json(location);
    } catch (error) {
      console.error("Erro ao buscar localizacao do motorista:", error);
      return sendError(res, 500, "Erro ao buscar localizacao do motorista");
    }
  }

  async getLocation(req, res) {
    try {
      const { driverId } = req.params;

      const location = await DriverLocation.findOne({ driverId }).populate(
        "driverId",
        "name phone profilePhoto",
      );

      if (!location) {
        return sendError(res, 404, "Localizacao do motorista nao encontrada");
      }

      return res.json(location);
    } catch (error) {
      console.error("Erro ao buscar localizacao:", error);
      return sendError(res, 500, "Erro ao buscar localizacao");
    }
  }

  async getAllLocations(req, res) {
    try {
      if (String(req.user?.userType || "").toLowerCase() !== "admin") {
        return sendError(res, 403, "Apenas admin pode listar todas as localizacoes");
      }

      const { status, vehicleType } = req.query;
      const query = {};

      const normalizedStatus = normalizeStatus(status);
      if (normalizedStatus === null) {
        return sendError(res, 400, "Status de motorista invalido");
      }
      if (normalizedStatus) {
        query.status = normalizedStatus;
      }

      if (vehicleType !== undefined) {
        const normalizedVehicleType = normalizeVehicleType(vehicleType);
        if (!normalizedVehicleType) {
          return sendError(res, 400, "Tipo de veiculo invalido");
        }
        query.vehicleType = normalizedVehicleType;
      }

      const locations = await DriverLocation.find(query).populate(
        "driverId",
        "name phone profilePhoto email",
      );

      return res.json({
        success: true,
        locations,
        count: locations.length,
      });
    } catch (error) {
      console.error("Erro ao buscar localizacoes:", error);
      return sendError(res, 500, "Erro ao buscar localizacoes");
    }
  }

  async getNearby(req, res) {
    try {
      if (String(req.user?.userType || "").toLowerCase() !== "admin") {
        return sendError(res, 403, "Apenas admin pode usar busca de proximidade");
      }

      const { latitude, longitude, maxDistance = 5000, vehicleType } = req.query;

      const latValue = parseCoordinate(latitude, -90, 90);
      const lngValue = parseCoordinate(longitude, -180, 180);
      if (latValue === null || lngValue === null) {
        return sendError(res, 400, "Latitude e longitude invalidas");
      }

      const distanceValue = Number(maxDistance);
      if (!Number.isFinite(distanceValue) || distanceValue <= 0) {
        return sendError(res, 400, "Distancia maxima invalida");
      }

      let normalizedVehicleType;
      if (vehicleType !== undefined) {
        normalizedVehicleType = normalizeVehicleType(vehicleType);
        if (!normalizedVehicleType) {
          return sendError(res, 400, "Tipo de veiculo invalido");
        }
      }

      const drivers = await DriverLocation.findNearby(
        latValue,
        lngValue,
        Math.floor(distanceValue),
        normalizedVehicleType,
      ).populate("driverId", "name phone profilePhoto");

      return res.json({
        count: drivers.length,
        drivers,
      });
    } catch (error) {
      console.error("Erro ao buscar motoristas proximos:", error);
      return sendError(res, 500, "Erro ao buscar motoristas proximos");
    }
  }

  async updateStatus(req, res) {
    try {
      if (!isDriverOrAdmin(req)) {
        return sendError(res, 403, "Apenas motoristas podem atualizar status");
      }

      const driverId = req.user.id;
      const { status, serviceTypes } = req.body;

      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        return sendError(res, 400, "Status de motorista invalido");
      }

      const normalizedServiceTypes = normalizeServiceTypes(serviceTypes);
      if (normalizedServiceTypes === null) {
        return sendError(res, 400, "Tipos de servico invalidos");
      }

      const updatePayload = {
        status: normalizedStatus,
      };
      if (normalizedServiceTypes) {
        updatePayload.serviceTypes = normalizedServiceTypes;
      }

      const driverLocation = await DriverLocation.findOneAndUpdate(
        { driverId },
        updatePayload,
        { new: true, runValidators: true },
      );

      if (!driverLocation) {
        return sendError(res, 404, "Motorista nao encontrado. Atualize sua localizacao primeiro.");
      }

      // ⚡️ CORREÇÃO CRÍTICA DO DRIFT DE CLOCK: Processar Máquina de Estados Online/Offline
      // Garante que ao clicar "Ficar Offline", os segundos finais sejam salvos e isOnline vire FALSE!
      try {
        const user = await User.findById(driverId);
        if (user) {
          const todayStr = new Date().toISOString().split("T")[0];
          
          if (!user.onlineStats) {
            user.onlineStats = {
              totalSecondsToday: 0,
              lastHeartbeatAt: new Date(),
              activeDateStr: todayStr,
              isOnline: false,
            };
          }

          // Se mudou o dia no fuso UTC/ISO, reseta o acumulador
          if (user.onlineStats.activeDateStr !== todayStr) {
            user.onlineStats.totalSecondsToday = 0;
            user.onlineStats.lastHeartbeatAt = new Date();
            user.onlineStats.activeDateStr = todayStr;
            user.onlineStats.isOnline = normalizedStatus !== "offline";
          } else {
            const wasOnline = Boolean(user.onlineStats.isOnline);
            const isNowOnline = normalizedStatus !== "offline";

            // Calcula tempo real transcorrido desde a última batida de coração
            const last = new Date(user.onlineStats.lastHeartbeatAt).getTime();
            const diffMs = Date.now() - last;
            const diffSec = Math.floor(diffMs / 1000);

            // 💡 REGRA MATEMÁTICA ABSOLUTA: Só acumula tempo se o status ANTERIOR era ONLINE!
            if (wasOnline && diffSec > 0 && diffSec < 60) {
              user.onlineStats.totalSecondsToday += diffSec;
            }

            // Atualiza referências de estado para parar a contagem IMEDIATAMENTE no banco
            user.onlineStats.lastHeartbeatAt = new Date();
            user.onlineStats.isOnline = isNowOnline;
          }
          
          await user.save();

          // 📡 Emitir atualização instantânea via Socket para sincronizar o front na hora
          const io = req.app.get("io");
          if (io) {
            io.to(`driver-${driverId}`).emit("online_time_updated", {
              totalSecondsToday: user.onlineStats.totalSecondsToday,
            });
          }
        }
      } catch (err) {
        console.error("Erro ao atualizar estado de tempo no updateStatus:", err);
      }

      return res.json({
        message: "Status atualizado",
        location: driverLocation,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      return sendError(res, 500, "Erro ao atualizar status");
    }
  }
}

module.exports = new DriverLocationController();