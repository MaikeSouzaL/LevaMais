// Tipos para a API

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

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  userType: 'client' | 'driver' | 'admin';
  googleId?: string;
  profilePhoto?: string;
  acceptedTerms: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

