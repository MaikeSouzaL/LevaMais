import { supabase } from "../lib/supabase";

export interface City {
  _id: string;
  name: string;
  state?: string;
  stateCode?: string;
  country?: string;
  isActive: boolean;
  center?: {
    latitude?: number;
    longitude?: number;
  };
  radiusKm?: number;
  defaultVehicleType?: "motorcycle" | "car" | "van" | "truck";
}

export type CityPayload = {
  name: string;
  state?: string;
  stateCode?: string;
  isActive?: boolean;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
  defaultVehicleType?: "motorcycle" | "car" | "van" | "truck";
};

export const citiesService = {
  async list(includeInactive = true): Promise<City[]> {
    try {
      let query = supabase.from("cities").select("*");
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }

      return (data || []).map((row: any) => ({
        _id: row.id,
        name: row.name,
        state: row.state || undefined,
        stateCode: row.state_code || undefined,
        country: row.country || "Brasil",
        isActive: row.is_active !== false,
        center: row.center || {
          latitude: Number(row.latitude || 0),
          longitude: Number(row.longitude || 0),
        },
        radiusKm: Number(row.radius_km || 0),
        defaultVehicleType: row.default_vehicle_type || undefined,
      }));
    } catch (error) {
      console.error("Error listing cities:", error);
      return [];
    }
  },

  async create(payload: CityPayload): Promise<City> {
    const { data, error } = await supabase
      .from("cities")
      .insert({
        name: payload.name,
        state: payload.state,
        state_code: payload.stateCode,
        is_active: payload.isActive !== false,
        center: payload.center,
        radius_km: payload.radiusKm,
        default_vehicle_type: payload.defaultVehicleType,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      _id: data.id,
      name: data.name,
      state: data.state || undefined,
      stateCode: data.state_code || undefined,
      country: data.country || "Brasil",
      isActive: data.is_active,
      center: data.center || {
        latitude: Number(data.latitude || 0),
        longitude: Number(data.longitude || 0),
      },
      radiusKm: Number(data.radius_km || 0),
      defaultVehicleType: data.default_vehicle_type || undefined,
    };
  },

  async update(id: string, payload: CityPayload): Promise<City> {
    const { data, error } = await supabase
      .from("cities")
      .update({
        name: payload.name,
        state: payload.state,
        state_code: payload.stateCode,
        is_active: payload.isActive,
        center: payload.center,
        radius_km: payload.radiusKm,
        default_vehicle_type: payload.defaultVehicleType,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      _id: data.id,
      name: data.name,
      state: data.state || undefined,
      stateCode: data.state_code || undefined,
      country: data.country || "Brasil",
      isActive: data.is_active,
      center: data.center || {
        latitude: Number(data.latitude || 0),
        longitude: Number(data.longitude || 0),
      },
      radiusKm: Number(data.radius_km || 0),
      defaultVehicleType: data.default_vehicle_type || undefined,
    };
  },

  async deactivate(id: string): Promise<City> {
    const { data, error } = await supabase
      .from("cities")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      _id: data.id,
      name: data.name,
      state: data.state || undefined,
      stateCode: data.state_code || undefined,
      country: data.country || "Brasil",
      isActive: data.is_active,
      center: data.center || {
        latitude: Number(data.latitude || 0),
        longitude: Number(data.longitude || 0),
      },
      radiusKm: Number(data.radius_km || 0),
      defaultVehicleType: data.default_vehicle_type || undefined,
    };
  },
};
