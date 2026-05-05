const ChatMessage = require("../models/ChatMessage");
const Ride = require("../models/Ride");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function normalizeUserType(userType) {
  const value = String(userType || "")
    .trim()
    .toLowerCase();
  if (["client", "driver", "admin"].includes(value)) return value;
  return "client";
}

function userOwnsRide(ride, userId, userType) {
  if (!ride) return false;

  const normalizedType = normalizeUserType(userType);
  if (normalizedType === "admin") return true;
  if (normalizedType === "driver") {
    return String(ride.driverId || "") === String(userId);
  }
  if (normalizedType === "client") {
    return String(ride.clientId || "") === String(userId);
  }

  return (
    String(ride.clientId || "") === String(userId) ||
    String(ride.driverId || "") === String(userId)
  );
}

async function assertRideAccess({ rideId, userId, userType, select }) {
  const ride = await Ride.findById(rideId).select(
    select || "clientId driverId status",
  );

  if (!ride) {
    const error = new Error("Corrida nao encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (!userOwnsRide(ride, userId, userType)) {
    const error = new Error("Voce nao tem acesso ao chat desta corrida");
    error.statusCode = 403;
    throw error;
  }

  return ride;
}

function assertSenderRoleAllowed(senderType) {
  const normalizedType = normalizeUserType(senderType);
  if (normalizedType === "admin") {
    const error = new Error("Perfil nao autorizado para enviar mensagens");
    error.statusCode = 403;
    throw error;
  }
  if (!["client", "driver"].includes(normalizedType)) {
    const error = new Error("Perfil de remetente invalido");
    error.statusCode = 400;
    throw error;
  }
  return normalizedType;
}

function parseStatusCode(error) {
  const status = Number(error?.statusCode || error?.status);
  if ([400, 401, 403, 404, 409, 422, 429].includes(status)) return status;
  return 500;
}

function getReceiverId(ride, senderId, senderType) {
  const normalizedType = normalizeUserType(senderType);

  if (normalizedType === "driver") return ride.clientId;
  if (normalizedType === "client") return ride.driverId;

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

function serializeMessage(message) {
  const normalized = toPayload(message);
  normalized.senderId = String(normalized.senderId || "");
  normalized.receiverId = String(normalized.receiverId || "");
  normalized.rideId = String(normalized.rideId || "");
  return normalized;
}

async function createMessage({ rideId, senderId, senderType, message }) {
  const normalizedSenderType = assertSenderRoleAllowed(senderType);

  const ride = await assertRideAccess({
    rideId,
    userId: senderId,
    userType: normalizedSenderType,
    select: "clientId driverId status",
  });

  const receiverId = getReceiverId(ride, senderId, normalizedSenderType);
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
    senderType: normalizedSenderType,
    message: text,
  });

  return serializeMessage(created);
}

class ChatController {
  async listRideMessages(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;
      const userType = normalizeUserType(req.user.userType || "client");

      await assertRideAccess({
        rideId,
        userId,
        userType,
        select: "clientId driverId",
      });

      const readAt = new Date();
      await ChatMessage.updateMany(
        {
          rideId,
          receiverId: userId,
          readAt: null,
        },
        { readAt },
      );

      const messages = await ChatMessage.find({ rideId })
        .sort({ createdAt: 1 })
        .limit(300);

      return res.json({
        success: true,
        messages: messages.map(serializeMessage),
      });
    } catch (error) {
      const status = parseStatusCode(error);
      if (status >= 500) {
        console.error("Erro ao listar mensagens:", error);
      }
      return sendError(
        res,
        status,
        status === 500 ? "Erro ao listar mensagens" : error.message,
        {
          details: status === 500 ? error.message : undefined,
        },
      );
    }
  }

  async markRideMessagesAsRead(req, res) {
    try {
      const { rideId } = req.params;
      const userId = req.user.id;
      const userType = normalizeUserType(req.user.userType || "client");

      await assertRideAccess({
        rideId,
        userId,
        userType,
        select: "clientId driverId",
      });

      const readAt = new Date();
      const result = await ChatMessage.updateMany(
        {
          rideId,
          receiverId: userId,
          readAt: null,
        },
        { readAt },
      );

      return res.json({
        success: true,
        readCount: Number(result?.modifiedCount || 0),
        readAt,
      });
    } catch (error) {
      const status = parseStatusCode(error);
      if (status >= 500) {
        console.error("Erro ao marcar mensagens como lidas:", error);
      }
      return sendError(
        res,
        status,
        status === 500
          ? "Erro ao marcar mensagens como lidas"
          : error.message,
        {
          details: status === 500 ? error.message : undefined,
        },
      );
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
        io.to(`${payload.senderType}-${payload.senderId}`).emit("new-message", payload);
      }

      return res.status(201).json({
        success: true,
        message: payload,
      });
    } catch (error) {
      const status = parseStatusCode(error);
      if (status >= 500) {
        console.error("Erro ao enviar mensagem:", error);
      }
      return sendError(
        res,
        status,
        status === 500 ? "Erro ao enviar mensagem" : error.message,
        {
          details: status === 500 ? error.message : undefined,
        },
      );
    }
  }
}

module.exports = new ChatController();
module.exports.createMessage = createMessage;
module.exports.assertRideAccess = assertRideAccess;
