const mongoose = require("mongoose");
const City = require("../models/City");
const User = require("../models/User");

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

function normalizeState(value) {
  const normalized = String(value || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return normalized;
}

function parseBooleanParam(value) {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "sim"].includes(normalized)) return true;
  if (["false", "0", "no", "nao"].includes(normalized)) return false;
  return null;
}

function ensureObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

class CityController {
  async index(req, res) {
    try {
      const { active, isActive, state } = req.query;
      const filter = {};

      const activeLegacy = parseBooleanParam(active);
      if (activeLegacy === null) {
        return sendError(res, 400, "Parametro active invalido");
      }

      const activeCurrent = parseBooleanParam(isActive);
      if (activeCurrent === null) {
        return sendError(res, 400, "Parametro isActive invalido");
      }

      if (activeLegacy !== undefined) filter.isActive = activeLegacy;
      if (activeCurrent !== undefined) filter.isActive = activeCurrent;

      if (state !== undefined) {
        const stateValue = normalizeState(state);
        if (!stateValue) {
          return sendError(res, 400, "UF invalida");
        }
        filter.state = stateValue;
      }

      const cities = await City.find(filter).sort({ name: 1 });
      return res.json(cities);
    } catch (error) {
      console.error("Erro ao listar cidades:", error);
      return sendError(res, 500, "Erro ao listar cidades");
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      if (!ensureObjectId(id)) {
        return sendError(res, 400, "Cidade invalida");
      }

      const city = await City.findById(id);
      if (!city) {
        return sendError(res, 404, "Cidade nao encontrada");
      }

      return res.json(city);
    } catch (error) {
      console.error("Erro ao buscar cidade:", error);
      return sendError(res, 500, "Erro ao buscar cidade");
    }
  }

