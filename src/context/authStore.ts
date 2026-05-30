import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import type { User } from "../types/models";

export type UserType = "client" | "driver" | "admin" | null | undefined;

/**
 * Auth store user shape. Extends the canonical User model with
 * backward-compatible Portuguese field aliases (populated from their
 * canonical English counterparts by normalizeUserData).
 *
 * Consumers should prefer the English fields; the PT aliases exist only
 * so existing call-sites don't break during migration.
 */
export interface UserData extends User {
  /** @deprecated use `name` */
  nome: string;
  /** @deprecated use `phone` */
  telefone: string;
  /** @deprecated use `city` */
  cidade: string;
  /** @deprecated use `profilePhoto` */
  fotoPerfil?: string;
  /** @deprecated use `acceptedTerms` */
  aceitouTermos: boolean;
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
  const resolvedCity = data.city || data.cidade || "";
  const resolvedPhone = data.phone || data.telefone || "";

  return {
    ...data,
    // Canonical English fields — prefer these in new code
    name: resolvedName,
    phone: resolvedPhone,
    city: resolvedCity,
    email: data.email?.trim().toLowerCase() || "",
    acceptedTerms: Boolean(data.acceptedTerms || data.aceitouTermos),
    // Backward-compat Portuguese aliases — populated from canonical fields
    nome: resolvedName,
    telefone: resolvedPhone,
    cidade: resolvedCity,
    aceitouTermos: Boolean(data.aceitouTermos || data.acceptedTerms),
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

      logout: () => {
        // Clear cached Google Sign-in session to enable picking other emails
        GoogleSignin.signOut().catch(() => {});
        
        set({
          isAuthenticated: false,
          userType: null,
          userData: null,
          token: null,
          walletBalance: 0,
        });
      },

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
