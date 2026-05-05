require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const database = require("./src/config/database");
const { initializeWebSocket } = require("./src/config/websocket");
const authRoutes = require("./src/routes/auth.routes");
const purposeRoutes = require("./src/routes/purpose.routes");
const favoriteRoutes = require("./src/routes/favorite.routes");
const favoriteAddressRoutes = require("./src/routes/favoriteAddress.routes");
const rideRoutes = require("./src/routes/ride.routes");
const driverLocationRoutes = require("./src/routes/driverLocation.routes");
const cityRoutes = require("./src/routes/city.routes");
const pricingRoutes = require("./src/routes/pricing.routes");
const walletRoutes = require("./src/routes/wallet.routes");
const representativeRoutes = require("./src/routes/representative.routes");
const platformConfigRoutes = require("./src/routes/platformConfig.routes");
const chatRoutes = require("./src/routes/chat.routes");

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 3001;

    this.middlewares();
    this.routes();
    this.setupWebSocket();
  }

  middlewares() {
    // CORS com configuração específica
    this.app.use(
      cors({
        origin: "*", // Permitir todas as origens em desenvolvimento
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        credentials: true,
      })
    );
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  }

  routes() {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/purposes", purposeRoutes);
    this.app.use("/api/favorites", favoriteRoutes);
    this.app.use("/api/favorite-addresses", favoriteAddressRoutes);
    this.app.use("/api/rides", rideRoutes);
    this.app.use("/api/driver-location", driverLocationRoutes);
    this.app.use("/api/cities", cityRoutes);
    this.app.use("/api/pricing", pricingRoutes);
    this.app.use("/api/wallet", walletRoutes);
    this.app.use("/api/representatives", representativeRoutes);
    this.app.use("/api/platform-config", platformConfigRoutes);
    this.app.use("/api/chat", chatRoutes);

    // Rota de teste
    this.app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        message: "Servidor está funcionando",
        timestamp: new Date().toISOString(),
        features: {
          auth: true,
          rides: true,
          websocket: true,
          matching: true,
          cities: true,
          pricing: true,
        },
      });
    });
  }

  setupWebSocket() {
    const io = initializeWebSocket(this.server);
    this.app.set("io", io);
    console.log("✅ WebSocket configurado");
  }

  async connectDatabase() {
    try {
      await database.connect();
      console.log("✅ MongoDB conectado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao conectar ao MongoDB:", error.message);
      process.exit(1);
    }
  }

  start() {
    this.server.listen(this.port, "0.0.0.0", () => {
      console.log(`🚀 Servidor rodando na porta ${this.port}`);
      console.log(`📍 http://localhost:${this.port}`);
      console.log(`📍 http://0.0.0.0:${this.port}`);
      console.log(`🔌 WebSocket disponível`);
    });
  }
}

// Iniciar servidor
async function startServer() {
  const server = new Server();
  await server.connectDatabase();
  server.start();
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
});

startServer();
