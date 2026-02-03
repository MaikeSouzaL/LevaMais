/**
 * useDriverSearch - Hook para gerenciar busca de motorista
 * Extrai lógica de WebSocket e busca de motorista do HomeScreen
 */

import { useState, useEffect, useRef } from 'react';
import webSocketService from '@/services/websocket.service';
import Toast from 'react-native-toast-message';

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  rating: number;
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plate: string;
  };
}

export interface SearchingState {
  visible: boolean;
  title: string;
  price: string;
  eta: string;
  rideId?: string;
  secondsLeft?: number;
}

export interface DriverFoundState {
  found: boolean;
  info: DriverInfo | null;
  etaText?: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface CancelNotice {
  visible: boolean;
  reason?: string;
}

export function useDriverSearch(rideId?: string) {
  const [searchingState, setSearchingState] = useState<SearchingState>({
    visible: false,
    title: '',
    price: '',
    eta: '',
    secondsLeft: undefined,
  });

  const [driverFoundState, setDriverFoundState] = useState<DriverFoundState>({
    found: false,
    info: null,
    location: null,
  });

  const [cancelNotice, setCancelNotice] = useState<CancelNotice>({
    visible: false,
  });

  const driverFoundRef = useRef<any>(null);

  // Iniciar busca
  const startSearch = (data: {
    title: string;
    price: string;
    eta: string;
    rideId: string;
    secondsLeft?: number;
  }) => {
    setSearchingState({
      visible: true,
      ...data,
      secondsLeft: data.secondsLeft || 30,
    });
  };

  // Parar busca
  const stopSearch = () => {
    setSearchingState((prev) => ({ ...prev, visible: false }));
  };

  // Resetar estado do motorista
  const resetDriverState = () => {
    setDriverFoundState({
      found: false,
      info: null,
      location: null,
    });
  };

  // WebSocket: Motorista encontrado
  useEffect(() => {
    let mounted = true;

    const currentRideId = searchingState.rideId || rideId;

    if (!searchingState.visible || !currentRideId) {
      return;
    }

    const onDriverFound = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== currentRideId) return;

      setSearchingState((prev) => ({ ...prev, visible: false }));

      const etaText =
        payload?.eta?.text ||
        (typeof payload?.eta === 'string' ? payload.eta : undefined);

      setDriverFoundState({
        found: true,
        info: payload?.driver || null,
        etaText,
        location: null,
      });

      // Abrir sheet de motorista encontrado
      setTimeout(() => {
        driverFoundRef.current?.snapToIndex?.(0);
      }, 150);
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== currentRideId) return;

      setSearchingState((prev) => ({ ...prev, visible: false }));
      resetDriverState();

      try {
        driverFoundRef.current?.close?.();
      } catch {}

      const cancelledBy = payload?.cancelledBy;
      const reason = payload?.reason;

      if (cancelledBy === 'driver') {
        setCancelNotice({
          visible: true,
          reason: reason ? String(reason) : undefined,
        });

        // Auto-fechar após 6 segundos
        setTimeout(() => {
          setCancelNotice({ visible: false });
        }, 6000);
      }

      Toast.show({
        type: 'error',
        text1:
          cancelledBy === 'driver'
            ? 'O motorista cancelou'
            : 'Corrida cancelada',
        text2: reason ? String(reason) : 'Tente novamente.',
      });
    };

    const onDriverLocationUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== currentRideId) return;

      const loc = payload?.location;
      if (loc?.latitude && loc?.longitude) {
        setDriverFoundState((prev) => ({
          ...prev,
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
          },
        }));
      }
    };

    // Conectar WebSocket
    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onDriverFound(onDriverFound);
        webSocketService.onRideCancelled(onRideCancelled);
        webSocketService.onDriverLocationUpdated(onDriverLocationUpdated);
        webSocketService.waitingDriver(currentRideId);
      } catch (e) {
        console.log('Falha ao conectar WebSocket', e);
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off('driver-found', onDriverFound);
      webSocketService.off('ride-cancelled', onRideCancelled);
      webSocketService.off('driver-location-updated', onDriverLocationUpdated);
    };
  }, [searchingState.visible, searchingState.rideId, rideId]);

  return {
    searchingState,
    driverFoundState,
    cancelNotice,
    driverFoundRef,
    startSearch,
    stopSearch,
    resetDriverState,
    setCancelNotice,
  };
}
