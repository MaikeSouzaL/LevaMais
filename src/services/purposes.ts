export type VehicleType = "motorcycle" | "car" | "van" | "truck";

export interface PurposeItem {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  badges?: string[];
}

const PURPOSES_MOTO: PurposeItem[] = [
  {
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Entregar pacotes e encomendas",
    icon: "local-shipping",
  },
  {
    id: "documents",
    title: "Documentos",
    subtitle: "Envio e retirada de documentos",
    icon: "description",
  },
  {
    id: "market-light",
    title: "Compras de Supermercado",
    subtitle: "Itens leves e compras do dia a dia",
    icon: "shopping-cart",
  },
  {
    id: "express",
    title: "Expresso",
    subtitle: "Coleta e entrega rápida",
    icon: "bolt",
    badges: ["Rápido"],
  },
  {
    id: "pharmacy",
    title: "Farmácia",
    subtitle: "Medicamentos e itens de saúde",
    icon: "local-pharmacy",
  },
  {
    id: "petshop",
    title: "Pet Shop",
    subtitle: "Itens para pets",
    icon: "pets",
  },
  {
    id: "postoffice",
    title: "Correios/Cartório",
    subtitle: "Postagens e autenticações",
    icon: "markunread-mailbox",
  },
  {
    id: "meals",
    title: "Refeições/Restaurantes",
    subtitle: "Retirada de comida pronta",
    icon: "restaurant",
  },
  {
    id: "ecommerce",
    title: "E-commerce/Loja",
    subtitle: "Coleta de pedidos em lojas",
    icon: "store",
  },
  {
    id: "office",
    title: "Material de escritório",
    subtitle: "Papelaria e suprimentos leves",
    icon: "inventory",
  },
  {
    id: "parts",
    title: "Peças e ferramentas leves",
    subtitle: "Itens leves automotivos/industriais",
    icon: "build",
  },
  {
    id: "bank",
    title: "Bancos/Financeiro",
    subtitle: "Documentos bancários",
    icon: "account-balance",
  },
  {
    id: "gifts",
    title: "Presentes/Floricultura",
    subtitle: "Entregas pontuais",
    icon: "redeem",
  },
  {
    id: "scheduled",
    title: "Retirada agendada",
    subtitle: "Coletas com horário",
    icon: "event",
  },
  {
    id: "multi-stop",
    title: "Multi-paradas",
    subtitle: "Roteiro com 2–3 endereços",
    icon: "alt-route",
  },
  {
    id: "urgent-1h",
    title: "Urgente 1h",
    subtitle: "SLA curto, taxa diferenciada",
    icon: "speed",
    badges: ["Urgente"],
  },
];

const PURPOSES_CAR: PurposeItem[] = [
  {
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Pacotes e encomendas médios",
    icon: "local-shipping",
  },
  {
    id: "documents",
    title: "Documentos",
    subtitle: "Envio e retirada de documentos",
    icon: "description",
  },
  {
    id: "market-medium",
    title: "Compras de Supermercado",
    subtitle: "Itens médios/volumosos",
    icon: "shopping-bag",
  },
  {
    id: "express",
    title: "Expresso",
    subtitle: "Coleta e entrega rápida",
    icon: "bolt",
    badges: ["Rápido"],
  },
  {
    id: "ecommerce",
    title: "E-commerce/Loja",
    subtitle: "Coleta em lojas e shoppings",
    icon: "storefront",
  },
  {
    id: "multi-stop",
    title: "Multi-paradas",
    subtitle: "Roteiro com 3–5 endereços",
    icon: "alt-route",
  },
  {
    id: "fragile",
    title: "Itens frágeis",
    subtitle: "Eletrônicos, vidros (proteção)",
    icon: "inventory-2",
  },
  {
    id: "rain-protection",
    title: "Proteção contra chuva",
    subtitle: "Itens que não podem molhar",
    icon: "umbrella",
  },
  {
    id: "scheduled",
    title: "Retirada agendada",
    subtitle: "Coletas com horário",
    icon: "event",
  },
  {
    id: "gifts",
    title: "Presentes/Floricultura",
    subtitle: "Volumes médios",
    icon: "card-giftcard",
  },
  {
    id: "postoffice",
    title: "Correios/Cartório",
    subtitle: "Postagens e autenticações",
    icon: "markunread-mailbox",
  },
];

const PURPOSES_VAN: PurposeItem[] = [
  {
    id: "moving-light",
    title: "Mudança leve",
    subtitle: "Móveis pequenos e caixas",
    icon: "inventory-2",
  },
  {
    id: "market-bulk",
    title: "Compras volumosas",
    subtitle: "Caixas e pacotes grandes",
    icon: "shopping-cart",
  },
  {
    id: "ecommerce-bulk",
    title: "Coleta de grandes volumes",
    subtitle: "Lojas/depósitos",
    icon: "warehouse",
  },
  {
    id: "multi-stop",
    title: "Multi-paradas",
    subtitle: "Roteiro otimizado",
    icon: "alt-route",
  },
  {
    id: "fragile",
    title: "Frágeis com proteção",
    subtitle: "Vidros, eletrônicos com acolchoamento",
    icon: "shield",
  },
];

const PURPOSES_TRUCK: PurposeItem[] = [
  {
    id: "moving",
    title: "Mudanças",
    subtitle: "Móveis e cargas pesadas",
    icon: "local-shipping",
  },
  {
    id: "commercial-load",
    title: "Carga comercial",
    subtitle: "Paletes e grandes volumes",
    icon: "inventory-2",
  },
  {
    id: "construction",
    title: "Materiais de construção",
    subtitle: "Cimentos, pisos, etc.",
    icon: "construction",
  },
  {
    id: "long-distance",
    title: "Longa distância",
    subtitle: "Rotas intermunicipais",
    icon: "route",
  },
];

export async function getPurposesByVehicleType(
  type: VehicleType
): Promise<PurposeItem[]> {
  await new Promise((r) => setTimeout(r, 200));
  switch (type) {
    case "motorcycle":
      return PURPOSES_MOTO;
    case "car":
      return PURPOSES_CAR;
    case "van":
      return PURPOSES_VAN;
    case "truck":
      return PURPOSES_TRUCK;
    default:
      return [];
  }
}
