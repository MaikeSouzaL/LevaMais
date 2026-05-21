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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const res = await axios.get(`${API_URL}/auth/users?userType=client`, {
      headers: { "x-admin-key": ADMIN_API_KEY }
    });
    return res.data.users || [];
  },

  async updateStatus(id: string, isActive: boolean): Promise<any> {
    const res = await axios.patch(
      `${API_URL}/auth/users/${id}`,
      { isActive },
      { headers: { "x-admin-key": ADMIN_API_KEY } }
    );
    return res.data;
  },

  async delete(id: string): Promise<any> {
    const res = await axios.delete(`${API_URL}/auth/users/${id}`, {
      headers: { "x-admin-key": ADMIN_API_KEY }
    });
    return res.data;
  }
};
