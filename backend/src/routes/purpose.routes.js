const express = require("express");
const router = express.Router();
const purposeController = require("../controllers/purpose.controller");
const {
  requireAdmin,
} = require("../middlewares/auth.middleware");

// Routes for /api/purposes
router.get(
  "/seed",
  requireAdmin,
  purposeController.seed,
); // Seed route (dev only)

// Compatibility routes (client expectations)
router.get("/item/:id", purposeController.getById);
router.get(
  "/:vehicleType(motorcycle|car|van|truck)",
  purposeController.getByVehicleType,
);

// Main CRUD
router.get("/", purposeController.getAll);
router.post(
  "/",
  requireAdmin,
  purposeController.create,
);
router.put(
  "/:id",
  requireAdmin,
  purposeController.update,
);
router.delete(
  "/:id",
  requireAdmin,
  purposeController.delete,
);
router.patch(
  "/:id/toggle",
  requireAdmin,
  purposeController.toggleActive,
);
router.post(
  "/bulk-delete",
  requireAdmin,
  purposeController.bulkDelete,
);

module.exports = router;
