// Force Metro compilation reload - 2026-05-20
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { MotiView, AnimatePresence } from "moti";
import { 
  MapPin, 
  Package, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap, 
  Check, 
  Trash2, 
  MessageCircle, 
  Route, 
  Star, 
  Navigation,
  Activity, 
  AlertCircle,
  AlertTriangle,
  Shield
} from "lucide-react-native";
import { formatBRL } from "../../../../utils/mappers";

export type DriverRequestCardItem = {
  rideId: string;
  status?: string;
  client?: {
    id?: string;
    name?: string;
    phone?: string;
    profilePhoto?: string;
    rating?: number;
  } | null;
  pickup?: { address?: string };
  dropoff?: { address?: string };
  pricing?: { total?: number; platformFee?: number; serviceFee?: number };
  distance?: { text?: string };
  serviceType?: string;
  vehicleType?: string;
  payment?: {
    method?: {
      type?: string;
    } | string;
  };
  financialRisk?: {
    requiredBalance?: number;
    estimatedPlatformFee?: number;
  };
  driverBalance?: number;
  details?: {
    itemType?: string;
    priority?: number;
    cargoSize?: string;
    approximateWeightKg?: number;
    isFragile?: boolean;
    needsHelper?: boolean;
    pickupComplement?: string;
    dropoffComplement?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientInstructions?: string;
    deliveryPin?: string;
    specialInstructions?: string;
  };
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    myOffer?: {
      amount: number;
      driverAmount?: number;
      status: string;
    } | null;
  };
  isWaitingInQueue?: boolean;
};

export type DriverRequestCardProps = {
  item: DriverRequestCardItem;
  onAccept: (rideId: string) => void;
  onReject: (rideId: string) => void;
  onOpenDetail?: (item: any) => void;
  onCounterOffer?: (rideId: string) => void;
};

