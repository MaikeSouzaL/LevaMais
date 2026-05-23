const express = require("express");
const router = express.Router();
const senderController = require("../controllers/sender.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

router.get("/", senderController.get);
router.post("/", senderController.save);

module.exports = router;
