import purposeService, { Purpose } from "./purpose.service";

export type VehicleType = "motorcycle" | "car" | "van" | "truck";

export interface PurposeItem {
  id: string;
  vehicleType: VehicleType;
  title: string;
  subtitle: string;
  serviceMode?: "ride" | "delivery" | "frete";
  icon: string;
  badges?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function mapToPurposeItem(p: Purpose): PurposeItem {
  return {
    id: p.id,
    vehicleType: p.vehicleType as VehicleType,
    title: p.title,
    subtitle: p.subtitle,
    serviceMode: p.serviceMode,
    icon: p.icon,
    badges: p.badges,
    isActive: p.isActive,
  };
}

export async function getPurposesByVehicleType(
  vehicleType: VehicleType,
): Promise<PurposeItem[]> {
  try {
    const list = await purposeService.getByVehicle(vehicleType);
    return list.map(mapToPurposeItem);
  } catch (error) {
    console.error("Error fetching purposes:", error);
    return [];
  }
}

export async function getPurposeById(id: string): Promise<PurposeItem | null> {
  try {
    const list = await purposeService.getAll();
    const found = list.find((p) => p.id === id);
    return found ? mapToPurposeItem(found) : null;
  } catch (error) {
    console.error("Error fetching purpose:", error);
    return null;
  }
}

export async function getAllPurposes(): Promise<PurposeItem[]> {
  try {
    const list = await purposeService.getAll();
    return list.map(mapToPurposeItem);
  } catch (error) {
    console.error("Error fetching all purposes:", error);
    return [];
  }
}
