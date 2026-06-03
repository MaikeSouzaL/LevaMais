import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Icon } from "@/components/ui/Icon";
import { colors } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import { ClientStackParamList } from "../types/navigation";

type MaterialIconName = string;

const EMERGENCY_CONTACTS = [
  { id: "police", label: "Policia", number: "190", icon: "local-police", color: "#3b82f6" },
  { id: "ambulance", label: "SAMU", number: "192", icon: "local-hospital", color: "#ef4444" },
  { id: "fire", label: "Bombeiros", number: "193", icon: "fire-truck", color: "#f97316" },
];

const SAFETY_FEATURES = [
  {
    id: "share",
    icon: "share-location",
    label: "Compartilhar localizacao",
    description: "Envie sua localizacao em tempo real para contatos de confianca",
  },
  {
    id: "contacts",
    icon: "contacts",
    label: "Contatos de confianca",
    description: "Gerencie quem pode acompanhar suas viagens",
  },
  {
    id: "verify",
    icon: "verified-user",
    label: "Verificar motorista",
    description: "Confira foto, placa e identidade do motorista ao entrar",
  },
];

export default function SafetyCenterScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "SafetyCenter">
  >();

  const handleCallEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: "Estou em uma viagem no Leva+. Acompanhe minha localizacao: [link da viagem]",
      });
    } catch (error) {
      console.error("Error sharing trip:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Central de Seguranca" subtitle="Recursos de protecao durante as viagens" />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <View className="mb-6">
          <Text className="text-xs font-bold text-gray-500 tracking-wider mb-4 mt-4">EMERGENCIA</Text>
          <View className="flex-row justify-between gap-3">
            {EMERGENCY_CONTACTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="flex-1 bg-[#0d2838] border border-gray-700 rounded-lg p-3 items-center"
                onPress={() => handleCallEmergency(item.number)}
                activeOpacity={0.7}
              >
                <View className="w-13 h-13 rounded-full items-center justify-center mb-2" style={{ backgroundColor: item.color + "20" }}>
                  <Icon name={item.icon as MaterialIconName} size={28} color={item.color} />
                </View>
                <Text className="text-white text-sm font-bold">{item.label}</Text>
                <Text className="text-gray-500 text-xs mt-0.5">{item.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text className="text-xs font-bold text-gray-500 tracking-wider mb-3 mt-4">FERRAMENTAS</Text>
        {SAFETY_FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            className="flex-row items-center bg-[#0d2838] border border-gray-700 rounded-lg p-4 mb-2"
            onPress={feature.id === "share" ? handleShareTrip : undefined}
            activeOpacity={0.7}
          >
            <View className="w-12 h-12 rounded-lg bg-[rgba(2,222,149,0.08)] items-center justify-center mr-3">
              <Icon name={feature.icon as MaterialIconName} size={24} color={colors.primary[500]} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-semibold">{feature.label}</Text>
              <Text className="text-gray-500 text-xs mt-0.5">{feature.description}</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#555" />
          </TouchableOpacity>
        ))}

        <View className="flex-row bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-lg p-4 mt-6">
          <Icon name="lightbulb" size={20} color="#fbbf24" className="mr-3" />
          <Text className="text-[#fbbf24] text-sm flex-1 leading-5">
            Confira sempre a placa e o modelo do veiculo antes de entrar. Nao compartilhe seus dados pessoais com o motorista.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
