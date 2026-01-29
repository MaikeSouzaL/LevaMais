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
};

export type DriverRequestCardProps = {
  item: DriverRequestCardItem;
  onAccept: (rideId: string) => void;
  onReject: (rideId: string) => void;
};

export function DriverRequestCard({
  item,
  onAccept,
  onReject,
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
        {formatBRL(item.pricing?.total ?? 0)}
      </Text>

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
          <Text style={{ color: "#0f231c", fontWeight: "900" }}>Aceitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
