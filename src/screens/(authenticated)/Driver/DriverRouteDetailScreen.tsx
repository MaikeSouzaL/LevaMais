import React, { useCallback, useMemo, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Modal, TextInput, Image } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

import routeService from "@/services/route.service";
import type { DriverRoute, RouteReservation, RouteReservationStatus } from "@/types/routes";
import { DriverScreen } from "./components/DriverScreen";
import { Icon } from "@/components/ui/Icon";

const RES_LABEL: Record<RouteReservationStatus, string> = {
  requested: "Solicitada",
  accepted: "Aceita",
  rejected: "Recusada",
  awaiting_pickup: "Aguardando coleta",
  in_transit: "Em trânsito",
  delivered: "Entregue",
  completed: "Concluída",
  cancelled: "Cancelada",
  refunded: "Estornada",
};

function money(v?: number) {
  return `R$ ${Number(v || 0).toFixed(2)}`;
}

function renderStatusBadge(status: RouteReservationStatus) {
  let color = "rgba(255,255,255,0.5)";
  let bg = "rgba(255,255,255,0.05)";

  if (status === "requested") {
    color = "#fb923c";
    bg = "rgba(251,146,60,0.1)";
  } else if (status === "accepted" || status === "awaiting_pickup") {
    color = "#38bdf8";
    bg = "rgba(56,189,248,0.1)";
  } else if (status === "in_transit") {
    color = "#34d399";
    bg = "rgba(52,211,153,0.1)";
  } else if (status === "delivered" || status === "completed") {
    color = "#02de95";
    bg = "rgba(2,222,149,0.1)";
  } else if (status === "cancelled" || status === "rejected" || status === "refunded") {
    color = "#f87171";
    bg = "rgba(248,113,113,0.1)";
  }

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
      <Text style={{ color, fontSize: 10, fontWeight: "800" }}>{RES_LABEL[status].toUpperCase()}</Text>
    </View>
  );
}

