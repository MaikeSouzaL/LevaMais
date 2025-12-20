export type VehicleType = "motorcycle" | "car" | "van" | "truck";

export interface PurposeItem {
  id: string; // slug-like id
  title: string;
  subtitle: string;
  icon: string; // lucide icon name or custom string
  badges?: string[];
  isActive: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export type PurposesState = Record<VehicleType, PurposeItem[]>;
