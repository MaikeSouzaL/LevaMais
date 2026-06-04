const City = require("../models/City");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({ success: false, message, error: message, ...extras });
}

function isAdminRequest(req) {
  const configuredKey = process.env.ADMIN_API_KEY || (process.env.NODE_ENV === "production" ? "" : "dev-admin-key");
  return Boolean(configuredKey && req.headers["x-admin-key"] === configuredKey);
}

function toNumber(value, fallback = undefined) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildCityPayload(body = {}) {
  const name = String(body.name || "").trim();
  const state = String(body.state || "").trim();
  const stateCode = String(body.stateCode || state || "").trim().toUpperCase().slice(0, 2);
  const latitude = toNumber(body.center?.latitude ?? body.latitude);
  const longitude = toNumber(body.center?.longitude ?? body.longitude);
  const radiusKm = toNumber(body.radiusKm, 50);

  if (!name) return { error: "Nome da cidade é obrigatório" };
  if (latitude === null || latitude < -90 || latitude > 90) return { error: "Latitude inválida" };
  if (longitude === null || longitude < -180 || longitude > 180) return { error: "Longitude inválida" };
  if (radiusKm === null || radiusKm <= 0 || radiusKm > 500) return { error: "Raio deve estar entre 1 e 500 km" };

  return {
    name,
    state,
    stateCode,
    country: String(body.country || "BR").trim().toUpperCase() || "BR",
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    center: { latitude, longitude },
    radiusKm,
    defaultVehicleType: ["motorcycle", "car", "van", "truck"].includes(body.defaultVehicleType)
      ? body.defaultVehicleType
      : "car",
  };
}

const cityController = {
  async list(req, res) {
    try {
      const includeInactive = String(req.query.includeInactive || "") === "true";
      const query = {};
      if (!includeInactive || !isAdminRequest(req)) {
        query.isActive = true;
      } else if (req.query.isActive !== undefined) {
        query.isActive = String(req.query.isActive) === "true";
      }
      if (req.query.state) {
        query.state = String(req.query.state).trim();
      }

      const cities = await City.find(query).sort({ isActive: -1, name: 1 }).lean();
      return res.json(cities);
    } catch (error) {
      return sendError(res, 500, "Erro ao listar cidades", { details: error.message });
    }
  },

  async create(req, res) {
    try {
      const payload = buildCityPayload(req.body);
      if (payload.error) return sendError(res, 400, payload.error);
      const city = await City.create(payload);
      return res.status(201).json({ success: true, city });
    } catch (error) {
      return sendError(res, 500, "Erro ao criar cidade", { details: error.message });
    }
  },

  async update(req, res) {
    try {
      const payload = buildCityPayload(req.body);
      if (payload.error) return sendError(res, 400, payload.error);
      const city = await City.findByIdAndUpdate(req.params.id, payload, {
        new: true,
        runValidators: true,
      });
      if (!city) return sendError(res, 404, "Cidade não encontrada");
      return res.json({ success: true, city });
    } catch (error) {
      return sendError(res, 500, "Erro ao atualizar cidade", { details: error.message });
    }
  },

  async deactivate(req, res) {
    try {
      const city = await City.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
      if (!city) return sendError(res, 404, "Cidade não encontrada");
      return res.json({ success: true, city });
    } catch (error) {
      return sendError(res, 500, "Erro ao desativar cidade", { details: error.message });
    }
  },
};

module.exports = cityController;
