const express = require("express");
const router = express.Router();
const pricingController = require("../controllers/pricing.controller");
const {
  requireAdmin,
} = require("../middlewares/auth.middleware");

// Rotas públicas
router.get("/categories", pricingController.categories);
router.post("/calculate", pricingController.calculate);
router.get("/config", pricingController.getConfig);
router.put(
  "/config",
  requireAdmin,
  pricingController.updateConfig,
);

// Rotas de CRUD
router.get(
  "/",
  requireAdmin,
  pricingController.index,
);
router.get(
  "/:id",
  requireAdmin,
  pricingController.show,
);
router.post(
  "/",
  requireAdmin,
  pricingController.store,
);
router.put(
  "/:id",
  requireAdmin,
  pricingController.update,
);
router.delete(
  "/:id",
  requireAdmin,
  pricingController.delete,
);

module.exports = router;
