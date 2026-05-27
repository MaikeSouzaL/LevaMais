const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");
const Ride = require("../models/Ride");
const RideTrackPoint = require("../models/RideTrackPoint");
const DriverLocation = require("../models/DriverLocation");

let io;

function parseAllowedOrigins() {
  const fromEnv = String(
    process.env.WS_CORS_ORIGINS ||
      process.env.CORS_ORIGINS ||
      process.env.CORS_ORIGIN ||
      "",
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "production") return [];
  return ["*"];
}

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
  const allowedOrigins = parseAllowedOrigins();
  const socketCorsOrigin = allowedOrigins.includes("*") ? "*" : allowedOrigins;

  io = socketIo(server, {
    cors: {
      origin: socketCorsOrigin,
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
        const accuracy = Number.isFinite(Number(data?.accuracy))
          ? Number(data.accuracy)
          : undefined;
        const phase = data?.phase || "to_dropoff";
        const capturedAt = data?.capturedAt ? new Date(data.capturedAt) : new Date();

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
            "clientId driverId status",
          );

          if (ride && isSameId(ride.driverId, socket.userId)) {
            io.to(`client-${ride.clientId}`).emit("driver-location-updated", {
              rideId: String(ride._id),
              location: { latitude, longitude },
              heading,
              speed,
              phase,
            });

            // Persistir track point (a cada atualizacao com ride ativa)
            const activeStatuses = ["accepted", "driver_arriving", "arrived", "in_progress"];
            if (activeStatuses.includes(ride.status)) {
              try {
                await RideTrackPoint.create({
                  rideId: ride._id,
                  driverId: socket.userId,
                  latitude,
                  longitude,
                  heading,
                  speed,
                  accuracy,
                  phase,
                  capturedAt,
                });
              } catch (trackErr) {
                // Silencioso - nao interrompe o fluxo principal
              }
            }
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

    // Evento: Mensagem de chat (via WebSocket, sem persistência)
    socket.on("send-message", (data, ack) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        const message = String(data?.message || "");

        const payload = {
          rideId,
          senderId: socket.userId,
          senderType: socket.userType,
          message,
          timestamp: new Date().toISOString(),
        };

        const receiverType = payload.senderType === "driver" ? "client" : "driver";
        const receiverId = data?.receiverId;
        if (receiverId) {
          io.to(`${receiverType}-${receiverId}`).emit("new-message", payload);
          io.to(`${payload.senderType}-${payload.senderId}`).emit("new-message", payload);
        }

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

    // Evento: Cliente avisa que o tempo de entrega expirou (00:00)
    socket.on("delivery_expired", async (data) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        if (!rideId) return;

        const ride = await Ride.findById(rideId);
        if (ride && String(ride.status) === "requesting") {
          ride.status = "cancelled_no_driver";
          ride.cancelledAt = new Date();
          await ride.save();

          // Move to history
          try {
            const RideHistory = require("../models/RideHistory");
            const historyRide = new RideHistory(ride.toObject());
            await historyRide.save();
          } catch (histErr) {
            console.error("Erro ao salvar historico de entrega expirada:", histErr);
          }

          console.log(`[WebSocket] Delivery ${rideId} marked as expired (cancelled_no_driver)`);

          // Broadcast to client room and everyone
          io.to(`client-${ride.clientId}`).emit("delivery_cancelled", {
            rideId: String(ride._id),
            reason: "expired",
          });

          // Broadcast to all to close sheet and remove from list
          io.emit("delivery_cancelled", {
            rideId: String(ride._id),
            reason: "expired",
          });
        }
      } catch (err) {
        console.error("Erro ao processar socket delivery_expired:", err);
      }
    });

    // Evento: Cliente avisa que o tempo de corrida expirou (00:00)
    socket.on("ride_expired", async (data) => {
      try {
        const rideId = String(data?.rideId || "").trim();
        if (!rideId) return;

        const ride = await Ride.findById(rideId);
        if (ride && String(ride.status) === "requesting") {
          ride.status = "cancelled_no_driver";
          ride.cancelledAt = new Date();
          await ride.save();

          // Move to history
          try {
            const RideHistory = require("../models/RideHistory");
            const historyRide = new RideHistory(ride.toObject());
            await historyRide.save();
          } catch (histErr) {
            console.error("Erro ao salvar historico de corrida expirada:", histErr);
          }

          console.log(`[WebSocket] Ride ${rideId} marked as expired (cancelled_no_driver)`);

          // Broadcast to client room and everyone
          io.to(`client-${ride.clientId}`).emit("ride_cancelled", {
            rideId: String(ride._id),
            reason: "expired",
          });

          // Broadcast to all to close sheet and remove from list
          io.emit("ride_cancelled", {
            rideId: String(ride._id),
            reason: "expired",
          });
        }
      } catch (err) {
        console.error("Erro ao processar socket ride_expired:", err);
      }
    });

    // Desconexao
    socket.on("disconnect", () => {
      console.log(`WebSocket desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("WebSocket nao foi inicializado");
  }
  return io;
}

module.exports = { initializeWebSocket, getIO };
