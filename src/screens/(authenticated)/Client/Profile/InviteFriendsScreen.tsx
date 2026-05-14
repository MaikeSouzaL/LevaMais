import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import { useAuthStore } from "@/context/authStore";

export default function InviteFriendsScreen() {
  const user = useAuthStore((s) => s.userData);
  const code = React.useMemo(() => {
    const seed = String(user?.id || "123456").slice(-6).toUpperCase();
    return `LEVA-${seed}`;
  }, [user?.id]);

  const shareInvite = async () => {
    try {
      await Share.share({
        message: `Conheça o Leva Mais. Use meu código de convite ${code} para se cadastrar e entrar no app: corridas, entregas e fretes em um só lugar.`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível compartilhar",
        text2: error?.message || "Tente novamente",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Convide amigos" subtitle="Compartilhe o app com sua rede" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="items-center gap-2 bg-[#0d2838] border border-gray-700 rounded-lg p-6">
          <MaterialIcons name="group-add" size={42} color={colors.primary[500]} />
          <Text className="text-white font-bold text-lg">Seu código de convite</Text>
          <Text className="text-[#02de95] font-bold text-2xl tracking-wider">{code}</Text>
          <Text className="text-gray-400 text-sm text-center leading-5">
            Compartilhe com amigos para ajudá-los a conhecer o Leva Mais. O programa financeiro de indicação ainda será finalizado no backend.
          </Text>
        </View>

        <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-[#02de95] rounded-full py-3" onPress={shareInvite}>
          <MaterialIcons name="ios-share" size={18} color="#091A2F" />
          <Text className="text-[#091A2F] font-bold text-base">Compartilhar convite</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
