const express = require("express");
const router = express.Router();
const rideController = require("../controllers/ride.controller");
const chatController = require("../controllers/chat.controller");
const { triggerSOS, generateShareToken, publicTrack } = require("../controllers/ride.safety.mixin");
const { addStop, changeDropoff } = require("../controllers/ride.advanced.mixin");
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

// Listar categorias de corrida (moto/economy/comfort/luxury) com preços (fluxo de corrida)
router.post("/calculate-ride-categories", rideController.calculateRideCategories);

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

// Cancelar corrida
router.post("/:rideId/cancel", rideController.cancel);

// Promover corrida para agendada
router.post("/:rideId/promote-to-scheduled", rideController.promoteToScheduled);

// Reiniciar busca da corrida
router.post("/:rideId/retry", rideController.retryRide);

// Atualizar status da corrida
router.patch("/:rideId/status", rideController.updateStatus);

// Avaliações
router.post("/:rideId/rate-driver", rideController.rateClientToDriver);
router.post("/:rideId/rate-client", rideController.rateDriverToClient);
router.post("/:rideId/tip", rideController.addTip);
// Provas de entrega (fotos)
router.post("/:rideId/proof/pickup", rideController.uploadPickupProof);
router.post("/:rideId/proof/delivery", rideController.uploadDeliveryProof);

// Validação de PIN (coleta e entrega)
router.post("/:rideId/validate-pin", rideController.validatePin);

// Entrega com problema no destino (ausente/endereço errado) → devolução
router.post("/:rideId/delivery-problem", rideController.reportDeliveryFailure);

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

// ── Surge Pricing & Heatmap ──
const { calculateSurgeMultiplier, getHeatmapData } = require("../services/surge-pricing.service");

router.get("/surge/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = Number(req.query.radius) || 10;
    const result = await calculateSurgeMultiplier(Number(lat), Number(lng), radius);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get("/heatmap/:lat/:lng", async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = Number(req.query.radius) || 20;
    const points = await getHeatmapData(Number(lat), Number(lng), radius);
    res.json({ success: true, points });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// PIX Payment for rides
router.post("/:rideId/pix-payment", rideController.createRidePixPayment);
router.post("/:rideId/pix-payment/confirm-mock", rideController.confirmRidePixPaymentMock);

// NFS-e Recibo Fiscal Simulado
router.get("/:rideId/nfse", rideController.getRideNfse);

// Buscar corrida por ID
router.get("/:rideId", rideController.getById);

// Entrar na fila de espera
router.post("/:rideId/queue", rideController.enterWaitingQueue);

// Chat history
router.get("/:rideId/chat", chatController.getChatHistory);

// SOS / Emergência
router.post("/:rideId/sos", triggerSOS);

// Múltiplas paradas
router.patch("/:rideId/add-stop", addStop);

// Alterar destino
router.patch("/:rideId/change-dropoff", changeDropoff);

// Compartilhamento (share token)
router.get("/:rideId/share-token", generateShareToken);

// Histórico de corridas (DEVE ficar por último para não capturar :rideId)
router.get("/", rideController.getHistory);

module.exports = router;
