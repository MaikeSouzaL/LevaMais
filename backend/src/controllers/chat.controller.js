const ChatMessage = require("../models/ChatMessage");
const Ride = require("../models/Ride");

function userOwnsRide(ride, userId, userType) {
  if (!ride) return false;
  if (userType === "admin") return true;
  if (userType === "driver") return String(ride.driverId || "") === String(userId);
  return String(ride.clientId || "") === String(userId);
}

function getReceiverId(ride, senderId, senderType) {
  if (senderType === "driver") return ride.clientId;
  if (senderType === "client") return ride.driverId;
  return String(ride.clientId || "") === String(senderId)
    ? ride.driverId
    : ride.clientId;
}

function toPayload(message) {
  return {
    id: message._id,
    _id: message._id,
    rideId: message.rideId,
    senderId: message.senderId,
    receiverId: message.receiverId,
    senderType: message.senderType,
    message: message.message,
    createdAt: message.createdAt,
    timestamp: message.createdAt,
    readAt: message.readAt,
  };
}

async function createMessage({ rideId, senderId, senderType, message }) {
  const ride = await Ride.findById(rideId).select("clientId driverId status");
  if (!ride) {
    const error = new Error("Corrida nao encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (!userOwnsRide(ride, senderId, senderType)) {
    const error = new Error("Voce nao tem acesso ao chat desta corrida");
    error.statusCode = 403;
    throw error;
  }

  const receiverId = getReceiverId(ride, senderId, senderType);
  if (!receiverId) {
    const error = new Error("Ainda nao ha destinatario para esta conversa");
    error.statusCode = 400;
    throw error;
  }

  const text = String(message || "").trim();
  if (!text) {
    const error = new Error("Mensagem vazia");
    error.statusCode = 400;
    throw error;
  }

  const created = await ChatMessage.create({
    rideId,
    senderId,
    receiverId,
    senderType,
    message: text,
  });

  return toPayload(created);
}

class ChatController {
  async listRideMessages(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;
      const userType = req.user.userType || "client";

      const ride = await Ride.findById(rideId).select("clientId driverId");
      if (!ride) return res.status(404).json({ error: "Corrida nao encontrada" });
      if (!userOwnsRide(ride, userId, userType)) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const messages = await ChatMessage.find({ rideId })
        .sort({ createdAt: 1 })
        .limit(300);

      return res.json({ messages: messages.map(toPayload) });
    } catch (error) {
      console.error("Erro ao listar mensagens:", error);
      return res.status(500).json({
        error: "Erro ao listar mensagens",
        details: error.message,
      });
    }
  }

  async sendRideMessage(req, res) {
    try {
      const payload = await createMessage({
        rideId: req.params.rideId,
        senderId: req.user.id,
        senderType: req.user.userType || "client",
        message: req.body.message,
      });

      const io = req.app.get("io");
      if (io) {
        const receiverType = payload.senderType === "driver" ? "client" : "driver";
        io.to(`${receiverType}-${payload.receiverId}`).emit("new-message", payload);
      }

      return res.status(201).json({ message: payload });
    } catch (error) {
      const status = error.statusCode || 500;
      if (status >= 500) console.error("Erro ao enviar mensagem:", error);
      return res.status(status).json({
        error: error.message || "Erro ao enviar mensagem",
      });
    }
  }
}

module.exports = new ChatController();
module.exports.createMessage = createMessage;
