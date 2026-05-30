import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Car, Package, Star, TrendingUp, Clock, AlertTriangle, Settings, ClipboardList, Power } from "lucide-react-native";
import { MotiText, MotiView } from "moti";
import { driverColors } from "@/theme/driverTheme";

export type DriverServicePrefs = {
  ride: boolean;
  delivery: boolean;
};

interface DriverStats {
  rating?: number;
  acceptanceRate?: number;
  onlineTime?: number;
  earnings?: number;
}

interface DriverBottomSheetProps {
  online: boolean;
  services: DriverServicePrefs;
  isTogglingOnline?: boolean;
  onToggleOnline: () => void;
  onToggleService: (key: keyof DriverServicePrefs) => void;
  snapPoints?: string[];
  vehicleType?: string;
  stats?: DriverStats;
  driverBalance?: number | null;
  onAddBalance?: () => void;
  onPressOffers: () => void;
  hasPendingOffer?: boolean;
  offersPulseToken?: number;
  pendingNegotiationsCount?: number;
  clientCounteredCount?: number;
  onPressNegotiations?: () => void;
}

/**
 * DriverBottomSheet — Highly interactive operational terminal for online/offline driver status.
 *
 * Upgraded UI/UX:
 * - Breathing glowing border for active search states.
 * - Heartbeat scaling power icon.
 * - Sequential animated radar dots (...) next to "Buscando" to indicate active operations.
 * - High-contrast glassmorphic stat pod containers.
 */
