import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type RideDraftLocation = {
  formattedAddress: string;
  latitude: number;
  longitude: number;

  // extras úteis (opcionais)
  placeId?: string;
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  referencePoint?: string;
};

type RideDraftState = {
  pickup: RideDraftLocation | null;
  dropoff: RideDraftLocation | null;

  setPickup: (loc: RideDraftLocation | null) => void;
  setDropoff: (loc: RideDraftLocation | null) => void;
  clearDraft: () => void;
};

export const useRideDraftStore = create<RideDraftState>()(
  persist(
    (set) => ({
      pickup: null,
      dropoff: null,

      setPickup: (loc) => set({ pickup: loc }),
      setDropoff: (loc) => set({ dropoff: loc }),
      clearDraft: () => set({ pickup: null, dropoff: null }),
    }),
    {
      name: "@leva_mais:ride_draft",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        pickup: state.pickup,
        dropoff: state.dropoff,
      }),
    },
  ),
);
