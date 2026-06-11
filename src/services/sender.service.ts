import api from "./api";

export interface SenderAddress {
  _id: string;
  userId: string;
  address: string;
  formattedAddress?: string;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface SaveSenderRequest {
  address: string;
  formattedAddress?: string;
  details?: string;
  contactName?: string;
  contactPhone?: string;
  latitude: number;
  longitude: number;
}

class SenderService {
  async get(): Promise<SenderAddress | null> {
    try {
      const response = await api.get("/senders");
      return response.data.sender || null;
    } catch (error: any) {
      console.error("Erro ao buscar remetente:", error);
      return null;
    }
  }

  async save(data: SaveSenderRequest): Promise<SenderAddress> {
    try {
      const response = await api.post("/senders", data);
      return response.data.sender;
    } catch (error: any) {
      console.error("Erro ao salvar remetente:", {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      throw error;
    }
  }
}

export default new SenderService();
