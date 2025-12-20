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
  vehicleType?: VehicleType;
  _id?: string; // MongoDB ID
}

export type PurposesState = Record<VehicleType, PurposeItem[]>;

// Lucide Icon Component Type
export interface LucideIconProps {
  size?: number | string;
  className?: string;
  strokeWidth?: number;
  color?: string;
}

export type LucideIcon = React.ComponentType<LucideIconProps>;
