const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Rotas públicas
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/google", authController.googleAuth.bind(authController));
router.post("/check-email", authController.checkEmail.bind(authController));
router.post(
  "/forgot-password",
  authController.forgotPassword.bind(authController),
);
router.post(
  "/verify-reset-code",
  authController.verifyResetCode.bind(authController),
);
router.post(
  "/reset-password",
  authController.resetPassword.bind(authController),
);

// Rotas protegidas (requerem autenticação)
router.get(
  "/profile",
  authenticateToken,
  authController.getProfile.bind(authController),
);
router.patch(
  "/profile",
  authenticateToken,
  authController.updateProfile.bind(authController),
);
router.post(
  "/push-token",
  authenticateToken,
  authController.savePushToken.bind(authController),
);
router.delete(
  "/push-token",
  authenticateToken,
  authController.removePushToken.bind(authController),
);

// Rotas admin (sem autenticação por enquanto - adicionar depois)
router.get("/users", authController.listUsers.bind(authController));
router.get("/users/:id", authController.getUserById.bind(authController));

module.exports = router;
