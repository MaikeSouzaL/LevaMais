import axios from "axios";

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  userType?: "driver";
  isActive: boolean;
  createdAt: string;
  city?: string;
  driverStatus?: string;
  driverDocuments?: {
    cnhFront?: string;
    cnhBack?: string;
    selfie?: string;
    cnhFrontStatus?: string;
    cnhBackStatus?: string;
    selfieStatus?: string;
    rejectionReason?: string;
    submittedAt?: string;
  };
  vehicles?: Array<{
    _id?: string;
    type?: string;
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
    status?: string;
    documents?: {
      crlvFront?: string;
      crlvBack?: string;
      vehiclePhoto?: string;
    };
  }>;
  bankAccount?: {
    bank?: string;
    agency?: string;
    account?: string;
    accountType?: string;
    pixKey?: string;
  };
}

const _RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const API_URL = _RAW_API_URL.replace("localhost", "127.0.0.1");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const driversService = {
  async getAll(): Promise<Driver[]> {
    try {
      const res = await axios.get(`${API_URL}/auth/users?userType=driver`, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });
      return res.data?.users || [];
    } catch (error) {
      console.error("Error fetching drivers:", error);
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
