import api from "./api";

export interface FavoriteAddress {
  _id: string;
  name: string;
  icon: string;
  formattedAddress?: string;
  street?: string;
  streetNumber?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  region?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface CreateFavoriteAddressRequest {
  name: string;
  icon?: string;
  formattedAddress?: string;
  street?: string;
  streetNumber?: string;
  address: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  region?: string;
  postalCode?: string;
  latitude: number;
  longitude: number;
}

export interface UpdateFavoriteAddressRequest {
  name?: string;
  icon?: string;
  formattedAddress?: string;
  street?: string;
  streetNumber?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  region?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

class FavoriteAddressService {
  // Listar favoritos
  async list(): Promise<FavoriteAddress[]> {
    try {
      const response = await api.get("/favorite-addresses");
      return response.data.favorites || [];
    } catch (error: any) {
      console.error("Erro ao listar favoritos:", error);
      throw error;
    }
  }

  // Adicionar favorito
  async create(data: CreateFavoriteAddressRequest): Promise<FavoriteAddress> {
    try {
      const response = await api.post("/favorite-addresses", data);
      return response.data.favorite;
    } catch (error: any) {
      console.error("Erro ao adicionar favorito:", error);
      throw error;
    }
  }

  // Atualizar favorito
  async update(
    favoriteId: string,
    data: UpdateFavoriteAddressRequest
  ): Promise<FavoriteAddress> {
    try {
      const response = await api.put(`/favorite-addresses/${favoriteId}`, data);
      return response.data.favorite;
    } catch (error: any) {
      console.error("Erro ao atualizar favorito:", error);
      throw error;
    }
  }

  // Deletar favorito
  async delete(favoriteId: string): Promise<void> {
    try {
      await api.delete(`/favorite-addresses/${favoriteId}`);
    } catch (error: any) {
      console.error("Erro ao deletar favorito:", error);
      throw error;
    }
  }
}

export default new FavoriteAddressService();