export default function DriverRouteDetailScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const routeId: string = params?.routeId;

  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [reservations, setReservations] = useState<RouteReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Estados para validação de PIN e Foto (Fase D9)
  const [activeResForAction, setActiveResForAction] = useState<{ res: RouteReservation; type: "pickup" | "deliver" } | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, res] = await Promise.all([
        routeService.getRoute(routeId),
        routeService.listRouteReservations(routeId),
      ]);
      setRoute(r);
      setReservations(res);
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const act = async (fn: () => Promise<any>, id: string) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Falhou", text2: e?.message });
    } finally {
      setBusyId(null);
    }
  };

  const takePhoto = async () => {
    setCapturingPhoto(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Toast.show({ type: "error", text1: "Permissão de câmera negada", text2: "Precisamos de permissão para tirar a foto de comprovação." });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]?.base64) {
        setPhotoBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro na câmera", text2: e?.message });
    } finally {
      setCapturingPhoto(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!activeResForAction) return;
    const { res, type } = activeResForAction;

    if (!pinInput.trim()) {
      return Toast.show({ type: "error", text1: "PIN obrigatório", text2: "Por favor, insira o PIN de validação." });
    }

    setBusyId(res._id);
    try {
      if (type === "pickup") {
        await routeService.pickupReservation(res._id, { pin: pinInput.trim(), photoBase64: photoBase64 || undefined });
        Toast.show({ type: "success", text1: "Coleta confirmada com sucesso!" });
      } else {
        await routeService.deliverReservation(res._id, { pin: pinInput.trim(), photoBase64: photoBase64 || undefined });
        Toast.show({ type: "success", text1: "Entrega concluída com sucesso!" });
      }
      setActiveResForAction(null);
      setPinInput("");
      setPhotoBase64(null);
      await load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Falha na validação", text2: e?.message || "PIN incorreto ou erro de conexão" });
    } finally {
      setBusyId(null);
    }
  };

  const startRoute = () => act(async () => {
    await routeService.start(routeId);
    Toast.show({ type: "success", text1: "Rota iniciada" });
  }, "route");

  const actionsFor = (r: RouteReservation) => {
    const busy = busyId === r._id;
    if (busy) return <ActivityIndicator color="#02de95" />;
    if (r.status === "requested") {
      return (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={() => act(() => routeService.acceptReservation(r._id), r._id)} style={btn("#02de95")}>
            <Text style={btnTxt("#062b22")}>Aceitar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => act(() => routeService.rejectReservation(r._id), r._id)} style={btnOutline("#ef4444")}>
            <Text style={btnTxt("#ef4444")}>Recusar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (r.status === "accepted" || r.status === "awaiting_pickup") {
      return (
        <TouchableOpacity onPress={() => setActiveResForAction({ res: r, type: "pickup" })} style={btn("#38bdf8")}>
          <Text style={btnTxt("#04293b")}>Confirmar coleta</Text>
        </TouchableOpacity>
      );
    }
    if (r.status === "in_transit") {
      return (
        <TouchableOpacity onPress={() => setActiveResForAction({ res: r, type: "deliver" })} style={btn("#02de95")}>
          <Text style={btnTxt("#062b22")}>Confirmar entrega</Text>
        </TouchableOpacity>
      );
    }
    return <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>{RES_LABEL[r.status]}</Text>;
  };

  const sortedReservations = useMemo(() => {
    const statusOrder: Record<RouteReservationStatus, number> = {
      requested: 1,
      accepted: 2,
      awaiting_pickup: 2,
      in_transit: 3,
      delivered: 4,
      completed: 5,
      cancelled: 6,
      rejected: 7,
      refunded: 8,
    };
    return [...reservations].sort((a, b) => {
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      return orderA - orderB;
    });
  }, [reservations]);

  if (loading) {
    return (
      <DriverScreen title="Rota">
        <View style={{ paddingTop: 60, alignItems: "center" }}><ActivityIndicator color="#02de95" /></View>
      </DriverScreen>
    );
  }

  const used = route?.capacityUsed?.items || 0;
  const max = route?.capacity?.maxItems || 0;

  return (
    <DriverScreen title="Detalhe da Rota" scroll>
      <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
          {route?.origin?.label} → {route?.destination?.label}
        </Text>
        <View style={{ flexDirection: "row", gap: 18, marginTop: 12 }}>
          <Info icon="clock" text={route?.departAt ? new Date(route.departAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"} />
          <Info icon="package" text={`${used}/${max} itens`} />
        </View>
        {route?.status === "published" && (
          <TouchableOpacity onPress={startRoute} style={{ marginTop: 16, backgroundColor: "#02de95", borderRadius: 12, paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: "#062b22", fontWeight: "900" }}>Iniciar rota</Text>
          </TouchableOpacity>
        )}
        {route?.status === "in_transit" && (
          <View style={{ marginTop: 14, backgroundColor: "rgba(56,189,248,0.12)", borderRadius: 10, padding: 10, alignItems: "center" }}>
            <Text style={{ color: "#38bdf8", fontWeight: "800", fontSize: 12 }}>Rota em andamento</Text>
          </View>
        )}
      </View>

      <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800", marginBottom: 12 }}>
        Reservas ({reservations.length})
      </Text>

      {reservations.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 30 }}>
          <Icon name="inbox" size={40} color="rgba(255,255,255,0.25)" />
          <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, fontSize: 13 }}>Nenhuma reserva ainda</Text>
        </View>
      ) : (
        sortedReservations.map((r) => (
          <View key={r._id} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={{ color: "#fff", fontWeight: "800", flex: 1 }} numberOfLines={1}>
                {r.item?.description || r.item?.type || "Encomenda"}
              </Text>
              {renderStatusBadge(r.status)}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                {r.item?.size} · {r.item?.weightKg || 0}kg · coleta: {r.pickup?.address || "—"}
              </Text>
              <Text style={{ color: "#02de95", fontWeight: "900" }}>{money(r.pricing?.driverPayout)}</Text>
            </View>
            <View style={{ marginTop: 12, alignItems: "flex-end" }}>{actionsFor(r)}</View>
          </View>
        ))
      )}

      {/* Modal de confirmação com PIN e Foto */}
      <Modal
        visible={activeResForAction !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setActiveResForAction(null);
          setPinInput("");
          setPhotoBase64(null);
        }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#1e1e1e", borderRadius: 20, width: "100%", maxWidth: 360, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 8 }}>
              {activeResForAction?.type === "pickup" ? "Confirmar Coleta" : "Confirmar Entrega"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
              Insira o PIN e capture a foto comprobatória para validar a operação.
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
              PIN de Validação
            </Text>
            <TextInput
              value={pinInput}
              onChangeText={setPinInput}
              placeholder="Digite o PIN de 4 dígitos"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="number-pad"
              maxLength={6}
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                color: "#fff",
                fontSize: 16,
                fontWeight: "bold",
                textAlign: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                marginBottom: 20,
              }}
            />

            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "700", marginBottom: 8 }}>
              Foto de Comprovação
            </Text>

            {photoBase64 ? (
              <View style={{ marginBottom: 20, alignItems: "center" }}>
                <Image
                  source={{ uri: photoBase64 }}
                  style={{ width: "100%", height: 160, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setPhotoBase64(null)}
                  style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}
                >
                  <Icon name="trash" size={14} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700", marginLeft: 4 }}>Remover foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={takePhoto}
                disabled={capturingPhoto}
                style={{
                  height: 120,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "rgba(255,255,255,0.2)",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                {capturingPhoto ? (
                  <ActivityIndicator color="#02de95" />
                ) : (
                  <>
                    <Icon name="camera" size={24} color="rgba(255,255,255,0.6)" />
                    <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "700", marginTop: 8 }}>Tirar Foto</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setActiveResForAction(null);
                  setPinInput("");
                  setPhotoBase64(null);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmAction}
                disabled={busyId !== null}
                style={{
                  flex: 1,
                  backgroundColor: "#02de95",
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                {busyId !== null ? (
                  <ActivityIndicator color="#062b22" />
                ) : (
                  <Text style={{ color: "#062b22", fontWeight: "900" }}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DriverScreen>
  );
}

function Info({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name={icon} size={14} color="rgba(255,255,255,0.6)" />
      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 5 }}>{text}</Text>
    </View>
  );
}

const btn = (bg: string) => ({ backgroundColor: bg, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9 });
const btnOutline = (c: string) => ({ borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: c });
const btnTxt = (c: string) => ({ color: c, fontWeight: "800" as const, fontSize: 13 });
