const express = require("express");
const router = express.Router();
const driverLocationController = require("../controllers/driverLocation.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.post("/update", driverLocationController.updateLocation);
router.patch("/status", driverLocationController.updateStatus);
router.get("/all", driverLocationController.getAllLocations);
router.get("/me", driverLocationController.getMe);
router.get("/nearby/search", driverLocationController.getNearby);
router.get("/:driverId", driverLocationController.getLocation);

module.exports = router;