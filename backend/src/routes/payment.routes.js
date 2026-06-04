const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Webhook (não requer autenticação)
router.post("/webhook", paymentController.webhook.bind(paymentController));
// Webhook OFICIAL do Stripe (verifica assinatura via stripe-signature). Público.
router.post("/webhook/stripe", paymentController.stripeWebhook.bind(paymentController));

// Rotas autenticadas
router.use(authenticateToken);

// Cartões de crédito
router.get("/cards", paymentController.listCards.bind(paymentController));
router.post("/cards", paymentController.addCard.bind(paymentController));
router.delete("/cards/:cardId", paymentController.deleteCard.bind(paymentController));

// Pagamentos
router.post("/process", paymentController.process.bind(paymentController));
router.post("/validate-pix", paymentController.validatePix.bind(paymentController));
router.get("/receipt/:transactionId", paymentController.getReceipt.bind(paymentController));
router.get("/history", paymentController.getHistory.bind(paymentController));
router.post("/refund/:transactionId", paymentController.refund.bind(paymentController));
router.get("/estimate-fee", paymentController.estimateFee.bind(paymentController));

// Depósito PIX na carteira (ou saldo do motorista via body.account="driver_balance")
router.post("/deposit/pix", paymentController.createPixDeposit.bind(paymentController));
router.get("/deposit/pix/:transactionId", paymentController.getPixDepositStatus.bind(paymentController));

// Depósito via Boleto (Stripe)
router.post("/deposit/boleto", paymentController.createBoletoDeposit.bind(paymentController));

// Depósito via Stripe
router.post("/deposit/stripe/intent", paymentController.createStripeIntent.bind(paymentController));
router.post("/deposit/stripe/confirm", paymentController.confirmStripePayment.bind(paymentController));
router.post("/deposit/stripe/cancel", paymentController.cancelStripeIntent.bind(paymentController));

// Feedback de saída (quando usuário abandona verificação)
router.post("/feedback/exit", paymentController.submitExitFeedback.bind(paymentController));

// Verificação de identidade
router.post("/verification/submit", paymentController.submitVerification.bind(paymentController));

module.exports = router;
