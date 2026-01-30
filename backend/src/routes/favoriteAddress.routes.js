const express = require("express");
const router = express.Router();
const favoriteAddressController = require("../controllers/favoriteAddress.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// GET /api/favorite-addresses - Listar favoritos
router.get("/", favoriteAddressController.list);

// POST /api/favorite-addresses - Adicionar favorito
router.post("/", favoriteAddressController.create);

// PUT /api/favorite-addresses/:favoriteId - Atualizar favorito
router.put("/:favoriteId", favoriteAddressController.update);

// DELETE /api/favorite-addresses/:favoriteId - Deletar favorito
router.delete("/:favoriteId", favoriteAddressController.delete);

module.exports = router;
