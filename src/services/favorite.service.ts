import { apiPost, apiGet, apiDelete } from "./api";

export interface CreateFavoriteDTO {
  userId: string;
  label: string;
  icon: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface FavoriteLocation {
  id: string;
  userId: string;
  label: string;
  icon: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export const favoriteService = {
  create: async (data: CreateFavoriteDTO, token?: string) => {
    try {
      const response = await apiPost<FavoriteLocation>(
        "/favorites",
        data,
        token,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  listByUser: async (userId: string, token?: string) => {
    try {
      const response = await apiGet<FavoriteLocation[]>(
        `/favorites/user/${userId}`,
        token,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  listMe: async (token?: string) => {
    try {
      const response = await apiGet<FavoriteLocation[]>(`/favorites/me`, token);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: string, token?: string) => {
    try {
      await apiDelete(`/favorites/${id}`, token);
    } catch (error) {
      throw error;
    }
  },
};
