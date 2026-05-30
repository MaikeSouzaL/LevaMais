const express = require("express");
const router = express.Router();
const Purpose = require("../models/Purpose");
const { authenticateToken } = require("../middlewares/auth.middleware");

router.use(authenticateToken);

router.get("/", async (req, res) => {
  try {
    const purposes = await Purpose.find({ isActive: true }).sort({ title: 1 });
    return res.json({ success: true, purposes });
  } catch (error) {
    console.error("Erro ao listar finalidades:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao listar finalidades",
    });
  }
});

module.exports = router;
