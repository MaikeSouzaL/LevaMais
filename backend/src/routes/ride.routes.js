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

// Marketplace de ofertas
router.get("/:rideId/offers", rideController.listOffers);
router.post("/:rideId/offers/respond", rideController.submitOfferResponse);
router.post("/:rideId/offers/select", rideController.selectOffer);

// Cancelar corrida
router.post("/:rideId/cancel", rideController.cancel);

// Reiniciar busca da corrida 🚀
router.post("/:rideId/retry", rideController.retryRide);

// Atualizar status da corrida
router.patch("/:rideId/status", rideController.updateStatus);

// Colocar corrida na fila de espera
router.post("/:rideId/queue", rideController.enterWaitingQueue);

// Avaliações
router.post("/:rideId/rate-client", rideController.rateClientToDriver);
router.post("/:rideId/rate-driver", rideController.rateDriverToClient);
router.post("/:rideId/tip", rideController.addTip);
// Provas de entrega (fotos)
router.post("/:rideId/proof/pickup", rideController.uploadPickupProof);
router.post("/:rideId/proof/delivery", rideController.uploadDeliveryProof);

// Buscar corrida ativa do usuário (principalmente motorista)
router.get("/active", rideController.getActive);
router.get("/active/list", rideController.getActiveList);
router.get("/available-requests", rideController.getAvailableRequests);
router.get("/scheduled/available", rideController.getAvailableScheduledRides);
router.post("/:rideId/accept-scheduled", rideController.acceptScheduled);

// Estatísticas do motorista (dashboard)
router.get("/stats", rideController.getDriverStats);

// Histórico de ganhos (gráfico 7 dias)
router.get("/earnings-history", rideController.getEarningsHistory);

// Buscar motoristas próximos
router.get("/nearby-drivers", rideController.getNearbyDrivers);

// Buscar corrida por ID
router.get("/:rideId", rideController.getById);

// Histórico de corridas
router.get("/", rideController.getHistory);

module.exports = router;
