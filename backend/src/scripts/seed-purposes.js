require("dotenv").config({
  path: require("path").join(__dirname, "../../.env"),
});
const mongoose = require("mongoose");
const Purpose = require("../models/Purpose");

// Dados de seed baseados no app mobile
const SEED_DATA = {
  motorcycle: [
    {
      id: "delivery",
      title: "Entrega de Delivery",
      subtitle: "Entregar pacotes e encomendas",
      icon: "local-shipping",
      isActive: true,
    },
    {
      id: "documents",
      title: "Documentos",
      subtitle: "Envio e retirada de documentos",
      icon: "description",
      isActive: true,
    },
    {
      id: "market-light",
      title: "Compras de Supermercado",
      subtitle: "Itens leves e compras do dia a dia",
      icon: "shopping-cart",
      isActive: true,
    },
    {
      id: "express",
      title: "Expresso",
      subtitle: "Coleta e entrega rápida",
      icon: "bolt",
      badges: ["Rápido"],
      isActive: true,
    },
    {
      id: "pharmacy",
      title: "Farmácia",
      subtitle: "Medicamentos e itens de saúde",
      icon: "local-pharmacy",
      isActive: true,
    },
    {
      id: "petshop",
      title: "Pet Shop",
      subtitle: "Itens para pets",
      icon: "pets",
      isActive: true,
    },
    {
      id: "postoffice",
      title: "Correios/Cartório",
      subtitle: "Postagens e autenticações",
      icon: "markunread-mailbox",
      isActive: true,
    },
    {
      id: "meals",
      title: "Refeições/Restaurantes",
      subtitle: "Retirada de comida pronta",
      icon: "restaurant",
      isActive: true,
    },
    {
      id: "ecommerce",
      title: "E-commerce/Loja",
      subtitle: "Coleta de pedidos em lojas",
      icon: "store",
      isActive: true,
    },
    {
      id: "office",
      title: "Material de escritório",
      subtitle: "Papelaria e suprimentos leves",
      icon: "inventory",
      isActive: true,
    },
    {
      id: "parts",
      title: "Peças e ferramentas leves",
      subtitle: "Itens leves automotivos/industriais",
      icon: "build",
      isActive: true,
    },
    {
      id: "bank",
      title: "Bancos/Financeiro",
      subtitle: "Documentos bancários",
      icon: "account-balance",
      isActive: true,
    },
    {
      id: "gifts",
      title: "Presentes/Floricultura",
      subtitle: "Entregas pontuais",
      icon: "redeem",
      isActive: true,
    },
    {
      id: "scheduled",
      title: "Retirada agendada",
      subtitle: "Coletas com horário",
      icon: "event",
      isActive: true,
    },
    {
      id: "multi-stop",
      title: "Multi-paradas",
      subtitle: "Roteiro com 2–3 endereços",
      icon: "alt-route",
      isActive: true,
    },
    {
      id: "urgent-1h",
      title: "Urgente 1h",
      subtitle: "SLA curto, taxa diferenciada",
      icon: "speed",
      badges: ["Urgente"],
      isActive: true,
    },
  ],
  car: [
    {
      id: "delivery",
      title: "Entrega de Delivery",
      subtitle: "Pacotes e encomendas médios",
      icon: "local-shipping",
      isActive: true,
    },
    {
      id: "documents",
      title: "Documentos",
      subtitle: "Envio e retirada de documentos",
      icon: "description",
      isActive: true,
    },
    {
      id: "market-medium",
      title: "Compras de Supermercado",
      subtitle: "Itens médios/volumosos",
      icon: "shopping-bag",
      isActive: true,
    },
    {
      id: "express",
      title: "Expresso",
      subtitle: "Coleta e entrega rápida",
      icon: "bolt",
      badges: ["Rápido"],
      isActive: true,
    },
    {
      id: "ecommerce",
      title: "E-commerce/Loja",
      subtitle: "Coleta em lojas e shoppings",
      icon: "storefront",
      isActive: true,
    },
    {
      id: "multi-stop",
      title: "Multi-paradas",
      subtitle: "Roteiro com 3–5 endereços",
      icon: "alt-route",
      isActive: true,
    },
    {
      id: "fragile",
      title: "Itens frágeis",
      subtitle: "Eletrônicos, vidros (proteção)",
      icon: "inventory-2",
      isActive: true,
    },
    {
      id: "rain-protection",
      title: "Proteção contra chuva",
      subtitle: "Itens que não podem molhar",
      icon: "umbrella",
      isActive: true,
    },
    {
      id: "scheduled",
      title: "Retirada agendada",
      subtitle: "Coletas com horário",
      icon: "event",
      isActive: true,
    },
    {
      id: "gifts",
      title: "Presentes/Floricultura",
      subtitle: "Volumes médios",
      icon: "card-giftcard",
      isActive: true,
    },
    {
      id: "postoffice",
      title: "Correios/Cartório",
      subtitle: "Postagens e autenticações",
      icon: "markunread-mailbox",
      isActive: true,
    },
  ],
  van: [
    {
      id: "moving-light",
      title: "Mudança leve",
      subtitle: "Móveis pequenos e caixas",
      icon: "inventory-2",
      isActive: true,
    },
    {
      id: "market-bulk",
      title: "Compras volumosas",
      subtitle: "Caixas e pacotes grandes",
      icon: "shopping-cart",
      isActive: true,
    },
    {
      id: "ecommerce-bulk",
      title: "Coleta de grandes volumes",
      subtitle: "Lojas/depósitos",
      icon: "warehouse",
      isActive: true,
    },
    {
      id: "multi-stop",
      title: "Multi-paradas",
      subtitle: "Roteiro otimizado",
      icon: "alt-route",
      isActive: true,
    },
    {
      id: "fragile",
      title: "Frágeis com proteção",
      subtitle: "Vidros, eletrônicos com acolchoamento",
      icon: "shield",
      isActive: true,
    },
  ],
  truck: [
    {
      id: "moving",
      title: "Mudanças",
      subtitle: "Móveis e cargas pesadas",
      icon: "local-shipping",
      isActive: true,
    },
    {
      id: "commercial-load",
      title: "Carga comercial",
      subtitle: "Paletes e grandes volumes",
      icon: "inventory-2",
      isActive: true,
    },
    {
      id: "construction",
      title: "Materiais de construção",
      subtitle: "Cimentos, pisos, etc.",
      icon: "construction",
      isActive: true,
    },
    {
      id: "long-distance",
      title: "Longa distância",
      subtitle: "Rotas intermunicipais",
      icon: "route",
      isActive: true,
    },
  ],
};

