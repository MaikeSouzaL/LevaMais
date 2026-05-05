const express = require("express");
const router = express.Router();
const cityController = require("../controllers/city.controller");
const {
  requireAdmin,
} = require("../middlewares/auth.middleware");

// Rotas públicas
router.get("/timezones", cityController.timezones);

// Rotas de CRUD
router.get("/", cityController.index);
router.get("/:id", cityController.show);
router.post(
  "/",
  requireAdmin,
  cityController.store,
);
router.put(
  "/:id",
  requireAdmin,
  cityController.update,
);
router.delete(
  "/:id",
  requireAdmin,
  cityController.delete,
);

// Estatísticas
router.get("/:id/stats", cityController.stats);

module.exports = router;
