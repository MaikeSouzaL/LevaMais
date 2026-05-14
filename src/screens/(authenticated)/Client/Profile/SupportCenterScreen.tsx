import React, { useEffect, useState } from "react";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { colors } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import configService, { SupportChannels } from "@/services/config.service";

const ITEMS = [
  { title: "Problemas com corrida", subtitle: "Reportar atraso, cancelamento ou valor", target: "History", icon: "directions-car" },
  { title: "Problemas com pagamento", subtitle: "Cartão, pix e cobranças", target: "PaymentsCenter", icon: "payment" },
  { title: "Segurança", subtitle: "Ajuda em emergência", target: "SafetyCenter", icon: "shield" },
];

export default function SupportCenterScreen() {
  const navigation = useNavigation<any>();
  const [supportChannels, setSupportChannels] = useState<SupportChannels | null>(null);

  useEffect(() => {
    configService.getSupportChannels().then(setSupportChannels).catch(() => setSupportChannels(null));
  }, []);

  const supportEmail = supportChannels?.email || "suporte@levamais.app";

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Suporte" subtitle="Central de atendimento" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 8 }}>
        {ITEMS.map((item) => (
          <TouchableOpacity key={item.title} className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-4" onPress={() => navigation.navigate(item.target)}>
            <MaterialIcons name={item.icon as any} size={22} color={colors.primary[500]} />
            <View className="flex-1">
              <Text className="text-white font-semibold text-base">{item.title}</Text>
              <Text className="text-gray-400 text-sm mt-0.5">{item.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-4" onPress={() => Linking.openURL(`mailto:${supportEmail}`)}>
          <MaterialIcons name="mail-outline" size={22} color={colors.primary[500]} />
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">Enviar e-mail</Text>
            <Text className="text-gray-400 text-sm mt-0.5">{supportEmail}</Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
