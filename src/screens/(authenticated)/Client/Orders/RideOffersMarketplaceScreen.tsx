import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import rideService, { RideOffer } from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";

function resolveDriverId(offer: RideOffer) {
  if (typeof offer.driverId === "string") return offer.driverId;
  return offer.driverId?._id || "";
}

function resolveDriverName(offer: RideOffer) {
  if (typeof offer.driverId === "string") return "Motorista";
  return offer.driverId?.name || "Motorista";
}

export default function RideOffersMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = String(route.params?.rideId || "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);

  const load = useCallback(async () => {
    if (!rideId) return;
    const data = await rideService.getOffers(rideId);
    setNegotiation(data.negotiation);
    setOffers((data.offers || []).filter((offer) => offer.status !== "rejected"));
  }, [rideId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await load();
      } catch (e: any) {
        if (!mounted) return;
        Toast.show({
          type: "error",
          text1: "Erro ao carregar ofertas",
          text2: e?.response?.data?.error || e?.message || "Tente novamente",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const interval = setInterval(() => {
      load().catch(() => {});
    }, 8000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [offers]);

  const selectOffer = async (offer: RideOffer) => {
    const driverId = resolveDriverId(offer);
    if (!driverId) return;

    setSelectingId(driverId);
    try {
      await rideService.selectOffer(rideId, driverId);
      Toast.show({
        type: "success",
        text1: "Oferta selecionada",
        text2: "Aguardando confirmacao do motorista.",
      });
      navigation.navigate("SearchingDriver", { rideId });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao selecionar oferta",
        text2: e?.response?.data?.error || e?.message || "Tente novamente",
      });
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ofertas de motoristas</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Sua oferta</Text>
          <Text style={styles.heroValue}>{formatBRL(Number(negotiation?.clientOffer || 0))}</Text>
          <Text style={styles.heroSub}>
            Minimo sugerido pelo app para motoristas: {formatBRL(Number(negotiation?.suggestedMinPrice || 0))}
          </Text>
        </View>

        {loading ? (
          <View style={styles.emptyCard}><Text style={styles.emptyText}>Carregando ofertas...</Text></View>
        ) : sortedOffers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sem ofertas por enquanto</Text>
            <Text style={styles.emptyText}>Aguarde alguns instantes e atualize para ver novas propostas.</Text>
          </View>
        ) : (
          sortedOffers.map((offer) => {
            const driverId = resolveDriverId(offer);
            const selected = selectingId === driverId;
            return (
              <View key={`${driverId}-${offer.createdAt || "offer"}`} style={styles.offerCard}>
                <View style={styles.offerTop}>
                  <Text style={styles.driverName}>{resolveDriverName(offer)}</Text>
                  <Text style={styles.offerAmount}>{formatBRL(Number(offer.amount || 0))}</Text>
                </View>
                <Text style={styles.offerStatus}>Tipo: {offer.status === "accepted" ? "Aceitou sua oferta" : "Contraoferta"}</Text>
                {!!offer.message && <Text style={styles.offerMessage}>{offer.message}</Text>}

                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => selectOffer(offer)}
                  disabled={selected}
                  activeOpacity={0.85}
                >
                  <Text style={styles.selectText}>{selected ? "Selecionando..." : "Selecionar esta oferta"}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
  headerTitle: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  hero: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  heroLabel: { color: colors.text.tertiary, fontSize: fontSize.xs, textTransform: "uppercase" },
  heroValue: { color: colors.primary[500], fontSize: 34, fontWeight: fontWeight.bold, marginTop: spacing.xs },
  heroSub: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  emptyCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  emptyTitle: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  emptyText: { color: colors.text.tertiary, marginTop: spacing.xs },
  offerCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  offerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  driverName: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  offerAmount: { color: colors.primary[500], fontWeight: fontWeight.bold, fontSize: fontSize.lg },
  offerStatus: { color: colors.text.secondary, fontSize: fontSize.sm },
  offerMessage: { color: colors.text.tertiary, fontSize: fontSize.sm },
  selectBtn: {
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(2,222,149,0.16)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.4)",
  },
  selectText: { color: colors.text.primary, fontWeight: fontWeight.bold },
});
