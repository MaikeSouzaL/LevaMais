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
          console.log("[ClientBoot] 🔍 Iniciando detecção de cidade...");
          const coords = await getCurrentLocation();

          if (coords) {
            console.log("[ClientBoot] 📍 GPS obtido:", {
              lat: coords.latitude,
              lng: coords.longitude,
            });

            const addr = await obterEnderecoPorCoordenadas(
              coords.latitude,
              coords.longitude,
            );
            console.log("[ClientBoot] 🗺️ Reverse geocode:", {
              city: addr?.city,
              region: addr?.region,
              subregion: addr?.subregion,
            });

            // Mapa de estados para siglas (reverse geocode pode retornar nome completo)
            const estadoParaSigla: Record<string, string> = {
              Acre: "AC",
              Alagoas: "AL",
              Amapá: "AP",
              Amazonas: "AM",
              Bahia: "BA",
              Ceará: "CE",
              "Distrito Federal": "DF",
              "Espírito Santo": "ES",
              Goiás: "GO",
              Maranhão: "MA",
              "Mato Grosso": "MT",
              "Mato Grosso do Sul": "MS",
              "Minas Gerais": "MG",
              Pará: "PA",
              Paraíba: "PB",
              Paraná: "PR",
              Pernambuco: "PE",
              Piauí: "PI",
              "Rio de Janeiro": "RJ",
              "Rio Grande do Norte": "RN",
              "Rio Grande do Sul": "RS",
              Rondônia: "RO",
              Roraima: "RR",
              "Santa Catarina": "SC",
              "São Paulo": "SP",
              Sergipe: "SE",
              Tocantins: "TO",
            };

            // Converter estado para sigla
            const stateCode =
              addr?.region && addr.region.length > 2
                ? estadoParaSigla[addr.region] || addr.region
                : addr?.region;

            console.log("[ClientBoot] 🔄 Estado convertido:", {
              original: addr?.region,
              convertido: stateCode,
            });

            const resolved = await resolveCityIdByNameAndState({
              cityName: addr?.city || addr?.subregion,
              stateCode,
            });
            console.log(
              "[ClientBoot] 🏙️ Cidade resolvida pelo backend:",
              resolved,
            );

            if (resolved?.cityId) {
              setCity({
                cityId: resolved.cityId,
                name: resolved.name,
                state: resolved.state,
                source: "gps",
                updatedAt: Date.now(),
              });
              console.log("[ClientBoot] ✅ Cidade salva no store:", {
                cityId: resolved.cityId,
                name: resolved.name,
              });
            } else {
              console.log(
                "[ClientBoot] ⚠️ Cidade não encontrada no backend. Cadastre via Leva Web!",
              );
            }
          } else {
            console.log("[ClientBoot] ⚠️ GPS não disponível");
          }
        } catch (e: any) {
          console.log("[ClientBoot] ❌ Erro:", e?.message);
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
          backgroundColor: "#091A2F",
          padding: 24,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.75)" }}>Carregando...</Text>
      </View>
    );
  }

  return <DrawerClienteRoutes initialRideId={initialRideId} />;
}
