const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { initializeWebSocket } = require("./config/websocket");

// Routes imports continue...
const authRoutes = require("./routes/auth.routes");
const rideRoutes = require("./routes/ride.routes");
const driverLocationRoutes = require("./routes/driverLocation.routes");
const favoriteAddressRoutes = require("./routes/favoriteAddress.routes");

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

  return { app, server };
}

module.exports = { createServer };
