const express = require("express");
const router = express.Router();
const driverLocationController = require("../controllers/driverLocation.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Todas as rotas exigem autenticação
router.use(authenticateToken);

// Atualizar localização do motorista
router.post("/update", driverLocationController.updateLocation);

// Atualizar status do motorista
router.patch("/status", driverLocationController.updateStatus);

// Buscar todas as localizações (admin/dashboard)
router.get("/all", driverLocationController.getAllLocations);

// Buscar localização de um motorista
router.get("/:driverId", driverLocationController.getLocation);

// Buscar motoristas próximos (debug/admin)
router.get("/nearby/search", driverLocationController.getNearby);

module.exports = router;
