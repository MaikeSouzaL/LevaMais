const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favorite.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Todas as rotas de favoritos requerem autenticação
router.use(authenticateToken);

router.post("/", favoriteController.create);
router.get("/me", favoriteController.listMe);
router.get("/user/:userId", favoriteController.listByUser);
router.delete("/:id", favoriteController.delete);

module.exports = router;
