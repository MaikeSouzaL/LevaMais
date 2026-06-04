const express = require("express");
const router = express.Router();
const operationsController = require("../controllers/operations.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.get("/summary", requireAdmin, operationsController.getSummary);

module.exports = router;
