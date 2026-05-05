const express = require("express");
const router = express.Router();
const controller = require("../controllers/representative.controller");
const { requireAdmin } = require("../middlewares/auth.middleware");

router.get("/", requireAdmin, controller.index);
router.post("/", requireAdmin, controller.store);
router.put("/:id", requireAdmin, controller.update);
router.delete("/:id", requireAdmin, controller.delete);

module.exports = router;
