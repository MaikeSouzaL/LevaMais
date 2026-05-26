import axios from "axios";

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  userType?: "client";
  isActive: boolean;
  createdAt: string;
  city?: string;
  emailVerified?: boolean;
  clientVerification?: {
    status?: string;
    cpfStatus?: string;
    selfieStatus?: string;
    documents?: {
      selfie?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  lastLocation?: {
    type: "Point";
    coordinates: [number, number];
    updatedAt: string;
  };
}

const _RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const API_URL = _RAW_API_URL.replace("localhost", "127.0.0.1");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const clientsService = {
  async getAll(): Promise<Client[]> {
    try {
      const res = await axios.get(`${API_URL}/auth/users?userType=client`, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });
      return res.data?.users || [];
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  },

  async updateStatus(id: string, isActive: boolean): Promise<unknown> {
    const res = await axios.patch(
      `${API_URL}/auth/users/${id}`,
      { isActive },
      { headers: { "x-admin-key": ADMIN_API_KEY } }
    );
    return res.data;
  },

  async delete(id: string): Promise<unknown> {
    const res = await axios.delete(`${API_URL}/auth/users/${id}`, {
      headers: { "x-admin-key": ADMIN_API_KEY }
    });
    return res.data;
  }
};
