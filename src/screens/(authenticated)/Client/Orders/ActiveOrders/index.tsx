import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import rideService, { Ride } from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";

function rideTitle(ride: Ride) {
  return ride.serviceType === "delivery" ? "Entrega" : "Corrida";
}

function mapStatusLabel(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "scheduled") return "agendada";
  if (normalized === "driver_assigned") return "motorista selecionado";
  return normalized.replaceAll("_", " ");
}

export default function ActiveOrdersScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [editingRideId, setEditingRideId] = useState<string | null>(null);
  const [cancellingRideId, setCancellingRideId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await rideService.getActiveList();
    setRides(res?.rides || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const handleCancel = async (rideId: string) => {
    setTimeout(() => {
      Alert.alert(
        "Cancelar Agendamento",
        "Deseja realmente cancelar esta entrega agendada?",
        [
          { text: "Não", style: "cancel" },
          {
            text: "Sim, Cancelar",
            style: "destructive",
            onPress: async () => {
              try {
                await rideService.cancel(rideId);
                Toast.show({ type: "success", text1: "Agendamento cancelado com sucesso" });
                await load();
              } catch (err: any) {
                Toast.show({
                  type: "error",
                  text1: "Não foi possível cancelar",
                  text2: err?.message || "Tente novamente",
                });
              }
            },
          },
        ]
      );
    }, 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos ativos</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
      >
        <Text style={styles.subtitle}>
          Acompanhe suas entregas e corridas em andamento quando quiser.
        </Text>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Carregando pedidos ativos...</Text>
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum pedido ativo</Text>
            <Text style={styles.emptyText}>Quando houver um pedido em andamento, ele aparece aqui.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.primaryBtnText}>Voltar para inicio</Text>
            </TouchableOpacity>
          </View>
        ) : (
          rides.map((ride) => (
            <View key={ride._id} style={[styles.rideCard, ride.isWaitingInQueue && { borderColor: "rgba(2,222,149,0.4)", borderWidth: 1.5 }]}>
              <View style={styles.cardTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialIcons 
                    name={ride.serviceType === "delivery" ? "local-shipping" : "local-taxi"} 
                    size={22} 
                    color={colors.primary[500]} 
                  />
                  <Text style={styles.rideType}>{rideTitle(ride)}</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {ride.isWaitingInQueue && (
                    <View style={{ backgroundColor: "rgba(239,68,68,0.12)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" }}>
                      <Text style={{ color: "#ef4444", fontSize: 9, fontWeight: "bold" }}>FILA DE ESPERA URGENTE</Text>
                    </View>
                  )}
                  <Text style={[styles.rideStatus, { color: ride.status === "requesting" ? "#02de95" : colors.primary[500] }]}>
                    {mapStatusLabel(ride.status)}
                  </Text>
                </View>
              </View>

              {/* Endereço de Coleta */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 10 }}>
                <MaterialIcons name="trip-origin" size={14} color="#02de95" />
                <Text style={[styles.address, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                  Coleta: {ride.pickup?.address || "-"}
                </Text>
              </View>

              {/* Endereço de Destino */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <MaterialIcons name="place" size={14} color="#ef4444" />
                <Text style={[styles.address, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                  Destino: {ride.dropoff?.address || "-"}
                </Text>
              </View>

              {/* Agendada para */}
              {!!ride.scheduledFor && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <MaterialIcons name="event" size={14} color={colors.text.tertiary} />
                  <Text style={[styles.address, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                    Agendada para: {new Date(ride.scheduledFor).toLocaleString("pt-BR")}
                  </Text>
                </View>
              )}

              {/* Valor / Oferta atual */}
              {(ride.negotiation?.enabled || (ride.pricing?.total || 0) > 0) && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, marginTop: 4 }}>
                  <MaterialIcons name="attach-money" size={14} color="#fbbf24" />
                  <Text style={[styles.address, { marginBottom: 0, color: "#fbbf24", fontWeight: "bold" }]} numberOfLines={1}>
                    Valor: {formatBRL(ride.negotiation?.finalAgreedPrice || ride.negotiation?.clientOffer || ride.pricing?.total || 0)}
                  </Text>
                </View>
              )}

              <View style={styles.cardActions}>
                {ride.negotiation?.enabled &&
                ["requesting", "driver_assigned"].includes(String(ride.status || "")) ? (
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: ride._id })}
                  >
                    <Text style={styles.trackBtnText}>Ver ofertas</Text>
                  </TouchableOpacity>
                ) : String(ride.status || "") === "scheduled" ? (
                  editingRideId === ride._id ? (
                    <View style={{ width: "100%", gap: 6 }}>
                      <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: "700", marginBottom: 2 }}>
                        Quer mesmo editar? O agendamento atual será cancelado para iniciar um novo.
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.trackBtn, { flex: 1, backgroundColor: "#02de95", borderColor: "#02de95" }]}
                          onPress={async () => {
                            try {
                              await rideService.cancel(ride._id, "Editado pelo cliente");
                              setEditingRideId(null);
                              navigation.navigate("Home", {
                                home_dropoff: ride.dropoff,
                                currentLocation: ride.pickup,
                                initialVehicle: ride.vehicleType,
                                initialService: ride.serviceType,
                              });
                            } catch (err: any) {
                              Toast.show({ type: "error", text1: "Não foi possível editar", text2: err?.message });
                            }
                          }}
                        >
                          <Text style={[styles.trackBtnText, { color: "#091A2F", fontWeight: "900" }]}>Confirmar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.trackBtn, { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.15)" }]}
                          onPress={() => setEditingRideId(null)}
                        >
                          <Text style={styles.trackBtnText}>Voltar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : cancellingRideId === ride._id ? (
                    <View style={{ width: "100%", gap: 6 }}>
                      <Text style={{ color: colors.text.secondary, fontSize: 12, fontWeight: "700", marginBottom: 2 }}>
                        Deseja realmente cancelar esta entrega agendada?
                      </Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={[styles.trackBtn, { flex: 1, backgroundColor: "rgba(239, 68, 68, 0.16)", borderColor: "rgba(239, 68, 68, 0.4)" }]}
                          onPress={async () => {
                            try {
                              await rideService.cancel(ride._id);
                              setCancellingRideId(null);
                              Toast.show({ type: "success", text1: "Agendamento cancelado com sucesso" });
                              await load();
                            } catch (err: any) {
                              Toast.show({ type: "error", text1: "Não foi possível cancelar", text2: err?.message });
                            }
                          }}
                        >
                          <Text style={[styles.trackBtnText, { color: "#ef4444", fontWeight: "900" }]}>Confirmar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.trackBtn, { flex: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.15)" }]}
                          onPress={() => setCancellingRideId(null)}
                        >
                          <Text style={styles.trackBtnText}>Voltar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={[styles.trackBtn, { flex: 1 }]}
                        onPress={() => {
                          setEditingRideId(ride._id);
                          setCancellingRideId(null);
                        }}
                      >
                        <MaterialIcons name="edit" size={14} color={colors.primary[500]} style={{ marginRight: 4 }} />
                        <Text style={styles.trackBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.trackBtn, { flex: 1, backgroundColor: "rgba(239, 68, 68, 0.12)", borderColor: "rgba(239, 68, 68, 0.4)" }]}
                        onPress={() => {
                          setCancellingRideId(ride._id);
                          setEditingRideId(null);
                        }}
                      >
                        <Text style={[styles.trackBtnText, { color: "#ef4444" }]}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )
                ) : (
                  <TouchableOpacity
                    style={styles.trackBtn}
                    onPress={() => navigation.navigate("RideTracking", { rideId: ride._id })}
                  >
                    <Text style={styles.trackBtnText}>Acompanhar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.secondaryBtnText}>Pedir nova corrida ou entrega</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  subtitle: { color: colors.text.tertiary, fontSize: fontSize.sm, lineHeight: 20 },
  emptyCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  emptyText: { color: colors.text.tertiary, fontSize: fontSize.sm },
  rideCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  rideType: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  rideStatus: { color: colors.primary[500], fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: "uppercase" },
  address: { color: colors.text.secondary, fontSize: fontSize.sm, marginBottom: 4 },
  cardActions: { marginTop: spacing.sm },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(2,222,149,0.16)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.4)",
  },
  trackBtnText: { color: colors.text.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
  },
  primaryBtnText: { color: "#052013", fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.08)",
    marginTop: spacing.sm,
  },
  secondaryBtnText: { color: colors.primary[500], fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});
