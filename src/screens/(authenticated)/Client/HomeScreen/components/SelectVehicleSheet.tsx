import React, { forwardRef, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type SelectVehicleSheetRef = BottomSheet;

interface SelectVehicleSheetProps {
  onSelect: (type: "motorcycle" | "car" | "van" | "truck") => void;
  onClose?: () => void;
}

export const SelectVehicleSheet = forwardRef<
  SelectVehicleSheetRef,
  SelectVehicleSheetProps
>(({ onSelect, onClose }, ref) => {
  const snapPoints = useMemo(() => ["100%"], []);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableHandlePanningGesture={false}
      enableContentPanningGesture={false}
      onClose={onClose}
      backgroundStyle={{ backgroundColor: "#0f231c" }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
    >
      <View style={{ paddingTop: 8, paddingBottom: 12, paddingHorizontal: 24 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: "700",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Qual tipo de veículo você precisa?
        </Text>
        <Text style={{ color: "#9bbbb0", fontSize: 13, textAlign: "center" }}>
          Selecione o melhor porte para sua carga
        </Text>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 24,
        }}
      >
        {/* Card: Moto */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSelect("motorcycle")}
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
          <View style={{ flex: 1, marginRight: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: "#06db94",
                  backgroundColor: "rgba(6,219,148,0.2)",
                  fontSize: 10,
                  fontWeight: "700",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  textTransform: "uppercase",
                }}
              >
                Mais rápido
              </Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Moto
            </Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Pequenos pacotes e documentos até 20kg
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="two-wheeler" size={32} color="#06db94" />
          </View>
        </TouchableOpacity>

        {/* Card: Carro */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSelect("car")}
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
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Carro
            </Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Compras de mercado ou caixas médias
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="directions-car" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Card: Van */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSelect("van")}
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
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Van
            </Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Móveis pequenos ou muitas caixas
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="airport-shuttle" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Card: Caminhão */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onSelect("truck")}
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
          <View style={{ flex: 1, marginRight: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  fontSize: 10,
                  fontWeight: "700",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  textTransform: "uppercase",
                }}
              >
                Grandes volumes
              </Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Caminhão
            </Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Mudanças e grandes cargas comerciais
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="local-shipping" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>

        {/* Spacer para garantir respiro no fim da lista */}
        <View style={{ height: insets.bottom + 24 }} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

SelectVehicleSheet.displayName = "SelectVehicleSheet";
