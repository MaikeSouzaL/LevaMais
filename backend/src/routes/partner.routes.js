const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/partner.controller");
const orderCtrl = require("../controllers/partnerOrder.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Portal parceiro separado (Fase D / D2). Reusa JWT do User.
router.use(authenticateToken);

router.post("/onboarding", ctrl.createOnboarding);

router.use(ctrl.resolvePartner);

router.get("/me", ctrl.getMe);
router.get("/stores/:storeId", ctrl.getStore);
router.patch("/stores/:storeId", ctrl.updateStore);
router.patch("/stores/:storeId/availability", ctrl.updateAvailability);

router.get("/stores/:storeId/products", ctrl.listProducts);
router.post("/stores/:storeId/products", ctrl.createProduct);
router.patch("/products/:productId", ctrl.updateProduct);
router.delete("/products/:productId", ctrl.deleteProduct);

// Pedidos do parceiro (Fulfillment - Fase D5)
router.get("/orders", orderCtrl.listOrders);
router.get("/orders/:orderId", orderCtrl.getOrder);
router.post("/orders/:orderId/accept", orderCtrl.acceptOrder);
router.post("/orders/:orderId/reject", orderCtrl.rejectOrder);
router.post("/orders/:orderId/preparing", orderCtrl.prepareOrder);
router.post("/orders/:orderId/ready", orderCtrl.readyOrder);

module.exports = router;
