const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { initializeWebSocket } = require("./config/websocket");

// Routes imports continue...
const authRoutes = require("./routes/auth.routes");
const purposeRoutes = require("./routes/purpose.routes");
const favoriteRoutes = require("./routes/favorite.routes");
const favoriteAddressRoutes = require("./routes/favoriteAddress.routes");
const rideRoutes = require("./routes/ride.routes");
const driverLocationRoutes = require("./routes/driverLocation.routes");
const cityRoutes = require("./routes/city.routes");
const pricingRoutes = require("./routes/pricing.routes");
const walletRoutes = require("./routes/wallet.routes");
const representativeRoutes = require("./routes/representative.routes");
const platformConfigRoutes = require("./routes/platformConfig.routes");
const chatRoutes = require("./routes/chat.routes");
const shiftOfferRoutes = require("./routes/shiftOffer.routes");
const promotionRoutes = require("./routes/promotion.routes");
const driverRoutes = require("./routes/driver.routes");
const configRoutes = require("./routes/config.routes");

function applyMiddlewares(app) {
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve static uploads
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
}

function applyRoutes(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/purposes", purposeRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/favorite-addresses", favoriteAddressRoutes);
  app.use("/api/rides", rideRoutes);
  app.use("/api/driver-location", driverLocationRoutes);
  app.use("/api/cities", cityRoutes);
  app.use("/api/pricing", pricingRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/representatives", representativeRoutes);
  app.use("/api/platform-config", platformConfigRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/shift-offers", shiftOfferRoutes);
  app.use("/api/promotions", promotionRoutes);
  app.use("/api/drivers", driverRoutes);
  app.use("/api/config", configRoutes);

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "Servidor esta funcionando",
      timestamp: new Date().toISOString(),
      features: {
        auth: true,
        rides: true,
        websocket: true,
        matching: true,
        cities: true,
        pricing: true,
        promotions: true,
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

  return { app, server };
}

module.exports = { createServer };
