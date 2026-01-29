const express = require("express");
const router = express.Router();
const purposeController = require("../controllers/purpose.controller");

// Routes for /api/purposes
router.get("/seed", purposeController.seed); // Seed route (dev only)

// Compatibility routes (client expectations)
router.get("/item/:id", purposeController.getById);
router.get(
  "/:vehicleType(motorcycle|car|van|truck)",
  purposeController.getByVehicleType,
);

// Main CRUD
router.get("/", purposeController.getAll);
router.post("/", purposeController.create);
router.put("/:id", purposeController.update);
router.delete("/:id", purposeController.delete);
router.patch("/:id/toggle", purposeController.toggleActive);
router.post("/bulk-delete", purposeController.bulkDelete);

module.exports = router;
