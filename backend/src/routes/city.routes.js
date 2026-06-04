const express = require("express");
const router = express.Router();
const cityController = require("../controllers/city.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.get("/", cityController.list);
router.post("/", requireAdmin, cityController.create);
router.patch("/:id", requireAdmin, cityController.update);
router.delete("/:id", requireAdmin, cityController.deactivate);

module.exports = router;
