import React from "react";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { colors } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import { exportPrivacyData, PrivacyExportPayload } from "@/services/auth.service";

export default function PrivacyDataScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<PrivacyExportPayload | null>(null);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await exportPrivacyData();
        if (!mounted) return;
        setSummary(data);
      } catch (error) {
        console.error("Error exporting privacy data:", error);
        if (!mounted) return;
        setSummary(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const exportData = async () => {
    setLoading(true);
    try {
      const payload = await exportPrivacyData();
      await Share.share({
        message: `Meus dados - Leva Mais\n${JSON.stringify(payload, null, 2)}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao exportar dados",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Privacidade e dados" subtitle="Controle da sua conta" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="bg-[#0d2838] border border-gray-700 rounded-lg p-4 gap-2">
          <MaterialIcons name="verified-user" size={28} color={colors.primary[500]} />
          <Text className="text-white font-bold text-base">Seus dados</Text>
          <Text className="text-gray-400 text-sm leading-5">
            Voce pode exportar seus dados e revisar informacoes principais da conta.
          </Text>
          {summary && (
            <Text className="text-[#02de95] text-xs font-semibold">
              Corridas registradas: {summary.rides.total} | Cartoes salvos: {summary.paymentMethods.length}
            </Text>
          )}
        </View>

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-3" onPress={exportData} disabled={loading}>
          <MaterialIcons name="download" size={20} color={colors.primary[500]} />
          <Text className="text-white font-semibold text-base">{loading ? "Exportando..." : "Exportar meus dados"}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-3" onPress={() => navigation.navigate("Settings") }>
          <MaterialIcons name="settings" size={20} color={colors.primary[500]} />
          <Text className="text-white font-semibold text-base">Gerenciar preferencias de privacidade</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

