const express = require("express");
const router = express.Router();
const pricingController = require("../controllers/pricing.controller");

// Rotas públicas
router.get("/categories", pricingController.categories);
router.post("/calculate", pricingController.calculate);
router.get("/config", pricingController.getConfig);
router.put("/config", pricingController.updateConfig);

// Rotas de CRUD
router.get("/", pricingController.index);
router.get("/:id", pricingController.show);
router.post("/", pricingController.store);
router.put("/:id", pricingController.update);
router.delete("/:id", pricingController.delete);

module.exports = router;
