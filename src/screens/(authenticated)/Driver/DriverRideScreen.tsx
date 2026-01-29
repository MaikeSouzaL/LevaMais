import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import DriverHeader from "./components/DriverHeader";
import GlobalMap from "../../../components/GlobalMap";
import rideService, { Ride } from "../../../services/ride.service";
import webSocketService from "../../../services/websocket.service";

type Params = {
  DriverRide: {
    rideId: string;
  };
};

export default function DriverRideScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRide">>();
  const rideId = route.params?.rideId;

  const [ride, setRide] = useState<Ride | null>(null);
  const [status, setStatus] = useState<string>("accepted");
  const intervalRef = useRef<any>(null);

  const [actionLoading, setActionLoading] = useState<
    null | "cancel" | "arrived" | "in_progress" | "completed"
  >(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string | null>(
    null,
  );

  const cancelReasons = useMemo(
    () => [
      { id: "client_no_show", label: "Cliente não apareceu" },
      { id: "wrong_pickup", label: "Local de coleta incorreto" },
      { id: "vehicle_issue", label: "Problema com o veículo" },
      { id: "safety", label: "Problema de segurança" },
      { id: "accident", label: "Acidente / imprevisto" },
      { id: "other", label: "Outro" },
    ],
    [],
  );

  const statusLabel = useMemo(() => {
    if (!status) return "—";
    if (status === "accepted") return "Aceita";
    if (status === "arrived") return "Cheguei";
    if (status === "in_progress") return "Em andamento";
    if (status === "completed") return "Finalizada";
    if (String(status).startsWith("cancelled")) return "Cancelada";
    return status;
  }, [status]);

  const canArrive = status === "accepted";
  const canStart = status === "accepted" || status === "arrived";
  const canComplete = status === "in_progress";
  const canCancel =
    status === "accepted" || status === "arrived" || status === "in_progress";

  const isDelivery = ride?.serviceType === "delivery";

  async function takePhotoBase64() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão de câmera negada");
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
    });

    if (result.canceled) {
      throw new Error("Foto cancelada");
    }

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      throw new Error("Não foi possível ler a foto");
    }

    // data URL (MVP)
    return `data:image/jpeg;base64,${asset.base64}`;
  }

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatus(r?.status || "accepted");
      } catch (e) {
        console.log("Falha ao carregar corrida", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  useEffect(() => {
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const tick = async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          webSocketService.emit("update-location", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
          });
        } catch {}
      };

      await tick();
      intervalRef.current = setInterval(tick, 4000);
    };

    start();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const update = async (nextStatus: "arrived" | "in_progress" | "completed") => {
    if (!rideId) return;

    // validações do fluxo (estilo Uber/99)
    if (nextStatus === "arrived" && !canArrive) return;
    if (nextStatus === "in_progress" && !canStart) return;
    if (nextStatus === "completed" && !canComplete) return;

    setActionLoading(nextStatus);
    try {
      // iFood style: para entregas, exigir foto na coleta (antes de iniciar)
      if (isDelivery && nextStatus === "in_progress") {
        const photo = await takePhotoBase64();
        await rideService.uploadPickupProof(rideId, photo);
      }

      // iFood style: para entregas, exigir foto na entrega (antes de finalizar)
      if (isDelivery && nextStatus === "completed") {
        const photo = await takePhotoBase64();
        await rideService.uploadDeliveryProof(rideId, photo);
      }

      const r = await rideService.updateStatus(rideId, nextStatus);
      setRide(r as any);
      setStatus(r?.status || nextStatus);

      if (nextStatus === "arrived") {
        webSocketService.emit("driver-arrived", { rideId });
        Toast.show({ type: "success", text1: "Você marcou: Cheguei" });
      }
      if (nextStatus === "in_progress") {
        webSocketService.emit("start-ride", { rideId });
        Toast.show({ type: "success", text1: "Entrega iniciada" });
      }
      if (nextStatus === "completed") {
        Toast.show({ type: "success", text1: "Entrega finalizada" });
        // estilo Uber/99: pedir avaliação
        try {
          (navigation as any).navigate("DriverRateClient", { rideId });
        } catch {
          try {
            (navigation as any).navigate("DriverHome");
          } catch {
            navigation.goBack();
          }
        }
      }
    } catch (e: any) {
      // se o motorista cancelou a foto, não tratar como erro grave
      const msg = e?.message || "Tente novamente";
      Toast.show({
        type: "error",
        text1: "Não foi possível continuar",
        text2: msg,
      });
      console.log("Falha ao atualizar status", e);
    } finally {
      setActionLoading(null);
    }
  };

  const cancel = async (reasonId: string) => {
    if (!rideId) return;
    if (!canCancel) return;

    // usar tela dedicada (estilo Uber/99)
    try {
      (navigation as any).navigate("DriverCancelRide", { rideId });
      return;
    } catch {}

    // fallback antigo
    setActionLoading("cancel");
    try {
      await rideService.cancel(rideId, reasonId);
      Toast.show({ type: "success", text1: "Entrega cancelada" });
      setCancelModalOpen(false);
      setSelectedCancelReason(null);
      try {
        (navigation as any).navigate("DriverHome");
      } catch {
        navigation.goBack();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível cancelar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const initialRegion = {
    latitude: ride?.pickup?.latitude ?? -23.5505,
    longitude: ride?.pickup?.longitude ?? -46.6333,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader
        title="Corrida ativa"
        right={
          <TouchableOpacity
            onPress={() => {
              if (!canCancel) return;
              try {
                (navigation as any).navigate("DriverCancelRide", { rideId });
              } catch {
                setCancelModalOpen(true);
              }
            }}
          >
            <Text style={{ color: "#ef4444", fontWeight: "900" }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1 }}>
        <GlobalMap initialRegion={initialRegion as any} showsUserLocation>
          {!!ride?.pickup?.latitude && !!ride?.pickup?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="Coleta"
              tracksViewChanges={false}
            />
          )}
          {!!ride?.dropoff?.latitude && !!ride?.dropoff?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              title="Destino"
              pinColor="#02de95"
              tracksViewChanges={false}
            />
          )}
        </GlobalMap>

        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            backgroundColor: "#111816",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            Status: {statusLabel}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
            Coleta: {ride?.pickup?.address || "—"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            Destino: {ride?.dropoff?.address || "—"}
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              disabled={!canArrive || actionLoading != null}
              onPress={() => update("arrived")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: !canArrive
                  ? "rgba(255,255,255,0.08)"
                  : "#1f2d29",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                opacity: !canArrive || actionLoading != null ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {actionLoading === "arrived" ? "..." : "Cheguei"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canStart || actionLoading != null}
              onPress={() => update("in_progress")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: !canStart
                  ? "rgba(255,255,255,0.08)"
                  : "#02de95",
                alignItems: "center",
                opacity: !canStart || actionLoading != null ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#0f231c", fontWeight: "900" }}>
                {actionLoading === "in_progress" ? "..." : "Iniciar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!canComplete || actionLoading != null}
              onPress={() => update("completed")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: !canComplete
                  ? "rgba(255,255,255,0.08)"
                  : "#3b82f6",
                alignItems: "center",
                opacity: !canComplete || actionLoading != null ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                {actionLoading === "completed" ? "..." : "Finalizar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal de cancelamento (estilo Uber/99: escolher motivo + confirmar) */}
      <Modal
        visible={cancelModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalOpen(false)}
      >
        <Pressable
          onPress={() => setCancelModalOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: 18,
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "#111816",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              padding: 14,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              Cancelar entrega
            </Text>
            <Text
              style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}
            >
              Selecione um motivo. O cliente será notificado.
            </Text>

            <View style={{ marginTop: 12, gap: 10 }}>
              {cancelReasons.map((r) => {
                const selected = selectedCancelReason === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setSelectedCancelReason(r.id)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 14,
                      backgroundColor: selected
                        ? "rgba(2,222,149,0.18)"
                        : "rgba(255,255,255,0.06)",
                      borderWidth: 1,
                      borderColor: selected
                        ? "rgba(2,222,149,0.55)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text style={{ color: "#fff", fontWeight: "800" }}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setCancelModalOpen(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  Voltar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!selectedCancelReason || actionLoading != null}
                onPress={() => {
                  if (!selectedCancelReason) return;
                  cancel(selectedCancelReason);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor:
                    !selectedCancelReason || actionLoading != null
                      ? "rgba(239,68,68,0.25)"
                      : "#ef4444",
                  alignItems: "center",
                  opacity:
                    !selectedCancelReason || actionLoading != null ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#111816", fontWeight: "900" }}>
                  {actionLoading === "cancel" ? "Cancelando..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
