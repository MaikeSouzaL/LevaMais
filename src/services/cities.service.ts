import api from "./api";

export type City = {
  _id: string;
  name: string;
  state: string;
  isActive?: boolean;
};

async function list(params?: { isActive?: boolean; state?: string }) {
  const res = await api.get<City[]>("/cities", { params });
  return res.data || [];
}

export default { list };
