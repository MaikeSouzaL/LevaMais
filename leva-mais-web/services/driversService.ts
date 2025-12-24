import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Criar instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  cpf?: string;
  userType: "driver";
  vehicleType?: "motorcycle" | "car" | "van" | "truck";
  vehicleInfo?: {
    plate: string;
    model: string;
    color: string;
    year: number;
  };
  profilePhoto?: string;
  isActive: boolean;
  acceptedTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriverLocation {
  _id: string;
  driverId: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: "offline" | "available" | "busy" | "on_ride";
  vehicleType: string;
  vehicle: {
    plate: string;
    model: string;
    color: string;
    year: number;
  };
  heading?: number;
  speed?: number;
  currentRideId?: string;
  lastUpdated: string;
  acceptingRides: boolean;
}

class DriversService {
  /**
   * Buscar todos os motoristas
   */
  async getAll(): Promise<Driver[]> {
    try {
      const response = await api.get("/auth/users", {
        params: { userType: "driver" },
      });

      return response.data.users || [];
    } catch (error) {
      console.error("Erro ao buscar motoristas:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao buscar motoristas"
        );
      }
      throw error;
    }
  }

  /**
   * Buscar motorista por ID
   */
  async getById(id: string): Promise<Driver> {
    try {
      const response = await api.get(`/auth/users/${id}`);

      return response.data.user;
    } catch (error) {
      console.error("Erro ao buscar motorista:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Motorista não encontrado"
        );
      }
      throw error;
    }
  }

  /**
   * Buscar localização dos motoristas
   */
  async getLocations(): Promise<DriverLocation[]> {
    try {
      const response = await api.get("/driver-location/all");

      return response.data.locations || [];
    } catch (error) {
      console.warn("Não foi possível buscar localizações:", error);
      // Retornar array vazio em caso de erro
      return [];
    }
  }

  /**
   * Atualizar status do motorista
   */
  async updateStatus(id: string, isActive: boolean): Promise<Driver> {
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
   * Deletar motorista
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/auth/users/${id}`);
    } catch (error) {
      console.error("Erro ao deletar motorista:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao deletar motorista"
        );
      }
      throw error;
    }
  }
}

export const driversService = new DriversService();
