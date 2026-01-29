require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");
const DriverLocation = require("./src/models/DriverLocation");

// ⚠️ CONFIGURE AQUI AS LOCALIZAÇÕES DOS MOTORISTAS
// Use sua localização atual ou locais próximos em São Paulo

const driverLocations = [
  {
    email: "carlos.driver@levamais.com",
    latitude: -23.5505, // Centro de São Paulo
    longitude: -46.6333,
  },
  {
    email: "joao.driver@levamais.com",
    latitude: -23.5489, // Próximo à Av. Paulista
    longitude: -46.6388,
  },
  {
    email: "maria.driver@levamais.com",
    latitude: -23.5629, // Bairro da Liberdade
    longitude: -46.6344,
  },
  {
    email: "pedro.driver@levamais.com",
    latitude: -23.5475, // Próximo ao Parque Ibirapuera
    longitude: -46.6361,
  },
  {
    email: "ana.driver@levamais.com",
    latitude: -23.5558, // Vila Madalena
    longitude: -46.6911,
  },
];

async function updateDriverLocations() {
  try {
    console.log("🔌 Conectando ao MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    console.log("\n📍 Atualizando localizações dos motoristas...\n");

    for (const location of driverLocations) {
      const user = await User.findOne({
        email: location.email,
        userType: "driver",
      });

      if (!user) {
        console.log(`❌ Motorista não encontrado: ${location.email}`);
        continue;
      }

      // Obter dados do veículo do schema do User
      const vehicleType = user.vehicleType || "car";

      const driverLocation = await DriverLocation.findOneAndUpdate(
        { driverId: user._id },
        {
          location: {
            type: "Point",
            coordinates: [location.longitude, location.latitude],
          },
          status: "available",
          vehicleType: vehicleType,
          vehicle: {
            plate: `${vehicleType.toUpperCase()}-${Math.floor(
              1000 + Math.random() * 9000
            )}`,
            model: getDefaultVehicleModel(vehicleType),
            color: "Prata",
            year: 2020 + Math.floor(Math.random() * 4),
          },
          lastUpdated: new Date(),
        },
        {
          new: true,
          upsert: true,
        }
      );

      console.log(`✅ ${user.name}:`);
      console.log(
        `   📍 ${location.latitude}, ${location.longitude} (${vehicleType})`
      );
      console.log(`   🚗 ${driverLocation.vehicle.model}`);
      console.log(`   📋 ${driverLocation.vehicle.plate}`);
    }

    console.log("\n✅ Localizações atualizadas com sucesso!");

    // Mostrar estatísticas
    const totalDrivers = await DriverLocation.countDocuments({
      status: "available",
    });
    console.log(`\n📊 Total de motoristas disponíveis: ${totalDrivers}`);

    const byVehicle = await DriverLocation.aggregate([
      { $match: { status: "available" } },
      { $group: { _id: "$vehicleType", count: { $sum: 1 } } },
    ]);

    console.log("\n🚗 Por tipo de veículo:");
    byVehicle.forEach((v) => {
      console.log(`   ${v._id}: ${v.count}`);
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar localizações:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Desconectado do MongoDB");
  }
}

function getDefaultVehicleModel(vehicleType) {
  const models = {
    motorcycle: "Honda CG 160",
    car: "Honda Civic",
    van: "Fiat Ducato",
    truck: "Mercedes-Benz Accelo",
  };
  return models[vehicleType] || "Veículo";
}

updateDriverLocations();
