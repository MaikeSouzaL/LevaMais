// Tipos para a API
// Re-export canonical User type from models module
export type { User } from "./models";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  userType?: 'client' | 'driver' | 'admin';
  acceptedTerms?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleAuthData {
  googleId: string;
  email: string;
  name: string;
  profilePhoto?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
