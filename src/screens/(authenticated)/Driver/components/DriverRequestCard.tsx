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
  AlertCircle
} from "lucide-react-native";
import { formatBRL } from "../../../../utils/mappers";

export type DriverRequestCardItem = {
  rideId: string;
  pickup?: { address?: string };
  dropoff?: { address?: string };
  pricing?: { total?: number };
  distance?: { text?: string };
  serviceType?: string;
  vehicleType?: string;
  details?: {
    itemType?: string;
    priority?: number;
    specialInstructions?: string;
  };
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    myOffer?: {
      amount: number;
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
              style={{
                flex: 1.4,
                height: 56,
                borderRadius: 16,
                backgroundColor: "#02de95",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
              activeOpacity={0.8}
            >
              <Check size={20} color="#091A2F" strokeWidth={3} />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Aceitar R$ {item.negotiation.myOffer.amount.toFixed(2).replace('.', ',')}</Text>
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
              style={{
                flex: 1.4,
                height: 56,
                borderRadius: 16,
                backgroundColor: "#02de95",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 5
              }}
              activeOpacity={0.8}
            >
              <Check size={20} color="#091A2F" strokeWidth={3} />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>Aceitar</Text>
            </TouchableOpacity>
          </View>

          {/* 💎 Negotiation Direct Counter Strike CTA */}
          {item.negotiation?.enabled && (
            <TouchableOpacity
              onPress={() => onCounterOffer?.(item.rideId)}
              style={{
                marginTop: 12,
                height: 56,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: "rgba(2, 222, 149, 0.3)",
                backgroundColor: "rgba(2, 222, 149, 0.05)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
              activeOpacity={0.85}
            >
              <MessageCircle size={18} color="#02de95" />
              <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Fazer Contraoferta</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </MotiView>
  );
}
