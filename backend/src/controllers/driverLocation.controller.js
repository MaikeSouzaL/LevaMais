const DriverLocation = require("../models/DriverLocation");
const User = require("../models/User");

const DRIVER_STATUSES = new Set(["offline", "available", "busy", "on_ride"]);
const VEHICLE_TYPES = new Set(["motorcycle", "car", "van", "truck"]);
const SERVICE_TYPES = new Set(["ride", "delivery"]);
const RIDE_CAPABLE_VEHICLES = new Set(["motorcycle", "car"]);
const DEFAULT_APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Sao_Paulo";

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

function filterServiceTypesByVehicle(vehicleType, serviceTypes) {
  if (!Array.isArray(serviceTypes)) return serviceTypes;
  if (RIDE_CAPABLE_VEHICLES.has(vehicleType)) return serviceTypes;
  return serviceTypes.filter((item) => item !== "ride");
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

function toMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100) / 100;
}

function getDateKeyInTimezone(date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    if (!year || !month || !day) return date.toISOString().split("T")[0];
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

async function upsertDailyStatsSnapshot({ driverId, user, dateStr }) {
  if (!driverId || !user || !dateStr) return;
  const DriverDailyStats = require("../models/DriverDailyStats");
  const balance = toMoney(user?.driverBalance?.balance || 0);
  await DriverDailyStats.findOneAndUpdate(
    { driverId, dateStr },
    {
      $set: {
        totalSeconds: Number(user?.onlineStats?.totalSecondsToday || 0),
        walletBalanceEnd: balance,
      },
      $setOnInsert: {
        walletBalanceStart: balance,
      },
    },
    { upsert: true, new: true }
  );
}

async function syncOnlineStatsForTransition({ user, driverId, normalizedStatus, app }) {
  if (!user) return;

  const now = new Date();
  const todayStr = getDateKeyInTimezone(now);

  if (!user.onlineStats) {
    user.onlineStats = {
      totalSecondsToday: 0,
      lastHeartbeatAt: now,
      activeDateStr: todayStr,
      isOnline: false,
    };
  }

  const previousDate = user.onlineStats.activeDateStr || todayStr;
  const wasOnline = Boolean(user.onlineStats.isOnline);
  const isNowOnline = normalizedStatus !== "offline";

  if (previousDate !== todayStr) {
    await upsertDailyStatsSnapshot({
      driverId,
      user,
      dateStr: previousDate,
    });

    user.onlineStats.totalSecondsToday = 0;
    user.onlineStats.lastHeartbeatAt = now;
    user.onlineStats.activeDateStr = todayStr;
    user.onlineStats.isOnline = isNowOnline;

    if (isNowOnline) {
      const DriverDailyStats = require("../models/DriverDailyStats");
      const balance = toMoney(user?.driverBalance?.balance || 0);
      await DriverDailyStats.findOneAndUpdate(
        { driverId, dateStr: todayStr },
        {
          $setOnInsert: {
            walletBalanceStart: balance,
          },
          $set: {
            walletBalanceEnd: balance,
            firstOnlineAt: now,
          },
          $inc: {
            onlineSessionsCount: 1,
          },
        },
        { upsert: true, new: true }
      );
    }
  } else {
    const last = new Date(user.onlineStats.lastHeartbeatAt || now).getTime();
    const diffMs = Date.now() - last;
    const diffSec = Math.floor(diffMs / 1000);

    if (wasOnline && diffSec > 0 && diffSec < 3600) {
      user.onlineStats.totalSecondsToday += diffSec;
    }

    user.onlineStats.lastHeartbeatAt = now;
    user.onlineStats.isOnline = isNowOnline;

    if (!wasOnline && isNowOnline) {
      const DriverDailyStats = require("../models/DriverDailyStats");
      const balance = toMoney(user?.driverBalance?.balance || 0);
      await DriverDailyStats.findOneAndUpdate(
        { driverId, dateStr: todayStr },
        {
          $setOnInsert: {
            walletBalanceStart: balance,
            firstOnlineAt: now,
          },
          $set: {
            walletBalanceEnd: balance,
          },
          $inc: {
            onlineSessionsCount: 1,
          },
        },
        { upsert: true, new: true }
      );
    }

    if (wasOnline && !isNowOnline) {
      const DriverDailyStats = require("../models/DriverDailyStats");
      const balance = toMoney(user?.driverBalance?.balance || 0);
      await DriverDailyStats.findOneAndUpdate(
        { driverId, dateStr: todayStr },
        {
          $set: {
            lastOfflineAt: now,
            walletBalanceEnd: balance,
            totalSeconds: Number(user.onlineStats.totalSecondsToday || 0),
          },
          $setOnInsert: {
            walletBalanceStart: balance,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  await user.save();

  const io = app?.get?.("io");
  if (io) {
    io.to(`driver-${driverId}`).emit("online_time_updated", {
      totalSecondsToday: Number(user.onlineStats.totalSecondsToday || 0),
    });
  }
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
        searchRadiusKm,
      } = req.body;

      const latValue = parseCoordinate(latitude, -90, 90);
      const lngValue = parseCoordinate(longitude, -180, 180);

      if (latValue === null || lngValue === null) {
        return sendError(res, 400, "Latitude e longitude invalidas");
      }

      const driverUser = await User.findById(driverId).select(
        "userType vehicleType vehicleInfo driverPreferences",
      );
      if (!driverUser || driverUser.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem atualizar localizacao");
      }

      const fallbackVehicleType = driverUser.vehicleType;
      const fallbackServiceTypes = Array.isArray(driverUser.driverPreferences?.serviceTypes)
        ? driverUser.driverPreferences.serviceTypes
        : undefined;
      const fallbackSearchRadiusKm = Number(driverUser.driverPreferences?.searchRadiusKm);

      const normalizedVehicleType = normalizeVehicleType(vehicleType || fallbackVehicleType);
      if (!normalizedVehicleType) {
        return sendError(res, 400, "Tipo de veiculo invalido");
      }

      const normalizedStatus = normalizeStatus(status);
      if (normalizedStatus === null) {
        return sendError(res, 400, "Status de motorista invalido");
      }

      const normalizedServiceTypes = normalizeServiceTypes(serviceTypes || fallbackServiceTypes);
      if (normalizedServiceTypes === null) {
        return sendError(res, 400, "Tipos de servico invalidos");
      }
      const compatibleServiceTypes = filterServiceTypesByVehicle(
        normalizedVehicleType,
        normalizedServiceTypes || ["delivery"],
      );
      if (!compatibleServiceTypes.length) {
        return sendError(res, 400, "Nenhum tipo de servico compativel com este veiculo");
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
        // Cache da categoria de corrida (moto sempre "moto"; carro usa vehicleInfo ou economy)
        rideCategory:
          normalizedVehicleType === "motorcycle"
            ? "moto"
            : normalizedVehicleType === "car"
              ? (["car_economy", "car_comfort", "car_luxury"].includes(driverUser.vehicleInfo?.rideCategory)
                  ? driverUser.vehicleInfo.rideCategory
                  : "car_economy")
              : null,
        lastUpdated: new Date(),
      };

      if (headingValue !== undefined) updatePayload.heading = headingValue;
      if (speedValue !== undefined) updatePayload.speed = speedValue;
      if (vehicle && typeof vehicle === "object") updatePayload.vehicle = vehicle;
      else if (driverUser.vehicleInfo) updatePayload.vehicle = driverUser.vehicleInfo;
      if (compatibleServiceTypes) updatePayload.serviceTypes = compatibleServiceTypes;
      
      if (searchRadiusKm !== undefined && searchRadiusKm !== null) {
        const radiusVal = Number(searchRadiusKm);
        if (Number.isFinite(radiusVal) && radiusVal >= 1 && radiusVal <= 300) {
          updatePayload.searchRadiusKm = radiusVal;
        }
      } else if (
        Number.isFinite(fallbackSearchRadiusKm) &&
        fallbackSearchRadiusKm >= 1 &&
        fallbackSearchRadiusKm <= 300
      ) {
        updatePayload.searchRadiusKm = fallbackSearchRadiusKm;
      }

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
          await syncOnlineStatsForTransition({
            user,
            driverId,
            normalizedStatus,
            app: req.app,
          });
        }
      } catch (err) {
        console.error("Erro ao sincronizar tempo online no updateLocation:", err);
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
      const { status, serviceTypes, searchRadiusKm } = req.body;

      const driverUser = await User.findById(driverId).select(
        "userType vehicleType driverPreferences",
      );
      if (!driverUser || driverUser.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem atualizar status");
      }

      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        return sendError(res, 400, "Status de motorista invalido");
      }

      const fallbackServiceTypes = Array.isArray(driverUser.driverPreferences?.serviceTypes)
        ? driverUser.driverPreferences.serviceTypes
        : undefined;
      const fallbackSearchRadiusKm = Number(driverUser.driverPreferences?.searchRadiusKm);
      const fallbackVehicleType = normalizeVehicleType(driverUser.vehicleType);

      const normalizedServiceTypes = normalizeServiceTypes(serviceTypes || fallbackServiceTypes);
      if (normalizedServiceTypes === null) {
        return sendError(res, 400, "Tipos de servico invalidos");
      }
      const compatibleServiceTypes = filterServiceTypesByVehicle(
        fallbackVehicleType || "motorcycle",
        normalizedServiceTypes || ["delivery"],
      );
      if (!compatibleServiceTypes.length) {
        return sendError(res, 400, "Nenhum tipo de servico compativel com este veiculo");
      }

      const updatePayload = {
        status: normalizedStatus,
      };
      if (compatibleServiceTypes) {
        updatePayload.serviceTypes = compatibleServiceTypes;
      }
      if (searchRadiusKm !== undefined && searchRadiusKm !== null) {
        const radiusVal = Number(searchRadiusKm);
        if (Number.isFinite(radiusVal) && radiusVal >= 1 && radiusVal <= 300) {
          updatePayload.searchRadiusKm = radiusVal;
        }
      } else if (
        Number.isFinite(fallbackSearchRadiusKm) &&
        fallbackSearchRadiusKm >= 1 &&
        fallbackSearchRadiusKm <= 300
      ) {
        updatePayload.searchRadiusKm = fallbackSearchRadiusKm;
      }

      const driverLocation = await DriverLocation.findOneAndUpdate(
        { driverId },
        updatePayload,
        { new: true, runValidators: true },
      );

      if (!driverLocation) {
        return sendError(res, 404, "Motorista nao encontrado. Atualize sua localizacao primeiro.");
      }

      // Sincroniza tempo online no clique online/offline e em transicoes de status.
      try {
        const user = await User.findById(driverId);
        if (user) {
          await syncOnlineStatsForTransition({
            user,
            driverId,
            normalizedStatus,
            app: req.app,
          });
        }
      } catch (err) {
        console.error("Erro ao sincronizar tempo online no updateStatus:", err);
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

  async getNearbyVehicleAvailability(req, res) {
    try {
      const { latitude, longitude, maxDistance = 50000 } = req.query;
      
      const latValue = parseCoordinate(latitude, -90, 90);
      const lngValue = parseCoordinate(longitude, -180, 180);
      if (latValue === null || lngValue === null) {
        return sendError(res, 400, "Coordenadas de latitude e longitude invalidas");
      }
      
      const distValue = Number(maxDistance);
      if (!Number.isFinite(distValue) || distValue <= 0) {
        return sendError(res, 400, "Distancia de busca invalida");
      }

      const pipeline = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lngValue, latValue] },
            distanceField: "calculatedDistance",
            maxDistance: Math.min(distValue, 100000),
            spherical: true,
            query: { status: "available" }
          }
        },
        {
          $group: {
            _id: "$vehicleType",
            count: { $sum: 1 }
          }
        }
      ];

      const results = await DriverLocation.aggregate(pipeline);
      
      const availabilityMap = {
        motorcycle: false,
        car: false,
        van: false,
        truck: false
      };

      results.forEach(row => {
        if (row._id && typeof availabilityMap[row._id] !== "undefined") {
          availabilityMap[row._id] = true;
        }
      });

      return res.json({
        success: true,
        availability: availabilityMap
      });
    } catch (error) {
      console.error("Erro ao mapear disponibilidade de veiculos:", error);
      return sendError(res, 500, "Erro ao computar disponibilidade de frota online");
    }
  }
}

module.exports = new DriverLocationController();
