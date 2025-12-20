import { PurposeItem, VehicleType } from "@/types";

const API_URL = "http://localhost:3000/api/purposes";

export const purposesService = {
  getAll: async (vehicleType?: VehicleType): Promise<PurposeItem[]> => {
    try {
      const url = vehicleType ? `${API_URL}?vehicleType=${vehicleType}` : API_URL;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch purposes");
      return await res.json();
    } catch (error) {
      console.error("API Error:", error);
      return [];
    }
  },

  create: async (data: Omit<PurposeItem, "createdAt" | "updatedAt"> & { vehicleType: VehicleType }): Promise<PurposeItem> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create purpose");
    }
    return await res.json();
  },

  update: async (id: string, vehicleType: VehicleType, updates: Partial<PurposeItem>): Promise<PurposeItem> => {
    // Note: The backend route expects the ID param. 
    // We are passing vehicleType in body to ensure uniqueness check or correct targeting if backend needs it.
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates, vehicleType }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to update purpose");
    }
    return await res.json();
  },

  delete: async (id: string, vehicleType: VehicleType): Promise<void> => {
    const res = await fetch(`${API_URL}/${id}?vehicleType=${vehicleType}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to delete purpose");
    }
  },

  toggleActive: async (id: string, vehicleType: VehicleType): Promise<PurposeItem> => {
    const res = await fetch(`${API_URL}/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleType }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to toggle status");
    }
    return await res.json();
  },
  
  // Helper to sync seed data if DB is empty (optional utility)
  seedDatabase: async (data: Record<string, any[]>) => {
    // This would be a batch operation, implement if needed
    console.log("Seeding not implemented in frontend service yet");
  }
};
