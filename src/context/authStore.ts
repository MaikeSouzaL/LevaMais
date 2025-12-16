import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipos
export type UserType = "client" | "driver" | "admin" | null | undefined;

export interface UserData {
  id: string;
  cidade: string;
  nome: string;
  email: string;
  telefone: string;
  fotoPerfil?: string;
  googleId?: string;
  aceitouTermos: boolean;
  expoPushToken?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType;
  userData: UserData | null;
  token: string | null;

  // Ações
  login: (userType: UserType, userData: UserData, token: string) => void;
  logout: () => void;
  updateUserData: (data: Partial<UserData>) => void;
  updateUserType: (userType: UserType) => void;
}

// Criar a store com persistência
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      userData: null,
      token: null,

      login: (userType, userData, token) =>
        set({ isAuthenticated: true, userType, userData, token }),

      logout: () =>
        set({
          isAuthenticated: false,
          userType: null,
          userData: null,
          token: null,
        }),

      updateUserData: (data) =>
        set((state) => ({
          userData: state.userData ? { ...state.userData, ...data } : null,
        })),

      updateUserType: (userType) => set({ userType }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
