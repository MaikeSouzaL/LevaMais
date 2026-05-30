const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { initializeWebSocket } = require("./config/websocket");

// Routes imports continue...
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/ride.routes");
const driverLocationRoutes = require("./routes/driverLocation.routes");
const favoriteAddressRoutes = require("./routes/favoriteAddress.routes");
const addressHistoryRoutes = require("./routes/addressHistory.routes");
const senderRoutes = require("./routes/sender.routes");
const paymentRoutes = require("./routes/payment.routes");
const driverRoutes = require("./routes/driver.routes");
const promotionRoutes = require("./routes/promotion.routes");
const walletRoutes = require("./routes/wallet.routes");
const shiftOfferRoutes = require("./routes/shiftOffer.routes");
const purposeRoutes = require("./routes/purpose.routes");
const pricingRoutes = require("./routes/pricing.routes");

function parseAllowedOrigins() {
  const fromEnv = String(
    process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "",
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (fromEnv.length > 0) return fromEnv;
  if (process.env.NODE_ENV === "production") return [];
  return ["*"];
}

function applyMiddlewares(app) {
  const allowedOrigins = parseAllowedOrigins();
  const corsOrigin = allowedOrigins.includes("*") ? "*" : allowedOrigins;

  app.use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Admin-Key",
        "X-Webhook-Secret",
      ],
      credentials: corsOrigin === "*" ? false : true,
    }),
  );

  // Rate limiting global — 200 req/min por IP
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Muitas requisicoes. Aguarde um momento.",
    },
  });
  app.use("/api", globalLimiter);

  // Rate limit mais restrito para auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Muitas tentativas. Tente novamente mais tarde.",
    },
  });
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/forgot-password", authLimiter);
  app.use("/api/auth/verify-phone-code", authLimiter);
  app.use("/api/auth/reset-password", authLimiter);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve static uploads
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
}

function applyRoutes(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/driver-location", driverLocationRoutes);
  app.use("/api/favorite-addresses", favoriteAddressRoutes);
  app.use("/api/address-history", addressHistoryRoutes);
  app.use("/api/senders", senderRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/promotions", promotionRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/shift-offers", shiftOfferRoutes);
  app.use("/api/purposes", purposeRoutes);
  app.use("/api/pricing", pricingRoutes);

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Servidor esta funcionando",
      timestamp: new Date().toISOString(),
      features: {
        auth: true,
        rides: true,
        websocket: true,
      },
    });
  });
}

function createServer(options = {}) {
  const enableWebSocket = options.enableWebSocket !== false;
  const app = express();
  const server = http.createServer(app);

  applyMiddlewares(app);
  applyRoutes(app);

  if (enableWebSocket) {
    const io = initializeWebSocket(server);
    app.set("io", io);
  }

  app.use((err, req, res, next) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Arquivo muito grande. Limite de 5MB.",
        });
      }
      console.error("Unhandled error:", err);
      return res.status(500).json({
        success: false,
        message: "Erro interno do servidor",
        error: process.env.NODE_ENV !== "production"
          ? err.message
          : undefined,
      });
    }
    next();
  });

  return { app, server };
}

module.exports = { createServer };
