const express = require("express");
const router = express.Router();
const cityController = require("../controllers/city.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.get("/timezones", cityController.timezones);
router.get("/", cityController.index);
router.get("/:id/stats", cityController.stats);
router.get("/:id", cityController.show);
router.post("/", requireAdmin, cityController.store);
router.put("/:id", requireAdmin, cityController.update);
router.delete("/:id", requireAdmin, cityController.delete);

module.exports = router;