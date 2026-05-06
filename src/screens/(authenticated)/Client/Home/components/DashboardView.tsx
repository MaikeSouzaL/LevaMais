import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import purposeService from "@/services/purpose.service";
import {
  buildModeCounts,
  formatModeSummary,
  inferPurposeServiceMode,
} from "../../Shared/utils";

type DashboardViewProps = {
  userAddress: string;
  destinationAddress?: string;
  onPressAddress: () => void;
  onPressDestination: () => void;
  onPressMenu: () => void;
  onSelectFlow: (vehicleId: string, serviceId?: string) => void;
  onSelectFavorite: (fav: FavoriteAddress) => void;
  onDefaultAddressFound?: (address: string) => void;
  onPressAddFavorite: () => void;
  refreshTrigger?: number;
  activeOrdersCount?: number;
  onPressActiveOrders?: () => void;
};

type VehicleCardData = {
  id: "motorcycle" | "car" | "van" | "truck";
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  servicesCount: number;
  rideCount: number;
  deliveryCount: number;
  freteCount: number;
  modeSummary: string;
  defaultServiceId?: string;
};

const VEHICLE_BASE: Array<Pick<VehicleCardData, "id" | "label" | "description" | "icon">> = [
  { id: "motorcycle", label: "Moto", description: "Entrega rapida e economica", icon: "motorbike" },
  { id: "car", label: "Carro", description: "Corridas e entregas de medio porte", icon: "car" },
  { id: "van", label: "Van", description: "Volumes maiores e multiplos itens", icon: "van-utility" },
  { id: "truck", label: "Caminhao", description: "Frete pesado e mudancas", icon: "truck" },
];

