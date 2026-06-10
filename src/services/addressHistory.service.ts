import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_HISTORY_KEY = "@LevaMais:address_history";

export type AddressHistoryContext = "sender" | "receiver" | "general";
export type AddressHistorySource = "search" | "favorite" | "manual" | "ride";

export interface AddressHistoryEntry {
  _id: string;
  id?: string;
  context: AddressHistoryContext;
  name?: string;
  address: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  source?: AddressHistorySource;
  lastUsedAt?: string;
  useCount?: number;
}

export interface CreateAddressHistoryRequest {
  context?: AddressHistoryContext;
  name?: string;
  address: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  source?: AddressHistorySource;
}

class AddressHistoryService {
  private async getLocal(): Promise<AddressHistoryEntry[]> {
    try {
      const data = await AsyncStorage.getItem(LOCAL_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async saveLocal(list: AddressHistoryEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list));
    } catch {}
  }

  async list(params?: { context?: AddressHistoryContext; limit?: number }): Promise<AddressHistoryEntry[]> {
    try {
      const userId = await requireUserId();
      let query = supabase
        .from("address_history")
        .select("*")
        .eq("user_id", userId);

      if (params?.context) {
        query = query.eq("context", params.context);
      }
      
      const limit = params?.limit || 20;
      query = query.order("last_used_at", { ascending: false }).range(0, limit - 1);

      const { data, error } = await query;

      if (error) {
        if (error.code === "42P01") {
          const local = await this.getLocal();
          let filtered = local;
          if (params?.context) {
            filtered = filtered.filter((x) => x.context === params.context);
          }
          return filtered.slice(0, limit);
        }
        throw error;
      }

      return (data || []).map((row: any) => ({
        _id: row.id,
        id: row.id,
        context: row.context as AddressHistoryContext,
        name: row.name,
        address: row.address,
        formattedAddress: row.formatted_address,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        details: row.details,
        contactName: row.contact_name,
        contactPhone: row.contact_phone,
        source: row.source as AddressHistorySource,
        lastUsedAt: row.last_used_at,
        useCount: row.use_count,
      }));
    } catch (error) {
      console.error("Erro ao listar historico de enderecos:", error);
      const local = await this.getLocal();
      let filtered = local;
      if (params?.context) {
        filtered = filtered.filter((x) => x.context === params.context);
      }
      return filtered.slice(0, params?.limit || 20);
    }
  }

  async create(data: CreateAddressHistoryRequest): Promise<AddressHistoryEntry | null> {
    const userId = await requireUserId();
    const newEntry: AddressHistoryEntry = {
      _id: Math.random().toString(36).substring(7),
      context: data.context || "general",
      name: data.name,
      address: data.address,
      formattedAddress: data.formattedAddress,
      latitude: data.latitude,
      longitude: data.longitude,
      details: data.details,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      source: data.source || "search",
      lastUsedAt: new Date().toISOString(),
      useCount: 1,
    };

    try {
      const { data: inserted, error } = await supabase
        .from("address_history")
        .insert({
          user_id: userId,
          context: data.context || "general",
          name: data.name,
          address: data.address,
          formatted_address: data.formattedAddress,
          latitude: data.latitude,
          longitude: data.longitude,
          details: data.details,
          contact_name: data.contactName,
          contact_phone: data.contactPhone,
          source: data.source || "search",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42P01") {
          const local = await this.getLocal();
          local.unshift(newEntry);
          await this.saveLocal(local.slice(0, 100));
          return newEntry;
        }
        throw error;
      }

      return {
        ...newEntry,
        _id: inserted.id,
        id: inserted.id,
        lastUsedAt: inserted.last_used_at,
        useCount: inserted.use_count,
      };
    } catch (error) {
      console.error("Erro ao salvar historico de endereco:", error);
      const local = await this.getLocal();
      local.unshift(newEntry);
      await this.saveLocal(local.slice(0, 100));
      return newEntry;
    }
  }
}

export default new AddressHistoryService();
