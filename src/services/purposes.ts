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

/**
 * Busca tipos de serviço por tipo de veículo
 * @param vehicleType Tipo de veículo (motorcycle, car, van, truck)
 * @returns Lista de purposes ativos para o veículo
 */
export async function getPurposesByVehicleType(
  vehicleType: VehicleType
): Promise<PurposeItem[]> {
  try {
    const response = await api.get(
      `/purposes?vehicleType=${vehicleType}&isActive=true`
    );
    return response.data || [];
  } catch (error) {
    console.error("Error fetching purposes:", error);
    return [];
  }
}

/**
 * Busca um purpose específico por ID
 * @param id ID do purpose
 * @returns Purpose encontrado ou null
 */
export async function getPurposeById(id: string): Promise<PurposeItem | null> {
  try {
    const response = await api.get(`/purposes/${id}`);
    return response.data || null;
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
