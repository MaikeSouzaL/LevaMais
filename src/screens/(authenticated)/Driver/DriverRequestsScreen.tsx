import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, ScrollView, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import webSocketService from "../../../services/websocket.service";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import driverLocationService from "../../../services/driverLocation.service";
import Toast from "react-native-toast-message";
import { DriverScreen } from "./components/DriverScreen";
import { DriverEmptyState } from "./components/DriverEmptyState";
import { DriverRequestCard } from "./components/DriverRequestCard";
import { formatBRL } from "@/utils/mappers";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type RideRequestItem = {
  rideId: string;
  pickup?: { address?: string; latitude?: number; longitude?: number };
  dropoff?: { address?: string; latitude?: number; longitude?: number };
  pricing?: { total?: number };
  distance?: { text?: string };
  duration?: { text?: string };
  serviceType?: string;
  vehicleType?: string;
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
  };
};

export default function DriverRequestsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<RideRequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<"realtime" | "scheduled">("realtime");
  const [scheduledRides, setScheduledRides] = useState<any[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  const loadScheduledRides = async () => {
    try {
      setLoadingScheduled(true);
      const res = await rideService.getAvailableScheduledRides();
      setScheduledRides(res?.rides || []);
    } catch (e) {
      console.log("Erro ao carregar agendamentos", e);
    } finally {
      setLoadingScheduled(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      (async () => {
        try {
          const ride = await rideService.getActive();
          if (!active) return;
          if (ride?.active && ride.ride?._id) {
            (navigation as any).navigate("DriverRide", { rideId: ride.ride._id });
            return;
          }

          const me = await driverLocationService.getMe();
          if (!active) return;
          const isOnline = me?.status === "available";
          const hasAnyService =
            Array.isArray(me?.serviceTypes) && me.serviceTypes.length > 0;

          if (!isOnline || !hasAnyService) {
            (navigation as any).navigate("DriverHome");
          }
        } catch {
          if (!active) return;
          (navigation as any).navigate("DriverHome");
        }
      })();

      // Sempre recarrega os agendamentos quando focar a tela
      loadScheduledRides();

      return () => {
        active = false;
      };
    }, [navigation]),
  );

  useEffect(() => {
    let mounted = true;
    const syncAvailableRequests = async () => {
      try {
        const available = await rideService.getAvailableRequests();
        if (!mounted) return;
        setRequests(
          (available?.requests || []).map((item: any) => ({
            rideId: item.rideId,
            pickup: item.pickup,
            dropoff: item.dropoff,
            pricing: item.pricing,
            distance: item.distance,
            duration: item.duration,
            serviceType: item.serviceType,
            vehicleType: item.vehicleType,
            negotiation: item.negotiation,
          })),
        );
      } catch {
        // ignora para manter a tela responsiva em reconexao
      }
    };

    (async () => {
      try {
        const active = await rideService.getActive();
        if (active?.active && active.ride?._id) {
          try {
            (navigation as any).navigate("DriverRide", {
              rideId: active.ride._id,
            });
          } catch {}
          return;
        }

        const me = await driverLocationService.getMe();
        const isOnline = me?.status === "available";
        const hasAnyService =
          Array.isArray(me?.serviceTypes) && me.serviceTypes.length > 0;

        if (!isOnline || !hasAnyService) {
          Toast.show({
            type: "info",
            text1: "Fique online para receber solicitações",
            text2: "Ative o modo online na tela inicial do motorista.",
          });

          try {
            (navigation as any).navigate("DriverHome");
          } catch {}
          return;
        }

        await syncAvailableRequests();
      } catch {
        Toast.show({
          type: "info",
          text1: "Atualize sua localização primeiro",
          text2: "Volte para a tela inicial e ative o modo online.",
        });

        try {
          (navigation as any).navigate("DriverHome");
        } catch {}
      }
    })();

    const onNewRide = async (payload: any) => {
      if (!mounted) return;
      const item: RideRequestItem = {
        rideId: payload?.rideId,
        pickup: payload?.pickup,
        dropoff: payload?.dropoff,
        pricing: payload?.pricing,
        distance: payload?.distance,
        duration: payload?.duration,
        serviceType: payload?.serviceType,
        vehicleType: payload?.vehicleType,
        negotiation: payload?.negotiation,
      };

      if (!item.rideId) return;

      setRequests((prev) => {
        if (prev.some((p) => p.rideId === item.rideId)) return prev;
        return [item, ...prev];
      });

      try {
        await driverAlertService.start();
      } catch (e) {
        console.log("Falha ao tocar alerta", e);
      }
    };

    const onRideTaken = (payload: any) => {
      if (!mounted) return;
      const takenId = payload?.rideId;
      if (!takenId) return;
      setRequests((prev) => prev.filter((r) => r.rideId !== takenId));
    };

    const onRideExpired = (payload: any) => {
      if (!mounted) return;
      const expiredId = payload?.rideId;
      if (!expiredId) return;
      setRequests((prev) => prev.filter((r) => r.rideId !== expiredId));
    };

    const onSocketConnected = () => {
      syncAvailableRequests().catch(() => {});
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("connect", onSocketConnected);
        webSocketService.on("new-ride-request", onNewRide);
        webSocketService.on("ride-taken", onRideTaken);
        webSocketService.on("ride-expired", onRideExpired);
      } catch (e) {
        console.log("Falha ao conectar WS", e);
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("new-ride-request", onNewRide);
      webSocketService.off("ride-taken", onRideTaken);
      webSocketService.off("ride-expired", onRideExpired);
      webSocketService.off("connect", onSocketConnected);
      driverAlertService.stop().catch(() => {});
    };
  }, [navigation]);

  useEffect(() => {
    if (requests.length === 0) {
      driverAlertService.stop();
    }
  }, [requests.length]);

  const accept = async (rideId: string) => {
    const request = requests.find((item) => item.rideId === rideId);
    if (request?.negotiation?.enabled) {
      try {
        await rideService.respondToOffer(rideId, { action: "accept" });
        Toast.show({
          type: "success",
          text1: "Oferta aceita",
          text2: "Aguardando cliente selecionar sua proposta.",
        });
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Falha ao enviar oferta",
          text2: e?.response?.data?.error || e?.message || "Tente novamente",
        });
      } finally {
        setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
        driverAlertService.stop().catch(() => {});
      }
      return;
    }

    try {
      const ride = await rideService.accept(rideId);
      await driverAlertService.stop();
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e: any) {
      const currentRideId = e?.response?.data?.currentRideId;
      const msg = e?.response?.data?.error || e?.message;

      console.log("Falha ao aceitar", msg || e);

      if (currentRideId) {
        try {
          (navigation as any).navigate("DriverRide", { rideId: currentRideId });
        } catch {}
      }

      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      driverAlertService.stop().catch(() => {});
    }
  };

  const counterOffer = async (rideId: string) => {
    const request = requests.find((item) => item.rideId === rideId);
    if (!request?.negotiation?.enabled) return;

    const base = Number(request.negotiation.suggestedMinPrice || request.negotiation.clientOffer || 0);
    const amount = Number((base + 5).toFixed(2));

    try {
      await rideService.respondToOffer(rideId, {
        action: "counter",
        amount,
        message: "Contraoferta enviada automaticamente pelo app.",
      });
      Toast.show({
        type: "success",
        text1: "Contraoferta enviada",
        text2: `Valor sugerido: ${formatBRL(amount)}`,
      });
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      driverAlertService.stop().catch(() => {});
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha na contraoferta",
        text2: e?.response?.data?.error || e?.message || "Tente novamente",
      });
    }
  };

  const reject = async (rideId: string) => {
    try {
      await rideService.reject(rideId, "driver_rejected");
      await driverAlertService.stop();
    } catch (e) {
      console.log("Falha ao rejeitar", e);
    } finally {
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
    }
  };

  const handleAcceptScheduled = async (rideId: string) => {
    Alert.alert(
      "Aceitar Agendamento",
      "Deseja aceitar este agendamento antecipadamente? Ele ficará reservado para você no horário programado.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Aceitar",
          style: "default",
          onPress: async () => {
            try {
              await rideService.acceptScheduledRide(rideId);
              Toast.show({
                type: "success",
                text1: "Agendamento reservado!",
                text2: "Este agendamento agora é seu. Fique online próximo ao horário!",
              });
              await loadScheduledRides();
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Não foi possível aceitar",
                text2: err?.message || "Tente novamente",
              });
            }
          },
        },
      ]
    );
  };

  const handleOpenMap = (pickup: any, dropoff: any) => {
    if (!pickup?.latitude || !dropoff?.latitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  return (
    <DriverScreen
      title="Solicitações"
      scroll={activeTab === "realtime"}
      headerRight={
        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
          {activeTab === "realtime" ? requests.length : scheduledRides.length}
        </Text>
      }
    >
      {/* Abas Personalizadas Premium */}
      <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 4, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" }}>
        <TouchableOpacity
          onPress={() => setActiveTab("realtime")}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: activeTab === "realtime" ? "#02de95" : "transparent"
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: activeTab === "realtime" ? "#091A2F" : "#9ca5a3", fontWeight: "900", fontSize: 13 }}>
            Em tempo real ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setActiveTab("scheduled");
            loadScheduledRides();
          }}
          style={{
            flex: 1,
            paddingVertical: 10,
            alignItems: "center",
            borderRadius: 12,
            backgroundColor: activeTab === "scheduled" ? "#02de95" : "transparent"
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: activeTab === "scheduled" ? "#091A2F" : "#9ca5a3", fontWeight: "900", fontSize: 13 }}>
            Agendados ({scheduledRides.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === "realtime" ? (
        requests.length === 0 ? (
          <DriverEmptyState title="Nenhuma solicitação no momento." />
        ) : (
          requests.map((r) => (
            <DriverRequestCard
              key={r.rideId}
              item={r}
              onAccept={accept}
              onReject={reject}
              onCounterOffer={counterOffer}
            />
          ))
        )
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }}>
          {loadingScheduled ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#02de95" />
              <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, fontWeight: "600" }}>Buscando agendamentos...</Text>
            </View>
          ) : scheduledRides.length === 0 ? (
            <DriverEmptyState title="Nenhum agendamento pendente no momento." />
          ) : (
            scheduledRides.map((ride) => (
              <View
                key={ride._id}
                style={{
                  backgroundColor: "#11253E",
                  borderRadius: 16,
                  padding: 18,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "rgba(2,222,149,0.15)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 5,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <MaterialCommunityIcons
                      name={ride.serviceType === "delivery" ? "package-variant-closed" : "car-sports"}
                      size={20}
                      color="#02de95"
                    />
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                      {ride.serviceType === "delivery" ? "Entrega Agendada" : "Corrida Agendada"}
                    </Text>
                  </View>
                  <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 18 }}>
                    {formatBRL(ride.pricing?.total || 0)}
                  </Text>
                </View>

                {/* Horário */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(2,222,149,0.08)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 14 }}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#02de95" />
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                    Para: {new Date(ride.scheduledFor).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" })}
                  </Text>
                </View>

                {/* Rotas */}
                <View style={{ gap: 10, marginBottom: 16 }}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ alignItems: "center", paddingTop: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95" }} />
                      <View style={{ width: 1, flex: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 4 }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700" }}>PARTIDA (COLETA)</Text>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 2 }}>{ride.pickup?.address}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ alignItems: "center", paddingTop: 4 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700" }}>DESTINO (ENTREGA)</Text>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 2 }}>{ride.dropoff?.address}</Text>
                    </View>
                  </View>
                </View>

                {/* Ações */}
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => handleOpenMap(ride.pickup, ride.dropoff)}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.12)",
                      backgroundColor: "rgba(255,255,255,0.04)",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="map-marker-distance" size={18} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>Ver rota</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleAcceptScheduled(ride._id)}
                    style={{
                      flex: 1.3,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "#02de95",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 6
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="calendar-check" size={18} color="#091A2F" />
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 13 }}>Aceitar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </DriverScreen>
  );
}