export function DriverRequestCard({
  item,
  onAccept,
  onReject,
  onOpenDetail,
  onCounterOffer,
}: DriverRequestCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const isQueueItem = item.isWaitingInQueue === true;
  


  const finalPrice = item.negotiation?.clientOffer ?? item.pricing?.total ?? 0;
  const minPrice = item.negotiation?.suggestedMinPrice ?? (finalPrice * 0.8);
  const estimatedPlatformFee =
    Number(
      item.financialRisk?.estimatedPlatformFee ??
        item.pricing?.platformFee ??
        item.pricing?.serviceFee ??
        0,
    ) || 0;
  const requiredBalance =
    Number(item.financialRisk?.requiredBalance) ||
    Number(estimatedPlatformFee) ||
    Number((finalPrice * 0.15).toFixed(2)) ||
    0;
  const currentBalance = Number(item.driverBalance || 0);
  const hasEnoughBalance = currentBalance >= requiredBalance;
  const rawPaymentType =
    typeof item.payment?.method === "object"
      ? item.payment?.method?.type
      : item.payment?.method;
  const paymentType = String(rawPaymentType || "cash").toLowerCase();
  const paymentLabel =
    paymentType === "pix"
      ? "Pix"
      : paymentType === "wallet"
        ? "Carteira"
        : paymentType === "card" ||
            paymentType === "credit_card" ||
            paymentType === "debit_card"
          ? "Cartao"
          : "Dinheiro";

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 300 }}
      style={{
        backgroundColor: "#11253E",
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(2, 222, 149, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
        overflow: "hidden",
      }}
    >
      <TouchableOpacity 
        activeOpacity={item.negotiation?.myOffer?.status === "rejected" ? 1 : 0.9} 
        onPress={() => {
          if (item.negotiation?.myOffer?.status === "rejected") return;
          onOpenDetail?.(item);
        }}
        style={{ flex: 1 }}
      >
        {/* Strip de status */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <View style={{ 
            width: 6, 
            height: 6, 
            borderRadius: 3, 
            backgroundColor: item.status === "cancelled_by_client"
              ? "#ef4444"
              : item.negotiation?.myOffer?.status === "rejected" 
                ? "#ef4444" 
                : item.negotiation?.myOffer?.status === "client_countered" 
                  ? "#F59E0B" 
                  : "#02de95" 
          }} />
          <Text style={{ 
            color: item.status === "cancelled_by_client"
              ? "#ef4444"
              : item.negotiation?.myOffer?.status === "rejected" 
                ? "#ef4444" 
                : item.negotiation?.myOffer?.status === "client_countered" 
                  ? "#F59E0B" 
                  : "rgba(255, 255, 255, 0.4)", 
            fontSize: 9.5, 
            fontWeight: "900", 
            letterSpacing: 0.3, 
            textTransform: "uppercase" 
          }}>
            {item.status === "cancelled_by_client"
              ? "Pedido Cancelado"
              : item.negotiation?.myOffer?.status === "rejected"
                ? "Oferta Recusada"
                : item.negotiation?.myOffer?.status === "client_countered" 
                  ? "Contraproposta Recebida" 
                  : item.negotiation?.myOffer 
                    ? "Negociação em Andamento" 
                    : item.negotiation?.enabled 
                      ? "Negociação Ativa" 
                      : "Oferta Disponível"}
          </Text>
        </View>

        {/* Informações do Trajeto compactas */}
        <View style={{ gap: 6, marginBottom: 10 }}>
          {/* Partida */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#02de95" }} />
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 9.5, fontWeight: "800", width: 45 }}>COLETA</Text>
            <Text style={{ color: "#fff", fontSize: 11.5, fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {item.pickup?.address || "Definido no mapa"}
            </Text>
          </View>
          
          {/* Destino */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 9.5, fontWeight: "800", width: 45 }}>ENTREGA</Text>
            <Text style={{ color: "#fff", fontSize: 11.5, fontWeight: "600", flex: 1 }} numberOfLines={1}>
              {item.dropoff?.address || "Definido no mapa"}
            </Text>
          </View>
        </View>

        {/* Tags e Preço em uma única linha horizontal elegante */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 12 }}>
          {/* Tag Veículo */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(255, 255, 255, 0.04)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
            <Text style={{ fontSize: 10.5 }}>{item.vehicleType === "motorcycle" ? "🛵" : "🚗"}</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase" }}>
              {item.vehicleType === "motorcycle" ? "Moto" : "Carro"}
            </Text>
          </View>

          {/* Tag Carga */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(2, 222, 149, 0.05)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
            <Package size={10} color="#02de95" />
            <Text style={{ color: "#02de95", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase" }}>
              {item.serviceType === "delivery"
                ? ({
                    food: "Food", doc: "Doc", market: "Mercado", box: "Caixa", material: "Mat", furniture: "Móvel", moving: "Mudança", other: "Outro"
                  }[item.details?.itemType as string] || "Encomenda")
                : "Viagem"}
            </Text>
          </View>

          {/* Tag Distância */}
          {item.distance?.text && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(59, 130, 246, 0.05)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
              <Route size={10} color="#60a5fa" />
              <Text style={{ color: "#60a5fa", fontSize: 9.5, fontWeight: "800" }}>
                {item.distance.text}
              </Text>
            </View>
          )}

          {/* Preço em Destaque no final */}
          <View style={{ flex: 1 }} />
          <View style={{ flexDirection: "row", alignItems: "baseline", backgroundColor: "rgba(245, 158, 11, 0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.2)" }}>
            <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "800", marginRight: 2 }}>R$</Text>
            <Text style={{ color: "#F59E0B", fontSize: 14.5, fontWeight: "900" }}>
              {item.negotiation?.myOffer ? item.negotiation.myOffer.amount.toFixed(2).replace(".", ",") : finalPrice.toFixed(2).replace(".", ",")}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ⚡ Action Command Console Row (Compact & Horizontal) */}
      {item.status === "cancelled_by_client" ? (
        <View style={{
          height: 38,
          borderRadius: 10,
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          borderWidth: 1,
          borderColor: "rgba(239, 68, 68, 0.2)",
          paddingHorizontal: 10,
        }}>
          <AlertTriangle size={14} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Cancelado pelo cliente "{item.client?.name || "Cliente"}"
          </Text>
        </View>
      ) : item.negotiation?.myOffer?.status === "rejected" ? (
        <View style={{
          height: 38,
          borderRadius: 10,
          backgroundColor: "rgba(239, 68, 68, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 6,
          borderWidth: 1,
          borderColor: "rgba(239, 68, 68, 0.15)"
        }}>
          <AlertCircle size={14} color="#ef4444" />
          <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Você recusou esta oferta
          </Text>
        </View>
      ) : item.negotiation?.myOffer?.status === "client_countered" ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => onReject(item.rideId)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: "rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.02)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={14} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }}>Recusar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onAccept(item.rideId)}
            disabled={!hasEnoughBalance}
            style={{
              flex: 1.8,
              height: 38,
              borderRadius: 10,
              backgroundColor: hasEnoughBalance ? "#02de95" : "rgba(2,222,149,0.28)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4,
              opacity: hasEnoughBalance ? 1 : 0.7,
            }}
            activeOpacity={0.85}
          >
            <Check size={16} color="#091A2F" strokeWidth={3} />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }} numberOfLines={1}>
              {hasEnoughBalance
                ? `Aceitar R$ ${item.negotiation.myOffer.amount.toFixed(2).replace(".", ",")}`
                : "Sem Saldo"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : item.negotiation?.myOffer ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {/* Status Aguardando */}
          <View style={{
            flex: 1.8,
            height: 38,
            borderRadius: 10,
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.08)"
          }}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }} numberOfLines={1}>
              Aguardando...
            </Text>
          </View>

          {/* Botão Cancelar Oferta */}
          <TouchableOpacity
            onPress={() => onReject(item.rideId)}
            style={{
              flex: 1.2,
              height: 38,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: "rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.02)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={13} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 11, textTransform: "uppercase" }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {/* Botão Rejeitar Compacto com Texto */}
          <TouchableOpacity
            onPress={() => onReject(item.rideId)}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: "rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.02)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4
            }}
            activeOpacity={0.7}
          >
            <Trash2 size={13} color="#ef4444" />
            <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }}>Recusar</Text>
          </TouchableOpacity>

          {/* Botão Contraproposta Compacto */}
          {item.negotiation?.enabled && (
            <TouchableOpacity
              onPress={() => onCounterOffer?.(item.rideId)}
              disabled={!hasEnoughBalance}
              style={{
                flex: 1.3,
                height: 38,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.3)" : "rgba(239,68,68,0.35)",
                backgroundColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.05)" : "rgba(239,68,68,0.08)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 4,
                opacity: hasEnoughBalance ? 1 : 0.7,
              }}
              activeOpacity={0.85}
            >
              <MessageCircle size={13} color={hasEnoughBalance ? "#02de95" : "#fca5a5"} />
              <Text style={{ color: hasEnoughBalance ? "#02de95" : "#fca5a5", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }}>
                Propor
              </Text>
            </TouchableOpacity>
          )}

          {/* Botão Aceitar Compacto */}
          <TouchableOpacity
            onPress={() => onAccept(item.rideId)}
            disabled={!hasEnoughBalance}
            style={{
              flex: 1.2,
              height: 38,
              borderRadius: 10,
              backgroundColor: hasEnoughBalance ? "#02de95" : "rgba(2,222,149,0.28)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4,
              opacity: hasEnoughBalance ? 1 : 0.7,
            }}
            activeOpacity={0.8}
          >
            <Check size={15} color="#091A2F" strokeWidth={3} />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }}>
              {hasEnoughBalance ? "Aceitar" : "Sem Saldo"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </MotiView>
  );
}