export function DriverBottomSheet({
  online,
  services,
  isTogglingOnline,
  onToggleOnline,
  onToggleService,
  snapPoints: userSnapPoints,
  vehicleType,
  stats,
  driverBalance,
  onAddBalance,
  onPressOffers,
  hasPendingOffer = false,
  offersPulseToken = 0,
  pendingNegotiationsCount = 0,
  clientCounteredCount = 0,
  onPressNegotiations,
}: DriverBottomSheetProps) {
  const [showSettings, setShowSettings] = useState(false);

  const finalSnapPoints = useMemo(() => {
    if (userSnapPoints) return userSnapPoints;
    const hasNoBalance = driverBalance !== undefined && driverBalance !== null && driverBalance <= 0 && !online;

    if (hasNoBalance) return ["48%", "64%"];
    return showSettings ? ["44%", "58%"] : ["25%", "35%"];
  }, [userSnapPoints, driverBalance, online, showSettings]);

  const canDoRides = vehicleType === "car" || vehicleType === "motorcycle";

  const displayRating = stats?.rating != null ? stats.rating.toFixed(1) : "5.0";
  const displayBalance = driverBalance != null
    ? `R$ ${Number(driverBalance).toFixed(2).replace(".", ",")}`
    : "R$ 0,00";

  const displayOnlineTime = useMemo(() => {
    if (stats?.onlineTime == null) return "00:00";
    const totalSecs = Math.round(stats.onlineTime);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [stats?.onlineTime]);

  return (
    <BottomSheet
      index={0}
      snapPoints={finalSnapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: "#091A2F", borderRadius: 32, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.06)" }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)", width: 44 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}>
        {/* Negative Balance Alert */}
        {driverBalance !== undefined && driverBalance !== null && driverBalance <= 0 && !online && (
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: -10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.06)",
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: "rgba(239, 68, 68, 0.25)",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ backgroundColor: "rgba(239, 68, 68, 0.12)", padding: 10, borderRadius: 14 }}>
                <AlertTriangle size={20} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Saldo Insuficiente
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 11, fontWeight: "600", marginTop: 4, lineHeight: 15 }}>
                  Você precisa de saldo positivo para ficar online e aceitar corridas.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onAddBalance}
              activeOpacity={0.85}
              style={{
                marginTop: 14,
                backgroundColor: "#02de95",
                borderRadius: 16,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Adicionar Saldo
              </Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* ── Glassmorphic Stats Grid ── */}
        <View style={styles.statsGrid}>
          {/* Rating */}
          <View style={[styles.statColumn, { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.06)" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Star size={13} color="#FBBF24" fill="#FBBF24" style={{ marginRight: 4 }} />
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14.5 }}>{displayRating}</Text>
            </View>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>

          {/* Balance */}
          <View style={[styles.statColumn, { flex: 1.4, borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.06)" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <TrendingUp size={13} color="#02de95" style={{ marginRight: 6 }} />
              <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 15.5 }}>{displayBalance}</Text>
            </View>
            <Text style={styles.statLabel}>Saldo</Text>
          </View>

          {/* Time Online */}
          <View style={styles.statColumn}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
              <Clock size={13} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14.5 }}>{displayOnlineTime}</Text>
            </View>
            <Text style={styles.statLabel}>Tempo Online</Text>
          </View>
        </View>

        {/* Pending Negotiations Alert */}
        {(pendingNegotiationsCount > 0 || clientCounteredCount > 0) && online && (
          <TouchableOpacity
            onPress={onPressNegotiations || onPressOffers}
            activeOpacity={0.85}
            style={{ marginBottom: 18 }}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.92, translateY: -8 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: "spring", damping: 14 }}
              style={{
                backgroundColor: clientCounteredCount > 0 ? "rgba(2, 222, 149, 0.1)" : "rgba(251, 191, 36, 0.08)",
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: clientCounteredCount > 0 ? "rgba(2, 222, 149, 0.4)" : "rgba(251, 191, 36, 0.35)",
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <MotiView
                  from={{ scale: 0.7 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ type: "timing", loop: true, duration: 1800 }}
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: clientCounteredCount > 0 ? "#02de95" : "#fbbf24",
                  }}
                />
                <View>
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12 }}>
                    {clientCounteredCount > 0
                      ? "Contraproposta do Cliente!"
                      : "Negociações Pendentes"}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "600", marginTop: 2 }}>
                    {clientCounteredCount > 0
                      ? `Você tem ${clientCounteredCount} contraproposta(s) aguardando`
                      : `Você tem ${pendingNegotiationsCount} negociação(ões) em aberto`}
                  </Text>
                </View>
              </View>
              <MotiView
                from={{ translateX: 0 }}
                animate={{ translateX: [0, 6, 0] }}
                transition={{ type: "timing", loop: true, duration: 2000 }}
              >
                <Text style={{ color: clientCounteredCount > 0 ? "#02de95" : "#fbbf24", fontWeight: "900", fontSize: 12 }}>
                  Ver →
                </Text>
              </MotiView>
            </MotiView>
          </TouchableOpacity>
        )}

        {/* ── Main Control Matrix ── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: showSettings ? 18 : 0 }}>
          {/* Settings Trigger */}
          <TouchableOpacity
            onPress={() => setShowSettings((prev) => !prev)}
            activeOpacity={0.8}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: showSettings ? "rgba(2, 222, 149, 0.12)" : "rgba(255,255,255,0.04)",
              borderWidth: 1.5,
              borderColor: showSettings ? "#02de95" : "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={20} color={showSettings ? "#02de95" : "rgba(255,255,255,0.75)"} strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Connect / Searching Button */}
          <View style={{ flex: 1 }}>
            <MotiView
              animate={{
                borderColor: online ? ["rgba(239, 68, 68, 0.35)", "rgba(239, 68, 68, 0.75)", "rgba(239, 68, 68, 0.35)"] : "rgba(2, 222, 149, 0.2)",
              }}
              transition={{
                loop: true,
                duration: 2000,
                type: "timing",
              }}
              style={{
                borderRadius: 24,
                borderWidth: 1.5,
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onToggleOnline}
                disabled={!!isTogglingOnline}
                style={{
                  width: "100%",
                  height: 64,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: online ? "rgba(239, 68, 68, 0.06)" : "#02de95",
                }}
              >
                {isTogglingOnline ? (
                  <ActivityIndicator color={online ? "#EF4444" : "#091A2F"} />
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {online ? (
                      <Text style={{ color: "#EF4444", fontWeight: "900", fontSize: 24, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Buscando
                      </Text>
                    ) : (
                      <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 24, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Conectar
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>
          </View>

          {/* Offers Clipboard Trigger */}
          <MotiView
            key="offers-clipboard-outer-container"
            style={{ position: "relative" }}
          >
            {hasPendingOffer && (
              <>
                <MotiView
                  key="offers-burst-outer-loop"
                  from={{ opacity: 0.65, scale: 0.45 }}
                  animate={{ opacity: 0, scale: 1.85 }}
                  transition={{
                    type: "timing",
                    duration: 1200,
                    loop: true,
                  }}
                  style={{
                    position: "absolute",
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    borderWidth: 2.5,
                    borderColor: "rgba(251,191,36,0.95)",
                    top: 0,
                    left: 0,
                  }}
                />
                <MotiView
                  key="offers-burst-inner-loop"
                  from={{ opacity: 0.75, scale: 0.35 }}
                  animate={{ opacity: 0, scale: 1.35 }}
                  transition={{
                    type: "timing",
                    duration: 1200,
                    loop: true,
                    delay: 250,
                  }}
                  style={{
                    position: "absolute",
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    borderWidth: 1.8,
                    borderColor: "rgba(251,191,36,0.75)",
                    top: 0,
                    left: 0,
                  }}
                />
              </>
            )}
            <TouchableOpacity
              onPress={onPressOffers}
              activeOpacity={0.8}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: hasPendingOffer ? "#FBBF24" : "rgba(255,255,255,0.04)",
                borderWidth: 1.5,
                borderColor: hasPendingOffer ? "rgba(251,191,36,0.9)" : "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MotiView
                key={hasPendingOffer ? "pending" : "idle"}
                from={hasPendingOffer ? { scale: 0.7, rotate: "0deg" } : { scale: 1, rotate: "0deg" }}
                animate={{ scale: 1, rotate: "0deg" }}
                transition={{ type: "spring", damping: 9, stiffness: 180 }}
              >
                <ClipboardList size={20} color={hasPendingOffer ? "#091A2F" : "rgba(255,255,255,0.75)"} strokeWidth={2.5} />
              </MotiView>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* Expandable Preferences Settings Panel */}
        {showSettings && (
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={{ marginTop: 6 }}
          >
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, paddingLeft: 2 }}>
              Preferências de Serviço
            </Text>

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => canDoRides && onToggleService("ride")}
                activeOpacity={0.8}
                disabled={!canDoRides}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: services.ride ? "#02de95" : "rgba(255,255,255,0.08)",
                  backgroundColor: services.ride ? "rgba(2, 222, 149, 0.08)" : "rgba(255,255,255,0.03)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: !canDoRides ? 0.4 : 1,
                }}
              >
                <Car size={18} color={services.ride ? "#02de95" : "rgba(255,255,255,0.5)"} style={{ marginRight: 8 }} />
                <Text style={{ color: services.ride ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: "900", fontSize: 13 }}>
                  Corridas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onToggleService("delivery")}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 52,
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: services.delivery ? "#02de95" : "rgba(255,255,255,0.08)",
                  backgroundColor: services.delivery ? "rgba(2, 222, 149, 0.08)" : "rgba(255,255,255,0.03)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Package size={18} color={services.delivery ? "#02de95" : "rgba(255,255,255,0.5)"} style={{ marginRight: 8 }} />
                <Text style={{ color: services.delivery ? "#fff" : "rgba(255,255,255,0.5)", fontWeight: "900", fontSize: 13 }}>
                  Entregas
                </Text>
              </TouchableOpacity>
            </View>

            {!canDoRides && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)" }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10.5, textAlign: "center", fontWeight: "600" }}>
                  Corridas de passageiros bloqueadas para seu tipo de veículo.
                </Text>
              </View>
            )}

            {!services.ride && !services.delivery && (
              <View style={{ marginTop: 12, padding: 12, backgroundColor: "rgba(245,158,11,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(245,158,11,0.2)" }}>
                <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 10.5, textAlign: "center" }}>
                  Ative ao menos 1 serviço para receber solicitações.
                </Text>
              </View>
            )}
          </MotiView>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 16,
    backgroundColor: "rgba(11, 26, 42, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    marginBottom: 18,
  },
  statColumn: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 8.5,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default DriverBottomSheet;
