import api from "./api";

export type VehicleType = "motorcycle" | "car" | "van" | "truck";

export interface PurposeItem {
  id: string;
  vehicleType: VehicleType;
  title: string;
  subtitle: string;
  icon: string; // Nome do ícone Lucide (será convertido no app via iconMapper)
  badges?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// OBS: não usamos mais dados mockados. As finalidades devem vir do backend.
// Se o backend falhar, mostramos erro no app (quem chama decide como lidar).
const MOCK_DATA_DISABLED: PurposeItem[] = [
  // Motorcycle
  {
    vehicleType: "motorcycle",
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Entregar pacotes e encomendas",
    icon: "Package",
    isActive: true,
  },
  {
    vehicleType: "motorcycle",
    id: "documents",
    title: "Documentos",
    subtitle: "Envio e retirada de documentos",
    icon: "FileText",
    isActive: true,
  },
  {
    vehicleType: "motorcycle",
    id: "market-light",
    title: "Compras de Supermercado",
    subtitle: "Itens leves e compras do dia a dia",
    icon: "ShoppingBasket",
    isActive: true,
  },
  {
    vehicleType: "motorcycle",
    id: "express",
    title: "Expresso",
    subtitle: "Coleta e entrega rápida",
    icon: "Zap",
    badges: ["RÁPIDO"],
    isActive: true,
  },

  // Car
  {
    vehicleType: "car",
    id: "delivery",
    title: "Entrega de Delivery",
    subtitle: "Pacotes médios e encomendas",
    icon: "Package",
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "documents",
    title: "Documentos e Processos",
    subtitle: "Envio seguro de documentos",
    icon: "FileText",
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "market-medium",
    title: "Compras de Mês",
    subtitle: "Compras médias de supermercado",
    icon: "ShoppingCart",
    isActive: true,
  },
  {
    vehicleType: "car",
    id: "express",
    title: "Expresso Carro",
    subtitle: "Entrega rápida com segurança",
    icon: "Zap",
    isActive: true,
  },

  // Van
  {
    vehicleType: "van",
    id: "moving-light",
    title: "Mudança Leve",
    subtitle: "Pequenos móveis e caixas",
    icon: "Truck",
    isActive: true,
  },
  {
    vehicleType: "van",
    id: "market-bulk",
    title: "Abastecimento",
    subtitle: "Restaurantes e comércios",
    icon: "ShoppingBag",
    isActive: true,
  },

  // Truck
  {
    vehicleType: "truck",
    id: "moving",
    title: "Mudança Completa",
    subtitle: "Residencial ou comercial",
    icon: "Home",
    isActive: true,
  },
  {
    vehicleType: "truck",
    id: "commercial-load",
    title: "Carga Comercial",
    subtitle: "Paletes e mercadorias",
    icon: "Container",
    isActive: true,
  },
];

/**
 * Busca tipos de serviço por tipo de veículo
 * @param vehicleType Tipo de veículo (motorcycle, car, van, truck)
 * @returns Lista de purposes ativos para o veículo
 */
export async function getPurposesByVehicleType(
  vehicleType: VehicleType,
): Promise<PurposeItem[]> {
  try {
    // Backend expõe GET /api/purposes com filtros via query
    const response = await api.get(`/purposes`, {
      params: { vehicleType, isActive: true },
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching purposes:", error);
    throw error;
  }
}

/**
 * Busca um purpose específico por ID
 * @param id ID do purpose
 * @returns Purpose encontrado ou null
 */
export async function getPurposeById(id: string): Promise<PurposeItem | null> {
  try {
    // Backend atual não tem GET /purposes/:id. Então buscamos a lista e filtramos localmente.
    const response = await api.get(`/purposes`);
    const list = (response.data || []) as PurposeItem[];
    return list.find((p) => p.id === id) || null;
  } catch (error) {
    console.error("Error fetching purpose:", error);
    return null;
  }
}

/**
 * Busca todos os purposes (admin)
 * @returns Lista de todos os purposes
 */
export async function getAllPurposes(): Promise<PurposeItem[]> {
  try {
    const response = await api.get("/purposes");
    return response.data || [];
  } catch (error) {
    console.error("Error fetching all purposes:", error);
    return [];
  }
}
