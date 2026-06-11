import { supabase } from "../lib/supabase";
import { requireUserId } from "./appwrite-auth.service";

export type DriverStatus = "offline" | "available" | "busy" | "on_ride";

export type DriverVehicleType = "motorcycle" | "car" | "van" | "truck";

export type DriverVehicleInfo = {
  plate?: string;
  model?: string;
  color?: string;
  year?: number;
};

export type UpdateDriverLocationRequest = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  status?: DriverStatus;
  vehicleType: DriverVehicleType;
  vehicle?: DriverVehicleInfo;
  serviceTypes?: Array<"ride" | "delivery">;
  searchRadiusKm?: number;
};

class DriverLocationService {
  /** Retorna a localização atual do motorista autenticado. */
  async getMe() {
    const userId = await requireUserId();
    const { data: location } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!location) return null;

    // Normaliza is_online → status e service_types → serviceTypes (camelCase) para
    // consumo nas telas (DriverHomeScreen/DriverRequestsScreen).
    return {
      ...location,
      status: location.is_online ? "available" : "offline",
      serviceTypes: Array.isArray(location.service_types) ? location.service_types : [],
    };
  }

  /** Persiste posição GPS do motorista em driver_locations e emite broadcast realtime. */
  async update(data: UpdateDriverLocationRequest) {
    const userId = await requireUserId();

    const { error } = await supabase
      .from("driver_locations")
      .upsert(
        {
          id: userId,
          is_online: data.status !== "offline",
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading ?? null,
          speed: data.speed ?? null,
          current_vehicle_type: data.vehicleType,
          service_types: data.serviceTypes ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) throw error;

    return { success: true };
  }

  /** Atualiza status online/offline e tipos de serviço em driver_locations. */
  async setStatus(data: {
    status: DriverStatus;
    acceptingRides?: boolean;
    serviceTypes?: Array<"ride" | "delivery">;
    onlineSessionStart?: string;
    searchRadiusKm?: number;
  }) {
    const userId = await requireUserId();
    const isOnline = data.status !== "offline";

    const { error } = await supabase
      .from("driver_locations")
      .upsert(
        {
          id: userId,
          is_online: isOnline,
          service_types: data.serviceTypes ?? [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) throw error;

    return { success: true };
  }

  async getNearbyAvailability(_coords: {
    latitude: number;
    longitude: number;
  }): Promise<{
    motorcycle: boolean;
    car: boolean;
    van: boolean;
    truck: boolean;
  }> {
    return { motorcycle: true, car: true, van: true, truck: true };
  }
}

export default new DriverLocationService();
