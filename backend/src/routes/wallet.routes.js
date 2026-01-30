const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/balance", walletController.getBalance);
router.get("/statement", walletController.getStatement);
router.post("/withdraw", walletController.withdraw);

module.exports = router;
