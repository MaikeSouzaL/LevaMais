import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tipos
export type UserType = "client" | "driver" | "admin" | null | undefined;

export interface UserData {
  id: string;
  name: string;
  cidade: string;
  nome: string;
  email: string;
  telefone: string;
  fotoPerfil?: string;
  googleId?: string;
  aceitouTermos: boolean;
  expoPushToken?: string;
  vehicleType?: any;
  vehicleInfo?: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType;
  userData: UserData | null;
  token: string | null;
  walletBalance?: number;

  // Ações
  login: (userType: UserType, userData: UserData, token: string) => void;
  logout: () => void;
  updateUserData: (data: Partial<UserData>) => void;
  updateUserType: (userType: UserType) => void;
  creditWallet: (amount: number) => void;
}

// Criar a store com persistência
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userType: null,
      userData: null,
      token: null,
      walletBalance: 0,

      login: (userType, userData, token) =>
        set({ isAuthenticated: true, userType, userData, token }),

      logout: () =>
        set({
          isAuthenticated: false,
          userType: null,
          userData: null,
          token: null,
          walletBalance: 0,
        }),

      updateUserData: (data) =>
        set((state) => ({
          userData: state.userData ? { ...state.userData, ...data } : null,
        })),

      updateUserType: (userType) => set({ userType }),

      creditWallet: (amount) =>
        set((state) => ({
          walletBalance: (state.walletBalance || 0) + amount,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
