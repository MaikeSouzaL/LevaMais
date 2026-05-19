require("dotenv").config();
const mongoose = require("mongoose");
const City = require("./src/models/City");
const Purpose = require("./src/models/Purpose");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/leva-mais";

const SEED_PURPOSES = [
  // Motorcycle
  {
    vehicleType: "motorcycle",
    id: "moto-taxi",
    title: "Corrida de Passageiro",
    subtitle: "Transporte rápido de pessoas",
    icon: "Car",
    badges: ["RÁPIDO"],
    isActive: true,
    serviceMode: "ride",
  },
  {
    vehicleType: "motorcycle",
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Entregar pacotes e encomendas",
    icon: "Package",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "motorcycle",
    id: "documents",
    title: "Documentos",
    subtitle: "Envio e retirada de documentos",
    icon: "FileText",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "motorcycle",
    id: "market-light",
    title: "Compras de Supermercado",
    subtitle: "Itens leves e compras do dia a dia",
    icon: "ShoppingBasket",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "motorcycle",
    id: "express",
    title: "Expresso",
    subtitle: "Coleta e entrega rápida",
    icon: "Zap",
    badges: ["RÁPIDO"],
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "motorcycle",
    id: "pharmacy",
    title: "Farmácia",
    subtitle: "Medicamentos e itens de saúde",
    icon: "Pill",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "motorcycle",
    id: "petshop",
    title: "Pet Shop",
    subtitle: "Itens para pets",
    icon: "Dog",
    isActive: true,
    serviceMode: "delivery",
  },

  // Car
  {
    vehicleType: "car",
    id: "passenger-ride",
    title: "Corrida de Passageiro",
    subtitle: "Transporte urbano para pessoas",
    icon: "Car",
    badges: ["MOBILIDADE"],
    isActive: true,
    serviceMode: "ride",
  },
  {
    vehicleType: "car",
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Pacotes médios e encomendas",
    icon: "Package",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "car",
    id: "documents",
    title: "Documentos e Processos",
    subtitle: "Envio seguro de documentos",
    icon: "FileText",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "car",
    id: "market-medium",
    title: "Compras de Mês",
    subtitle: "Compras médias de supermercado",
    icon: "ShoppingCart",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "car",
    id: "express",
    title: "Expresso Carro",
    subtitle: "Entrega rápida com segurança",
    icon: "Zap",
    isActive: true,
    serviceMode: "delivery",
  },
  {
    vehicleType: "car",
    id: "fragile",
    title: "Frágil/Delicado",
    subtitle: "Transporte cuidadoso (bolos, vidro)",
    icon: "ShieldCheck",
    badges: ["CUIDADO"],
    isActive: true,
    serviceMode: "delivery",
  },

  // Van
  {
    vehicleType: "van",
    id: "moving-light",
    title: "Mudança Leve",
    subtitle: "Pequenos móveis e caixas",
    icon: "Truck",
    isActive: true,
    serviceMode: "frete",
  },
  {
    vehicleType: "van",
    id: "market-bulk",
    title: "Abastecimento",
    subtitle: "Restaurantes e comércios",
    icon: "ShoppingBag",
    isActive: true,
    serviceMode: "frete",
  },

  // Truck
  {
    vehicleType: "truck",
    id: "moving",
    title: "Mudança Completa",
    subtitle: "Residencial ou comercial",
    icon: "Home",
    isActive: true,
    serviceMode: "frete",
  },
  {
    vehicleType: "truck",
    id: "commercial-load",
    title: "Carga Comercial",
    subtitle: "Paletes e mercadorias",
    icon: "Container",
    isActive: true,
    serviceMode: "frete",
  },
];

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);

    console.log("Seeding city: Pimenta Bueno (RO)...");
    
    // Deleta se já existir para evitar duplicados
    await City.deleteMany({ name: "Pimenta Bueno", state: "RO" });
    
    const pimentaBueno = await City.create({
      name: "Pimenta Bueno",
      state: "RO",
      region: "Norte",
      timezone: "America/Porto_Velho",
      isActive: true,
      operatingHours: {
        start: "00:00",
        end: "23:59",
      },
      searchRadius: 15000,
      coordinates: {
        latitude: -11.6661242,
        longitude: -61.1833359,
      },
    });

    console.log(`✅ City seeded successfully: ${pimentaBueno.name} (${pimentaBueno.state})`);

    console.log("Seeding purposes/service categories...");
    await Purpose.deleteMany({});
    const createdPurposes = await Purpose.insertMany(SEED_PURPOSES);
    console.log(`✅ Seeded ${createdPurposes.length} purpose/service categories!`);

    await mongoose.disconnect();
    console.log("🎉 Seeding complete successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

run();
