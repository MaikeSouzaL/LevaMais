require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const mongoose = require("mongoose");
const Purpose = require("../models/Purpose");

async function fixIndexes() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/levamais";
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    const collection = Purpose.collection;
    const indexes = await collection.indexes();
    console.log("📚 Índices atuais:", indexes.map((i) => i.name));

    const hasIdOnly = indexes.find((i) => i.name === "id_1");
    if (hasIdOnly) {
      console.log("🗑️ Removendo índice único antigo: id_1");
      await collection.dropIndex("id_1");
      console.log("✅ Índice id_1 removido");
    } else {
      console.log("ℹ️ Índice id_1 não encontrado");
    }

    const compoundName = "vehicleType_1_id_1";
    const hasCompound = indexes.find((i) => i.name === compoundName);
    if (!hasCompound) {
      console.log("🔧 Criando índice composto único: vehicleType_1_id_1");
      await collection.createIndex(
        { vehicleType: 1, id: 1 },
        { unique: true, background: true }
      );
      console.log("✅ Índice composto criado");
    } else {
      console.log("ℹ️ Índice composto já existe");
    }

    console.log("✅ Correção de índices concluída");
  } catch (err) {
    console.error("❌ Erro ao corrigir índices:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexão fechada");
    process.exit(0);
  }
}

fixIndexes();
