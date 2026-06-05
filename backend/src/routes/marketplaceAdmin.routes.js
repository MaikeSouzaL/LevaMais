const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/marketplaceAdmin.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

// Marketplace — administração (Fase D / D1). Tudo restrito a admin.

// Parceiros
router.get("/partners", requireAdmin, ctrl.listPartners);
router.post("/partners", requireAdmin, ctrl.createPartner);
router.get("/partners/:id", requireAdmin, ctrl.getPartner);
router.patch("/partners/:id/kyc", requireAdmin, ctrl.updatePartnerKyc);
router.patch("/partners/:id/status", requireAdmin, ctrl.updatePartnerStatus);

// Categorias (incl. comissão padrão da categoria)
router.get("/categories", requireAdmin, ctrl.listCategories);
router.post("/categories", requireAdmin, ctrl.createCategory);
router.patch("/categories/:id", requireAdmin, ctrl.updateCategory);

// Lojas — comissão override + preview da comissão efetiva
router.get("/stores", requireAdmin, ctrl.listStores);
router.post("/stores", requireAdmin, ctrl.createStore);
router.patch("/stores/:id/status", requireAdmin, ctrl.updateStoreStatus);
router.patch("/stores/:id/commission", requireAdmin, ctrl.setStoreCommission);
router.get("/commission/resolve", requireAdmin, ctrl.previewStoreCommission);

module.exports = router;
