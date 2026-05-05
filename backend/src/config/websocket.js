const socketIo = require("socket.io");
const jwt = require("jsonwebtoken");

let io;

function initializeWebSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*", // TODO: Configurar origins permitidas
      methods: ["GET", "POST"],
    },
    // Reduz falsos "ping timeout" em redes móveis/wi-fi instáveis
    pingInterval: 25000,
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Token não fornecido"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

      // Token do app (auth.controller) usa { id, userType? }
      socket.userId = decoded.id || decoded.userId;
      socket.userType = decoded.userType || "client";

      next();
    } catch (error) {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `✅ WebSocket conectado: ${socket.id} (User: ${socket.userId})`,
    );

    // Juntar sala específica do usuário
    const userRoom =
      socket.userType === "driver"
        ? `driver-${socket.userId}`
        : `client-${socket.userId}`;
    socket.join(userRoom);

    console.log(`📍 Usuário entrou na sala: ${userRoom}`);

    // Evento: Motorista atualiza localização em tempo real
    socket.on("update-location", async (data) => {
      try {
        const { latitude, longitude, heading, speed } = data;

        const DriverLocation = require("../models/DriverLocation");

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

        // Se motorista está em corrida, notificar cliente
        const driverLocation = await DriverLocation.findOne({
          driverId: socket.userId,
        });

        if (driverLocation && driverLocation.currentRideId) {
          const Ride = require("../models/Ride");
          const ride = await Ride.findById(driverLocation.currentRideId);

          if (ride) {
            io.to(`client-${ride.clientId}`).emit("driver-location-updated", {
              rideId: ride._id,
              location: { latitude, longitude },
              heading,
              speed,
            });
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar localização:", error);
      }
    });

    // Evento: Cliente está aguardando motorista
    socket.on("waiting-driver", (data) => {
      const { rideId } = data;
      console.log(
        `⏳ Cliente ${socket.userId} aguardando motorista (Ride: ${rideId})`,
      );
    });

    // Evento: Motorista chegou
    socket.on("driver-arrived", async (data) => {
      try {
        const { rideId } = data;
        const Ride = require("../models/Ride");

        const ride = await Ride.findById(rideId);
        if (ride) {
          io.to(`client-${ride.clientId}`).emit("driver-arrived", {
            rideId,
            message: "Motorista chegou!",
          });
        }
      } catch (error) {
        console.error("Erro ao notificar chegada:", error);
      }
    });

    // Evento: Iniciar corrida
    socket.on("start-ride", async (data) => {
      try {
        const { rideId } = data;
        const Ride = require("../models/Ride");

        const ride = await Ride.findById(rideId);
        if (ride) {
          io.to(`client-${ride.clientId}`).emit("ride-started", {
            rideId,
            message: "Corrida iniciada!",
          });
        }
      } catch (error) {
        console.error("Erro ao iniciar corrida:", error);
      }
    });

    // Evento: Mensagem de chat
    socket.on("send-message", async (data) => {
      try {
        const { rideId, message } = data;
        const { createMessage } = require("../controllers/chat.controller");

        const payload = await createMessage({
          rideId,
          senderId: socket.userId,
          senderType: socket.userType,
          message,
        });

        const receiverType = payload.senderType === "driver" ? "client" : "driver";
        io.to(`${receiverType}-${payload.receiverId}`).emit("new-message", payload);
      } catch (error) {
        console.error("Erro ao enviar mensagem:", error);
      }
    });

    // Desconexão
    socket.on("disconnect", () => {
      console.log(`❌ WebSocket desconectado: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("WebSocket não foi inicializado");
  }
  return io;
}

module.exports = { initializeWebSocket, getIO };
