const express = require("express");
const router = express.Router();
const driverController = require("../controllers/driver.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { uploadDriverBundle } = require("../middlewares/upload.middleware");

// Todas as rotas de motorista exigem token de autenticação
router.use(authenticateToken);

// Carteira e Saldo
router.get("/balance", driverController.getBalance.bind(driverController));
router.post("/balance/deposit", driverController.addDeposit.bind(driverController));
router.post("/balance/deduct", driverController.deductBalance.bind(driverController));
router.get("/balance/history", driverController.getBalanceHistory.bind(driverController));
router.post("/balance/withdrawal-request", driverController.requestWithdrawal.bind(driverController));

// Status de Trabalho e Preferências
router.post("/check-ride-availability", driverController.canAcceptRide.bind(driverController));
router.post("/go-online", driverController.goOnline.bind(driverController));
router.post("/go-offline", driverController.goOffline.bind(driverController));
router.put("/preferences", driverController.updateDriverPreferences.bind(driverController));

// Frota de Veículos do Motorista
router.get("/vehicles", driverController.listVehicles.bind(driverController));
router.post("/vehicles", driverController.addVehicle.bind(driverController));
router.post("/vehicles/:vehicleId/documents", uploadDriverBundle, driverController.uploadVehicleDocuments.bind(driverController));
router.patch("/vehicles/:id/activate", driverController.activateVehicle.bind(driverController));

module.exports = router;
