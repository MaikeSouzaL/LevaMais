const express = require("express");
const router = express.Router();
const controller = require("../controllers/representative.controller");

// TODO: Adicionar middleware de auth (admin)
router.get("/", controller.index);
router.post("/", controller.store);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
