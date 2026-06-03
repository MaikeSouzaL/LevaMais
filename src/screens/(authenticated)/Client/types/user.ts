/**
 * User Types
 * Define todos os tipos relacionados ao usuário
 */

// Re-export canonical types from the models module
export type { User, UserType } from "../../../../types/models";

import type { User } from "../../../../types/models";

/**
 * Perfil do cliente
 */
export interface ClientProfile extends User {
  type: 'client';
  walletBalance: number;
  totalRides: number;
  averageRating?: number;
}

/**
 * Cidade
 */
export interface City {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
  active: boolean;
  source?: 'gps' | 'manual';
}

/**
 * Endereço favorito
 */
export interface FavoriteAddress {
  id: string;
  userId: string;
  name: string; // Ex: "Casa", "Trabalho", "Academia"
  icon: string; // Ex: "home", "work", "fitness-center"
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Configurações do usuário
 */
export interface UserSettings {
  notificationsEnabled: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: 'pt-BR' | 'en-US' | 'es-ES';
  theme: 'light' | 'dark' | 'auto';
}

/**
 * Dados de atualização do perfil
 */
export interface UpdateProfileData {
  name?: string;
  phone?: string;
  city?: string;
  notificationsEnabled?: boolean;
}

/**
 * Dados de autenticação
 */
export interface AuthData {
  token: string;
  refreshToken?: string;
  user: User;
  expiresAt: string;
}

/**
 * Dados de login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Dados de registro
 */
export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  cpf?: string;
  city?: string;
}
