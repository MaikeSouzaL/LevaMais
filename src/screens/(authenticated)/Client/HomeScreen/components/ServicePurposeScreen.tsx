import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getPurposesByVehicleType,
  type PurposeItem,
  type VehicleType,
} from "../../../../../services/purposes";
export function ServicePurposeScreen({
  vehicleType,
  onClose,
  onSelect,
}: {
  vehicleType: VehicleType;
  onClose: () => void;
  onSelect: (purposeId: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [purposes, setPurposes] = useState<PurposeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getPurposesByVehicleType(vehicleType)
      .then((data) => {
        if (mounted) setPurposes(data);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [vehicleType]);
  return (
    <SafeAreaView
      style={{
        position: "absolute",
        inset: 0 as any,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: "#0f231c",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{ padding: 8, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          Escolha o tipo de serviço
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#02de95" />
        </View>
      ) : (
        <FlatList
          data={purposes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelect(item.id)}
              activeOpacity={0.9}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                backgroundColor: "#162e26",
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons
                    name={(item.icon as any) ?? ("list" as any)}
                    size={28}
                    color="#9bbbb0"
                  />
                </View>
                <View>
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    {item.title}
                  </Text>
                  <Text style={{ color: "#9bbbb0", fontSize: 13 }}>{item.subtitle}</Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9bbbb0" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
