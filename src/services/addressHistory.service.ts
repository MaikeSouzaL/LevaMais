import api from "./api";

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
  async list(params?: { context?: AddressHistoryContext; limit?: number }): Promise<AddressHistoryEntry[]> {
    try {
      const response = await api.get("/address-history", { params });
      return response.data.history || [];
    } catch (error) {
      console.error("Erro ao listar historico de enderecos:", error);
      return [];
    }
  }

  async create(data: CreateAddressHistoryRequest): Promise<AddressHistoryEntry | null> {
    try {
      const response = await api.post("/address-history", data);
      return response.data.history || null;
    } catch (error) {
      console.error("Erro ao salvar historico de endereco:", error);
      return null;
    }
  }
}

export default new AddressHistoryService();
