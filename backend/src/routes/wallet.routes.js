const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { authenticateToken, requireAdmin } = require("../middlewares/auth.middleware");

// Conciliação financeira da plataforma (ADMIN — x-admin-key ou JWT admin).
router.get("/admin/reconciliation", requireAdmin, walletController.getFinancialReconciliation);

router.use(authenticateToken);

router.get("/balance", walletController.getBalance);
router.post("/withdraw", walletController.withdraw);
router.get("/statement", walletController.getStatement);

module.exports = router;
