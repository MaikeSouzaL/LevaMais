const express = require("express");
const router = express.Router();
const configController = require("../controllers/config.controller");

// Public config endpoints (no auth required)
router.get("/ride-categories", configController.getRideCategories);
router.get("/delivery-types", configController.getDeliveryTypes);
router.get("/delivery-vehicles", configController.getDeliveryVehicles);
router.get("/cancel-reasons", configController.getCancelReasons);
router.get("/deposit-config", configController.getDepositConfig);
router.get("/ride-settings", configController.getRideSettings);
router.get("/deduction-percentage", configController.getDeductionPercentage);
router.get("/support-channels", configController.getSupportChannels);
router.get("/policy-versions", configController.getPolicyVersions);
router.get("/all", configController.getAllConfig);

// Admin endpoints (should add auth check)
router.put("/update", configController.updateConfig);

module.exports = router;
