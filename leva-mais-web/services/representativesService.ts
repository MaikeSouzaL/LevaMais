import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Representative {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  active: boolean;
  bankInfo?: {
    bank: string;
    agency: string;
    account: string;
    pixKey: string;
  };
  createdAt?: string;
}

export const representativesService = {
  async getAll(): Promise<Representative[]> {
    try {
      // Por enquanto, vou simular uma rota ou você precisa criar a rota no backend
      // Vou assumir que vamos criar a rota /representatives no backend em breve
      // Se não existir, vai dar 404, mas a estrutura do front fica pronta.
      const res = await api.get("/representatives");
      return res.data;
    } catch (error) {
      console.error("Error fetching representatives", error);
      return [];
    }
  },

  async create(data: Omit<Representative, "_id">): Promise<Representative> {
    const res = await api.post("/representatives", data);
    return res.data;
  },

  async update(id: string, data: Partial<Representative>): Promise<Representative> {
    const res = await api.put(`/representatives/${id}`, data);
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/representatives/${id}`);
  }
};
