import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import websocketService from "./websocket.service";

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
  async getMe() {
    const userId = await requireUserId();
    const { data: driver } = await supabase
      .from("driver_details")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    return driver;
  }

  async update(data: UpdateDriverLocationRequest) {
    const userId = await requireUserId();
    
    websocketService.emit("driver-location-updated", {
      driverId: userId,
      latitude: data.latitude,
      longitude: data.longitude,
      heading: data.heading,
      speed: data.speed,
      status: data.status,
      vehicleType: data.vehicleType,
    });

    return { success: true };
  }

  async setStatus(data: {
    status: DriverStatus;
    acceptingRides?: boolean;
    serviceTypes?: Array<"ride" | "delivery">;
    onlineSessionStart?: string;
    searchRadiusKm?: number;
  }) {
    const userId = await requireUserId();
    
    websocketService.emit("driver-status-changed", {
      driverId: userId,
      status: data.status,
      acceptingRides: data.acceptingRides,
      serviceTypes: data.serviceTypes,
    });

    return { success: true };
  }

  async getNearbyAvailability(coords: { latitude: number; longitude: number }): Promise<{ motorcycle: boolean; car: boolean; van: boolean; truck: boolean }> {
    return { motorcycle: true, car: true, van: true, truck: true };
  }
}

export default new DriverLocationService();
