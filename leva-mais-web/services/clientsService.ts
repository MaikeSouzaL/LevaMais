import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL.endsWith("/") ? API_URL : `${API_URL}/`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    ...(ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}),
  },
});

// Garantir que caminhos com barra inicial não quebrem a resolução da subpasta /api no Axios
api.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("/")) {
    config.url = config.url.substring(1);
  }
  return config;
});

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  cpf?: string;
  userType: "client";
  profilePhoto?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  acceptedTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientStats {
  total: number;
  active: number;
  verified: number;
  newThisMonth: number;
}

class ClientsService {
  /**
   * Buscar todos os clientes
   */
  async getAll(): Promise<Client[]> {
    try {
      const response = await api.get("/auth/users", {
        params: { userType: "client" },
      });

      return response.data.users || [];
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao buscar clientes"
        );
      }
      throw error;
    }
  }

  /**
   * Buscar cliente por ID
   */
  async getById(id: string): Promise<Client> {
    try {
      const response = await api.get(`/auth/users/${id}`);

      return response.data.user;
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Cliente não encontrado"
        );
      }
      throw error;
    }
  }

  /**
   * Atualizar status do cliente
   */
  async updateStatus(id: string, isActive: boolean): Promise<Client> {
    try {
      const response = await api.patch(`/auth/users/${id}`, { isActive });

      return response.data.user;
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao atualizar status"
        );
      }
      throw error;
    }
  }

  /**
   * Deletar cliente
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/auth/users/${id}`);
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao deletar cliente"
        );
      }
      throw error;
    }
  }

  /**
   * Calcular estatísticas dos clientes
   */
  calculateStats(clients: Client[]): ClientStats {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: clients.length,
      active: clients.filter((c) => c.isActive).length,
      verified: clients.filter((c) => c.emailVerified || c.phoneVerified)
        .length,
      newThisMonth: clients.filter(
        (c) => new Date(c.createdAt) >= firstDayOfMonth
      ).length,
    };
  }
}

export const clientsService = new ClientsService();

