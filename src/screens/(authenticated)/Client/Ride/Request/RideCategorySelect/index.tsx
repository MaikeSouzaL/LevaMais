import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { ChevronLeft, Users, Check, Plus, X } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { GlobalMap } from "@/components/GlobalMap";
import RoutePin from "@/components/maps/RoutePin";
import StopPin from "@/components/maps/StopPin";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PlaceDetails } from "@/services/googlePlaces.service";
import rideService, { RideCategoryOption } from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";
import { ClientStackParamList } from "../../../types/navigation";

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v || 0));

type Coord = { address?: string; latitude: number; longitude: number };

export default function RideCategorySelectScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "RideCategorySelect">>();
  const insets = useSafeAreaInsets();
  const params = (route.params as any) || {};

  const pickup: Coord = params.pickup;
  const dropoff: Coord = params.dropoff;
  const [stops, setStops] = useState<Coord[]>(Array.isArray(params.stops) ? params.stops : []);
  const routeCoordinates: Array<{ latitude: number; longitude: number }> =
    Array.isArray(params.routeCoordinates) ? params.routeCoordinates : [];
  const cityId = useClientCityStore((s) => (s as any)?.city?.id || (s as any)?.city?._id);

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<RideCategoryOption[]>([]);
  const [distanceText, setDistanceText] = useState("");
  const [durationText, setDurationText] = useState("");
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
        // Com paradas, ignora a distância pré-computada (A→B) e recalcula a rota completa.
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
  }, [stops]);

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
      initialDistanceKm: params.initialDistanceKm,
      initialDurationMin: params.initialDurationMin,
    } as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Mapa no topo */}
      <View style={styles.mapWrap}>
        <GlobalMap
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          useDarkStyle
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
            <Polyline coordinates={routeCoordinates} strokeColor="#02de95" strokeWidth={4} lineCap="round" lineJoin="round" />
          )}
          {!!pickup && (
            <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <RoutePin variant="pickup" />
            </Marker>
          )}
          {stops.map((s, i) => (
            <Marker key={`stop-${i}`} coordinate={{ latitude: s.latitude, longitude: s.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <StopPin index={i + 1} />
            </Marker>
          ))}
          {!!dropoff && (
            <Marker coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }} anchor={{ x: 0.5, y: 1 }}>
              <RoutePin variant="dropoff" />
            </Marker>
          )}
        </GlobalMap>

        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>

        {!!distanceText && (
          <View style={[styles.routePill, { top: insets.top + 10 }]}>
            <MaterialIcons name="near-me" size={13} color="#02de95" />
            <Text style={styles.routePillText}>
              {distanceText}
              {durationText ? ` • ${durationText}` : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Detalhes do endereço (em cima) */}
      <View style={styles.addressCard}>
        <View style={styles.addressRow}>
          <View style={[styles.addressDot, { backgroundColor: "#60a5fa" }]} />
          <Text style={styles.addressText} numberOfLines={1}>
            {pickup?.address || "Embarque"}
          </Text>
        </View>
        <View style={styles.addressDivider} />
        {stops.map((s, i) => (
          <View key={`stoprow-${i}`}>
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: "#02de95" }]} />
              <Text style={styles.addressStopText} numberOfLines={1}>
                Parada {i + 1}: {s.address || "—"}
              </Text>
              <TouchableOpacity onPress={() => handleRemoveStop(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="#ef4444" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            <View style={styles.addressDivider} />
          </View>
        ))}
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={15} color="#ef4444" />
          <Text style={styles.addressText} numberOfLines={1}>
            {dropoff?.address || "Destino"}
          </Text>
        </View>

        {stops.length < 3 && (
          <TouchableOpacity style={styles.addStopBtn} onPress={() => setStopModalOpen(true)} activeOpacity={0.8}>
            <Plus size={15} color="#02de95" strokeWidth={3} />
            <Text style={styles.addStopText}>Adicionar parada</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lista de categorias com valores (em baixo) */}
      <Text style={styles.sectionTitle}>Escolha sua categoria</Text>
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#02de95" size="large" />
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
                  <MaterialIcons
                    name={cat.vehicleType === "motorcycle" ? "two-wheeler" : "directions-car"}
                    size={26}
                    color={active ? "#091A2F" : "#02de95"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.catLabel}>{cat.label}</Text>
                  <Text style={styles.catDesc} numberOfLines={1}>
                    {cat.description}
                  </Text>
                  <View style={styles.catMetaRow}>
                    <Users size={11} color="rgba(255,255,255,0.45)" />
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
                      <Check size={13} color="#091A2F" strokeWidth={3.5} />
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
          <MaterialIcons name="arrow-forward" size={20} color="#091A2F" />
        </TouchableOpacity>
      </View>

      {/* Modal: adicionar parada */}
      <Modal visible={stopModalOpen} transparent animationType="slide" onRequestClose={() => setStopModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar parada</Text>
              <TouchableOpacity onPress={() => setStopModalOpen(false)} style={styles.modalClose}>
                <X size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>A parada entra no trajeto e recalcula o preço.</Text>
            <AddressAutocomplete
              query={stopQuery}
              setQuery={setStopQuery}
              placeholder="Buscar endereço da parada..."
              onSelect={(details) => handleAddStop(details)}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#091A2F" },
  mapWrap: { height: 240, width: "100%", position: "relative" },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(9,26,47,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  routePill: {
    position: "absolute",
    right: 16,
    backgroundColor: "rgba(9,26,47,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.25)",
  },
  routePillText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  addressCard: {
    backgroundColor: "#11253E",
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  addressDot: { width: 10, height: 10, borderRadius: 5 },
  addressText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
  addressStopText: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  addressDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 8, marginLeft: 20 },
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
    borderColor: "rgba(2,222,149,0.6)",
  },
  addStopText: { color: "#02de95", fontSize: 13, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#0c1c2f",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    minHeight: 340,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  modalClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  modalHint: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 14 },
  sectionTitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 18,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  loadingText: { color: "rgba(255,255,255,0.6)", marginTop: 10, fontSize: 13 },
  catCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#11253E",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
  },
  catCardActive: { borderColor: "#02de95", backgroundColor: "rgba(2,222,149,0.08)" },
  catIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(2,222,149,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  catIconActive: { backgroundColor: "#02de95" },
  catLabel: { color: "#fff", fontSize: 15, fontWeight: "900" },
  catDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 1 },
  catMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  catMeta: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700" },
  catAvailable: { color: "#02de95", fontSize: 11, fontWeight: "800" },
  catUnavailable: { color: "#f59e0b", fontSize: 11, fontWeight: "800" },
  catPrice: { color: "#02de95", fontSize: 16, fontWeight: "900" },
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
    backgroundColor: "#091A2F",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
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
  confirmText: { color: "#091A2F", fontSize: 15, fontWeight: "900" },
});
