const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// All driver routes require authentication
router.use(authenticateToken);

// Balance routes
router.get("/balance", driverController.getBalance);
router.post("/balance/deposit", driverController.addDeposit);
router.post("/balance/deduct", driverController.deductBalance);
router.post("/balance/withdrawal-request", driverController.requestWithdrawal);

// Availability check
router.post("/check-ride-availability", driverController.canAcceptRide);
router.post("/go-online", driverController.goOnline);
router.post("/go-offline", driverController.goOffline);

// Preferences
router.put("/preferences", driverController.updateDriverPreferences);

module.exports = router;
