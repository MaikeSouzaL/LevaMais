const express = require("express");
const router = express.Router();
const controller = require("../controllers/platformConfig.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.get("/", requireAdmin, controller.get);
router.put("/", requireAdmin, controller.update);

module.exports = router;
