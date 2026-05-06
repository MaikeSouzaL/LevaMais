require("dotenv").config();
const database = require("./src/config/database");
const { createServer } = require("./src/createServer");

const port = process.env.PORT || 3001;
const { server } = createServer({ enableWebSocket: true });

async function startServer() {
  try {
    await database.connect();
    console.log("MongoDB conectado com sucesso");
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error.message);
    process.exit(1);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`http://localhost:${port}`);
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

startServer();
