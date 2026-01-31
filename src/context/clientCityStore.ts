import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ClientCity = {
  cityId: string;
  name: string;
  state: string;
  source: "gps" | "manual";
  updatedAt: number;
};

type ClientCityState = {
  city: ClientCity | null;
  setCity: (city: ClientCity) => void;
  clearCity: () => void;
};

export const useClientCityStore = create<ClientCityState>()(
  persist(
    (set) => ({
      city: null,
      setCity: (city) => set({ city }),
      clearCity: () => set({ city: null }),
    }),
    {
      name: "@leva_mais:client_city",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
