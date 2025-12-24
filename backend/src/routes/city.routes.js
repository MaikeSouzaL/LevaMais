const express = require("express");
const router = express.Router();
const cityController = require("../controllers/city.controller");

// Rotas públicas
router.get("/timezones", cityController.timezones);

// Rotas de CRUD
router.get("/", cityController.index);
router.get("/:id", cityController.show);
router.post("/", cityController.store);
router.put("/:id", cityController.update);
router.delete("/:id", cityController.delete);

// Estatísticas
router.get("/:id/stats", cityController.stats);

module.exports = router;
