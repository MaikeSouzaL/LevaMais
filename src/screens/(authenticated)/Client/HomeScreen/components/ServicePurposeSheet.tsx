import React, { forwardRef, useMemo, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getPurposesByVehicleType,
  type PurposeItem,
  type VehicleType,
} from "../../../../../services/purposes";
import { mapIconName } from "../../../../../utils/iconMapper";

export type ServicePurposeSheetRef = BottomSheet;

interface ServicePurposeSheetProps {
  vehicleType: VehicleType;
  onSelect: (purposeId: string) => void;
  onClose?: () => void;
  onBack?: () => void;
}

export const ServicePurposeSheet = forwardRef<
  ServicePurposeSheetRef,
  ServicePurposeSheetProps
>(({ vehicleType, onSelect, onClose, onBack }, ref) => {
  const snapPoints = useMemo(() => ["85%"], []);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [purposes, setPurposes] = useState<PurposeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    if (vehicleType) {
      setLoading(true);
      getPurposesByVehicleType(vehicleType)
        .then((data) => {
          if (mounted) setPurposes(data);
        })
        .finally(() => mounted && setLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, [vehicleType]);

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: "#0f231c" }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
    >
      <View
        style={{
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={onBack}
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
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
        >
          {purposes.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
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
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
});

ServicePurposeSheet.displayName = "ServicePurposeSheet";
