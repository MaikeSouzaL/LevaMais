import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { Clock, ChevronRight, CircleDot, Route } from "lucide-react-native";
import { formatBRL } from "@/utils/mappers";

const { width } = Dimensions.get("window");

interface NewIncomingOfferSheetProps {
  isVisible: boolean;
  request: any;
  countdown: number | null;
  onAccept: () => void;
  onReject: () => void;
  onViewDetail: () => void;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
}

function CountdownRing({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, (value ?? 0) / (max || 60)));
  const color = pct > 0.4 ? "#02de95" : pct > 0.15 ? "#F59E0B" : "#EF4444";
  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: 50, height: 50 }}>
      <View
        style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          borderWidth: 3.5,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${color}10`,
        }}
      >
        <Text style={{ color, fontWeight: "900", fontSize: 16 }}>{value ?? "--"}</Text>
      </View>
    </View>
  );
}

export function NewIncomingOfferSheet({
  isVisible,
  request,
  countdown,
  onAccept,
  onReject,
  onViewDetail,
  acceptLoading,
  rejectLoading,
}: NewIncomingOfferSheetProps) {
  const formatDistanceFromMeters = (meters?: number): string => {
    if (typeof meters !== "number" || Number.isNaN(meters) || meters <= 0) return "--";
    return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
  };

  const formatDurationFromSeconds = (seconds?: number): string => {
    if (typeof seconds !== "number" || Number.isNaN(seconds) || seconds <= 0) return "--";
    const min = Math.max(1, Math.round(seconds / 60));
    return `${min} min`;
  };

  const offer = request;
  const baseValue = Number(offer?.negotiation?.clientOffer ?? offer?.pricing?.total ?? 0);
  const routeDistanceMeters = Number(offer?.distance?.value ?? 0);
  const routeDurationSeconds = Number(offer?.duration?.value ?? 0);
  const toPickupDistanceMeters = Number(offer?.distanceToPickup ?? 0);
  const toPickupDurationSecondsRaw = Number(
    offer?.durationToPickup?.value ?? offer?.etaToPickup?.value ?? 0
  );
  const toPickupDurationText = formatDurationFromSeconds(toPickupDurationSecondsRaw);
  const toPickupDistanceText = formatDistanceFromMeters(toPickupDistanceMeters);
  const routeDurationText = formatDurationFromSeconds(routeDurationSeconds);
  const routeDistanceText = formatDistanceFromMeters(routeDistanceMeters);
  const pickup = offer?.pickup?.address || "--";
  const dropoff = offer?.dropoff?.address || "--";
  const maxCountdown = 60;
  const valuePerKm = routeDistanceMeters > 0 ? baseValue / (routeDistanceMeters / 1000) : 0;
  const passengerRating = Number(offer?.client?.rating || offer?.clientRating || 5).toFixed(1);
  const ridesCount = Number(offer?.client?.ridesCount || offer?.client?.totalRides || offer?.clientRides || 0);

  return (
    <AnimatePresence>
      {isVisible && offer?.rideId && (
        <MotiView
          from={{ opacity: 0, translateY: 300 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 300 }}
          transition={{ type: "spring", damping: 18, stiffness: 180 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: "#081325",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 12,
              paddingBottom: 36,
              paddingHorizontal: 22,
              borderTopWidth: 2,
              borderTopColor: "rgba(2, 222, 149, 0.35)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -12 },
              shadowOpacity: 0.5,
              shadowRadius: 25,
              elevation: 35,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 44, height: 5, borderRadius: 2.5, backgroundColor: "rgba(255, 255, 255, 0.12)" }} />
            </View>

            <View style={{ marginBottom: 16 }} />

            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: 18,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                marginBottom: 20,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text style={{ color: "#FFFFFF", fontSize: 52, fontWeight: "900", letterSpacing: -1.2 }}>
                  {formatBRL(baseValue)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: "800", marginTop: -3 }}>
                  {valuePerKm > 0 ? `${formatBRL(valuePerKm)}/km` : "--/km"}
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                    <CircleDot size={14} color="rgba(255,255,255,0.95)" />
                    <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 12.5, fontWeight: "700", marginLeft: 6 }}>
                      {passengerRating} · {ridesCount} corridas
                    </Text>
                  </View>
                </View>
                {countdown !== null && <CountdownRing value={countdown} max={maxCountdown} />}
              </View>

              <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", paddingTop: 11 }}>
                <View style={{ flexDirection: "row", marginBottom: 12 }}>
                  <Route size={16} color="#34D399" style={{ marginTop: 1, marginRight: 7 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                      {(toPickupDurationText !== "--" ? toPickupDurationText : "Sem ETA")} ({toPickupDistanceText}) até a coleta
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "500", lineHeight: 18 }} numberOfLines={2}>
                      {pickup}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row" }}>
                  <Clock size={16} color="#FB923C" style={{ marginTop: 1, marginRight: 7 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>
                      {routeDurationText} ({routeDistanceText}) até a entrega
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, fontWeight: "500", lineHeight: 18 }} numberOfLines={2}>
                      {dropoff}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={onAccept}
                disabled={acceptLoading || rejectLoading}
                style={{
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: "#02de95",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#02de95",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 5,
                }}
                activeOpacity={0.85}
              >
                {acceptLoading ? (
                  <ActivityIndicator color="#081325" size="small" />
                ) : (
                  <Text style={{ color: "#081325", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    ACEITAR CORRIDA • {formatBRL(baseValue)}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={onReject}
                  disabled={acceptLoading || rejectLoading}
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    backgroundColor: "rgba(239, 68, 68, 0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  {rejectLoading ? (
                    <ActivityIndicator color="#EF4444" size="small" />
                  ) : (
                    <Text style={{ color: "#EF4444", fontWeight: "800", fontSize: 13, textTransform: "uppercase" }}>Recusar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onViewDetail}
                  disabled={acceptLoading || rejectLoading}
                  style={{
                    flex: 1.4,
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderWidth: 1.5,
                    borderColor: "rgba(59, 130, 246, 0.35)",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "#93C5FD", fontWeight: "800", fontSize: 13, textTransform: "uppercase" }}>Ver Detalhes</Text>
                  <ChevronRight size={15} color="#93C5FD" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
}
