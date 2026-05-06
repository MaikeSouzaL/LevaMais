const mongoose = require("mongoose");
const ShiftOffer = require("../models/ShiftOffer");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

class ShiftOfferController {
  async create(req, res) {
    try {
      if (req.user.userType !== "client") {
        return sendError(res, 403, "Apenas clientes podem criar plantoes");
      }

      const {
        title,
        description,
        cityId,
        vehicleType = "motorcycle",
        dailyAmount,
        fuelIncluded,
        startAt,
        endAt,
      } = req.body || {};

      if (!title || String(title).trim().length < 3) {
        return sendError(res, 400, "Titulo do plantao invalido");
      }

      const amount = Number(dailyAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return sendError(res, 400, "Valor da diaria invalido");
      }

      const startDate = parseDate(startAt);
      const endDate = parseDate(endAt);
      if (!startDate || !endDate) {
        return sendError(res, 400, "Horario do plantao invalido");
      }

      if (endDate <= startDate) {
        return sendError(res, 400, "Horario final deve ser maior que o inicial");
      }

      if (startDate.getTime() <= Date.now() + 10 * 60 * 1000) {
        return sendError(
          res,
          400,
          "O plantao precisa iniciar com pelo menos 10 minutos de antecedencia",
        );
      }

      if (cityId && !mongoose.Types.ObjectId.isValid(cityId)) {
        return sendError(res, 400, "Cidade invalida");
      }

      const offer = await ShiftOffer.create({
        clientId: req.user.id,
        cityId: cityId || null,
        title: String(title).trim(),
        description: String(description || "").trim(),
        vehicleType,
        dailyAmount: toMoney(amount),
        fuelIncluded: Boolean(fuelIncluded),
        startAt: startDate,
        endAt: endDate,
      });

      await offer.populate("clientId", "name phone");
      return res.status(201).json({
        success: true,
        message: "Plantao criado com sucesso",
        offer,
      });
    } catch (error) {
      console.error("Erro ao criar plantao:", error);
      return sendError(res, 500, "Erro ao criar plantao", {
        details: error.message,
      });
    }
  }

  async listClientOffers(req, res) {
    try {
      if (req.user.userType !== "client") {
        return sendError(res, 403, "Apenas clientes podem listar seus plantoes");
      }

      const offers = await ShiftOffer.find({ clientId: req.user.id })
        .populate("acceptedBy", "name phone profilePhoto")
        .sort({ createdAt: -1 })
        .limit(100);

      return res.json({
        success: true,
        offers,
      });
    } catch (error) {
      console.error("Erro ao listar plantoes do cliente:", error);
      return sendError(res, 500, "Erro ao listar plantoes", {
        details: error.message,
      });
    }
  }

  async listAvailable(req, res) {
    try {
      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem listar plantoes");
      }

      const now = new Date();
      const offers = await ShiftOffer.find({
        status: "open",
        startAt: { $gt: now },
        vehicleType: "motorcycle",
      })
        .populate("clientId", "name phone")
        .sort({ startAt: 1 })
        .limit(100);

      return res.json({
        success: true,
        offers,
      });
    } catch (error) {
      console.error("Erro ao listar plantoes disponiveis:", error);
      return sendError(res, 500, "Erro ao listar plantoes", {
        details: error.message,
      });
    }
  }

  async listDriverAccepted(req, res) {
    try {
      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas");
      }

      const offers = await ShiftOffer.find({
        acceptedBy: req.user.id,
        status: "accepted",
      })
        .populate("clientId", "name phone")
        .sort({ startAt: 1 });

      return res.json({
        success: true,
        offers,
      });
    } catch (error) {
      console.error("Erro ao listar plantoes aceitos:", error);
      return sendError(res, 500, "Erro ao listar plantoes aceitos", {
        details: error.message,
      });
    }
  }

  async accept(req, res) {
    try {
      if (req.user.userType !== "driver") {
        return sendError(res, 403, "Apenas motoristas podem aceitar plantoes");
      }

      const { offerId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(offerId)) {
        return sendError(res, 400, "Plantao invalido");
      }

      const offer = await ShiftOffer.findById(offerId);
      if (!offer) return sendError(res, 404, "Plantao nao encontrado");
      if (offer.status !== "open") {
        return sendError(res, 400, "Plantao nao esta mais disponivel");
      }

      const now = new Date();
      const overlap = await ShiftOffer.findOne({
        acceptedBy: req.user.id,
        status: "accepted",
        startAt: { $lt: offer.endAt },
        endAt: { $gt: offer.startAt },
      }).select("_id");

      if (overlap?._id) {
        return sendError(
          res,
          400,
          "Voce ja possui outro plantao nesse mesmo horario",
        );
      }

      offer.status = "accepted";
      offer.acceptedBy = req.user.id;
      offer.acceptedAt = now;
      await offer.save();
      await offer.populate("clientId", "name phone");

      return res.json({
        success: true,
        message: "Plantao aceito com sucesso",
        offer,
      });
    } catch (error) {
      console.error("Erro ao aceitar plantao:", error);
      return sendError(res, 500, "Erro ao aceitar plantao", {
        details: error.message,
      });
    }
  }
}

module.exports = new ShiftOfferController();
