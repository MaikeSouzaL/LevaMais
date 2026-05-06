const mongoose = require("mongoose");
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

function findFavoriteIndexById(favorites, favoriteId) {
  return favorites.findIndex((fav) => String(fav._id) === String(favoriteId));
}

class FavoriteAddressController {
  async list(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("favoriteAddresses");

      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      return res.json({
        favorites: user.favoriteAddresses || [],
      });
    } catch (error) {
      console.error("Erro ao listar favoritos:", error);
      return sendError(res, 500, "Erro ao listar enderecos favoritos");
    }
  }

  async create(req, res) {
    try {
      const userId = req.user.id;
      const {
        name,
        icon,
        address,
        formattedAddress,
        street,
        streetNumber,
        neighborhood,
        city,
        state,
        region,
        postalCode,
        latitude,
        longitude,
      } = req.body;

      const nameValue = normalizeText(name);
      const addressValue = normalizeText(address);
      const latValue = parseCoordinate(latitude, -90, 90);
      const lngValue = parseCoordinate(longitude, -180, 180);
      const stateValue = normalizeState(state);

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

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      const favorites = user.favoriteAddresses || [];
      const duplicate = favorites.find(
        (fav) =>
          String(fav.name || "").trim().toLowerCase() === nameValue.toLowerCase(),
      );

      if (duplicate) {
        return sendError(res, 409, `Voce ja possui um favorito com o nome \"${nameValue}\"`);
      }

      const newFavorite = {
        name: nameValue,
        icon: normalizeText(icon) || "home",
        address: addressValue,
        formattedAddress: normalizeText(formattedAddress) || addressValue,
        street: normalizeOptionalText(street),
        streetNumber: normalizeOptionalText(streetNumber),
        neighborhood: normalizeOptionalText(neighborhood),
        city: normalizeOptionalText(city),
        state: stateValue,
        region: normalizeOptionalText(region),
        postalCode: normalizeOptionalText(postalCode),
        latitude: latValue,
        longitude: lngValue,
        createdAt: new Date(),
      };

      user.favoriteAddresses = favorites;
      user.favoriteAddresses.push(newFavorite);
      await user.save();

      const created = user.favoriteAddresses[user.favoriteAddresses.length - 1];

      return res.status(201).json({
        message: "Favorito adicionado com sucesso",
        favorite: created,
        favorites: user.favoriteAddresses,
      });
    } catch (error) {
      console.error("Erro ao adicionar favorito:", error);
      return sendError(res, 500, "Erro ao adicionar endereco favorito");
    }
  }

  async update(req, res) {
    try {
      const userId = req.user.id;
      const { favoriteId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
        return sendError(res, 400, "Favorito invalido");
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      const favorites = user.favoriteAddresses || [];
      const favoriteIndex = findFavoriteIndexById(favorites, favoriteId);
      if (favoriteIndex < 0) {
        return sendError(res, 404, "Favorito nao encontrado");
      }

      const favorite = favorites[favoriteIndex];
      const payload = req.body || {};

      if (payload.name !== undefined) {
        const nameValue = normalizeText(payload.name);
        if (!nameValue) {
          return sendError(res, 400, "Nome do favorito invalido");
        }

        const duplicate = favorites.find(
          (fav, index) =>
            index !== favoriteIndex &&
            String(fav.name || "").trim().toLowerCase() === nameValue.toLowerCase(),
        );

        if (duplicate) {
          return sendError(res, 409, `Voce ja possui um favorito com o nome \"${nameValue}\"`);
        }

        favorite.name = nameValue;
      }

      if (payload.icon !== undefined) {
        favorite.icon = normalizeText(payload.icon) || "home";
      }

      if (payload.address !== undefined) {
        const addressValue = normalizeText(payload.address);
        if (!addressValue) {
          return sendError(res, 400, "Endereco invalido");
        }
        favorite.address = addressValue;
      }

      if (payload.formattedAddress !== undefined) {
        favorite.formattedAddress = normalizeOptionalText(payload.formattedAddress);
      }

      if (payload.street !== undefined) favorite.street = normalizeOptionalText(payload.street);
      if (payload.streetNumber !== undefined) favorite.streetNumber = normalizeOptionalText(payload.streetNumber);
      if (payload.neighborhood !== undefined) favorite.neighborhood = normalizeOptionalText(payload.neighborhood);
      if (payload.city !== undefined) favorite.city = normalizeOptionalText(payload.city);
      if (payload.region !== undefined) favorite.region = normalizeOptionalText(payload.region);
      if (payload.postalCode !== undefined) favorite.postalCode = normalizeOptionalText(payload.postalCode);

      if (payload.state !== undefined) {
        const stateValue = normalizeState(payload.state);
        if (stateValue === null) {
          return sendError(res, 400, "Estado invalido");
        }
        favorite.state = stateValue;
      }

      if (payload.latitude !== undefined) {
        const latValue = parseCoordinate(payload.latitude, -90, 90);
        if (latValue === null) {
          return sendError(res, 400, "Latitude invalida");
        }
        favorite.latitude = latValue;
      }

      if (payload.longitude !== undefined) {
        const lngValue = parseCoordinate(payload.longitude, -180, 180);
        if (lngValue === null) {
          return sendError(res, 400, "Longitude invalida");
        }
        favorite.longitude = lngValue;
      }

      await user.save();

      return res.json({
        message: "Favorito atualizado com sucesso",
        favorite,
        favorites: user.favoriteAddresses,
      });
    } catch (error) {
      console.error("Erro ao atualizar favorito:", error);
      return sendError(res, 500, "Erro ao atualizar endereco favorito");
    }
  }

  async delete(req, res) {
    try {
      const userId = req.user.id;
      const { favoriteId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
        return sendError(res, 400, "Favorito invalido");
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      const favorites = user.favoriteAddresses || [];
      const favoriteIndex = findFavoriteIndexById(favorites, favoriteId);

      if (favoriteIndex < 0) {
        return sendError(res, 404, "Favorito nao encontrado");
      }

      user.favoriteAddresses.splice(favoriteIndex, 1);
      await user.save();

      return res.json({
        message: "Favorito removido com sucesso",
        favorites: user.favoriteAddresses,
      });
    } catch (error) {
      console.error("Erro ao deletar favorito:", error);
      return sendError(res, 500, "Erro ao deletar endereco favorito");
    }
  }
}

module.exports = new FavoriteAddressController();