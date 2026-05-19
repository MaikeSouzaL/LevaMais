const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { uploadDriverBundle } = require("../middlewares/upload.middleware");

// All driver routes require authentication
router.use(authenticateToken);

// Balance routes
router.get("/balance", driverController.getBalance);
router.get("/balance/history", driverController.getBalanceHistory);
router.post("/balance/deposit", driverController.addDeposit);
router.post("/balance/deduct", driverController.deductBalance);
router.post("/balance/withdrawal-request", driverController.requestWithdrawal);

// Availability check
router.post("/check-ride-availability", driverController.canAcceptRide);
router.post("/go-online", driverController.goOnline);
router.post("/go-offline", driverController.goOffline);

// Preferences
router.put("/preferences", driverController.updateDriverPreferences);

// Vehicle Fleet Management
router.get("/vehicles", driverController.listVehicles);
router.post("/vehicles", driverController.addVehicle);
router.patch("/vehicles/:id/activate", driverController.activateVehicle);

// Vehicle Document Upload (multipart) - corrige o problema de file:// URIs
router.post(
  "/vehicles/:vehicleId/documents",
  uploadDriverBundle,
  driverController.uploadVehicleDocuments
);

module.exports = router;
