const express = require("express");
const router = express.Router();
const favoriteAddressController = require("../controllers/favoriteAddress.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.get("/", authenticateToken, favoriteAddressController.list.bind(favoriteAddressController));
router.post("/", authenticateToken, favoriteAddressController.create.bind(favoriteAddressController));
router.put("/:favoriteId", authenticateToken, favoriteAddressController.update.bind(favoriteAddressController));
router.delete("/:favoriteId", authenticateToken, favoriteAddressController.delete.bind(favoriteAddressController));

module.exports = router;
