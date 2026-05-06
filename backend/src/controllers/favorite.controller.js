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

function parseCoordinate(value, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function normalizeText(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function isAdmin(req) {
  return String(req?.user?.userType || "").toLowerCase() === "admin";
}

exports.create = async (req, res) => {
  try {
    const { userId: requestedUserId, label, icon, address, latitude, longitude } = req.body;

    const userId =
      isAdmin(req) && requestedUserId
        ? requestedUserId
        : req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Usuario invalido");
    }

    const labelValue = normalizeText(label);
    const iconValue = normalizeText(icon) || "home";
    const addressValue = normalizeText(address);
    const latValue = parseCoordinate(latitude, -90, 90);
    const lngValue = parseCoordinate(longitude, -180, 180);

    if (!labelValue) {
      return sendError(res, 400, "Nome do favorito obrigatorio");
    }
    if (!addressValue) {
      return sendError(res, 400, "Endereco do favorito obrigatorio");
    }
    if (latValue === null || lngValue === null) {
      return sendError(res, 400, "Coordenadas invalidas");
    }

    const duplicate = await Favorite.findOne({
      userId,
      label: labelValue,
      address: addressValue,
    });

    if (duplicate) {
      return sendError(res, 409, "Este favorito ja existe");
    }

    const favorite = await Favorite.create({
      userId,
      label: labelValue,
      icon: iconValue,
      address: addressValue,
      latitude: latValue,
      longitude: lngValue,
    });

    return res.status(201).json(favorite);
  } catch (error) {
    console.error("Erro ao criar favorito:", error);
    return sendError(res, 500, "Erro ao criar favorito");
  }
};

exports.listMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    return res.json(favorites);
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    return sendError(res, 500, "Erro ao listar favoritos");
  }
};

exports.listByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return sendError(res, 400, "Usuario invalido");
    }

    if (req.user.id.toString() !== userId && !isAdmin(req)) {
      return sendError(res, 403, "Acesso negado");
    }

    const favorites = await Favorite.find({ userId }).sort({ createdAt: -1 });
    return res.json(favorites);
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    return sendError(res, 500, "Erro ao listar favoritos");
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Favorito invalido");
    }

    const favorite = await Favorite.findById(id);

    if (!favorite) {
      return sendError(res, 404, "Favorito nao encontrado");
    }

    if (req.user.id.toString() !== String(favorite.userId) && !isAdmin(req)) {
      return sendError(res, 403, "Acesso negado");
    }

    await favorite.deleteOne();
    return res.json({ message: "Favorito removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar favorito:", error);
    return sendError(res, 500, "Erro ao deletar favorito");
  }
};