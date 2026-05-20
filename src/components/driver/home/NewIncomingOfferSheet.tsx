import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { MapPin, Package, Clock, Route, ChevronRight, Check, X } from "lucide-react-native";
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
    <View style={{ alignItems: "center", justifyContent: "center", width: 46, height: 46 }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: 23,
          borderWidth: 3,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${color}15`,
        }}
      >
        <Text style={{ color, fontWeight: "900", fontSize: 14 }}>{value ?? "--"}</Text>
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
  const offer = request;
  const baseValue = Number(offer?.negotiation?.clientOffer ?? offer?.pricing?.total ?? 0);
  const distanceKm = offer?.distance?.text || "--";
  const durationText = offer?.duration?.text || "--";
  const pickup = offer?.pickup?.address || "--";
  const dropoff = offer?.dropoff?.address || "--";
  const maxCountdown = 60;

  return (
    <AnimatePresence>
      {isVisible && offer?.rideId && (
        <MotiView
          from={{ opacity: 0, translateY: 220 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 220 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
          }}
        >
          {/* Card */}
          <View
            style={{
              backgroundColor: "#0D1F35",
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 10,
              paddingBottom: 32,
              paddingHorizontal: 20,
              borderTopWidth: 1,
              borderTopColor: "rgba(2,222,149,0.25)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 30,
            }}
          >
            {/* Drag handle */}
            <View style={{ alignItems: "center", marginBottom: 14 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" }} />
            </View>

            {/* Top row: value + countdown */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, textTransform: "uppercase", marginBottom: 2 }}>
                  Novo Pedido de Entrega
                </Text>
                <Text style={{ color: "#02de95", fontSize: 28, fontWeight: "900" }}>
                  {formatBRL(baseValue)}
                </Text>
              </View>
              <CountdownRing value={countdown ?? maxCountdown} max={maxCountdown} />
            </View>

            {/* Addresses */}
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginTop: 4, marginRight: 10 }} />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, flex: 1, lineHeight: 18 }} numberOfLines={2}>
                  {pickup}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", marginTop: 4, marginRight: 10 }} />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, flex: 1, lineHeight: 18 }} numberOfLines={2}>
                  {dropoff}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 10, gap: 6 }}>
                <Route size={14} color="#02de95" />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700" }}>{distanceKm}</Text>
              </View>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 10, gap: 6 }}>
                <Clock size={14} color="#F59E0B" />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700" }}>{durationText}</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={{ gap: 10 }}>
              {/* Accept */}
              <TouchableOpacity
                onPress={onAccept}
                disabled={acceptLoading}
                style={{
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: "#02de95",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                activeOpacity={0.85}
              >
                {acceptLoading ? (
                  <ActivityIndicator color="#091A2F" />
                ) : (
                  <>
                    <Check size={18} color="#091A2F" strokeWidth={2.5} />
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14 }}>
                      Aceitar {formatBRL(baseValue)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Reject */}
                <TouchableOpacity
                  onPress={onReject}
                  disabled={rejectLoading}
                  style={{
                    flex: 1,
                    height: 46,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.4)",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                  activeOpacity={0.8}
                >
                  {rejectLoading ? (
                    <ActivityIndicator color="#EF4444" size="small" />
                  ) : (
                    <>
                      <X size={15} color="#EF4444" />
                      <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>Recusar</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* View detail */}
                <TouchableOpacity
                  onPress={onViewDetail}
                  style={{
                    flex: 1.5,
                    height: 46,
                    borderRadius: 14,
                    backgroundColor: "rgba(99,102,241,0.15)",
                    borderWidth: 1,
                    borderColor: "rgba(99,102,241,0.4)",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: "#A5B4FC", fontWeight: "700", fontSize: 13 }}>Ver Detalhes</Text>
                  <ChevronRight size={14} color="#A5B4FC" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
}
