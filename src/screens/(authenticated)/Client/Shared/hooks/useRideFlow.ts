/**
 * useRideFlow - Hook para gerenciar fluxo de solicitação de corrida
 * Extrai lógica de navegação e estados do HomeScreen
 */

import { useState } from 'react';
import { useRideDraftStore } from '@/context/rideDraftStore';
import type { VehicleType, ServiceMode } from '../../types';

export interface PickupDropoff {
  formattedAddress?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export function useRideFlow() {
  const [serviceMode, setServiceMode] = useState<ServiceMode | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] =
    useState<VehicleType | null>(null);
  const [selectedPurposeId, setSelectedPurposeId] = useState<string | null>(
    null
  );

  const [pickupSelection, setPickupSelection] = useState<PickupDropoff | null>(
    null
  );
  const [dropoffSelection, setDropoffSelection] =
    useState<PickupDropoff | null>(null);

  const [priceQuote, setPriceQuote] = useState<any>(null);
  const [priceQuoteLoading, setPriceQuoteLoading] = useState(false);

  // Zustand draft store
  const draftPickup = useRideDraftStore((s) => s.pickup);
  const draftDropoff = useRideDraftStore((s) => s.dropoff);
  const setDraftPickup = useRideDraftStore((s) => s.setPickup);
  const setDraftDropoff = useRideDraftStore((s) => s.setDropoff);

  // Resetar fluxo
  const resetFlow = () => {
    setServiceMode(null);
    setSelectedVehicleType(null);
    setSelectedPurposeId(null);
    setPickupSelection(null);
    setDropoffSelection(null);
    setPriceQuote(null);
    setPriceQuoteLoading(false);
  };

  // Preparar pickup e dropoff para navegação
  const prepareLocations = (
    currentAddress: string,
    currentLat?: number,
    currentLng?: number
  ) => {
    const pickup =
      currentLat != null && currentLng != null
        ? {
            formattedAddress: currentAddress,
            latitude: currentLat,
            longitude: currentLng,
          }
        : draftPickup;

    return { pickup };
  };

  return {
    // Estados
    serviceMode,
    selectedVehicleType,
    selectedPurposeId,
    pickupSelection,
    dropoffSelection,
    priceQuote,
    priceQuoteLoading,
    draftPickup,
    draftDropoff,

    // Setters
    setServiceMode,
    setSelectedVehicleType,
    setSelectedPurposeId,
    setPickupSelection,
    setDropoffSelection,
    setPriceQuote,
    setPriceQuoteLoading,
    setDraftPickup,
    setDraftDropoff,

    // Helpers
    resetFlow,
    prepareLocations,
  };
}