  async store(req, res) {
    try {
      const cityData = { ...(req.body || {}) };

      const nameValue = normalizeText(cityData.name);
      const stateValue = normalizeState(cityData.state);
      const timezoneValue = normalizeText(cityData.timezone);

      if (!nameValue || !stateValue || !timezoneValue) {
        return sendError(res, 400, "Nome, estado e fuso horario sao obrigatorios");
      }

      cityData.name = nameValue;
      cityData.state = stateValue;
      cityData.timezone = timezoneValue;

      const existingCity = await City.findOne({
        name: new RegExp(`^${nameValue.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i"),
        state: stateValue,
      });

      if (existingCity) {
        return sendError(res, 409, "Ja existe uma cidade cadastrada com este nome neste estado");
      }

      const city = await City.create(cityData);
      return res.status(201).json(city);
    } catch (error) {
      console.error("Erro ao criar cidade:", error);
      return sendError(res, 400, "Erro ao criar cidade", { details: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = { ...(req.body || {}) };

      if (!ensureObjectId(id)) {
        return sendError(res, 400, "Cidade invalida");
      }

      const city = await City.findById(id);
      if (!city) {
        return sendError(res, 404, "Cidade nao encontrada");
      }

      if (updateData.name !== undefined) {
        const nameValue = normalizeText(updateData.name);
        if (!nameValue) {
          return sendError(res, 400, "Nome da cidade invalido");
        }
        updateData.name = nameValue;
      }

      if (updateData.state !== undefined) {
        const stateValue = normalizeState(updateData.state);
        if (!stateValue) {
          return sendError(res, 400, "UF invalida");
        }
        updateData.state = stateValue;
      }

      if (updateData.timezone !== undefined) {
        const timezoneValue = normalizeText(updateData.timezone);
        if (!timezoneValue) {
          return sendError(res, 400, "Fuso horario invalido");
        }
        updateData.timezone = timezoneValue;
      }

      const nextName = updateData.name || city.name;
      const nextState = updateData.state || city.state;

      const duplicate = await City.findOne({
        _id: { $ne: city._id },
        name: new RegExp(`^${String(nextName).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i"),
        state: nextState,
      });

      if (duplicate) {
        return sendError(res, 409, "Ja existe uma cidade cadastrada com este nome neste estado");
      }

      const updated = await City.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      return res.json(updated);
    } catch (error) {
      console.error("Erro ao atualizar cidade:", error);
      return sendError(res, 400, "Erro ao atualizar cidade", { details: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!ensureObjectId(id)) {
        return sendError(res, 400, "Cidade invalida");
      }

      const city = await City.findById(id);
      if (!city) {
        return sendError(res, 404, "Cidade nao encontrada");
      }

      const cityRegex = new RegExp(`^${String(city.name).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");
      const usersInCity = await User.countDocuments({
        $or: [
          { city: cityRegex },
          { "address.city": cityRegex },
        ],
      });

      if (usersInCity > 0) {
        return sendError(res, 400, "Nao e possivel excluir cidade com usuarios vinculados", {
          usersCount: usersInCity,
        });
      }

      await City.findByIdAndDelete(id);
      return res.json({ message: "Cidade excluida com sucesso" });
    } catch (error) {
      console.error("Erro ao deletar cidade:", error);
      return sendError(res, 500, "Erro ao deletar cidade");
    }
  }

  async stats(req, res) {
    try {
      const { id } = req.params;

      if (!ensureObjectId(id)) {
        return sendError(res, 400, "Cidade invalida");
      }

      const city = await City.findById(id);
      if (!city) {
        return sendError(res, 404, "Cidade nao encontrada");
      }

      const cityRegex = new RegExp(`^${String(city.name).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, "i");

      const locationMatch = {
        $or: [{ city: cityRegex }, { "address.city": cityRegex }],
      };

      const totalDrivers = await User.countDocuments({
        ...locationMatch,
        userType: "driver",
      });

      const activeDrivers = await User.countDocuments({
        ...locationMatch,
        userType: "driver",
        isActive: true,
      });

      const totalClients = await User.countDocuments({
        ...locationMatch,
        userType: "client",
      });

      city.stats = {
        totalDrivers,
        activeDrivers,
        totalClients,
        totalRides: city.stats?.totalRides || 0,
        monthlyRevenue: city.stats?.monthlyRevenue || 0,
      };

      await city.save();
      return res.json(city.stats);
    } catch (error) {
      console.error("Erro ao buscar estatisticas:", error);
      return sendError(res, 500, "Erro ao buscar estatisticas");
    }
  }

  async timezones(req, res) {
    try {
      const timezones = [
        { value: "America/Rio_Branco", label: "Acre - Rio Branco (UTC-5)" },
        { value: "America/Manaus", label: "Amazonas - Manaus (UTC-4)" },
        { value: "America/Porto_Velho", label: "Rondonia - Porto Velho (UTC-4)" },
        { value: "America/Boa_Vista", label: "Roraima - Boa Vista (UTC-4)" },
        { value: "America/Cuiaba", label: "Mato Grosso - Cuiaba (UTC-4)" },
        { value: "America/Sao_Paulo", label: "Sao Paulo - Sao Paulo (UTC-3)" },
        { value: "America/Bahia", label: "Bahia - Salvador (UTC-3)" },
        { value: "America/Belem", label: "Para - Belem (UTC-3)" },
        { value: "America/Fortaleza", label: "Ceara - Fortaleza (UTC-3)" },
        { value: "America/Recife", label: "Pernambuco - Recife (UTC-3)" },
        { value: "America/Maceio", label: "Alagoas - Maceio (UTC-3)" },
        { value: "America/Araguaina", label: "Tocantins - Palmas (UTC-3)" },
        { value: "America/Santarem", label: "Para - Santarem (UTC-3)" },
        { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
      ];

      return res.json(timezones);
    } catch (error) {
      console.error("Erro ao listar fusos horarios:", error);
      return sendError(res, 500, "Erro ao listar fusos horarios");
    }
  }
}

module.exports = new CityController();