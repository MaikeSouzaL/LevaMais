import axios from "axios";
import { PurposeItem, VehicleType } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Criar instância do axios
const api = axios.create({
  baseURL: `${API_URL}/purposes`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const purposesService = {
  getAll: async (vehicleType?: VehicleType): Promise<PurposeItem[]> => {
    try {
      const response = await api.get("/", {
        params: vehicleType ? { vehicleType } : undefined,
      });
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  create: async (
    data: Omit<PurposeItem, "createdAt" | "updatedAt"> & {
      vehicleType: VehicleType;
    }
  ): Promise<PurposeItem> => {
    try {
      const response = await api.post("/", data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to create purpose"
        );
      }
      throw error;
    }
  },

  update: async (
    id: string,
    vehicleType: VehicleType,
    updates: Partial<PurposeItem>
  ): Promise<PurposeItem> => {
    try {
      const response = await api.put(`/${id}`, { ...updates, vehicleType });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to update purpose"
        );
      }
      throw error;
    }
  },

  delete: async (id: string, vehicleType: VehicleType): Promise<void> => {
    try {
      await api.delete(`/${id}`, {
        params: { vehicleType },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to delete purpose"
        );
      }
      throw error;
    }
  },

  deleteBulk: async (
    vehicleType: VehicleType,
    ids: string[]
  ): Promise<number> => {
    try {
      const response = await api.post("/bulk-delete", {
        items: ids.map((id) => ({ id, vehicleType })),
      });
      return response.data.deletedCount || 0;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to bulk delete"
        );
      }
      throw error;
    }
  },

  deleteAllByVehicle: async (vehicleType: VehicleType): Promise<number> => {
    try {
      const response = await api.post("/bulk-delete", {
        deleteAll: true,
        vehicleType,
      });
      return response.data.deletedCount || 0;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to delete all by vehicle"
        );
      }
      throw error;
    }
  },

  toggleActive: async (
    id: string,
    vehicleType: VehicleType
  ): Promise<PurposeItem> => {
    try {
      const response = await api.patch(`/${id}/toggle`, { vehicleType });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Failed to toggle status"
        );
      }
      throw error;
    }
  },

  // Helper to sync seed data if DB is empty (optional utility)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seedDatabase: async (_data: Record<string, unknown[]>) => {
    // This would be a batch operation, implement if needed
    console.log("Seeding not implemented in frontend service yet");
  },
};
