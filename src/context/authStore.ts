import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

export type UserType = "client" | "driver" | "admin" | null | undefined;

export interface UserData {
  id: string;
  name: string;
  nome: string;
  email: string;
  telefone: string;
  phone?: string;
  cidade: string;
  city?: string;
  fotoPerfil?: string;
  profilePhoto?: string;
  googleId?: string;
  aceitouTermos: boolean;
  acceptedTerms?: boolean;
  tourSeen?: boolean;
  isActive?: boolean;
  expoPushToken?: string;
  vehicleType?: unknown;
  vehicleInfo?: unknown;
  driverStatus?: "none" | "pending" | "approved" | "rejected";
  enableMapAnimation?: boolean;
  driverPreferences?: {
    serviceTypes?: Array<"ride" | "delivery">;
    selectedVehicles?: Array<"motorcycle" | "car" | "van" | "truck">;
    searchRadiusKm?: number;
    autoAccept?: boolean;
  };
  // CPF/CNPJ & Company Details
  cpf?: string;
  cnpj?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  paymentMethods?: Array<any>;
  clientVerification?: {
    status?: "none" | "pending" | "approved" | "rejected";
    cpfStatus?: "unchecked" | "pending" | "manual_review" | "valid" | "invalid" | string;
    selfieStatus?: "none" | "pending" | "approved" | "rejected" | string;
    documents?: {
      selfie?: string;
      rgFront?: string;
      rgBack?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  } | null;
  mapTheme?: "light" | "dark" | string;
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
  const resolvedCity = data.cidade || data.city || "";
  const resolvedPhone = data.telefone || data.phone || "";

  return {
    ...data,
    name: resolvedName,
    nome: resolvedName,
    cidade: resolvedCity,
    city: resolvedCity,
    telefone: resolvedPhone,
    phone: resolvedPhone,
    email: data.email?.trim().toLowerCase() || "",
    aceitouTermos: Boolean(data.aceitouTermos || data.acceptedTerms),
    acceptedTerms: Boolean(data.acceptedTerms || data.aceitouTermos),
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
