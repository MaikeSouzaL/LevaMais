const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Rotas públicas
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/google", authController.googleAuth.bind(authController));
router.post(
  "/forgot-password",
  authController.forgotPassword.bind(authController)
);
router.post(
  "/verify-reset-code",
  authController.verifyResetCode.bind(authController)
);
router.post(
  "/reset-password",
  authController.resetPassword.bind(authController)
);

// Rotas protegidas (requerem autenticação)
router.get(
  "/profile",
  authenticateToken,
  authController.getProfile.bind(authController)
);

module.exports = router;