export const DashboardView = ({
  userAddress,
  destinationAddress,
  onPressAddress,
  onPressDestination,
  onPressMenu,
  onPressAddFavorite,
  activeOrdersCount = 0,
  onPressActiveOrders,
  onSelectFlow,
  onSelectFavorite,
  onDefaultAddressFound,
  refreshTrigger,
}: DashboardViewProps) => {
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleCardData[]>(
    VEHICLE_BASE.map((v) => ({
      ...v,
      servicesCount: 0,
      rideCount: 0,
      deliveryCount: 0,
      freteCount: 0,
      modeSummary: "Sem servicos ativos",
    })),
  );

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingFavorites(true);
      try {
        const list = await favoriteAddressService.list();
        if (!mounted) return;

        const ordered = [...(list || [])].sort((a, b) => {
          const aName = String(a.name || "").toLowerCase();
          const bName = String(b.name || "").toLowerCase();
          if (aName === "casa") return -1;
          if (bName === "casa") return 1;
          return aName.localeCompare(bName);
        });

        setFavorites(ordered);

      } catch {
        if (mounted) setFavorites([]);
      } finally {
        if (mounted) setLoadingFavorites(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger, onDefaultAddressFound]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingVehicles(true);
      try {
        const purposes = await purposeService.getAll(true);
        if (!mounted) return;

        const enriched = VEHICLE_BASE.map((vehicle) => {
          const services = (purposes || []).filter((p) => p.vehicleType === vehicle.id);
          const modeCounts = buildModeCounts(services);

          const prioritized = [...services].sort((a, b) => {
            const priority = (mode: string) =>
              mode === "ride" ? 0 : mode === "delivery" ? 1 : 2;
            return priority(inferPurposeServiceMode(a)) - priority(inferPurposeServiceMode(b));
          });

          return {
            ...vehicle,
            servicesCount: services.length,
            rideCount: modeCounts.ride,
            deliveryCount: modeCounts.delivery,
            freteCount: modeCounts.frete,
            modeSummary: formatModeSummary(modeCounts),
            defaultServiceId: prioritized[0]?.id,
          };
        });

        setVehicles(enriched);
      } catch {
        if (mounted) {
          setVehicles(
            VEHICLE_BASE.map((v) => ({
              ...v,
              servicesCount: 0,
              rideCount: 0,
              deliveryCount: 0,
              freteCount: 0,
              modeSummary: "Sem servicos ativos",
            })),
          );
        }
      } finally {
        if (mounted) setLoadingVehicles(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshTrigger]);

  const quickFavorites = useMemo(() => favorites.slice(0, 3), [favorites]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onPressMenu} style={styles.menuButton}>
          <MaterialIcons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topRight}>
          {activeOrdersCount > 0 && (
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(2,222,149,0.35)",
                backgroundColor: "rgba(2,222,149,0.18)",
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
              onPress={onPressActiveOrders}
              activeOpacity={0.85}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "#02de95",
                }}
              />
              <Text
                style={{
                  color: "#02de95",
                  fontWeight: "900",
                  fontSize: 14,
                }}
              >
                {activeOrdersCount} {activeOrdersCount === 1 ? "ativo" : "ativos"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Qual servico voce precisa?</Text>
        <Text style={styles.subtitle}>Escolha entre corrida, entrega ou frete e continue</Text>

        <View style={styles.routeCard}>
          <TouchableOpacity onPress={onPressAddress} style={styles.routeRow} activeOpacity={0.85}>
            <View style={styles.pickupDot} />
            <Text style={[styles.routeText, !userAddress && styles.placeholder]} numberOfLines={1}>
              {userAddress || "Definir local de coleta"}
            </Text>
            <MaterialIcons name="edit" size={18} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>

          <View style={styles.routeDivider} />

          <TouchableOpacity onPress={onPressDestination} style={styles.routeRow} activeOpacity={0.85}>
            <View style={styles.dropoffDot} />
            <Text
              style={[styles.routeText, !destinationAddress && styles.placeholder]}
              numberOfLines={1}
            >
              {destinationAddress || "Para onde vamos?"}
            </Text>
            <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.45)" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Categorias</Text>

        {loadingVehicles ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.primary[500]} size="small" />
          </View>
        ) : (
          <View style={styles.grid}>
            {vehicles.map((vehicle) => {
              const enabled = vehicle.servicesCount > 0;
              return (
                <TouchableOpacity
                  key={vehicle.id}
                  style={[styles.vehicleCard, !enabled && styles.vehicleCardDisabled]}
                  activeOpacity={enabled ? 0.85 : 1}
                  disabled={!enabled}
                  onPress={() => onSelectFlow(vehicle.id, vehicle.defaultServiceId)}
                >
                  <View style={[styles.vehicleIconWrap, !enabled && styles.vehicleIconWrapDisabled]}>
                    <MaterialCommunityIcons
                      name={vehicle.icon}
                      size={24}
                      color={enabled ? "#ffffff" : "rgba(255,255,255,0.45)"}
                    />
                  </View>

                  <Text style={[styles.vehicleLabel, !enabled && styles.vehicleLabelDisabled]}>
                    {vehicle.label}
                  </Text>
                  <Text style={[styles.vehicleDescription, !enabled && styles.vehicleDescriptionDisabled]}>
                    {enabled ? vehicle.modeSummary : "Sem servicos ativos nessa categoria"}
                  </Text>

                  <View style={[styles.badge, !enabled && styles.badgeDisabled]}>
                    <Text style={[styles.badgeText, !enabled && styles.badgeTextDisabled]}>
                      {enabled ? `${vehicle.servicesCount} servicos` : "Indisponivel"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Favoritos</Text>

        {loadingFavorites ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator color={colors.primary[500]} size="small" />
          </View>
        ) : quickFavorites.length === 0 ? (
          <TouchableOpacity style={styles.emptyFavCard} onPress={onPressAddFavorite} activeOpacity={0.85}>
            <MaterialIcons name="add-location-alt" size={28} color={colors.primary[500]} />
            <Text style={styles.emptyFavTitle}>Adicionar endereco favorito</Text>
            <Text style={styles.emptyFavSub}>Casa, trabalho e destinos recorrentes.</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.favoritesList}>
            {quickFavorites.map((fav) => (
              <TouchableOpacity
                key={fav._id}
                style={styles.favoriteItem}
                activeOpacity={0.85}
                onPress={() => onSelectFavorite(fav)}
              >
                <View style={styles.favoriteIconWrap}>
                  <MaterialIcons name="location-on" size={20} color={colors.primary[500]} />
                </View>

                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Text style={styles.favoriteName}>{fav.name}</Text>
                  <Text style={styles.favoriteAddress} numberOfLines={1}>
                    {fav.formattedAddress || fav.address}
                  </Text>
                </View>

                <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addMoreButton} onPress={onPressAddFavorite} activeOpacity={0.85}>
              <MaterialIcons name="add-circle-outline" size={18} color={colors.primary[500]} />
              <Text style={styles.addMoreText}>Adicionar novo favorito</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  topRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  activeOrdersBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  activeOrdersDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#02de95",
  },
  activeOrdersText: {
    color: "#02de95",
    fontSize: 14,
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  routeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 24,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
    backgroundColor: "#ff5a5a",
  },
  routeDivider: {
    height: 18,
    marginLeft: 4,
    borderLeftWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderStyle: "dashed",
    marginVertical: 4,
  },
  routeText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  placeholder: { color: colors.text.tertiary, fontWeight: "500" as any },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  loaderWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  vehicleCard: {
    width: "48%",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.15)",
  },
  vehicleCardDisabled: {
    borderColor: colors.border.light,
    opacity: 0.55,
  },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[500],
    marginBottom: spacing.sm,
  },
  vehicleIconWrapDisabled: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  vehicleLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  vehicleLabelDisabled: {
    color: "rgba(255,255,255,0.6)",
  },
  vehicleDescription: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
    minHeight: 30,
  },
  vehicleDescriptionDisabled: {
    color: "rgba(255,255,255,0.38)",
  },
  badge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeDisabled: {
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  badgeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  badgeTextDisabled: {
    color: "#ef4444",
  },
  emptyFavCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.3)",
    borderStyle: "dashed",
    backgroundColor: "rgba(2,222,149,0.06)",
    alignItems: "center",
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyFavTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  emptyFavSub: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  favoritesList: { gap: spacing.sm },
  favoriteItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
  },
  favoriteIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(2,222,149,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  favoriteName: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    textTransform: "capitalize",
  },
  favoriteAddress: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.32)",
    backgroundColor: "rgba(2,222,149,0.08)",
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  addMoreText: {
    color: colors.primary[500],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
