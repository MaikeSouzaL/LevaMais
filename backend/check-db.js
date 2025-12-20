require("dotenv").config();
const mongoose = require("mongoose");

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const total = await mongoose.connection.db
      .collection("purposes")
      .countDocuments();
    console.log("\n📊 TOTAL DE SERVIÇOS:", total);

    const byType = await mongoose.connection.db
      .collection("purposes")
      .aggregate([
        { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    console.log("\n📦 POR TIPO DE VEÍCULO:");
    byType.forEach((item) => {
      const icons = { motorcycle: "🏍️", car: "🚗", van: "🚐", truck: "🚚" };
      console.log(
        `   ${icons[item._id] || "❓"} ${item._id}: ${item.count} serviços`
      );
    });

    console.log("\n");
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
