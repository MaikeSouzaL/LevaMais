import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";

import DrawerClienteRoutes from "./drawer.cliente.routes";
import rideService from "../services/ride.service";
import {
  getCurrentLocation,
  obterEnderecoPorCoordenadas,
} from "../utils/location";
import { resolveCityIdByNameAndState } from "../services/cityResolver.service";
import { useClientCityStore } from "../context/clientCityStore";

export default function ClientBoot() {
  const setCity = useClientCityStore((s) => s.setCity);
  const [loading, setLoading] = useState(true);
  const [initialRideId, setInitialRideId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Detectar cidade via GPS (se permitido) e mapear para cityId do backend.
        // Se falhar, seguimos sem cityId (o app ainda funciona, mas sem precificação por cidade correta).
        try {
          const coords = await getCurrentLocation();
          if (coords) {
            const addr = await obterEnderecoPorCoordenadas(
              coords.latitude,
              coords.longitude,
            );

            const resolved = await resolveCityIdByNameAndState({
              cityName: addr?.city,
              stateCode: addr?.region,
            });

            if (resolved?.cityId) {
              setCity({
                cityId: resolved.cityId,
                name: resolved.name,
                state: resolved.state,
                source: "gps",
                updatedAt: Date.now(),
              });
            }
          }
        } catch {
          // silencioso
        }

        // 2) Retomar corrida ativa (se existir)
        const res = await rideService.getActive();
        if (!mounted) return;

        if (res?.active && res.ride?._id) {
          setInitialRideId(res.ride._id);
        }
      } catch {
        // silencioso
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f231c",
          padding: 24,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.75)" }}>Carregando...</Text>
      </View>
    );
  }

  return <DrawerClienteRoutes initialRideId={initialRideId} />;
}
