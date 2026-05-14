const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/cards", paymentController.listCards.bind(paymentController));
router.post("/cards", paymentController.addCard.bind(paymentController));
router.delete("/cards/:cardId", paymentController.deleteCard.bind(paymentController));
router.post("/process", paymentController.process.bind(paymentController));
router.post("/pix/validate", paymentController.validatePix.bind(paymentController));
router.get("/receipts/:transactionId", paymentController.getReceipt.bind(paymentController));
router.get("/history", paymentController.getHistory.bind(paymentController));
router.post("/refund/:transactionId", paymentController.refund.bind(paymentController));
router.get("/estimate-fee", paymentController.estimateFee.bind(paymentController));

module.exports = router;
