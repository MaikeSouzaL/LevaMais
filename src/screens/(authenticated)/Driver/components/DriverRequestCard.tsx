import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
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

  return (
    <View
      style={{
        backgroundColor: "#162e26",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Text style={{ color: "white", fontWeight: "800" }}>
        {formatBRL(item.negotiation?.clientOffer ?? item.pricing?.total ?? 0)}
      </Text>
      {item.negotiation?.enabled && (
        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
          Oferta do cliente: {formatBRL(item.negotiation?.clientOffer ?? 0)}
          {"  "}
          Min. sugerido: {formatBRL(item.negotiation?.suggestedMinPrice ?? 0)}
        </Text>
      )}

      {/* ✨ Delivery Info Extensions ✨ */}
      {item.serviceType === "delivery" && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 4 }}>
           <View style={{ backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: "#ddd", fontSize: 11, fontWeight: "700" }}>
                 {item.vehicleType === "motorcycle" ? "🛵 Moto" : "🚗 Carro"}
              </Text>
           </View>
           {item.details?.itemType && (
             <View style={{ backgroundColor: "rgba(2,222,149,0.12)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "700" }}>
                   {
                     {
                        food: "Delivery",
                        doc: "Documentos",
                        market: "Mercado",
                        box: "Caixa",
                        material: "Material",
                        furniture: "Móveis",
                        moving: "Mudança",
                        other: "Outros"
                     }[item.details.itemType as string] || item.details.itemType
                   }
                </Text>
             </View>
           )}
           {item.details?.priority !== undefined && (
             <View style={{ 
                backgroundColor: item.details.priority === 2 ? "rgba(239,68,68,0.1)" : "rgba(59,130,246,0.1)", 
                paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 
             }}>
                <Text style={{ 
                   color: item.details.priority === 2 ? "#ef4444" : "#60a5fa", 
                   fontSize: 11, fontWeight: "700" 
                }}>
                   {item.details.priority === 2 ? "🚨 Urgente" : item.details.priority === 1 ? "⚡ Rápido" : "🐢 Econômico"}
                </Text>
             </View>
           )}
        </View>
      )}

       {item.details?.specialInstructions && (
         <View style={{ backgroundColor: "rgba(251,191,36,0.06)", padding: 8, borderRadius: 10, marginTop: 6, marginBottom: 4, borderWidth: 1, borderColor: "rgba(251,191,36,0.1)" }}>
            <Text style={{ color: "rgba(251,191,36,0.8)", fontSize: 10, fontWeight: "800" }}>VOLUME/OBS:</Text>
            <Text style={{ color: "#fef3c7", fontSize: 12, marginTop: 2 }} numberOfLines={2}>
              {item.details.specialInstructions}
            </Text>
         </View>
       )}

       {!isQueueItem || showDetails ? (
         <>
           <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
             Coleta: {item.pickup?.address || "—"}
           </Text>
           <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
             Destino: {item.dropoff?.address || "—"}
           </Text>
           <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
             {item.distance?.text || ""}
           </Text>
         </>
       ) : (
         <View style={{ backgroundColor: "rgba(251,191,36,0.1)", padding: 10, borderRadius: 10, marginTop: 6, marginBottom: 6, borderWidth: 1, borderColor: "rgba(251,191,36,0.3)" }}>
           <Text style={{ color: "#fef3c7", fontSize: 12, fontWeight: "700" }}>
             📍 Detalhes da localização ocultos até aceitar
           </Text>
         </View>
       )}

       {isQueueItem && !showDetails && (
         <TouchableOpacity
           onPress={() => setShowDetails(true)}
           style={{
             marginTop: 10,
             paddingVertical: 10,
             borderRadius: 12,
             borderWidth: 1,
             borderColor: "rgba(251,191,36,0.5)",
             alignItems: "center",
             backgroundColor: "rgba(251,191,36,0.1)",
           }}
         >
           <Text style={{ color: "#fef3c7", fontWeight: "800" }}>Ver Detalhes da Localização</Text>
         </TouchableOpacity>
       )}

       <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          onPress={() => onReject(item.rideId)}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.5)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ef4444", fontWeight: "900" }}>Rejeitar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onAccept(item.rideId)}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#02de95",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#091A2F", fontWeight: "900" }}>Aceitar</Text>
        </TouchableOpacity>
      </View>

      {item.negotiation?.enabled && (
        <TouchableOpacity
          onPress={() => onCounterOffer?.(item.rideId)}
          style={{
            marginTop: 10,
            paddingVertical: 10,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "rgba(2,222,149,0.35)",
            alignItems: "center",
            backgroundColor: "rgba(2,222,149,0.08)",
          }}
        >
          <Text style={{ color: "#02de95", fontWeight: "800" }}>Fazer contraoferta</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
