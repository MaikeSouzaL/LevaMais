const express = require("express");
const router = express.Router();
const rideController = require("../controllers/ride.controller");
const chatController = require("../controllers/chat.controller");
const { triggerSOS, generateShareToken, publicTrack } = require("../controllers/ride.safety.mixin");
const { authenticateToken } = require("../middlewares/auth.middleware");

// ── Public routes (no auth) ──
// Rastreamento público via link compartilhável
router.get("/track/:rideId", publicTrack);

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Calcular preço (antes de criar corrida)
router.post("/calculate-price", rideController.calculatePrice);

// Calcular estimativa de corrida (estilo inDriver)
router.post("/calculate-ride-estimate", rideController.calculateRideEstimate);

// Criar nova corrida
router.post("/", rideController.create);

// Aceitar corrida (motorista)
router.post("/:rideId/accept", rideController.accept);

// Rejeitar corrida (motorista)
router.post("/:rideId/reject", rideController.reject);

// Marketplace de ofertas
router.get("/:rideId/offers", rideController.listOffers);
router.post("/:rideId/offers/respond", rideController.submitOfferResponse);
router.post("/:rideId/offers/client-counter", rideController.clientCounterOffer);
router.post("/:rideId/offers/select", rideController.selectOffer);
router.post("/:rideId/offers/decline", rideController.declineOffer);
router.post("/:rideId/offers/increase", rideController.increaseOffer);
router.post("/:rideId/payment/confirm", rideController.confirmNegotiationPayment);
router.post("/:rideId/payment/cancel-selection", rideController.cancelPaymentSelection);

// Cancelar corrida
router.post("/:rideId/cancel", rideController.cancel);

// Promover corrida para agendada
router.post("/:rideId/promote-to-scheduled", rideController.promoteToScheduled);

// Reiniciar busca da corrida
router.post("/:rideId/retry", rideController.retryRide);

// Atualizar status da corrida
router.patch("/:rideId/status", rideController.updateStatus);

// Avaliações
router.post("/:rideId/rate-client", rideController.rateClientToDriver);
router.post("/:rideId/rate-driver", rideController.rateDriverToClient);
router.post("/:rideId/tip", rideController.addTip);
// Provas de entrega (fotos)
router.post("/:rideId/proof/pickup", rideController.uploadPickupProof);
router.post("/:rideId/proof/delivery", rideController.uploadDeliveryProof);

// Validação de PIN (coleta e entrega)
router.post("/:rideId/validate-pin", rideController.validatePin);

// Tracking de rota (GPS)
router.post("/:rideId/track-points", rideController.saveTrackPoint);
router.get("/:rideId/route-audit", rideController.getRouteAudit);

router.get("/active", rideController.getActive);
router.get("/active/list", rideController.getActiveList);
router.get("/available-requests", rideController.getAvailableRequests);
router.get("/negotiations/pending", rideController.getPendingNegotiations);
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

// Entrar na fila de espera
router.post("/:rideId/queue", rideController.enterWaitingQueue);

// Chat history
router.get("/:rideId/chat", chatController.getChatHistory);

// SOS / Emergência
router.post("/:rideId/sos", triggerSOS);

// Compartilhamento (share token)
router.get("/:rideId/share-token", generateShareToken);

// Histórico de corridas (DEVE ficar por último para não capturar :rideId)
router.get("/", rideController.getHistory);

module.exports = router;
