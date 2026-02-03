/**
 * useActiveRide - Hook para verificar corrida ativa
 * Redireciona para RideTracking se houver corrida em andamento
 */

import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import rideService from '@/services/ride.service';

export function useActiveRide(
  navigation: any,
  userType: string | undefined,
  searchingVisible: boolean
) {
  useFocusEffect(
    useCallback(() => {
      if (userType !== 'client') return;

      let cancelled = false;

      (async () => {
        try {
          const res = await rideService.getActive();
          if (cancelled) return;

          if (res?.active && res.ride?._id) {
            // Evita interromper o modal de busca
            if (searchingVisible) return;

            navigation.navigate('RideTracking', {
              rideId: res.ride._id,
            });
          }
        } catch (e) {
          // Silencioso: falha de rede não deve travar a Home
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userType, searchingVisible, navigation])
  );
}
