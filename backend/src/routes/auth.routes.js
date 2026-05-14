const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const {
  authenticateToken,
  requireAdmin,
} = require("../middlewares/auth.middleware");
const { upload, uploadDriverBundle } = require("../middlewares/upload.middleware");

// Rotas publicas
router.post("/register", authController.register.bind(authController));
router.post("/login", authController.login.bind(authController));
router.post("/google", authController.googleAuth.bind(authController));
router.post("/check-email", authController.checkEmail.bind(authController));
router.post(
  "/send-phone-code",
  authController.sendPhoneCode.bind(authController),
);
router.post(
  "/verify-phone-code",
  authController.verifyPhoneCode.bind(authController),
);
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

// Rotas de fluxo de cadastro extendido
router.post(
  "/driver-verification",
  authenticateToken,
  uploadDriverBundle,
  authController.submitDriverVerification.bind(authController),
);

// Rotas protegidas (requerem autenticacao)
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
  "/profile-photo",
  authenticateToken,
  upload.single("photo"),
  authController.uploadProfilePhoto.bind(authController),
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
router.get(
  "/payment-methods",
  authenticateToken,
  authController.listPaymentMethods.bind(authController),
);
router.post(
  "/payment-methods",
  authenticateToken,
  authController.addPaymentMethod.bind(authController),
);
router.patch(
  "/payment-methods/:methodId/default",
  authenticateToken,
  authController.setDefaultPaymentMethod.bind(authController),
);
router.delete(
  "/payment-methods/:methodId",
  authenticateToken,
  authController.deletePaymentMethod.bind(authController),
);
router.get(
  "/wallet",
  authenticateToken,
  authController.getClientWallet.bind(authController),
);
router.post(
  "/wallet/topup",
  authenticateToken,
  authController.topupClientWallet.bind(authController),
);
router.get(
  "/notifications",
  authenticateToken,
  authController.listNotifications.bind(authController),
);
router.get(
  "/privacy-export",
  authenticateToken,
  authController.exportPrivacyData.bind(authController),
);
router.post(
  "/privacy-consent",
  authenticateToken,
  authController.recordPrivacyConsent.bind(authController),
);
router.post(
  "/privacy-revoke",
  authenticateToken,
  authController.revokePrivacyConsent.bind(authController),
);
router.post(
  "/account-delete",
  authenticateToken,
  authController.deleteOwnAccount.bind(authController),
);

// Rotas admin
router.get(
  "/users",
  requireAdmin,
  authController.listUsers.bind(authController),
);
router.get(
  "/users/:id",
  requireAdmin,
  authController.getUserById.bind(authController),
);
router.patch(
  "/users/:id",
  requireAdmin,
  authController.updateUserById.bind(authController),
);
router.delete(
  "/users/:id",
  requireAdmin,
  authController.deleteUserById.bind(authController),
);

module.exports = router;
