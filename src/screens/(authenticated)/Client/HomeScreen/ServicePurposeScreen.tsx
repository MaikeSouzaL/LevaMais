import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  getPurposesByVehicleType,
  type PurposeItem,
  type VehicleType,
} from "../../../../services/purposes";
import { mapIconName } from "../../../../utils/iconMapper";

export default function ServicePurposeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleType, pickup, dropoff } = (route.params as any) || {};

  const [loading, setLoading] = useState(false);
  const [purposes, setPurposes] = useState<PurposeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    if (vehicleType) {
      setLoading(true);
      getPurposesByVehicleType(vehicleType as VehicleType)
        .then((data) => {
          if (mounted) setPurposes(data);
        })
        .finally(() => mounted && setLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, [vehicleType]);

  const handleBack = () => {
    (navigation as any).navigate("SelectVehicle", { pickup, dropoff });
  };

  const handleSelectPurpose = (purposeId: string) => {
    (navigation as any).navigate("Home", {
      openOffersFor: vehicleType,
      purposeId,
      pickup,
      dropoff,
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#0f231c", paddingTop: insets.top }}
    >
      <View
        style={{
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={{ padding: 4, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Finalidade do Serviço
          </Text>
          <Text style={{ color: "#9bbbb0", fontSize: 13, textAlign: "center" }}>
            O que vamos transportar hoje?
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color="#02de95" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          {purposes.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleSelectPurpose(item.id)}
              activeOpacity={0.85}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                borderRadius: 16,
                backgroundColor: "#162e26",
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
              >
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
                    name={mapIconName(item.icon) as any}
                    size={28}
                    color="#02de95"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                  >
                    {item.title}
                  </Text>
                  <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
                    {item.subtitle}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9bbbb0" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
