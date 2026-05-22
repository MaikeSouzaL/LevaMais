const mongoose = require("mongoose");
const Favorite = require("../models/Favorite");

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
  const normalized = String(value || "").trim();
  return normalized || "";
}

function normalizeState(value) {
  if (value === undefined) return undefined;
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return "";
  if (!/^[A-Z]{2}$/.test(normalized)) return null;
  return normalized;
}

function parseCoordinate(value, min, max) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function serializeFavorite(favorite) {
  if (!favorite) return null;
  const obj = favorite.toObject ? favorite.toObject() : favorite;
  return {
    ...obj,
    _id: String(obj._id),
    id: String(obj._id),
    name: obj.name || obj.label,
    label: obj.label || obj.name,
    formattedAddress: obj.formattedAddress || obj.address,
  };
}

class FavoriteAddressController {
  async list(req, res) {
    try {
      const favorites = await Favorite.find({ userId: req.user.id }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        favorites: favorites.map(serializeFavorite),
      });
    } catch (error) {
      console.error("Erro ao listar favoritos:", error);
      return sendError(res, 500, "Erro ao listar enderecos favoritos");
    }
  }

  async create(req, res) {
    try {
      const payload = req.body || {};
      const nameValue = normalizeText(payload.name || payload.label);
      const addressValue = normalizeText(payload.address || payload.formattedAddress);
      const latValue = parseCoordinate(payload.latitude, -90, 90);
      const lngValue = parseCoordinate(payload.longitude, -180, 180);
      const stateValue = normalizeState(payload.state);

      if (!nameValue || !addressValue) {
        return sendError(res, 400, "Nome e endereco sao obrigatorios");
      }
      if (latValue === undefined || lngValue === undefined) {
        return sendError(res, 400, "Latitude e longitude sao obrigatorias");
      }
      if (latValue === null || lngValue === null) {
        return sendError(res, 400, "Coordenadas invalidas");
      }
      if (stateValue === null) {
        return sendError(res, 400, "Estado invalido");
      }

      const duplicate = await Favorite.findOne({
        userId: req.user.id,
        name: nameValue,
      });
      if (duplicate) {
        return sendError(res, 409, `Voce ja possui um favorito com o nome "${nameValue}"`);
      }

      const favorite = await Favorite.create({
        userId: req.user.id,
        name: nameValue,
        label: nameValue,
        icon: normalizeText(payload.icon) || "favorite",
        address: addressValue,
        formattedAddress: normalizeText(payload.formattedAddress) || addressValue,
        street: normalizeOptionalText(payload.street),
        streetNumber: normalizeOptionalText(payload.streetNumber),
        neighborhood: normalizeOptionalText(payload.neighborhood),
        city: normalizeOptionalText(payload.city),
        state: stateValue,
        region: normalizeOptionalText(payload.region),
        postalCode: normalizeOptionalText(payload.postalCode),
        details: normalizeOptionalText(payload.details),
        contactName: normalizeOptionalText(payload.contactName),
        contactPhone: normalizeOptionalText(payload.contactPhone),
        latitude: latValue,
        longitude: lngValue,
      });

      return res.status(201).json({
        success: true,
        message: "Favorito adicionado com sucesso",
        favorite: serializeFavorite(favorite),
      });
    } catch (error) {
      console.error("Erro ao adicionar favorito:", error);
      return sendError(res, 500, "Erro ao adicionar endereco favorito");
    }
  }

  async update(req, res) {
    try {
      const { favoriteId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
        return sendError(res, 400, "Favorito invalido");
      }

      const favorite = await Favorite.findOne({ _id: favoriteId, userId: req.user.id });
      if (!favorite) return sendError(res, 404, "Favorito nao encontrado");

      const payload = req.body || {};
      if (payload.name !== undefined || payload.label !== undefined) {
        const nameValue = normalizeText(payload.name || payload.label);
        if (!nameValue) return sendError(res, 400, "Nome do favorito invalido");
        favorite.name = nameValue;
        favorite.label = nameValue;
      }
      if (payload.icon !== undefined) favorite.icon = normalizeText(payload.icon) || "favorite";
      if (payload.address !== undefined || payload.formattedAddress !== undefined) {
        const addressValue = normalizeText(payload.address || payload.formattedAddress);
        if (!addressValue) return sendError(res, 400, "Endereco invalido");
        favorite.address = addressValue;
        favorite.formattedAddress = normalizeText(payload.formattedAddress) || addressValue;
      }
      if (payload.street !== undefined) favorite.street = normalizeOptionalText(payload.street);
      if (payload.streetNumber !== undefined) favorite.streetNumber = normalizeOptionalText(payload.streetNumber);
      if (payload.neighborhood !== undefined) favorite.neighborhood = normalizeOptionalText(payload.neighborhood);
      if (payload.city !== undefined) favorite.city = normalizeOptionalText(payload.city);
      if (payload.region !== undefined) favorite.region = normalizeOptionalText(payload.region);
      if (payload.postalCode !== undefined) favorite.postalCode = normalizeOptionalText(payload.postalCode);
      if (payload.details !== undefined) favorite.details = normalizeOptionalText(payload.details);
      if (payload.contactName !== undefined) favorite.contactName = normalizeOptionalText(payload.contactName);
      if (payload.contactPhone !== undefined) favorite.contactPhone = normalizeOptionalText(payload.contactPhone);
      if (payload.state !== undefined) {
        const stateValue = normalizeState(payload.state);
        if (stateValue === null) return sendError(res, 400, "Estado invalido");
        favorite.state = stateValue;
      }
      if (payload.latitude !== undefined) {
        const latValue = parseCoordinate(payload.latitude, -90, 90);
        if (latValue === null) return sendError(res, 400, "Latitude invalida");
        favorite.latitude = latValue;
      }
      if (payload.longitude !== undefined) {
        const lngValue = parseCoordinate(payload.longitude, -180, 180);
        if (lngValue === null) return sendError(res, 400, "Longitude invalida");
        favorite.longitude = lngValue;
      }

      await favorite.save();
      return res.json({
        success: true,
        message: "Favorito atualizado com sucesso",
        favorite: serializeFavorite(favorite),
      });
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      return sendError(res, 500, "Erro ao atualizar endereco favorito");
    }
  }

  async delete(req, res) {
    try {
      const { favoriteId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
        return sendError(res, 400, "Favorito invalido");
      }
      const deleted = await Favorite.findOneAndDelete({ _id: favoriteId, userId: req.user.id });
      if (!deleted) return sendError(res, 404, "Favorito nao encontrado");

      return res.json({
        success: true,
        message: "Favorito removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar favorito:", error);
      return sendError(res, 500, "Erro ao deletar endereco favorito");
    }
  }
}

module.exports = new FavoriteAddressController();
