const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/leva-mais";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Collections:", collections.map(c => c.name));

  await mongoose.disconnect();
}

run().catch(console.error);
