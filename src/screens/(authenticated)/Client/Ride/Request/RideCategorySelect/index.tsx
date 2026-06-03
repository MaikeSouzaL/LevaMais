import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Icon } from "@/components/ui/Icon";
import { ChevronLeft, Users, Check, Plus, X, ArrowUp, ArrowDown } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { GlobalMap } from "@/components/GlobalMap";
import RoutePin from "@/components/maps/RoutePin";
import StopPin from "@/components/maps/StopPin";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PlaceDetails } from "@/services/googlePlaces.service";
import rideService, { RideCategoryOption } from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";
import { decodePolyline } from "@/utils/polyline";
import { ClientStackParamList } from "../../../types/navigation";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

type Coord = { address?: string; latitude: number; longitude: number };

const AddressPin = ({ color, label }: { color: string; label?: string | number }) => (
  <View style={{ alignItems: "center", width: 18, height: 22, justifyContent: "flex-start", marginRight: 6 }}>
    <View style={{
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: color,
      borderWidth: 1.5,
      borderColor: "#fff",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {label !== undefined && (
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900", lineHeight: 11, textAlign: "center" }}>
          {label}
        </Text>
      )}
    </View>
    <View style={{
      width: 0,
      height: 0,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 6,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: color,
      marginTop: -1,
    }} />
  </View>
);

export default function RideCategorySelectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "RideCategorySelect">>();
  const insets = useSafeAreaInsets();
  const params = (route.params as any) || {};

  const pickup: Coord = params.pickup;
  const dropoff: Coord = params.dropoff;
  const [stops, setStops] = useState<Coord[]>(Array.isArray(params.stops) ? params.stops : []);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>(
    Array.isArray(params.routeCoordinates) ? params.routeCoordinates : []
  );
  const cityId = useClientCityStore((s) => (s as any)?.city?.id || (s as any)?.city?._id);

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<RideCategoryOption[]>([]);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
  const [routeMeta, setRouteMeta] = useState<{ distanceKm: number; durationMin: number }>({ distanceKm: 0, durationMin: 0 });
  const [selected, setSelected] = useState<RideCategoryOption | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [stopQuery, setStopQuery] = useState("");

  const handleAddStop = (details: PlaceDetails) => {
    if (stops.length >= 3) {
      Toast.show({ type: "info", text1: "Limite de 3 paradas" });
      return;
    }
    setStops((prev) => [
      ...prev,
      { address: details.formattedAddress, latitude: details.latitude, longitude: details.longitude },
    ]);
    setStopQuery("");
    setStopModalOpen(false);
  };

  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // 1. Recalculate route polyline with stops if stops exist or route is recalculated
        const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
        if (key && pickup && dropoff) {
          const originCoords = `${pickup.latitude},${pickup.longitude}`;
          const destinationCoords = `${dropoff.latitude},${dropoff.longitude}`;
          
          let waypointsQuery = "";
          if (stops.length > 0) {
            const wpString = stops.map((s) => `${s.latitude},${s.longitude}`).join("|");
            waypointsQuery = `&waypoints=${encodeURIComponent(wpString)}`;
          }

          const url =
            `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
              originCoords,
            )}&destination=${encodeURIComponent(destinationCoords)}${waypointsQuery}` +
            `&mode=driving&key=${encodeURIComponent(key)}`;

          const res = await fetch(url);
          const data = await res.json();
          if (mounted) {
            const points = data?.routes?.[0]?.overview_polyline?.points;
            if (points) {
              const decoded = decodePolyline(points);
              setRouteCoordinates(decoded);
            }
          }
        }

        // 2. Calculate category options
        const hasStops = stops.length > 0;
        const resp = await rideService.calculateRideCategories({
          pickup: { address: pickup?.address || "", latitude: pickup.latitude, longitude: pickup.longitude },
          dropoff: { address: dropoff?.address || "", latitude: dropoff.latitude, longitude: dropoff.longitude },
          stops: stops.map((s) => ({ address: s.address || "", latitude: s.latitude, longitude: s.longitude })),
          cityId,
          distance:
            !hasStops && typeof params.initialDistanceKm === "number"
              ? params.initialDistanceKm * 1000
              : undefined,
          duration:
            !hasStops && typeof params.initialDurationMin === "number"
              ? params.initialDurationMin * 60
              : undefined,
        });
        if (!mounted) return;
        setCategories(resp.categories || []);
        setDistanceText(resp.distance?.text || "");
        setDurationText(resp.duration?.text || "");
        setRouteMeta({
          distanceKm: Number(resp.distance?.value || 0) / 1000,
          durationMin: Math.max(1, Math.ceil(Number(resp.duration?.value || 0) / 60)),
        });
        // Mantém a categoria selecionada se ainda existir; senão escolhe disponível/economy.
        setSelected((prev) => {
          if (prev) {
            const same = resp.categories?.find((c) => c.category === prev.category);
            if (same) return same;
          }
          return (
            resp.categories?.find((c) => c.available) ||
            resp.categories?.find((c) => c.category === "car_economy") ||
            resp.categories?.[0] ||
            null
          );
        });
      } catch (e: any) {
        Toast.show({ type: "error", text1: "Erro ao calcular", text2: e?.message });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, pickup, dropoff]);

  const handleMoveStopUp = (index: number) => {
    if (index === 0) return;
    setStops((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
  };

  const handleMoveStopDown = (index: number) => {
    if (index === stops.length - 1) return;
    setStops((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
  };

  const fitCoords = useMemo(() => {
    const pts: Array<{ latitude: number; longitude: number }> = [];
    if (pickup) pts.push({ latitude: pickup.latitude, longitude: pickup.longitude });
    stops.forEach((s) => pts.push({ latitude: s.latitude, longitude: s.longitude }));
    if (dropoff) pts.push({ latitude: dropoff.latitude, longitude: dropoff.longitude });
    return pts;
  }, [pickup, dropoff, stops]);

  const handleMapReady = () => {
    if (fitCoords.length >= 2) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(fitCoords, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 400);
    }
  };

  const handleContinue = () => {
    if (!selected) return;
    navigation.navigate("RideBidSetup", {
      pickup,
      dropoff,
      stops,
      // Com paradas, a rota reta A→B fica obsoleta; deixa o destino reconstruir via paradas.
      routeCoordinates: stops.length > 0 ? undefined : routeCoordinates,
      vehicleType: selected.vehicleType,
      rideCategory: selected.category,
      presetOffer: selected.pricing.total,
      // Preço JÁ calculado da categoria — usado como "preço sugerido" no RideBidSetup
      // (evita divergência com o motor antigo de estimativa).
      category: {
        key: selected.category,
        label: selected.label,
        total: selected.pricing.total,
        basePrice: selected.pricing.basePrice,
        distancePrice: selected.pricing.distancePrice,
        distanceKm: routeMeta.distanceKm,
        durationMin: routeMeta.durationMin,
      },
      initialDistanceKm: routeMeta.distanceKm || params.initialDistanceKm,
      initialDurationMin: routeMeta.durationMin || params.initialDurationMin,
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header com seta de voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("DestinationSearch", { clearRoute: true })} style={styles.headerBackBtn} activeOpacity={0.7}>
          <ChevronLeft size={24} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar Viagem</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mapa no topo */}
      <View style={styles.mapWrap}>
        <GlobalMap
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          useDarkStyle={false}
          showsUserLocation={false}
          initialRegion={{
            latitude: pickup?.latitude || -23.5505,
            longitude: pickup?.longitude || -46.6333,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          onMapReady={handleMapReady}
        >
          {routeCoordinates.length >= 2 && (
            <Polyline coordinates={routeCoordinates} strokeColor="#0F172A" strokeWidth={5} lineCap="round" lineJoin="round" />
          )}
          {!!pickup && (
            <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }} anchor={{ x: 0.35, y: 0.75 }}>
              <RoutePin variant="pickup" />
            </Marker>
          )}
          {stops.map((s, i) => (
            <Marker key={`stop-${i}`} coordinate={{ latitude: s.latitude, longitude: s.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <StopPin index={i + 1} />
            </Marker>
          ))}
          {!!dropoff && (
            <Marker coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }} anchor={{ x: 0.35, y: 0.75 }}>
              <RoutePin variant="dropoff" />
            </Marker>
          )}
        </GlobalMap>

        {loading ? (
          <View style={[styles.routePill, { top: 12 }]}>
            <ActivityIndicator size="small" color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.routePillText}>Calculando...</Text>
          </View>
        ) : !!distanceText ? (
          <View style={[styles.routePill, { top: 12 }]}>
            <Icon name="near-me" size={13} color="#059669" />
            <Text style={styles.routePillText}>
              {distanceText}
              {durationText ? ` • ${durationText}` : ""}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Detalhes do endereço (em cima) */}
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <AddressPin color="#02de95" />
          <Text style={styles.addressText} numberOfLines={1}>
            {pickup?.address || "Embarque"}
          </Text>
        </View>
        <View style={styles.addressDivider} />
        {stops.map((s, i) => (
          <View key={`stoprow-${i}`}>
            <View style={styles.addressRow}>
              <AddressPin color="#F59E0B" label={i + 1} />
              <Text style={styles.addressStopText} numberOfLines={1}>
                Parada {i + 1}: {s.address || "—"}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginRight: 8 }}>
                {i > 0 && (
                  <TouchableOpacity
                    onPress={() => handleMoveStopUp(i)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(5, 150, 105, 0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowUp size={15} color="#059669" strokeWidth={3} />
                  </TouchableOpacity>
                )}
                {i < stops.length - 1 && (
                  <TouchableOpacity
                    onPress={() => handleMoveStopDown(i)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: "rgba(5, 150, 105, 0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ArrowDown size={15} color="#059669" strokeWidth={3} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveStop(i)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color="#ef4444" strokeWidth={3} />
              </TouchableOpacity>
            </View>
            <View style={styles.addressDivider} />
          </View>
        ))}
        <View style={styles.addressRow}>
          <AddressPin color="#ef4444" />
          <Text style={styles.addressText} numberOfLines={1}>
            {dropoff?.address || "Destino"}
          </Text>
        </View>

        {stops.length < 3 && (
          <TouchableOpacity style={styles.addStopBtn} onPress={() => setStopModalOpen(true)} activeOpacity={0.8}>
            <Plus size={15} color="#059669" strokeWidth={3} />
            <Text style={styles.addStopText}>Adicionar parada</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de categorias com valores (em baixo) */}
      <Text style={styles.sectionTitle}>Escolha sua categoria</Text>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#059669" size="large" />
          <Text style={styles.loadingText}>Calculando preços...</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => {
            const active = selected?.category === cat.category;
            return (
              <TouchableOpacity
                key={cat.category}
                activeOpacity={0.85}
                onPress={() => setSelected(cat)}
                style={[styles.catCard, active && styles.catCardActive]}
              >
                <View style={[styles.catIcon, active && styles.catIconActive]}>
                  <Icon
                    name={cat.vehicleType === "motorcycle" ? "two-wheeler" : "directions-car"}
                    size={26}
                    color={active ? "#FFFFFF" : "#64748B"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catDesc} numberOfLines={1}>
                    {cat.description}
                  </Text>
                  <View style={styles.catMetaRow}>
                    <Users size={11} color="#64748B" />
                    <Text style={styles.catMeta}>{cat.maxPassengers}</Text>
                    {cat.available === false ? (
                      <Text style={styles.catUnavailable}>• Sem motoristas perto</Text>
                    ) : cat.availableCount && cat.availableCount > 0 ? (
                      <Text style={styles.catAvailable}>
                        • {cat.availableCount} perto
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.catPrice}>{formatBRL(cat.pricing.total)}</Text>
                  {active && (
                    <View style={styles.catCheck}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3.5} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Rodapé */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.9}
        >
          <Text style={styles.confirmText}>
            {selected ? `Continuar • ${formatBRL(selected.pricing.total)}` : "Selecione uma categoria"}
          </Text>
          <Icon name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Modal: adicionar parada */}
      <Modal visible={stopModalOpen} transparent animationType="slide" onRequestClose={() => setStopModalOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Adicionar parada</Text>
                <TouchableOpacity onPress={() => setStopModalOpen(false)} style={styles.modalClose}>
                  <X size={20} color="#475569" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalHint}>A parada entra no trajeto e recalcula o preço.</Text>
              <AddressAutocomplete
                query={stopQuery}
                setQuery={setStopQuery}
                placeholder="Buscar endereço da parada..."
                onSelect={(details) => handleAddStop(details)}
                theme="light"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 16,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
  },
  mapWrap: { height: 240, width: "100%", position: "relative" },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  routePill: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  routePillText: { color: "#0F172A", fontSize: 12, fontWeight: "800" },
  addressCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addressDot: { width: 10, height: 10, borderRadius: 5 },
  addressText: { flex: 1, color: "#0F172A", fontSize: 13, fontWeight: "700" },
  addressStopText: { flex: 1, color: "#334155", fontSize: 12, fontWeight: "600" },
  addressDivider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 8, marginLeft: 20 },
  addStopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#059669",
    backgroundColor: "#ECFDF5",
  },
  addStopText: { color: "#059669", fontSize: 13, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15,23,42,0.3)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 340,
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900" },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  modalHint: { color: "#475569", fontSize: 12, marginBottom: 14 },
  sectionTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  loadingText: { color: "#64748B", marginTop: 10, fontSize: 13 },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  catCardActive: { borderColor: "#02de95", backgroundColor: "rgba(2,222,149,0.06)" },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  catIconActive: { backgroundColor: "#02de95", borderColor: "#02de95" },
  catLabel: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
  catDesc: { color: "#475569", fontSize: 12, marginTop: 1 },
  catMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  catMeta: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  catAvailable: { color: "#059669", fontSize: 11, fontWeight: "800" },
  catUnavailable: { color: "#d97706", fontSize: 11, fontWeight: "800" },
  catPrice: { color: "#059669", fontSize: 16, fontWeight: "900" },
  catCheck: {
    marginTop: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  confirmBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: "#02de95",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: "rgba(2,222,149,0.3)" },
  confirmText: { color: "#0F172A", fontSize: 15, fontWeight: "900" },
});
