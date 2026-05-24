const express = require("express");
const router = express.Router();
const addressHistoryController = require("../controllers/addressHistory.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.get("/", authenticateToken, addressHistoryController.list.bind(addressHistoryController));
router.post("/", authenticateToken, addressHistoryController.create.bind(addressHistoryController));

module.exports = router;
