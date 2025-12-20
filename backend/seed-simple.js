require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/leva-mais";

// Schema simplificado
const purposeSchema = new mongoose.Schema(
  {
    vehicleType: String,
    id: { type: String, unique: true },
    title: String,
    subtitle: String,
    icon: String,
    badges: [String],
    isActive: Boolean,
  },
  { timestamps: true }
);

const Purpose = mongoose.model("Purpose", purposeSchema);

// Dados dos serviços
const carServices = [
  {
    vehicleType: "car",
    id: "small-moving",
    title: "Mudança Pequena",
    subtitle: "Mudanças residenciais de itens pequenos e médios",
    icon: "Home",
    badges: ["RESIDENCIAL"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "grocery-shopping",
    title: "Compras de Supermercado",
    subtitle: "Entregar compras completas de supermercado",
    icon: "ShoppingCart",
    badges: ["POPULAR", "ECONÔMICO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "small-furniture",
    title: "Móveis Pequenos",
    subtitle: "Transportar móveis desmontados ou pequenos",
    icon: "Armchair",
    badges: ["MÓVEIS"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "appliances",
    title: "Eletrodomésticos",
    subtitle: "Transportar geladeiras, fogões, micro-ondas, etc.",
    icon: "Refrigerator",
    badges: ["FRÁGIL", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "large-electronics",
    title: "Eletrônicos Grandes",
    subtitle: "TVs, computadores, equipamentos de som",
    icon: "Tv",
    badges: ["FRÁGIL", "TECNOLOGIA"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "documents-bulk",
    title: "Documentos em Volume",
    subtitle: "Transporte de grandes volumes de documentos",
    icon: "FolderOpen",
    badges: ["CORPORATIVO", "URGENTE"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "office-supplies",
    title: "Material de Escritório",
    subtitle: "Entregar suprimentos e equipamentos de escritório",
    icon: "Briefcase",
    badges: ["CORPORATIVO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "medical-equipment",
    title: "Equipamentos Médicos",
    subtitle: "Transporte de equipamentos médicos e hospitalares",
    icon: "HeartPulse",
    badges: ["SAÚDE", "ESPECIAL"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "light-construction",
    title: "Material de Construção",
    subtitle: "Transportar materiais leves de construção",
    icon: "HardHat",
    badges: ["CONSTRUÇÃO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "large-packages",
    title: "Encomendas Grandes",
    subtitle: "Pacotes e caixas de grande volume",
    icon: "Boxes",
    badges: ["VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "bulk-textiles",
    title: "Roupas em Volume",
    subtitle: "Transporte de grandes volumes de roupas e têxteis",
    icon: "ShoppingBasket",
    badges: ["VAREJO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "event-flowers",
    title: "Flores para Eventos",
    subtitle: "Arranjos florais e decorações para eventos",
    icon: "Flower2",
    badges: ["EVENTOS", "ESPECIAL"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "sports-equipment",
    title: "Equipamentos Esportivos",
    subtitle: "Bicicletas, pranchas, equipamentos de ginástica",
    icon: "Bike",
    badges: ["ESPORTES"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "perishable-food",
    title: "Alimentos Perecíveis",
    subtitle: "Transporte refrigerado de alimentos",
    icon: "Salad",
    badges: ["REFRIGERADO", "RÁPIDO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "pet-bulk",
    title: "Produtos Pet em Volume",
    subtitle: "Rações, camas, casinhas e acessórios grandes",
    icon: "PawPrint",
    badges: ["PET", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "promotional-material",
    title: "Material Promocional",
    subtitle: "Banners, brindes, material de marketing",
    icon: "Megaphone",
    badges: ["CORPORATIVO", "EVENTOS"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "musical-instruments",
    title: "Instrumentos Musicais",
    subtitle: "Transporte de instrumentos grandes (violão, bateria, etc)",
    icon: "Music",
    badges: ["FRÁGIL", "ESPECIAL"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "bulk-beverages",
    title: "Bebidas em Volume",
    subtitle: "Transporte de engradados e volumes de bebidas",
    icon: "Wine",
    badges: ["VOLUME", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "mattresses",
    title: "Colchões e Estofados",
    subtitle: "Transporte de colchões, sofás e poltronas",
    icon: "Bed",
    badges: ["MÓVEIS", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "car-express",
    title: "Express Carro",
    subtitle: "Entrega urgente de maior volume com carro",
    icon: "Zap",
    badges: ["URGENTE", "EXPRESSO"],
    isActive: true,
  },
];

const vanServices = [
  {
    vehicleType: "van",
    id: "complete-moving",
    title: "Mudança Completa",
    subtitle: "Mudanças residenciais completas",
    icon: "Home",
    badges: ["RESIDENCIAL", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "furniture-large",
    title: "Móveis Grandes",
    subtitle: "Transporte de móveis de grande porte",
    icon: "Armchair",
    badges: ["MÓVEIS", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "event-equipment",
    title: "Equipamentos para Eventos",
    subtitle: "Transporte de equipamentos completos para eventos",
    icon: "Music",
    badges: ["EVENTOS", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "office-moving",
    title: "Mudança de Escritório",
    subtitle: "Transporte de móveis e equipamentos de escritório",
    icon: "Briefcase",
    badges: ["CORPORATIVO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "appliances-bulk",
    title: "Eletrodomésticos em Volume",
    subtitle: "Múltiplos eletrodomésticos e linha branca",
    icon: "Refrigerator",
    badges: ["FRÁGIL", "PESADO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "store-stock",
    title: "Estoque de Loja",
    subtitle: "Transporte de mercadorias e estoque",
    icon: "ShoppingBasket",
    badges: ["VAREJO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "construction-materials",
    title: "Material de Construção",
    subtitle: "Transporte de materiais de construção em volume",
    icon: "HardHat",
    badges: ["CONSTRUÇÃO", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "e-commerce-bulk",
    title: "E-commerce em Volume",
    subtitle: "Grandes volumes de encomendas e-commerce",
    icon: "Boxes",
    badges: ["VAREJO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "wedding-decoration",
    title: "Decoração de Casamento",
    subtitle: "Transporte de decoração completa para eventos",
    icon: "Flower2",
    badges: ["EVENTOS", "ESPECIAL", "FRÁGIL"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "gym-equipment",
    title: "Equipamentos de Academia",
    subtitle: "Esteiras, pesos e equipamentos de ginástica",
    icon: "Bike",
    badges: ["ESPORTES", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "restaurant-equipment",
    title: "Equipamentos de Restaurante",
    subtitle: "Equipamentos industriais de cozinha",
    icon: "UtensilsCrossed",
    badges: ["CORPORATIVO", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "electronics-bulk",
    title: "Eletrônicos em Volume",
    subtitle: "Grande quantidade de equipamentos eletrônicos",
    icon: "Tv",
    badges: ["TECNOLOGIA", "FRÁGIL", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "pet-store-delivery",
    title: "Entregas Pet Shop",
    subtitle: "Grandes volumes de produtos pet",
    icon: "PawPrint",
    badges: ["PET", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "pharmacy-bulk",
    title: "Farmácia em Volume",
    subtitle: "Grandes cargas de medicamentos e produtos",
    icon: "Pill",
    badges: ["SAÚDE", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "promotional-campaign",
    title: "Campanha Promocional",
    subtitle: "Material completo para ações promocionais",
    icon: "Megaphone",
    badges: ["CORPORATIVO", "EVENTOS", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "textile-bulk",
    title: "Têxteis em Grande Volume",
    subtitle: "Grandes cargas de roupas e tecidos",
    icon: "Shirt",
    badges: ["VAREJO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "beverage-distribution",
    title: "Distribuição de Bebidas",
    subtitle: "Grandes volumes de bebidas e engradados",
    icon: "Wine",
    badges: ["VOLUME", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "van-express",
    title: "Express Van",
    subtitle: "Entrega urgente de grande volume",
    icon: "Zap",
    badges: ["URGENTE", "EXPRESSO", "VOLUME"],
    isActive: true,
  },
];

const truckServices = [
  {
    vehicleType: "truck",
    id: "commercial-moving",
    title: "Mudança Comercial",
    subtitle: "Mudanças comerciais e industriais completas",
    icon: "Briefcase",
    badges: ["CORPORATIVO", "PESADO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "industrial-equipment",
    title: "Equipamentos Industriais",
    subtitle: "Máquinas e equipamentos pesados",
    icon: "HardHat",
    badges: ["INDUSTRIAL", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "construction-heavy",
    title: "Construção Pesada",
    subtitle: "Materiais pesados de construção (vigas, cimento, etc)",
    icon: "HardHat",
    badges: ["CONSTRUÇÃO", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "palletized-cargo",
    title: "Carga Paletizada",
    subtitle: "Transporte de paletes e cargas industriais",
    icon: "Boxes",
    badges: ["INDUSTRIAL", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "container-transport",
    title: "Transporte de Container",
    subtitle: "Movimentação de containers",
    icon: "Package",
    badges: ["INDUSTRIAL", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "vehicle-transport",
    title: "Transporte de Veículos",
    subtitle: "Transporte de carros, motos e veículos",
    icon: "Bike",
    badges: ["ESPECIAL", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "warehouse-transfer",
    title: "Transferência de Estoque",
    subtitle: "Grandes volumes entre armazéns",
    icon: "ShoppingBasket",
    badges: ["CORPORATIVO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "food-distribution",
    title: "Distribuição de Alimentos",
    subtitle: "Grandes volumes de alimentos e bebidas",
    icon: "Salad",
    badges: ["REFRIGERADO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "furniture-factory",
    title: "Móveis de Fábrica",
    subtitle: "Grandes cargas de móveis direto da fábrica",
    icon: "Armchair",
    badges: ["MÓVEIS", "VOLUME", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "appliance-wholesale",
    title: "Eletrodomésticos Atacado",
    subtitle: "Grandes volumes de linha branca",
    icon: "Refrigerator",
    badges: ["CORPORATIVO", "VOLUME", "FRÁGIL"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "event-infrastructure",
    title: "Infraestrutura de Eventos",
    subtitle: "Estruturas completas (palcos, tendas, etc)",
    icon: "Music",
    badges: ["EVENTOS", "PESADO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "agricultural-products",
    title: "Produtos Agrícolas",
    subtitle: "Transporte de produtos agrícolas em grande escala",
    icon: "Flower2",
    badges: ["VOLUME", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "metal-materials",
    title: "Materiais Metálicos",
    subtitle: "Transporte de metais, chapas e estruturas",
    icon: "Wrench",
    badges: ["INDUSTRIAL", "PESADO"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "waste-removal",
    title: "Remoção de Entulho",
    subtitle: "Transporte de entulho e resíduos",
    icon: "Home",
    badges: ["CONSTRUÇÃO", "VOLUME"],
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "truck-express",
    title: "Express Caminhão",
    subtitle: "Entrega urgente de carga pesada",
    icon: "Zap",
    badges: ["URGENTE", "EXPRESSO", "PESADO"],
    isActive: true,
  },
];

async function run() {
  try {
    console.log("Conectando...");
    await mongoose.connect(MONGODB_URI);

    console.log("Limpando...");
    await Purpose.deleteMany({ vehicleType: { $in: ["car", "van", "truck"] } });

    console.log("Inserindo carro...");
    await Purpose.insertMany(carServices);
    console.log(`OK: ${carServices.length} carros`);

    console.log("Inserindo van...");
    await Purpose.insertMany(vanServices);
    console.log(`OK: ${vanServices.length} vans`);

    console.log("Inserindo caminhão...");
    await Purpose.insertMany(truckServices);
    console.log(`OK: ${truckServices.length} caminhões`);

    const total = await Purpose.countDocuments();
    console.log(`\nTOTAL NO BANCO: ${total}`);

    await mongoose.disconnect();
    console.log("Concluído!");
    process.exit(0);
  } catch (error) {
    console.error("ERRO:", error.message);
    process.exit(1);
  }
}

run();
