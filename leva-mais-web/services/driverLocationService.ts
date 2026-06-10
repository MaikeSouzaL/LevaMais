import { supabase } from "../lib/supabase";

export interface DriverLocation {
  _id: string;
  driverId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  status?: "available" | "busy" | "on_ride" | "offline" | string;
  vehicleType?: "motorcycle" | "car" | "van" | "truck" | string;
  speed?: number;
  heading?: number;
  location?: {
    type?: string;
    coordinates?: [number, number];
  };
  updatedAt?: string;
}

export const driverLocationService = {
  async getAll(): Promise<DriverLocation[]> {
    try {
      const { data, error } = await supabase
        .from("driver_locations")
        .select(`
          *,
          profiles(*)
        `);

      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }

      return (data || []).map((row: any) => {
        const profile = row.profiles?.[0] || row.profiles || {};
        return {
          _id: row.id,
          driverId: {
            _id: row.id,
            name: profile.full_name || "Motorista Leva Mais",
            email: profile.email || "",
          },
          status: row.status || "available",
          vehicleType: row.vehicle_type || "car",
          speed: Number(row.speed || 0),
          heading: Number(row.heading || 0),
          location: {
            type: "Point",
            coordinates: [Number(row.longitude || 0), Number(row.latitude || 0)],
          },
          updatedAt: row.updated_at,
        };
      });
    } catch (error) {
      console.error("Error fetching driver locations:", error);
      return [];
    }
  },
};
