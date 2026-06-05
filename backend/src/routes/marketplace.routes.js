const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/marketplace.controller");
const { authenticateToken } = require("../middlewares/auth.middleware");

// Public routes
router.get("/categories", ctrl.getCategories);
router.get("/stores", ctrl.getStores);
router.get("/stores/:slug", ctrl.getStoreBySlug);
router.get("/stores/:id/products", ctrl.getStoreProducts);
router.get("/products/:id", ctrl.getProductDetail);
router.post("/cart/validate", ctrl.validateCart);

// Protected routes (requires customer auth)
router.post("/orders", authenticateToken, ctrl.createOrder);
router.get("/orders", authenticateToken, ctrl.listOrders);
router.get("/orders/:id", authenticateToken, ctrl.getOrder);

module.exports = router;
