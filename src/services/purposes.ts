import api from "./api";

export type VehicleType = "motorcycle" | "car" | "van" | "truck";

export interface PurposeItem {
  id: string;
  vehicleType: VehicleType;
  title: string;
  subtitle: string;
  serviceMode?: "ride" | "delivery" | "frete";
  icon: string; // Nome do icone Lucide (sera convertido no app via iconMapper)
  badges?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// OBS: não usamos mais dados mockados. As finalidades devem vir do backend.
// Se o backend falhar, mostramos erro no app (quem chama decide como lidar).
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
