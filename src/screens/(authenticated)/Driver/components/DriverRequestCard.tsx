import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { formatBRL } from "../../../../utils/mappers";

export type DriverRequestCardItem = {
  rideId: string;
  pickup?: { address?: string };
  dropoff?: { address?: string };
  pricing?: { total?: number };
  distance?: { text?: string };
  vehicleType?: string;
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
  };
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

      <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
        Coleta: {item.pickup?.address || "—"}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
        Destino: {item.dropoff?.address || "—"}
      </Text>
      <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
        {item.distance?.text || ""}
      </Text>

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
