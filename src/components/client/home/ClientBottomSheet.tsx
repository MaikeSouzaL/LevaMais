import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MotiView } from "moti";
import { Car, Package, Star, Clock, Home, Briefcase, ChevronRight } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize } from "@/theme";

interface ClientBottomSheetProps {
  onSelectService: (
    service: "ride" | "delivery",
    options?: { preferScheduled?: boolean },
  ) => void;
  favorites: any[];
  onSelectFavorite: (fav: any) => void;
  onChangeSnap: (index: number) => void;
  availability?: {
    rideDrivers: number;
    deliveryDrivers: number;
    totalNearby: number;
  };
  availabilityLoading?: boolean;
  availabilityError?: string | null;
}

export const ClientBottomSheet = ({
  onSelectService,
  favorites = [],
  onSelectFavorite,
  onChangeSnap,
  availability,
  availabilityLoading = false,
  availabilityError = null,
}: ClientBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  // Snaps de 30% (inicial/fechado) e 75% (expandido)
  const snapPoints = useMemo(() => ["32%", "80%"], []);

  const renderHandle = useCallback(() => (
    <View style={styles.handleContainer}>
      <View style={styles.handleIndicator} />
    </View>
  ), []);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={onChangeSnap}
      handleComponent={renderHandle}
      backgroundStyle={styles.sheetBackground}
    >
      <BottomSheetScrollView contentContainerStyle={styles.container}>
        
        {/* 🚀 Main Services (ALWAYS VISIBLE) */}
        <View style={styles.servicesGrid}>
          <TouchableOpacity 
            style={[
              styles.serviceCard, 
              styles.primaryCard,
              availability && availability.rideDrivers <= 0 && styles.serviceCardDisabled,
            ]} 
            onPress={() => onSelectService("ride")}
            disabled={Boolean(availability && availability.rideDrivers <= 0)}
            activeOpacity={0.85}
          >
            <View style={styles.glowOverlay} />
            <View style={[styles.iconCircle, { backgroundColor: "rgba(2, 222, 149, 0.15)" }]}>
              <Car size={32} color={colors.primary[500]} strokeWidth={1.5} />
            </View>
            <Text style={styles.serviceTitle}>Corrida</Text>
            <Text style={styles.serviceDesc}>Viagens seguras e rapidas</Text>
            {!!availability && (
              <Text style={styles.availabilityText}>
                {availability.rideDrivers} motoristas proximos
              </Text>
            )}
            {!!availability && availability.rideDrivers <= 0 && (
              <Text style={styles.unavailableText}>
                Indisponivel agora nesta regiao
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.serviceCard,
              availability && availability.deliveryDrivers <= 0 && styles.serviceCardDisabled,
            ]} 
            onPress={() => onSelectService("delivery")}
            disabled={Boolean(availability && availability.deliveryDrivers <= 0)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
              <Package size={30} color="#38bdf8" strokeWidth={1.5} />
            </View>
            <Text style={styles.serviceTitle}>Entrega</Text>
            <Text style={styles.serviceDesc}>Envie pacotes agora</Text>
            {!!availability && (
              <Text style={styles.availabilityText}>
                {availability.deliveryDrivers} entregadores proximos
              </Text>
            )}
            {!!availability && availability.deliveryDrivers <= 0 && (
              <Text style={styles.unavailableText}>
                Indisponivel agora nesta regiao
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {availabilityLoading && (
          <View style={styles.availabilityBanner}>
            <Text style={styles.availabilityBannerText}>
              Verificando disponibilidade de motoristas...
            </Text>
          </View>
        )}

        {!!availabilityError && !availabilityLoading && (
          <View style={styles.availabilityBanner}>
            <Text style={styles.warningText}>
              {availabilityError}
            </Text>
          </View>
        )}

        {!!availability && (
          <View style={styles.availabilityBanner}>
            <Text style={styles.availabilityBannerText}>
              Disponibilidade local agora: {availability.totalNearby} motoristas online
            </Text>
            {availability.rideDrivers === 0 && (
              <View style={styles.warningRow}>
                <Text style={styles.warningText}>
                  Corrida com baixa oferta no momento.
                </Text>
                <TouchableOpacity
                  style={styles.warningCta}
                  activeOpacity={0.85}
                  onPress={() => onSelectService("ride")}
                >
                  <Text style={styles.warningCtaText}>Tentar</Text>
                </TouchableOpacity>
              </View>
            )}
            {availability.deliveryDrivers === 0 && (
              <View style={styles.warningRow}>
                <Text style={styles.warningText}>
                  Entrega com baixa oferta no momento.
                </Text>
                <TouchableOpacity
                  style={styles.warningCta}
                  activeOpacity={0.85}
                  onPress={() =>
                    onSelectService("delivery", { preferScheduled: true })
                  }
                >
                  <Text style={styles.warningCtaText}>Agendar</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.divider} />

        {/* 🕒 Recent Searches / Detailed Favorites */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Locais recentes</Text>
        </View>

        <View style={styles.listContainer}>
          {/* Example item - will load from favorites if present */}
          {favorites.length > 0 ? favorites.map((item, idx) => (
            <TouchableOpacity 
              key={item._id || idx} 
              style={styles.listItem} 
              activeOpacity={0.7}
              onPress={() => onSelectFavorite(item)}
            >
              <View style={styles.listIconWrap}>
                <Clock size={18} color={colors.text.tertiary} />
              </View>
              <View style={styles.listTextWrap}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.name || item.address}</Text>
                <Text style={styles.itemSub} numberOfLines={1}>{item.formattedAddress || item.address}</Text>
              </View>
              <ChevronRight size={18} color={colors.text.disabled} />
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyState}>
              <Clock size={40} color={colors.text.disabled} strokeWidth={1} />
              <Text style={styles.emptyText}>Nenhuma viagem recente ainda.</Text>
            </View>
          )}
        </View>

      </BottomSheetScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#091A2F", // Brand Dark Core
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 24,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  servicesGrid: {
    flexDirection: "row",
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  serviceCard: {
    flex: 1,
    height: 140,
    backgroundColor: "#11253E", // Surface Primary
    borderRadius: 24,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  serviceCardDisabled: {
    opacity: 0.5,
  },
  primaryCard: {
    borderColor: "rgba(2, 222, 149, 0.15)",
  },
  glowOverlay: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(2, 222, 149, 0.05)",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "auto",
  },
  serviceTitle: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 2,
  },
  serviceDesc: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: "500",
  },
  availabilityText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  unavailableText: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3,
  },
  availabilityBanner: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  availabilityBannerText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
  warningRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.28)",
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  warningText: {
    flex: 1,
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
  },
  warningCta: {
    backgroundColor: "rgba(2,222,149,0.2)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.45)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  warningCtaText: {
    color: "#02de95",
    fontSize: 11,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  shortcutsContainer: {
    gap: spacing.sm,
  },
  pillShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  listContainer: {
    gap: spacing.xs,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  listIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  listTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemTitle: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  itemSub: {
    color: colors.text.tertiary,
    fontSize: 13,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.sm,
    opacity: 0.6,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  }
});
