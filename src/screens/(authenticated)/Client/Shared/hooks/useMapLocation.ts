/**
 * useMapLocation - Hook para gerenciar localização e mapa
 * Extrai lógica de localização do HomeScreen
 */

import { useState, useEffect, useRef } from 'react';
import MapView, { Region } from 'react-native-maps';
import {
  getCurrentLocationAndAddress,
  getCurrentLocation,
} from '@/utils/location';

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useMapLocation() {
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<MapRegion | null>(null);
  const [userRegion, setUserRegion] = useState<UserLocation | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [showMyLocationButton, setShowMyLocationButton] = useState(false);
  const [dragLatLng, setDragLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Obter localização inicial
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const result = await getCurrentLocationAndAddress();
      if (!result || !isMounted) return;

      const { location, address } = result;

      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      setCurrentAddress(
        `${address.street}${address.number ? ', ' + address.number : ''}`
      );

      setUserRegion({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setShowMyLocationButton(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Centralizar no usuário
  const centerOnUser = async () => {
    const result = await getCurrentLocationAndAddress();
    if (!result) {
      console.warn('Permissão negada ou falha ao obter localização');
      return;
    }

    const { location, address } = result;

    setCurrentAddress(
      `${address.street}${address.number ? ', ' + address.number : ''}`
    );

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600
      );
    }

    setShowMyLocationButton(false);
  };

  // Handler de mudança de região
  const handleRegionChange = (r: MapRegion) => {
    // Função vazia - não precisa fazer nada durante o arrasto
  };

  // Handler de mudança de região completa
  const handleRegionChangeComplete = (r: MapRegion) => {
    setRegion(r); // CRITICAL: Atualiza a região atual
    setDragLatLng({ lat: r.latitude, lng: r.longitude });

    if (!userRegion) return;

    const distanceLat = Math.abs(r.latitude - userRegion.latitude);
    const distanceLng = Math.abs(r.longitude - userRegion.longitude);
    const thresholdLat = r.latitudeDelta * 0.5;
    const thresholdLng = r.longitudeDelta * 0.5;
    const isFar = distanceLat > thresholdLat || distanceLng > thresholdLng;

    setShowMyLocationButton(isFar);
  };

  return {
    mapRef,
    region,
    userRegion,
    currentAddress,
    showMyLocationButton,
    dragLatLng,
    setCurrentAddress,
    centerOnUser,
    handleRegionChange,
    handleRegionChangeComplete,
  };
}
