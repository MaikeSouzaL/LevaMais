const express = require("express");
const router = express.Router();
const promotionController = require("../controllers/promotion.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/", promotionController.list);
router.get("/:code/validate", promotionController.validate);

module.exports = router;
