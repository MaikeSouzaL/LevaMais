require("dotenv").config();
const express = require("express");
const cors = require("cors");
const database = require("./src/config/database");
const authRoutes = require("./src/routes/auth.routes");
const purposeRoutes = require("./src/routes/purpose.routes");
const favoriteRoutes = require("./src/routes/favorite.routes");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;

    this.middlewares();
    this.routes();
    this.connectDatabase();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/purposes", purposeRoutes);
    this.app.use("/api/favorites", favoriteRoutes);

    // Rota de teste
    this.app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        message: "Servidor está funcionando",
        timestamp: new Date().toISOString(),
      });
    });
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
    this.app.listen(this.port, "0.0.0.0", () => {
      console.log(`🚀 Servidor rodando na porta ${this.port}`);
      console.log(`📍 http://localhost:${this.port}`);
      console.log(`📍 http://0.0.0.0:${this.port}`);
    });
  }
}

// Iniciar servidor
function startServer() {
  const server = new Server();
  server.start();
}

startServer();
