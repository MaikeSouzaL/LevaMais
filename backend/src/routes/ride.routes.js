const express = require("express");
const router = express.Router();
const rideController = require("../controllers/ride.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Calcular preço (antes de criar corrida)
router.post("/calculate-price", rideController.calculatePrice);

// Criar nova corrida
router.post("/", rideController.create);

// Aceitar corrida (motorista)
router.post("/:rideId/accept", rideController.accept);

// Rejeitar corrida (motorista)
router.post("/:rideId/reject", rideController.reject);

// Cancelar corrida
router.post("/:rideId/cancel", rideController.cancel);

// Atualizar status da corrida
router.patch("/:rideId/status", rideController.updateStatus);

// Buscar corrida por ID
router.get("/:rideId", rideController.getById);

// Histórico de corridas
router.get("/", rideController.getHistory);

module.exports = router;
