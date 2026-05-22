/**
 * useMapLocation - Hook para gerenciar localização e mapa
 * Extrai lógica de localização do HomeScreen
 */

import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import MapView, { Region } from 'react-native-maps';
import {
  getAddressFromCoordinates,
  getCurrentLocationAndAddress,
} from '@/utils/location';
import { updateLocation } from '@/services/auth.service';

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

  // Obter e monitorar localização em tempo real
  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !isMounted) return;

      // Obter posição inicial imediatamente
      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (!isMounted) return;

      const { latitude, longitude } = initial.coords;

      setRegion({ latitude, longitude, latitudeDelta: 0.003, longitudeDelta: 0.003 });
      setUserRegion({ latitude, longitude });

      // Reverso do endereço inicial
      const address = await getAddressFromCoordinates({ latitude, longitude });
      if (isMounted && address) {
        const fullAddr = [
          `${address.street}${address.number ? ', ' + address.number : ''}`,
          address.neighborhood,
          address.city,
        ].filter(Boolean).join(' - ');
        setCurrentAddress(fullAddr);
      }

      // Monitorar movimentação em tempo real
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000,     // atualiza a cada 2 segundos no mínimo
          distanceInterval: 3,    // ou se mover >= 3 metros
        },
        (loc) => {
          if (!isMounted) return;
          const { latitude: lat, longitude: lng } = loc.coords;
          setUserRegion({ latitude: lat, longitude: lng });
          setRegion((prev) =>
            prev ? { ...prev, latitude: lat, longitude: lng } : prev
          );
          setShowMyLocationButton(false);
          
          // Enviar localização real-time ao backend
          updateLocation(lat, lng).catch(console.error);
        }
      );
    })();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);


  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    if (mapRef.current && userRegion && !hasCentered) {
      mapRef.current.animateToRegion(
        {
          latitude: userRegion.latitude,
          longitude: userRegion.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
        },
        1000
      );
      setHasCentered(true);
    }
  }, [userRegion, hasCentered]);

  // Centralizar no usuário
  const centerOnUser = async () => {
    const result = await getCurrentLocationAndAddress();
    if (!result) {
      console.warn('Permissão negada ou falha ao obter localização');
      return;
    }

    const { location, address } = result;

    const fullAddr = [
      `${address.street}${address.number ? ', ' + address.number : ''}`,
      address.neighborhood,
      address.city
    ].filter(Boolean).join(' - ');

    setCurrentAddress(fullAddr);

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.003,
          longitudeDelta: 0.003,
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
