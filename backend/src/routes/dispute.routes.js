const express = require("express");
const router = express.Router();
const disputeController = require("../controllers/dispute.controller");
const { authenticateToken, requireAdmin } = require("../middlewares/auth.middleware");

router.post("/", authenticateToken, disputeController.createDispute);
router.get("/", authenticateToken, disputeController.listMyDisputes);
router.get("/admin", requireAdmin, disputeController.listMyDisputes);
router.patch("/admin/:id", requireAdmin, disputeController.updateDisputeByAdmin);

module.exports = router;
