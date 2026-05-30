const express = require("express");
const router = express.Router();
const rideController = require("../controllers/ride.controller");
const platformConfigService = require("../services/platformConfig.service");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

// GET /api/pricing?city=&vehicleType=&serviceType=
// Delegates to ride controller's calculatePrice
router.get("/", rideController.calculatePrice);

// GET /api/pricing/config
// Returns current platform pricing configuration
router.get("/config", async (req, res) => {
  try {
    const runtimeConfig = await platformConfigService.getRuntimeConfig();
    return res.json({
      success: true,
      vehiclePricing: runtimeConfig.vehiclePricing || runtimeConfig.ridePricing || {},
      appFeePercentage: runtimeConfig.appFeePercentage || 20,
      logisticsMultipliers: runtimeConfig.logisticsMultipliers || {},
    });
  } catch (error) {
    console.error("Erro ao buscar configuracao de precos:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar configuracao de precos",
      details: error.message,
    });
  }
});

module.exports = router;
