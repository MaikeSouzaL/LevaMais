import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import ActionButton from "../../../components/ui/ActionButton";
import InfoRow from "../../../components/ui/InfoRow";
import SmallLinkButton from "../../../components/ui/SmallLinkButton";
import rideService, { Ride } from "../../../services/ride.service";

type Params = {
  RideCompleted: {
    rideId: string;
  };
};

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

function formatVehicleText(driver: any) {
  if (!driver) return "";
  let vehicle = driver.vehicle || {};
  let model = vehicle.model ? String(vehicle.model) : "";
  let plate = vehicle.plate ? String(vehicle.plate) : "";
  if (model && plate) return `${model} • ${plate}`;
  if (model) return model;
  if (plate) return plate;
  return "";
}

export default function RideCompletedScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "RideCompleted">>();
  const rideId = route.params?.rideId;

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);

  const driver = useMemo(() => {
    return (ride as any)?.driverId || null;
  }, [ride]);

  const totalText = useMemo(() => {
    let total = (ride as any)?.pricing?.total;
    if (total == null) return undefined;
    return formatBRL(Number(total));
  }, [ride]);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    (async () => {
      setLoading(true);
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Não foi possível carregar o resumo",
          text2: e?.message || "Tente novamente",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  function goHome() {
    try {
      (navigation as any).navigate("Home");
    } catch {
      try {
        navigation.goBack();
      } catch {}
    }
  }

  function openRate() {
    if (!rideId) return;
    try {
      (navigation as any).navigate("ClientRateDriver", { rideId });
    } catch {}
  }

  function openDetails() {
    if (!ride) return;

    try {
      (navigation as any).navigate("OrderDetails", {
        data: {
          pickupAddress: ride.pickup?.address,
          dropoffAddress: ride.dropoff?.address,
          vehicleType: (ride as any)?.vehicleType,
          servicePurposeLabel: (ride as any)?.purposeId?.name,
          etaMinutes: ride.duration?.value ? Math.round(ride.duration.value / 60) : undefined,
          pricing: {
            total: (ride as any)?.pricing?.total,
            base: (ride as any)?.pricing?.basePrice,
            distancePrice: (ride as any)?.pricing?.distancePrice,
            serviceFee: (ride as any)?.pricing?.serviceFee,
            distanceKm: ride.distance?.value ? ride.distance.value / 1000 : undefined,
          },
        },
      });
    } catch {}
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: "rgba(2,222,149,0.14)",
              borderWidth: 1,
              borderColor: "rgba(2,222,149,0.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="check" size={22} color="#02de95" />
          </View>
          <View>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              Entrega finalizada
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              Resumo da corrida
            </Text>
          </View>
        </View>

        <Text style={{ color: "#02de95", fontWeight: "900" }}>
          {totalText || (loading ? "Carregando..." : "")}
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <View
          style={{
            backgroundColor: "rgba(17,24,22,0.96)",
            borderRadius: 22,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {driver?.profilePhoto ? (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Image
                  source={{ uri: String(driver.profilePhoto) }}
                  style={{ width: 52, height: 52 }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="person" size={22} color="rgba(255,255,255,0.7)" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                {driver?.name ? String(driver.name) : "Motorista"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {formatVehicleText(driver) || ""}
              </Text>
            </View>

            <SmallLinkButton title="Ver detalhes" onPress={openDetails} />
          </View>

          <InfoRow label="Coleta" value={ride?.pickup?.address} />
          <InfoRow label="Destino" value={ride?.dropoff?.address} />

          <InfoRow
            label="Distância"
            value={ride?.distance?.text ? String(ride.distance.text) : undefined}
          />
          <InfoRow
            label="Duração"
            value={ride?.duration?.text ? String(ride.duration.text) : undefined}
          />

          <InfoRow
            label="Total"
            value={totalText}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
          <ActionButton
            title="Avaliar"
            variant="primary"
            onPress={openRate}
            style={{ flex: 1 }}
          />
          <ActionButton
            title="Fechar"
            variant="secondary"
            onPress={goHome}
            style={{ flex: 1 }}
          />
        </View>

        <View style={{ marginTop: 10 }}>
          <ActionButton
            title="Solicitar outra"
            variant="secondary"
            onPress={goHome}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
