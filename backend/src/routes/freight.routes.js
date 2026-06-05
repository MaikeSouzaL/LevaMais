const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/freight.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Frete sob demanda (Modo Transportadora / T3). Tudo exige login.
router.use(authenticateToken);

// CLIENTE
router.post("/", ctrl.createRequest);
router.get("/mine", ctrl.listMine);

// TRANSPORTADORA (motorista)
router.get("/incoming", ctrl.listIncoming);

// Ações por frete
router.post("/:id/quote", ctrl.quote);
router.post("/:id/reject", ctrl.reject);
router.post("/:id/accept", ctrl.acceptQuote);
router.post("/:id/cancel", ctrl.cancelRequest);
router.post("/:id/pickup", ctrl.pickup);
router.post("/:id/deliver", ctrl.deliver);

// Detalhe (por último para não capturar /mine, /incoming)
router.get("/:id", ctrl.getRequest);

module.exports = router;
