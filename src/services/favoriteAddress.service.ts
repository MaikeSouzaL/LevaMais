import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_FAVORITES_KEY = "@LevaMais:favorite_addresses";

export interface FavoriteAddress {
  _id: string;
  id?: string;
  name: string;
  icon: string;
  formattedAddress?: string;
  street?: string;
  streetNumber?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  region?: string;
  postalCode?: string;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface CreateFavoriteAddressRequest {
  name: string;
  icon?: string;
  formattedAddress?: string;
  street?: string;
  streetNumber?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  region?: string;
  postalCode?: string;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  latitude: number;
  longitude: number;
}

export interface UpdateFavoriteAddressRequest {
  name?: string;
  icon?: string;
  formattedAddress?: string;
  street?: string;
  streetNumber?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  region?: string;
  postalCode?: string;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
}

class FavoriteAddressService {
  private async getLocal(): Promise<FavoriteAddress[]> {
    try {
      const data = await AsyncStorage.getItem(LOCAL_FAVORITES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveLocal(list: FavoriteAddress[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(list));
    } catch {}
  }

  async list(params?: { category?: "home" | "work" | "favorite" }): Promise<FavoriteAddress[]> {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("favorite_addresses")
        .select("*")
        .eq("user_id", userId);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          const local = await this.getLocal();
          return params?.category ? local.filter((x) => x.icon === params.category) : local;
        }
        throw error;
      }

      const mapped = (data || []).map((row: any) => ({
        _id: row.id,
        id: row.id,
        name: row.name,
        icon: row.icon,
        formattedAddress: row.formatted_address,
        street: row.street,
        streetNumber: row.street_number,
        address: row.address,
        neighborhood: row.neighborhood,
        city: row.city,
        state: row.state,
        region: row.region,
        postalCode: row.postal_code,
        details: row.details,
        contactName: row.contact_name,
        contactPhone: row.contact_phone,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        createdAt: row.created_at,
      }));

      return params?.category ? mapped.filter((x) => x.icon === params.category) : mapped;
    } catch (error: any) {
      if (error?.code !== "42P01" && error?.code !== "PGRST205" && !String(error?.message || "").includes("favorite_addresses")) {
        console.error("Erro ao listar favoritos:", error);
      }
      const local = await this.getLocal();
      return params?.category ? local.filter((x) => x.icon === params.category) : local;
    }
  }

  async create(data: CreateFavoriteAddressRequest): Promise<FavoriteAddress> {
    const userId = await requireUserId();
    const newFav: FavoriteAddress = {
      _id: Math.random().toString(36).substring(7),
      name: data.name,
      icon: data.icon || "favorite",
      formattedAddress: data.formattedAddress,
      street: data.street,
      streetNumber: data.streetNumber,
      address: data.address,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      region: data.region,
      postalCode: data.postalCode,
      details: data.details,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      latitude: data.latitude,
      longitude: data.longitude,
      createdAt: new Date().toISOString(),
    };

    try {
      const { data: inserted, error } = await supabase
        .from("favorite_addresses")
        .insert({
          user_id: userId,
          name: data.name,
          icon: data.icon || "favorite",
          formatted_address: data.formattedAddress,
          street: data.street,
          street_number: data.streetNumber,
          address: data.address,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          region: data.region,
          postal_code: data.postalCode,
          details: data.details,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          latitude: data.latitude,
          longitude: data.longitude,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          const local = await this.getLocal();
          local.push(newFav);
          await this.saveLocal(local);
          return newFav;
        }
        throw error;
      }

      return {
        ...newFav,
        _id: inserted.id,
        id: inserted.id,
        createdAt: inserted.created_at,
      };
    } catch (error: any) {
      if (error?.code !== "42P01" && error?.code !== "PGRST205" && !String(error?.message || "").includes("favorite_addresses")) {
        console.error("Erro ao adicionar favorito:", error);
      }
      const local = await this.getLocal();
      local.push(newFav);
      await this.saveLocal(local);
      return newFav;
    }
  }

  async update(favoriteId: string, data: UpdateFavoriteAddressRequest): Promise<FavoriteAddress> {
    try {
      const updates: any = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.icon !== undefined) updates.icon = data.icon;
      if (data.formattedAddress !== undefined) updates.formatted_address = data.formattedAddress;
      if (data.street !== undefined) updates.street = data.street;
      if (data.streetNumber !== undefined) updates.street_number = data.streetNumber;
      if (data.address !== undefined) updates.address = data.address;
      if (data.neighborhood !== undefined) updates.neighborhood = data.neighborhood;
      if (data.city !== undefined) updates.city = data.city;
      if (data.state !== undefined) updates.state = data.state;
      if (data.region !== undefined) updates.region = data.region;
      if (data.postalCode !== undefined) updates.postal_code = data.postalCode;
      if (data.details !== undefined) updates.details = data.details;
      if (data.contactName !== undefined) updates.contact_name = data.contactName;
      if (data.contactPhone !== undefined) updates.contact_phone = data.contactPhone;
      if (data.latitude !== undefined) updates.latitude = data.latitude;
      if (data.longitude !== undefined) updates.longitude = data.longitude;

      const { data: updated, error } = await supabase
        .from("favorite_addresses")
        .update(updates)
        .eq("id", favoriteId)
        .select()
        .single();

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          const local = await this.getLocal();
          const idx = local.findIndex((x) => x._id === favoriteId);
          if (idx !== -1) {
            local[idx] = { ...local[idx], ...data } as any;
            await this.saveLocal(local);
            return local[idx];
          }
        }
        throw error;
      }

      return {
        ...updated.id ? { _id: updated.id, id: updated.id } : { _id: favoriteId },
        name: updated.name,
        icon: updated.icon,
        formattedAddress: updated.formatted_address,
        street: updated.street,
        streetNumber: updated.street_number,
        address: updated.address,
        neighborhood: updated.neighborhood,
        city: updated.city,
        state: updated.state,
        region: updated.region,
        postalCode: updated.postal_code,
        details: updated.details,
        contactName: updated.contact_name,
        contactPhone: updated.contact_phone,
        latitude: Number(updated.latitude),
        longitude: Number(updated.longitude),
        createdAt: updated.created_at,
      };
    } catch (error: any) {
      if (error?.code !== "42P01" && error?.code !== "PGRST205" && !String(error?.message || "").includes("favorite_addresses")) {
        console.error("Erro ao atualizar favorito:", error);
      }
      const local = await this.getLocal();
      const idx = local.findIndex((x) => x._id === favoriteId);
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...data } as any;
        await this.saveLocal(local);
        return local[idx];
      }
      throw error;
    }
  }

  async delete(favoriteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("favorite_addresses")
        .delete()
        .eq("id", favoriteId);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          const local = await this.getLocal();
          const filtered = local.filter((x) => x._id !== favoriteId);
          await this.saveLocal(filtered);
          return;
        }
        throw error;
      }
    } catch (error: any) {
      if (error?.code !== "42P01" && error?.code !== "PGRST205" && !String(error?.message || "").includes("favorite_addresses")) {
        console.error("Erro ao deletar favorito:", error);
      }
      const local = await this.getLocal();
      const filtered = local.filter((x) => x._id !== favoriteId);
      await this.saveLocal(filtered);
    }
  }
}

export default new FavoriteAddressService();
