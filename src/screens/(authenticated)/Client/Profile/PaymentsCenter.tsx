import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { colors } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../Shared/components";
import {
  deletePaymentMethod,
  getPaymentMethods,
  type PaymentMethod,
} from "@/services/auth.service";

export default function PaymentsCenterScreen() {
  const navigation = useNavigation<any>();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getPaymentMethods();
      setMethods(list || []);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar pagamentos",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMethods();
    }, [loadMethods]),
  );

  const handleDelete = async (methodId: string) => {
    try {
      await deletePaymentMethod(methodId);
      Toast.show({ type: "success", text1: "Cartao removido" });
      await loadMethods();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao remover",
        text2: error?.message || "Tente novamente",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader
        title="Pagamentos"
        subtitle="Gerencie cartoes e forma padrao"
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <LoadingButton
          title="Adicionar cartao"
          onPress={() => navigation.navigate("AddPaymentMethod")}
          variant="primary"
          loading={loading}
        />

        <Text className="text-xs font-bold text-gray-500 tracking-wider mt-3">SEUS CARTOES</Text>

        {methods.length === 0 ? (
          <View className="items-center p-6 border border-gray-700 rounded-lg bg-[#0d2838]">
            <MaterialIcons name="credit-card-off" size={42} color={colors.text.tertiary} />
            <Text className="text-gray-500 text-base mt-3">Nenhum cartao cadastrado</Text>
          </View>
        ) : (
          methods.map((method) => (
            <View key={method._id} className="flex-row gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-4 items-start">
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  {String(method.brand || "card").toUpperCase()} •••• {method.last4}
                </Text>
                <Text className="text-gray-400 text-sm mt-0.5">{method.holderName}</Text>
                <Text className="text-gray-400 text-sm mt-0.5">
                  Validade: {String(method.expiryMonth).padStart(2, "0")}/{String(method.expiryYear).padStart(2, "0")}
                </Text>
                {method.isDefault && <Text className="text-[#02de95] text-xs font-bold mt-1 uppercase">Padrao</Text>}
              </View>

              <TouchableOpacity onPress={() => handleDelete(method._id)} className="w-9 h-9 rounded-full items-center justify-center bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.2)]">
                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


