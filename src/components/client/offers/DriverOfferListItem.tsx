import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { MotiView } from "moti";
import { Star, Clock, Check, MessageCircle, User, Car, Bike, Route, X, ShieldCheck } from "lucide-react-native";
import { formatBRL } from "@/utils/mappers";
import { RideOffer } from "@/services/ride.service";

interface DriverOfferListItemProps {
  offer: RideOffer;
  clientBudget: number;
  onSelect: (offer: RideOffer) => void;
  onDecline: (offer: RideOffer) => void;
  onCounter: (offer: RideOffer) => void;
  loading: boolean;
  /** Marca esta oferta como a recomendada (melhor custo-benefício) — calculado pela lista. */
  recommended?: boolean;
  /** Timestamp atual (ms) compartilhado, para o contador "expira em". */
  nowTs?: number;
}

/** Janela de validade da oferta (a partir do createdAt) usada no contador "expira em". */
const OFFER_TTL_SEC = 180;

function readOfferNumber(offer: RideOffer, field: "amount" | "driverAmount"): number {
  const raw =
    (offer as any)?.[field] ??
    (offer as any)?._doc?.[field] ??
    (offer as any)?.doc?.[field];
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

export function DriverOfferListItem({ offer, clientBudget, onSelect, onDecline, onCounter, loading, recommended = false, nowTs }: DriverOfferListItemProps) {
  const driverName = useMemo(() => {
    if (typeof offer.driverId === "string") return "Entregador Parceiro";
    return offer.driverId?.name || "Entregador Parceiro";
  }, [offer.driverId]);

  const driverPhoto = useMemo(() => {
    if (typeof offer.driverId === "string") return null;
    return offer.driverId?.profilePhoto || null;
  }, [offer.driverId]);

  const offerAmount = readOfferNumber(offer, "amount");
  const originalDriverAmount = readOfferNumber(offer, "driverAmount");
  const displayAmount =
    offer.status === "client_countered" && originalDriverAmount > 0
      ? originalDriverAmount
      : offerAmount;

  const normalizedBudget = Number(clientBudget || 0);
  const isCounterOffer = offer.status !== "accepted";
  const isPendingDriver = offer.status === "client_countered";
  const isCheaperOrEqual = displayAmount > 0 && displayAmount <= normalizedBudget;
  const isBestValue = isCheaperOrEqual && !isCounterOffer;

  const driverObj = typeof offer.driverId === "string" ? null : offer.driverId;
  const rating = Number(driverObj?.rating ?? 5.0).toFixed(1);
  const deliveryCount = driverObj?.completedRides ?? 0;
  const reliabilityPct = driverObj?.reliabilityPct ?? null;
  const eta = offer.etaMinutes ?? 0;
  const distanceKm = offer.distanceToPickupKm ?? null;
  const vehicleName = offer.vehicleLabel ?? "Moto";
  const vehicleKey = (offer.vehicleType ?? "motorcycle").toLowerCase();
  const VehicleIcon = vehicleKey === "car" || vehicleKey === "van" || vehicleKey === "truck" ? Car : Bike;

  const diff = displayAmount - normalizedBudget;
  const deltaAbs = Math.abs(diff);
  const hasComparableBudget = normalizedBudget > 0 && displayAmount > 0;
  const deltaLabel =
    !hasComparableBudget || deltaAbs < 0.005
      ? "Igual à base"
      : `${diff > 0 ? "+" : "-"} ${formatBRL(deltaAbs)}`;
  const deltaCaption =
    !hasComparableBudget || deltaAbs < 0.005
      ? "Valor alinhado"
      : diff > 0
        ? "Acima da base"
        : "Abaixo da base";
  const deltaTone =
    !hasComparableBudget || deltaAbs < 0.005
      ? { bg: "#F1F5F9", text: "#475569", border: "rgba(71, 85, 105, 0.14)" }
      : diff > 0
        ? { bg: "#FEF2F2", text: "#DC2626", border: "rgba(220, 38, 38, 0.16)" }
        : { bg: "#ECFDF5", text: "#047857", border: "rgba(4, 120, 87, 0.16)" };

  const isEstimate = offer.routeSource === "estimate";
  const approxPrefix = isEstimate ? "~" : "";
  const isVeryClose = eta > 0 && eta <= 2;

  // Contador "expira em" a partir do createdAt da oferta.
  const expiresInSec = useMemo(() => {
    if (!offer.createdAt) return null;
    const created = new Date(offer.createdAt).getTime();
    if (!Number.isFinite(created)) return null;
    const ref = nowTs ?? Date.now();
    return Math.max(0, Math.floor((created + OFFER_TTL_SEC * 1000 - ref) / 1000));
  }, [offer.createdAt, nowTs]);
  const expiresLabel =
    expiresInSec != null && expiresInSec > 0
      ? `expira em ${Math.floor(expiresInSec / 60)}:${String(expiresInSec % 60).padStart(2, "0")}`
      : null;
  const distanceLabel =
    distanceKm == null
      ? "--"
      : distanceKm < 1
        ? `${approxPrefix}${Math.round(distanceKm * 1000)} m`
        : `${approxPrefix}${distanceKm.toFixed(1)} km`;
  const etaLabel = eta > 0 ? `${approxPrefix}${eta} min` : "--";

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.96, translateY: 14 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full mb-4 overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 22,
        borderWidth: recommended ? 2 : 1,
        borderColor: recommended || isBestValue ? "#00C853" : "rgba(15, 23, 42, 0.08)",
        shadowColor: "#091A2F",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        position: "relative",
      }}
    >
      {(recommended || isBestValue) && (
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 4,
            backgroundColor: "#00C853",
            zIndex: 20,
          }}
        />
      )}

      {recommended && (
        <View
          style={{
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#00C853",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderTopLeftRadius: 22,
            borderBottomRightRadius: 12,
          }}
        >
          <Star size={11} color="#FFFFFF" fill="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 10, letterSpacing: 0.4 }}>
            RECOMENDADO
          </Text>
        </View>
      )}

      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: "#F1F5F9",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                marginRight: 12,
                borderWidth: 2,
                borderColor: "#FFFFFF",
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              {driverPhoto ? (
                <Image source={{ uri: driverPhoto }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <User size={20} color="#64748B" />
              )}
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5 }}>
                <Text style={{ color: "#0F172A", fontWeight: "800", fontSize: 16, marginRight: 5, flexShrink: 1 }} numberOfLines={1}>
                  {driverName}
                </Text>
                {isBestValue && (
                  <View style={{ backgroundColor: "#ECFDF5", borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 }}>
                    <Check size={10} color="#047857" strokeWidth={3} />
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Star size={12} color="#ffb950" fill="#ffb950" style={{ marginRight: 4 }} />
                <Text style={{ color: "#ffb950", fontWeight: "800", fontSize: 13, marginRight: 4 }}>
                  {rating}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 12 }} numberOfLines={1}>
                  ({deliveryCount} entregas)
                </Text>
                {reliabilityPct != null && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: reliabilityPct >= 90 ? "#ECFDF5" : "#F1F5F9",
                      borderRadius: 999,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      marginLeft: 6,
                    }}
                  >
                    <ShieldCheck size={10} color={reliabilityPct >= 90 ? "#047857" : "#64748B"} style={{ marginRight: 3 }} />
                    <Text style={{ color: reliabilityPct >= 90 ? "#047857" : "#64748B", fontSize: 10, fontWeight: "900" }}>
                      {reliabilityPct}%
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ alignItems: "flex-end", marginLeft: 10, minWidth: 120 }}>
            <Text style={{ fontSize: 9, fontWeight: "900", color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 1 }}>
              Oferta do entregador
            </Text>
            <Text style={{ fontSize: 25, fontWeight: "900", color: isBestValue ? "#047857" : "#0F172A", letterSpacing: 0 }}>
              {displayAmount > 0 ? formatBRL(displayAmount) : "—"}
            </Text>
            <View
              style={{
                marginTop: 5,
                borderWidth: 1,
                borderColor: deltaTone.border,
                backgroundColor: deltaTone.bg,
                borderRadius: 999,
                paddingHorizontal: 8,
                paddingVertical: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: deltaTone.text, fontSize: 10, fontWeight: "900" }} numberOfLines={1}>
                {deltaLabel}
              </Text>
            </View>
            <Text style={{ marginTop: 3, color: deltaTone.text, fontSize: 9, fontWeight: "800" }} numberOfLines={1}>
              {deltaCaption}
            </Text>
            {offer.status === "client_countered" && offerAmount > 0 && (
              <Text style={{ marginTop: 4, fontSize: 10, fontWeight: "800", color: "#0EA5E9" }} numberOfLines={1}>
                sua oferta: {formatBRL(offerAmount)}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <View style={metricBoxStyle}>
            <View style={metricLabelRowStyle}>
              <Clock size={14} color="#64748B" style={{ marginRight: 5 }} />
              <Text style={metricLabelStyle}>Chega</Text>
            </View>
            <Text style={metricValueStyle} numberOfLines={1}>{etaLabel}</Text>
          </View>

          <View style={metricBoxStyle}>
            <View style={metricLabelRowStyle}>
              <Route size={14} color="#64748B" style={{ marginRight: 5 }} />
              <Text style={metricLabelStyle}>Distância</Text>
            </View>
            <Text style={metricValueStyle} numberOfLines={1}>{distanceLabel}</Text>
          </View>

          <View style={metricBoxStyle}>
            <View style={metricLabelRowStyle}>
              <VehicleIcon size={14} color="#64748B" style={{ marginRight: 5 }} />
              <Text style={metricLabelStyle}>Veículo</Text>
            </View>
            <Text style={metricValueStyle} numberOfLines={1}>{vehicleName}</Text>
          </View>
        </View>

        {(isVeryClose || expiresLabel) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            {isVeryClose && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Clock size={11} color="#047857" style={{ marginRight: 4 }} />
                <Text style={{ color: "#047857", fontSize: 10, fontWeight: "900" }}>Muito perto</Text>
              </View>
            )}
            {expiresLabel && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFF7ED", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text style={{ color: "#C2410C", fontSize: 10, fontWeight: "800" }}>{expiresLabel}</Text>
              </View>
            )}
          </View>
        )}

        {isPendingDriver && (
          <View className="flex-row items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl mb-3">
            <ActivityIndicator size="small" color="#10B981" className="mr-3" />
            <View className="flex-1">
              <Text className="text-emerald-600 text-[9px] font-black uppercase tracking-widest mb-0.5">Aguardando Retorno</Text>
              <Text className="text-slate-600 text-[11px] font-bold leading-4">
                O entregador recebeu sua contraproposta e está decidindo.
              </Text>
            </View>
          </View>
        )}

        {isPendingDriver ? (
          <TouchableOpacity
            onPress={() => onDecline(offer)}
            disabled={loading}
            activeOpacity={0.7}
            className="w-full h-12 flex-row items-center justify-center rounded-xl bg-red-50 border border-red-100"
          >
            <X size={15} color="#DC2626" strokeWidth={2.5} style={{ marginRight: 7 }} />
            <Text className="text-red-600 font-black text-xs uppercase tracking-widest">Retirar Proposta</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => onDecline(offer)}
              disabled={loading}
              activeOpacity={0.7}
              style={{
                flex: 1,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "rgba(220, 38, 38, 0.18)",
                backgroundColor: "#FFF7F7",
              }}
            >
              <X size={15} color="#DC2626" strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text style={{ color: "#B91C1C", fontWeight: "800", fontSize: 13 }}>Recusar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onCounter(offer)}
              disabled={loading}
              activeOpacity={0.78}
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: "rgba(14, 165, 233, 0.24)",
                backgroundColor: "#F0F9FF",
              }}
            >
              <MessageCircle size={18} color="#0284C7" strokeWidth={2.4} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSelect(offer)}
              disabled={loading}
              activeOpacity={0.9}
              style={{
                flex: 1.5,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 12,
                backgroundColor: "#00C853",
                shadowColor: "#00C853",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.24,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" strokeWidth={3} style={{ marginRight: 6 }} />
                  <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 14 }}>Aceitar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </MotiView>
  );
}

const metricBoxStyle = {
  flex: 1,
  minHeight: 54,
  borderRadius: 14,
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: "rgba(15, 23, 42, 0.06)",
  paddingHorizontal: 9,
  paddingVertical: 8,
  justifyContent: "center",
} as const;

const metricLabelRowStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 3,
} as const;

const metricLabelStyle = {
  color: "#64748B",
  fontSize: 9,
  fontWeight: "800",
  textTransform: "uppercase",
} as const;

const metricValueStyle = {
  color: "#0F172A",
  fontSize: 13,
  fontWeight: "900",
} as const;
