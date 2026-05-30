const mongoose = require('mongoose');

class Database {
  constructor() {
    this.connection = null;
  }

  async connect(retries = 5, delayMs = 3000) {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/leva-mais';

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.connection = await mongoose.connect(mongoURI, {
          serverSelectionTimeoutMS: 10000,
        });

        mongoose.connection.on("disconnected", () => {
          console.warn("[Database] MongoDB desconectado — aguardando reconexão...");
        });
        mongoose.connection.on("reconnected", () => {
          console.log("[Database] MongoDB reconectado com sucesso.");
        });
        mongoose.connection.on("error", (err) => {
          console.error("[Database] Erro na conexão MongoDB:", err.message);
        });

        console.log("[Database] Conectado ao MongoDB.");
        return this.connection;
      } catch (error) {
        console.error(
          `[Database] Tentativa ${attempt}/${retries} falhou: ${error.message}`,
        );
        if (attempt === retries) throw error;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        console.log("[Database] Desconectado do MongoDB");
      }
    } catch (error) {
      console.error("[Database] Erro ao desconectar:", error.message);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }
}

const database = new Database();

module.exports = database;

