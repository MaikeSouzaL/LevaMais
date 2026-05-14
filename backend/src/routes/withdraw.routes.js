const express = require("express");
const router = express.Router();
const withdrawController = require("../controllers/withdraw.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/balance", withdrawController.getBalance.bind(withdrawController));
router.post("/request", withdrawController.request.bind(withdrawController));
router.post("/schedule", withdrawController.schedule.bind(withdrawController));
router.get("/history", withdrawController.history.bind(withdrawController));
router.get("/limits", withdrawController.limits.bind(withdrawController));
router.post("/validate-pix", withdrawController.validatePix.bind(withdrawController));
router.get("/:withdrawId", withdrawController.getById.bind(withdrawController));
router.post("/:withdrawId/cancel", withdrawController.cancel.bind(withdrawController));

module.exports = router;
