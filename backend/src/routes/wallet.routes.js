const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/balance", walletController.getBalance);
router.post("/withdraw", walletController.withdraw);
router.get("/statement", walletController.getStatement);

module.exports = router;
