const ChatMessage = require("../models/ChatMessage");
const Ride = require("../models/Ride");

/**
 * GET /api/rides/:rideId/chat
 * Retorna histórico de mensagens do chat de uma corrida.
 * Apenas participantes ou admin podem acessar.
 */
async function getChatHistory(req, res) {
  try {
    const { rideId } = req.params;
    const { limit = 50, before } = req.query;

    const ride = await Ride.findById(rideId).select("clientId driverId");
    if (!ride) {
      return res.status(404).json({ success: false, message: "Corrida nao encontrada" });
    }

    const userId = String(req.user.id);
    const isParticipant =
      String(ride.clientId) === userId ||
      String(ride.driverId) === userId ||
      String(req.user.userType).toLowerCase() === "admin";

    if (!isParticipant) {
      return res.status(403).json({ success: false, message: "Acesso negado" });
    }

    const filter = { rideId };
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit), 100))
      .populate("senderId", "name profilePhoto userType")
      .lean();

    const formatted = messages.reverse().map((msg) => ({
      _id: msg._id,
      rideId: msg.rideId,
      senderId: msg.senderId?._id || msg.senderId,
      senderName: msg.senderId?.name || "Usuario",
      senderType: msg.senderType,
      senderPhoto: msg.senderId?.profilePhoto || null,
      message: msg.message,
      readAt: msg.readAt,
      timestamp: msg.createdAt,
    }));

    return res.json({ success: true, messages: formatted });
  } catch (error) {
    console.error("[Chat] History error:", error);
    return res.status(500).json({ success: false, message: "Erro ao carregar mensagens" });
  }
}

module.exports = { getChatHistory };
