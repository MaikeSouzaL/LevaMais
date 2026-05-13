import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Share, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
    await Share.share({
      message: `Use meu codigo ${code} no Leva Mais e venha pedir corridas e entregas comigo!`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Convide amigos" subtitle="Ganhe beneficios por indicacao" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="items-center gap-2 bg-[#0d2838] border border-gray-700 rounded-lg p-6">
          <MaterialIcons name="group-add" size={42} color={colors.primary[500]} />
          <Text className="text-white font-bold text-lg">Seu codigo de convite</Text>
          <Text className="text-[#02de95] font-bold text-2xl tracking-wider">{code}</Text>
          <Text className="text-gray-400 text-sm text-center leading-5">Compartilhe com amigos para receber vantagens em corridas e entregas.</Text>
        </View>

        <TouchableOpacity className="flex-row items-center justify-center gap-2 bg-[#02de95] rounded-full py-3" onPress={shareInvite}>
          <MaterialIcons name="ios-share" size={18} color="#091A2F" />
          <Text className="text-[#091A2F] font-bold text-base">Compartilhar convite</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

