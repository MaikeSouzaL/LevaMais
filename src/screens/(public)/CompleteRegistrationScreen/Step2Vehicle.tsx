import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import theme from "../../../theme";
import type { RegistrationData } from "../../../types/registration";

interface Step2VehicleProps {
  data: RegistrationData;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Vehicle({
  data,
  onUpdate,
  onNext,
  onBack,
}: Step2VehicleProps) {
  const [vehicleType, setVehicleType] = useState<
    "motorcycle" | "car" | "van" | "truck" | undefined
  >(data.vehicleType);

  const vehicleInfo = data.vehicleInfo || {};

  const items = useMemo(
    () => [
      { id: "motorcycle", label: "Moto", icon: "motorbike" },
      { id: "car", label: "Carro", icon: "car" },
      { id: "van", label: "Van", icon: "van-passenger" },
      { id: "truck", label: "Caminhão", icon: "truck" },
    ],
    [],
  );

  const handleNext = () => {
    if (!vehicleType) {
      Toast.show({
        type: "error",
        text1: "Selecione o veículo",
        text2: "Informe o tipo de veículo para continuar.",
      });
      return;
    }

    onUpdate({ vehicleType });
    onNext();
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-dark" edges={["top", "bottom"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
          >
            <MaterialCommunityIcons
              name="truck-fast"
              size={24}
              color={theme.COLORS.WHITE}
            />
          </View>
          <Text className="text-white text-lg font-bold">Leva+</Text>
        </View>
        <TouchableOpacity>
          <Feather name="help-circle" size={24} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 340, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={120}
      >
        <View className="px-6">
          <Text className="text-white text-2xl font-bold mb-2">
            Dados do veículo
          </Text>
          <Text className="text-gray-300 text-base mb-6">
            Para receber solicitações, precisamos do seu tipo de veículo e
            informações básicas.
          </Text>

          <Text className="text-gray-300 text-sm font-semibold mb-3">
            Tipo de veículo
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {items.map((it) => {
              const selected = vehicleType === it.id;
              return (
                <TouchableOpacity
                  key={it.id}
                  onPress={() => {
                    setVehicleType(it.id as any);
                    onUpdate({ vehicleType: it.id as any });
                  }}
                  activeOpacity={0.85}
                  style={{
                    width: "48%",
                    paddingVertical: 14,
                    paddingHorizontal: 12,
                    borderRadius: 16,
                    backgroundColor: selected
                      ? "rgba(2,222,149,0.16)"
                      : theme.COLORS.SURFACE_SECONDARY,
                    borderWidth: 1,
                    borderColor: selected
                      ? theme.COLORS.BRAND_LIGHT
                      : "rgba(255,255,255,0.08)",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <MaterialCommunityIcons
                    name={it.icon as any}
                    size={22}
                    color={selected ? theme.COLORS.BRAND_LIGHT : "#9CA3AF"}
                  />
                  <Text
                    style={{
                      color: selected ? "#fff" : "rgba(255,255,255,0.85)",
                      fontWeight: "800",
                    }}
                  >
                    {it.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="mt-6">
            <Text className="text-gray-300 text-sm font-semibold mb-1.5">
              Placa
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3">
              <MaterialCommunityIcons
                name="card-text"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="ABC1D23"
                placeholderTextColor="#7C7C8A"
                value={vehicleInfo.plate || ""}
                autoCapitalize="characters"
                onChangeText={(t) =>
                  onUpdate({
                    vehicleInfo: { ...vehicleInfo, plate: t },
                  })
                }
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-gray-300 text-sm font-semibold mb-1.5">
              Modelo
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3">
              <MaterialCommunityIcons
                name="car-info"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Ex: Honda CG 160, Corolla..."
                placeholderTextColor="#7C7C8A"
                value={vehicleInfo.model || ""}
                onChangeText={(t) =>
                  onUpdate({
                    vehicleInfo: { ...vehicleInfo, model: t },
                  })
                }
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-gray-300 text-sm font-semibold mb-1.5">
              Cor
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3">
              <MaterialCommunityIcons
                name="palette"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Ex: Prata"
                placeholderTextColor="#7C7C8A"
                value={vehicleInfo.color || ""}
                onChangeText={(t) =>
                  onUpdate({
                    vehicleInfo: { ...vehicleInfo, color: t },
                  })
                }
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-gray-300 text-sm font-semibold mb-1.5">
              Ano
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3">
              <MaterialCommunityIcons
                name="calendar"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Ex: 2020"
                placeholderTextColor="#7C7C8A"
                keyboardType="number-pad"
                value={vehicleInfo.year ? String(vehicleInfo.year) : ""}
                onChangeText={(t) =>
                  onUpdate({
                    vehicleInfo: {
                      ...vehicleInfo,
                      year: t ? Number(t.replace(/\D/g, "")) : undefined,
                    },
                  })
                }
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleNext}
            className="h-14 rounded-2xl items-center justify-center mt-8"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
            activeOpacity={0.85}
          >
            <Text className="text-brand-dark font-bold text-lg">Continuar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
