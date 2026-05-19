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
  onCounterOffer?: (rideId: string) => void;
};

export function DriverRequestCard({
  item,
  onAccept,
  onReject,
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
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(2, 222, 149, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
        overflow: "hidden",
      }}
    >
      {/* 📡 Dynamic Header Command Strip */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95" }} />
          <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 10.5, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" }}>
            {item.negotiation?.enabled ? "Negociação Ativa" : "Oferta Disponível"}
          </Text>
        </View>

      </View>

      {/* 💰 Golden Super-Sized Value Pod */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <MotiView
          from={{ scale: 0.98 }}
          animate={{ scale: 1.02 }}
          transition={{ loop: true, type: "timing", duration: 1200, repeatReverse: true }}
          style={{ flexDirection: "row", alignItems: "baseline" }}
        >
          <Text style={{ color: "#F59E0B", fontSize: 20, fontWeight: "800", marginRight: 4 }}>
            R$
          </Text>
          <Text 
            style={{ 
              color: "#F59E0B", 
              fontSize: 44, 
              fontWeight: "900", 
              letterSpacing: -1.5,
              textShadowColor: "rgba(245, 158, 11, 0.25)",
              textShadowOffset: { width: 0, height: 4 },
              textShadowRadius: 12
            }}
          >
            {item.negotiation?.myOffer ? item.negotiation.myOffer.amount.toFixed(2).replace(".", ",") : finalPrice.toFixed(2).replace(".", ",")}
          </Text>
        </MotiView>
        <Text style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: 11, fontWeight: "700", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {item.negotiation?.myOffer?.status === "client_countered" ? "Contraproposta do Cliente" : item.negotiation?.myOffer ? "Sua Contraproposta Enviada" : "Oferta proposta pelo cliente"}
        </Text>

        {/* 🔄 Visual comparison of driver's original offer vs client's counter */}
        {item.negotiation?.myOffer?.status === "client_countered" && !!item.negotiation.myOffer.driverAmount && (
          <MotiView 
            from={{ opacity: 0, translateY: 4 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{ 
              marginTop: 12, 
              flexDirection: "row", 
              alignItems: "center", 
              backgroundColor: "rgba(245, 158, 11, 0.12)", 
              paddingHorizontal: 16, 
              paddingVertical: 8, 
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(245, 158, 11, 0.3)",
              gap: 8
            }}
          >
            <Text style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>
              SUA OFERTA ANTERIOR:
            </Text>
            <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "900", textDecorationLine: "line-through", textDecorationColor: "#FF3B30" }}>
              R$ {item.negotiation.myOffer.driverAmount.toFixed(2).replace(".", ",")}
            </Text>
          </MotiView>
        )}

        {item.negotiation?.enabled && !item.negotiation?.myOffer && (
          <View style={{ marginTop: 8, backgroundColor: "rgba(245, 158, 11, 0.08)", borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.15)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
            <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "800" }}>
              Mínimo Sugerido: {formatBRL(minPrice)}
            </Text>
          </View>
        )}
      </View>

      {/* 🧬 Tech Capsules Metadata Block */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20, justifyContent: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255, 255, 255, 0.04)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.04)" }}>
          <Text style={{ fontSize: 12 }}>
            {item.vehicleType === "motorcycle" ? "🛵" : "🚗"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
            {item.vehicleType === "motorcycle" ? "Moto" : "Carro"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(2, 222, 149, 0.06)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "rgba(2, 222, 149, 0.1)" }}>
          <Package size={12} color="#02de95" />
          <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
            {
              item.serviceType === "delivery"
                ? ({
                    food: "Delivery",
                    doc: "Documentos",
                    market: "Mercado",
                    box: "Caixa",
                    material: "Material",
                    furniture: "Móveis",
                    moving: "Mudança",
                    other: "Outros"
                  }[item.details?.itemType as string] || "Encomenda")
                : "Transporte"
            }
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(59, 130, 246, 0.06)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.1)" }}>
          <Zap size={12} color="#60a5fa" />
          <Text style={{ color: "#60a5fa", fontSize: 11, fontWeight: "800", textTransform: "uppercase" }}>
            {item.details?.priority === 2 ? "Urgente" : item.details?.priority === 1 ? "Rápido" : "Econômico"}
          </Text>
        </View>
      </View>

      {/* 🔍 AI Smart Insights / Special Observations Container */}
      {item.details?.specialInstructions && (
        <View 
          style={{ 
            backgroundColor: "rgba(32, 201, 151, 0.04)", 
            borderRadius: 16, 
            padding: 14, 
            marginBottom: 20,
            borderWidth: 1, 
            borderColor: "rgba(2, 222, 149, 0.08)" 
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Star size={12} color="#02de95" fill="#02de95" />
            <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Análise de Encomenda
            </Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", fontStyle: "italic", opacity: 0.9 }}>
            "{item.details.specialInstructions}"
          </Text>
        </View>
      )}

      {/* Cargo Details */}
      {(item.details?.cargoSize || (item.details?.approximateWeightKg != null && item.details.approximateWeightKg > 0) || item.details?.isFragile || item.details?.needsHelper) && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 20 }}>
          {item.details?.cargoSize && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(168, 85, 247, 0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.1)' }}>
              <Package size={12} color='#a855f7' />
              <Text style={{ color: '#a855f7', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>
                {item.details.cargoSize === 'large' ? 'Grande' : item.details.cargoSize === 'medium' ? 'Medio' : 'Pequeno'}
              </Text>
            </View>
          )}
          {item.details?.approximateWeightKg != null && item.details.approximateWeightKg > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(250, 204, 21, 0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.1)' }}>
              <Package size={12} color='#facc15' />
              <Text style={{ color: '#facc15', fontSize: 11, fontWeight: '800' }}>{item.details.approximateWeightKg}kg</Text>
            </View>
          )}
          {item.details?.isFragile && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle size={12} color='#ef4444' />
              <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '800' }}>Fragil</Text>
            </View>
          )}
          {item.details?.needsHelper && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34, 197, 94, 0.06)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34, 197, 94, 0.1)' }}>
              <Shield size={12} color='#22c55e' />
              <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '800' }}>Ajudante</Text>
            </View>
          )}
        </View>
      )}

      {item.serviceType === "delivery" && (
        <View
          style={{
            backgroundColor: "rgba(59, 130, 246, 0.08)",
            borderRadius: 16,
            padding: 14,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "rgba(59, 130, 246, 0.2)",
            gap: 4,
          }}
        >
          <Text style={{ color: "#60a5fa", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Operacao da Entrega
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            Recebedor: {item.details?.recipientName || "-"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
            Telefone: {item.details?.recipientPhone || "-"}
          </Text>
          {!!item.details?.pickupComplement && (
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              Complemento coleta: {item.details.pickupComplement}
            </Text>
          )}
          {!!item.details?.dropoffComplement && (
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              Complemento destino: {item.details.dropoffComplement}
            </Text>
          )}
          {!!item.details?.recipientInstructions && (
            <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              Instrucao de entrega: {item.details.recipientInstructions}
            </Text>
          )}
          {!!item.details?.deliveryPin && (
            <Text style={{ color: "#F59E0B", fontSize: 12, fontWeight: "800" }}>
              PIN: {item.details.deliveryPin}
            </Text>
          )}
        </View>
      )}

      <View
        style={{
          backgroundColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.08)" : "rgba(239, 68, 68, 0.12)",
          borderRadius: 16,
          padding: 14,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.2)" : "rgba(239, 68, 68, 0.3)",
          gap: 4,
        }}
      >
        <Text
          style={{
            color: hasEnoughBalance ? "#02de95" : "#f87171",
            fontSize: 10,
            fontWeight: "900",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Risco Financeiro
        </Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
          Taxa estimada plataforma: {formatBRL(estimatedPlatformFee)}
        </Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
          Saldo necessario: {formatBRL(requiredBalance)}
        </Text>
        <Text style={{ color: hasEnoughBalance ? "#86efac" : "#fca5a5", fontSize: 12, fontWeight: "700" }}>
          Saldo atual: {formatBRL(currentBalance)}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
          Pagamento previsto: {paymentLabel}
        </Text>
        {!hasEnoughBalance && (
          <Text style={{ color: "#fca5a5", fontSize: 11, fontWeight: "700" }}>
            Saldo insuficiente para aceitar com seguranca.
          </Text>
        )}
      </View>

      {/* 📍 Connected Tactical Timeline */}
      <View style={{ backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.04)", marginBottom: 20 }}>
        {!isQueueItem || showDetails ? (
          <View style={{ gap: 16 }}>
            {/* Partida */}
            <View style={{ flexDirection: "row", gap: 14 }}>
              <View style={{ alignItems: "center", width: 20 }}>
                <View 
                  style={{ 
                    width: 18, 
                    height: 18, 
                    borderRadius: 9, 
                    backgroundColor: "rgba(2, 222, 149, 0.12)", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    borderWidth: 1, 
                    borderColor: "rgba(2, 222, 149, 0.3)" 
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#02de95" }} />
                </View>
                <View style={{ width: 0, flex: 1, borderLeftWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.15)", borderStyle: "dashed", marginVertical: 4 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>PARTIDA (COLETA)</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 }}>{item.pickup?.address || "Definido no mapa"}</Text>
              </View>
            </View>

            {/* Destino */}
            <View style={{ flexDirection: "row", gap: 14 }}>
              <View style={{ alignItems: "center", width: 20 }}>
                <View 
                  style={{ 
                    width: 18, 
                    height: 18, 
                    borderRadius: 9, 
                    backgroundColor: "rgba(239, 68, 68, 0.12)", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    borderWidth: 1, 
                    borderColor: "rgba(239, 68, 68, 0.3)" 
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 }}>DESTINO (ENTREGA)</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 2 }}>{item.dropoff?.address || "Definido no mapa"}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 6 }}>
            <AlertCircle size={20} color="#F59E0B" style={{ marginBottom: 6 }} />
            <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>
              Localização Oculta
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "600", marginTop: 2, textAlign: "center" }}>
              Visível apenas para motoristas da fila que aceitarem a tarefa.
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowDetails(true)}
              style={{
                marginTop: 14,
                width: "100%",
                height: 44,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(245, 158, 11, 0.4)",
                backgroundColor: "rgba(245, 158, 11, 0.06)",
                alignItems: "center",
                justifyContent: "center"
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 12, textTransform: "uppercase" }}>Ver Detalhes</Text>
            </TouchableOpacity>
          </View>
        )}

        {(!isQueueItem || showDetails) && item.distance?.text && (
          <View style={{ flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", marginTop: 14, paddingTop: 14, justifyContent: "space-around" }}>
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700" }}>DISTÂNCIA</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "900", marginTop: 1 }}>{item.distance.text}</Text>
            </View>
            <View style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.05)", alignSelf: "center" }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700" }}>DEMANDA</Text>
              <Text style={{ color: "#02de95", fontSize: 13, fontWeight: "900", marginTop: 1 }}>ALTA</Text>
            </View>
          </View>
        )}
      </View>

      {/* ⚡ Action Command Console Row */}
      {item.negotiation?.myOffer?.status === "client_countered" ? (
        <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => onReject(item.rideId)}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: "rgba(239, 68, 68, 0.3)",
                backgroundColor: "rgba(239, 68, 68, 0.02)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Recusar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onAccept(item.rideId)}
              disabled={!hasEnoughBalance}
              style={{
                flex: 1.4,
                height: 56,
                borderRadius: 16,
                backgroundColor: hasEnoughBalance ? "#02de95" : "rgba(2,222,149,0.28)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
                opacity: hasEnoughBalance ? 1 : 0.7,
              }}
              activeOpacity={0.8}
            >
              <Check size={20} color="#091A2F" strokeWidth={3} />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {hasEnoughBalance
                  ? `Aceitar R$ ${item.negotiation.myOffer.amount.toFixed(2).replace(".", ",")}`
                  : "Saldo insuficiente"}
              </Text>
            </TouchableOpacity>
        </View>
      ) : item.negotiation?.myOffer ? (
        <View style={{
          height: 56,
          borderRadius: 16,
          backgroundColor: "rgba(255,255,255,0.03)",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 10,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)"
        }}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Aguardando Cliente...
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => onReject(item.rideId)}
              style={{
                flex: 1,
                height: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: "rgba(239, 68, 68, 0.3)",
                backgroundColor: "rgba(239, 68, 68, 0.02)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6
              }}
              activeOpacity={0.7}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Rejeitar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onAccept(item.rideId)}
              disabled={!hasEnoughBalance}
              style={{
                flex: 1.4,
                height: 56,
                borderRadius: 16,
                backgroundColor: hasEnoughBalance ? "#02de95" : "rgba(2,222,149,0.28)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 5,
                opacity: hasEnoughBalance ? 1 : 0.7,
              }}
              activeOpacity={0.8}
            >
              <Check size={20} color="#091A2F" strokeWidth={3} />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {hasEnoughBalance ? "Aceitar" : "Saldo insuficiente"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 💎 Negotiation Direct Counter Strike CTA */}
          {item.negotiation?.enabled && (
            <TouchableOpacity
              onPress={() => onCounterOffer?.(item.rideId)}
              disabled={!hasEnoughBalance}
              style={{
                marginTop: 12,
                height: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.3)" : "rgba(239,68,68,0.35)",
                backgroundColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.05)" : "rgba(239,68,68,0.08)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: hasEnoughBalance ? 1 : 0.7,
              }}
              activeOpacity={0.85}
            >
              <MessageCircle size={18} color={hasEnoughBalance ? "#02de95" : "#fca5a5"} />
              <Text style={{ color: hasEnoughBalance ? "#02de95" : "#fca5a5", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {hasEnoughBalance ? "Fazer Contraoferta" : "Saldo insuficiente"}
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </MotiView>
  );
}
