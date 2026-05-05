const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/rides/:rideId/messages", chatController.listRideMessages);
router.post("/rides/:rideId/messages", chatController.sendRideMessage);

module.exports = router;
