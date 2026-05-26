import React, { useMemo, useRef, useCallback } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MotiView } from "moti";
import { Car, Package, Star, Clock, Home, Briefcase, ChevronRight, Wallet, HelpCircle } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize } from "@/theme";

interface ClientBottomSheetProps {
  onSelectService: (
    service: "ride" | "delivery",
    options?: { preferScheduled?: boolean },
  ) => void;
  onActiveOrdersPress?: () => void;
  onWalletPress?: () => void;
  onSupportPress?: () => void;
  activeOrdersCount?: number;
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
  onActiveOrdersPress,
  onWalletPress,
  onSupportPress,
  activeOrdersCount = 0,
  favorites = [],
  onSelectFavorite,
  onChangeSnap,
  availability,
  availabilityLoading = false,
  availabilityError = null,
}: ClientBottomSheetProps) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  
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
        
        {/* Main Services */}
        <View style={styles.servicesGrid}>
          <TouchableOpacity 
            style={[
              styles.serviceCard, 
              styles.primaryCard,
            ]} 
            onPress={() => onSelectService("ride")}
            activeOpacity={0.85}
          >
            <View style={styles.glowOverlay} />
            <View style={[styles.iconCircle, { backgroundColor: "rgba(2, 222, 149, 0.15)" }]}>
              <Car size={32} color={colors.primary[500]} strokeWidth={1.5} />
            </View>
            <Text style={styles.serviceTitle}>Corrida</Text>
            <Text style={styles.serviceDesc} numberOfLines={1}>Rapidas e Seguras</Text>
            {!!availability && (
              <Text style={styles.availabilityText}>
                {availability.rideDrivers} motoristas proximos
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.serviceCard} 
            onPress={() => onSelectService("delivery")}
            activeOpacity={0.85}
          >
            <View style={[styles.iconCircle, { backgroundColor: "rgba(56, 189, 248, 0.15)" }]}>
              <Package size={30} color="#38bdf8" strokeWidth={1.5} />
            </View>
            <Text style={styles.serviceTitle}>Entrega</Text>
            <Text style={styles.serviceDesc} numberOfLines={1}>Envie pacotes agora</Text>
            {!!availability && (
              <Text style={styles.availabilityText}>
                {availability.deliveryDrivers} entregadores proximos
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Quick Links */}
        {(onActiveOrdersPress || onWalletPress || onSupportPress) && (
          <View style={styles.quickLinksContainer}>
            {onActiveOrdersPress && (
              <TouchableOpacity style={styles.quickLinkItem} onPress={onActiveOrdersPress} activeOpacity={0.7}>
                <View style={styles.quickLinkIcon}>
                  <Clock size={18} color="#02de95" />
                  {activeOrdersCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{activeOrdersCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickLinkLabel}>Pedidos Ativos</Text>
              </TouchableOpacity>
            )}
            {onWalletPress && (
              <TouchableOpacity style={styles.quickLinkItem} onPress={onWalletPress} activeOpacity={0.7}>
                <View style={styles.quickLinkIcon}>
                  <Wallet size={18} color="#02de95" />
                </View>
                <Text style={styles.quickLinkLabel}>Carteira</Text>
              </TouchableOpacity>
            )}
            {onSupportPress && (
              <TouchableOpacity style={styles.quickLinkItem} onPress={onSupportPress} activeOpacity={0.7}>
                <View style={styles.quickLinkIcon}>
                  <HelpCircle size={18} color="#02de95" />
                </View>
                <Text style={styles.quickLinkLabel}>Suporte</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Recent Searches / Detailed Favorites */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Locais recentes</Text>
        </View>

        <View style={styles.listContainer}>
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
    backgroundColor: "#091A2F",
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
    height: 148,
    backgroundColor: "#11253E",
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
  quickLinksContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  quickLinkItem: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  quickLinkIcon: {
    position: "relative",
    marginBottom: 6,
  },
  quickLinkLabel: {
    color: colors.text.secondary,
    fontSize: 11,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    backgroundColor: "#F59E0B",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#091A2F",
    fontSize: 9,
    fontWeight: "900",
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