async function seedDatabase() {
  try {
    // Conectar ao MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/levamais";
    console.log("🔗 Conectando ao MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado ao MongoDB");

    // Limpar coleção existente (CUIDADO: isso apaga todos os dados!)
    console.log("🗑️  Limpando coleção de purposes...");
    await Purpose.deleteMany({});
    console.log("✅ Coleção limpa");

    // Inserir dados de seed
    console.log("📝 Inserindo dados de seed...");
    let totalInserted = 0;

    for (const [vehicleType, purposes] of Object.entries(SEED_DATA)) {
      for (const purpose of purposes) {
        const doc = new Purpose({
          vehicleType,
          ...purpose,
        });
        await doc.save();
        totalInserted++;
        console.log(`  ✓ ${vehicleType.toUpperCase()}: ${purpose.title}`);
      }
    }

    console.log(`\n✅ Seed concluído com sucesso!`);
    console.log(`📊 Total de registros inseridos: ${totalInserted}`);
    console.log(`   - Motorcycle: ${SEED_DATA.motorcycle.length}`);
    console.log(`   - Car: ${SEED_DATA.car.length}`);
    console.log(`   - Van: ${SEED_DATA.van.length}`);
    console.log(`   - Truck: ${SEED_DATA.truck.length}`);
  } catch (error) {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Conexão com MongoDB fechada");
    process.exit(0);
  }
}

// Executar seed
seedDatabase();
