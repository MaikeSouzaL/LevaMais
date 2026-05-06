const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Ride = require("../models/Ride");
const DriverLocation = require("../models/DriverLocation");

let io;

function normalizeUserType(userType) {
  const value = String(userType || "")
    .trim()
    .toLowerCase();
  if (["client", "driver", "admin"].includes(value)) return value;
  return "client";
}

function isSameId(a, b) {
  return String(a || "") === String(b || "");
}

async function resolveRideForSocket(rideId, socket) {
  const ride = await Ride.findById(rideId).select("clientId driverId status");
  if (!ride) {
    const error = new Error("Corrida nao encontrada");
    error.statusCode = 404;
    throw error;
  }

  const userType = normalizeUserType(socket.userType);
  if (userType === "admin") return ride;

  const isClient = isSameId(ride.clientId, socket.userId);
  const isDriver = isSameId(ride.driverId, socket.userId);

  if (!isClient && !isDriver) {
    const error = new Error("Acesso negado para esta corrida");
    error.statusCode = 403;
    throw error;
  }

  return ride;
}

function initializeWebSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*", // TODO: Configurar origins permitidas
      methods: ["GET", "POST"],
    },
    // Reduz falsos ping timeout em redes moveis/wi-fi instaveis
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Token nao fornecido"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

      // Token do app (auth.controller) usa { id, userType? }
      socket.userId = decoded.id || decoded.userId;
      socket.userType = normalizeUserType(decoded.userType || "client");

      next();
    } catch (error) {
      next(new Error("Token invalido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`WebSocket conectado: ${socket.id} (User: ${socket.userId})`);

    // Juntar sala especifica do usuario
    const userRoom =
      socket.userType === "driver"
        ? `driver-${socket.userId}`
        : `client-${socket.userId}`;
    socket.join(userRoom);

    console.log(`Usuario entrou na sala: ${userRoom}`);

    // Evento: Motorista atualiza localizacao em tempo real
    socket.on("update-location", async (data) => {
      try {
        if (normalizeUserType(socket.userType) !== "driver") return;

        const latitude = Number(data?.latitude);
        const longitude = Number(data?.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

        const heading = Number.isFinite(Number(data?.heading))
          ? Number(data.heading)
          : undefined;
        const speed = Number.isFinite(Number(data?.speed))
          ? Number(data.speed)
          : undefined;

        await DriverLocation.findOneAndUpdate(
          { driverId: socket.userId },
          {
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            heading,
            speed,
            lastUpdated: new Date(),
          },
          { upsert: true },
        );

        // Se motorista esta em corrida, notificar cliente
        const driverLocation = await DriverLocation.findOne({
          driverId: socket.userId,
        }).select("currentRideId");

        if (driverLocation?.currentRideId) {
          const ride = await Ride.findById(driverLocation.currentRideId).select(
            "clientId driverId",
          );

          if (ride && isSameId(ride.driverId, socket.userId)) {
            io.to(`client-${ride.clientId}`).emit("driver-location-updated", {
              rideId: String(ride._id),
              location: { latitude, longitude },
              heading,
              speed,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar localizacao:", error);
      }
    });

    // Evento: Cliente esta aguardando motorista
    socket.on("waiting-driver", async (data) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        if (!rideId) return;

        const ride = await resolveRideForSocket(rideId, socket);
        if (!isSameId(ride.clientId, socket.userId)) {
          return;
        }

        console.log(
          `Cliente ${socket.userId} aguardando motorista (Ride: ${rideId})`,
        );
      } catch (error) {
        console.log("waiting-driver bloqueado:", error.message);
      }
    });

    // Evento: Motorista chegou
    socket.on("driver-arrived", async (data) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        if (!rideId) return;

        const ride = await resolveRideForSocket(rideId, socket);
        if (!isSameId(ride.driverId, socket.userId)) {
          return;
        }

        io.to(`client-${ride.clientId}`).emit("driver-arrived", {
          rideId,
          message: "Motorista chegou!",
        });
      } catch (error) {
        console.error("Erro ao notificar chegada:", error.message || error);
      }
    });

    // Evento: Iniciar corrida
    socket.on("start-ride", async (data) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        if (!rideId) return;

        const ride = await resolveRideForSocket(rideId, socket);
        if (!isSameId(ride.driverId, socket.userId)) {
          return;
        }

        io.to(`client-${ride.clientId}`).emit("ride-started", {
          rideId,
          message: "Corrida iniciada!",
        });
      } catch (error) {
        console.error("Erro ao iniciar corrida:", error.message || error);
      }
    });

    // Evento: Mensagem de chat
    socket.on("send-message", async (data, ack) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        const message = String(data?.message || "");

        const { createMessage } = require("../controllers/chat.controller");

        const payload = await createMessage({
          rideId,
          senderId: socket.userId,
          senderType: socket.userType,
          message,
        });

        const receiverType = payload.senderType === "driver" ? "client" : "driver";
        io.to(`${receiverType}-${payload.receiverId}`).emit("new-message", payload);
        io.to(`${payload.senderType}-${payload.senderId}`).emit("new-message", payload);

        if (typeof ack === "function") {
          ack({ success: true, message: payload });
        }
      } catch (error) {
        const msg = String(error?.message || "Erro ao enviar mensagem");
        console.error("Erro ao enviar mensagem:", msg);

        socket.emit("chat-error", { message: msg });

        if (typeof ack === "function") {
          ack({ success: false, message: msg });
        }
      }
    });

    // Desconexao
    socket.on("disconnect", () => {
      console.log(`WebSocket desconectado: ${socket.id}`);
    });
  });

  // Loop de re-envio periódico de corridas da Fila de Espera (roda a cada 15s)
  setInterval(async () => {
    try {
      const activeQueuedRides = await Ride.find({
        status: "requesting",
        isWaitingInQueue: true,
      }).populate("clientId");

      if (activeQueuedRides.length === 0) return;

      const PlatformConfig = require("../models/PlatformConfig");
      const systemConfig = await PlatformConfig.findOne().sort({ createdAt: -1 });
      const defaultInterval = systemConfig?.queueRedispatchInterval || 60;

      for (const ride of activeQueuedRides) {
        const now = Date.now();
        const lastDispatched = new Date(ride.lastDispatchedAt || ride.createdAt).getTime();
        const clientInterval = ride.clientId?.queueRedispatchInterval;
        const intervalSeconds = clientInterval !== null && clientInterval !== undefined ? clientInterval : defaultInterval;

        if (now - lastDispatched >= intervalSeconds * 1000) {
          ride.lastDispatchedAt = new Date();
          ride.redispatchInterval = intervalSeconds;
          await ride.save();

          let searchRadius = 15000;
          try {
            if (ride.cityId) {
              const City = require("../models/City");
              const city = await City.findById(ride.cityId).select("searchRadius");
              if (city?.searchRadius) {
                searchRadius = city.searchRadius;
              }
            }
          } catch (cityErr) {}

          const nearbyDrivers = await DriverLocation.findNearby(
            ride.pickup.latitude,
            ride.pickup.longitude,
            searchRadius,
            ride.vehicleType,
            50,
            ride.serviceType
          );

          const rejectedDriverIds = (ride.rejectedBy || []).map(r => String(r.driverId));

          nearbyDrivers.forEach(driver => {
            if (!driver || !driver.driverId) return;
            if (rejectedDriverIds.includes(String(driver.driverId))) {
              // Respeita a recusa do motorista (alerta não aparece de novo para quem já recusou)
              return;
            }

            let distanceToPickup = 0;
            try {
              if (typeof driver.distanceTo === "function") {
                distanceToPickup = driver.distanceTo(
                  ride.pickup.latitude,
                  ride.pickup.longitude
                );
              }
            } catch (distErr) {}

            io.to(`driver-${driver.driverId}`).emit("new-ride-request", {
              rideId: ride._id,
              pickup: ride.pickup,
              dropoff: ride.dropoff,
              pricing: ride.pricing,
              distance: ride.distance,
              duration: ride.duration,
              serviceType: ride.serviceType,
              vehicleType: ride.vehicleType,
              requestedAt: ride.requestedAt,
              scheduledFor: ride.scheduledFor || null,
              distanceToPickup,
              negotiation: ride.negotiation?.enabled
                ? {
                    enabled: true,
                    clientOffer: ride.negotiation.clientOffer ?? null,
                    suggestedMinPrice: ride.negotiation.suggestedMinPrice ?? null,
                    finalAgreedPrice: ride.negotiation.finalAgreedPrice ?? null,
                  }
                : { enabled: false },
              client: {
                name: ride.clientId?.name,
                phone: ride.clientId?.phone,
                profilePhoto: ride.clientId?.profilePhoto,
                rating: ride.clientId?.rating || 5.0,
              },
            });
          });
        }
      }
    } catch (err) {
      console.error("Erro no loop de re-despacho da fila de espera:", err);
    }
  }, 15000);

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("WebSocket nao foi inicializado");
  }
  return io;
}

module.exports = { initializeWebSocket, getIO };
