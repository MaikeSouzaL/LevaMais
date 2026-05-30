const express = require("express");
const router = express.Router();
const shiftOfferController = require("../controllers/shiftOffer.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.post("/", shiftOfferController.create);
router.get("/client", shiftOfferController.listClientOffers);
router.get("/available", shiftOfferController.listAvailable);
router.get("/driver/accepted", shiftOfferController.listDriverAccepted);
router.post("/:offerId/accept", shiftOfferController.accept);

module.exports = router;
