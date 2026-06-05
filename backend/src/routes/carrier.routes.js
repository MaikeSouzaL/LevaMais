const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/carrier.controller");
const { authenticateToken, requireAdmin } = require("../middlewares/auth.middleware");

// Modo Transportadora (Fase D / T1).

// Público/cliente (JWT) — descoberta de transportadoras
router.get("/public", authenticateToken, ctrl.listPublic);
router.get("/public/:slug", authenticateToken, ctrl.getPublicProfile);

// Motorista (JWT)
router.post("/onboarding", authenticateToken, ctrl.onboarding);
router.get("/me", authenticateToken, ctrl.getMe);
router.patch("/me", authenticateToken, ctrl.updateMe);

// Admin (requireAdmin)
router.get("/admin/list", requireAdmin, ctrl.listCarriers);
router.get("/admin/:id", requireAdmin, ctrl.getCarrier);
router.patch("/admin/:id/kyc", requireAdmin, ctrl.reviewKyc);
router.patch("/admin/:id/status", requireAdmin, ctrl.updateStatus);

module.exports = router;
