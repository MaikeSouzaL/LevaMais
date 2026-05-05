import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserType = "client" | "driver" | "admin" | null | undefined;

export interface UserData {
  id: string;
  name: string;
  nome: string;
  cidade: string;
  email: string;
  telefone: string;
  fotoPerfil?: string;
  googleId?: string;
  aceitouTermos: boolean;
  expoPushToken?: string;
  vehicleType?: unknown;
  vehicleInfo?: unknown;
}

export interface AuthState {
  hasHydrated: boolean;
  isAuthenticated: boolean;
  userType: UserType;
  userData: UserData | null;
  token: string | null;
  walletBalance: number;

  login: (userType: UserType, userData: UserData, token: string) => void;
  logout: () => void;
  updateUserData: (data: Partial<UserData>) => void;
  updateUserType: (userType: UserType) => void;
  setToken: (token: string | null) => void;
  setHasHydrated: (value: boolean) => void;
  creditWallet: (amount: number) => void;
  resetWallet: () => void;
}

function normalizeUserData(data: UserData): UserData {
  const resolvedName = data.name?.trim() || data.nome?.trim() || "";

  return {
    ...data,
    name: resolvedName,
    nome: resolvedName,
    cidade: data.cidade || "",
    telefone: data.telefone || "",
    email: data.email?.trim().toLowerCase() || "",
    aceitouTermos: Boolean(data.aceitouTermos),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      isAuthenticated: false,
      userType: null,
      userData: null,
      token: null,
      walletBalance: 0,

      login: (userType, userData, token) =>
        set({
          isAuthenticated: true,
          userType: userType ?? null,
          userData: normalizeUserData(userData),
          token: token ?? null,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          userType: null,
          userData: null,
          token: null,
          walletBalance: 0,
        }),

      updateUserData: (data) =>
        set((state) => {
          if (!state.userData) return { userData: null };
          return { userData: normalizeUserData({ ...state.userData, ...data }) };
        }),

      updateUserType: (userType) => set({ userType }),
      setToken: (token) => set({ token }),
      setHasHydrated: (value) => set({ hasHydrated: value }),

      creditWallet: (amount) =>
        set((state) => ({
          walletBalance: Math.max(0, (state.walletBalance || 0) + amount),
        })),

      resetWallet: () => set({ walletBalance: 0 }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userType: state.userType,
        userData: state.userData,
        token: state.token,
        walletBalance: state.walletBalance,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
