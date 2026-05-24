const AddressHistory = require("../models/AddressHistory");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function normalizeText(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeOptionalText(value) {
  if (value === undefined) return undefined;
  return String(value || "").trim();
}

function parseCoordinate(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function normalizeContext(value) {
  const normalized = String(value || "general").trim().toLowerCase();
  return ["sender", "receiver", "general"].includes(normalized) ? normalized : "general";
}

function normalizeSource(value) {
  const normalized = String(value || "search").trim().toLowerCase();
  return ["search", "favorite", "manual", "ride"].includes(normalized) ? normalized : "search";
}

function serializeAddressHistory(entry) {
  const obj = entry.toObject ? entry.toObject() : entry;
  return {
    ...obj,
    _id: String(obj._id),
    id: String(obj._id),
    formattedAddress: obj.formattedAddress || obj.address,
  };
}

class AddressHistoryController {
  async list(req, res) {
    try {
      const context = normalizeContext(req.query?.context);
      const limit = Math.min(Math.max(Number(req.query?.limit) || 20, 1), 50);
      const filter = { userId: req.user.id };
      if (context !== "general") {
        filter.context = { $in: [context, "general"] };
      }

      const history = await AddressHistory.find(filter)
        .sort({ lastUsedAt: -1, updatedAt: -1 })
        .limit(limit);

      return res.json({
        success: true,
        history: history.map(serializeAddressHistory),
      });
    } catch (error) {
      console.error("Erro ao listar historico de enderecos:", error);
      return sendError(res, 500, "Erro ao listar historico de enderecos");
    }
  }

  async create(req, res) {
    try {
      const payload = req.body || {};
      const address = normalizeText(payload.address || payload.formattedAddress);
      const latitude = parseCoordinate(payload.latitude, -90, 90);
      const longitude = parseCoordinate(payload.longitude, -180, 180);
      const context = normalizeContext(payload.context);

      if (!address) return sendError(res, 400, "Endereco e obrigatorio");
      if (latitude === null || longitude === null) {
        return sendError(res, 400, "Coordenadas invalidas");
      }

      const history = await AddressHistory.findOneAndUpdate(
        {
          userId: req.user.id,
          context,
          address,
        },
        {
          $set: {
            name: normalizeOptionalText(payload.name) || address.split(",")[0],
            address,
            formattedAddress: normalizeOptionalText(payload.formattedAddress) || address,
            latitude,
            longitude,
            details: normalizeOptionalText(payload.details),
            contactName: normalizeOptionalText(payload.contactName),
            contactPhone: normalizeOptionalText(payload.contactPhone),
            source: normalizeSource(payload.source),
            lastUsedAt: new Date(),
          },
          $inc: { useCount: 1 },
          $setOnInsert: {
            userId: req.user.id,
            context,
          },
        },
        { new: true, upsert: true },
      );

      return res.status(201).json({
        success: true,
        history: serializeAddressHistory(history),
      });
    } catch (error) {
      console.error("Erro ao salvar historico de endereco:", error);
      return sendError(res, 500, "Erro ao salvar historico de endereco");
    }
  }
}

module.exports = new AddressHistoryController();
