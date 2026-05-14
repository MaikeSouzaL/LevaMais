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
  setDefaultPaymentMethod,
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
      Toast.show({ type: "success", text1: "Cartão removido" });
      await loadMethods();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao remover",
        text2: error?.message || "Tente novamente",
      });
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await setDefaultPaymentMethod(methodId);
      Toast.show({ type: "success", text1: "Cartão padrão atualizado" });
      await loadMethods();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao atualizar padrão",
        text2: error?.message || "Tente novamente",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader
        title="Pagamentos"
        subtitle="Gerencie cartões e forma padrão"
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <LoadingButton
          title="Adicionar cartão"
          onPress={() => navigation.navigate("AddPaymentMethod")}
          variant="primary"
          loading={loading}
        />

        <View className="bg-[#0d2838] border border-gray-700 rounded-lg p-4 gap-2">
          <Text className="text-white font-bold text-base">Estado atual da integração</Text>
          <Text className="text-gray-400 text-sm leading-5">
            O app já permite salvar e escolher cartão padrão na plataforma. A tokenização e a captura com gateway externo ainda dependem da integração financeira final.
          </Text>
        </View>

        <Text className="text-xs font-bold text-gray-500 tracking-wider mt-3">SEUS CARTÕES</Text>

        {methods.length === 0 ? (
          <View className="items-center p-6 border border-gray-700 rounded-lg bg-[#0d2838]">
            <MaterialIcons name="credit-card-off" size={42} color={colors.text.tertiary} />
            <Text className="text-gray-500 text-base mt-3">Nenhum cartão cadastrado</Text>
          </View>
        ) : (
          methods.map((method) => (
            <View key={method._id} className="gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-4">
              <View className="flex-row gap-3 items-start">
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    {String(method.brand || "card").toUpperCase()} •••• {method.last4}
                  </Text>
                  <Text className="text-gray-400 text-sm mt-0.5">{method.holderName}</Text>
                  <Text className="text-gray-400 text-sm mt-0.5">
                    Validade: {String(method.expiryMonth).padStart(2, "0")}/{String(method.expiryYear).padStart(2, "0")}
                  </Text>
                  {method.isDefault && <Text className="text-[#02de95] text-xs font-bold mt-1 uppercase">Padrão</Text>}
                </View>

                <TouchableOpacity onPress={() => handleDelete(method._id)} className="w-9 h-9 rounded-full items-center justify-center bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.2)]">
                  <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {!method.isDefault && (
                <TouchableOpacity
                  onPress={() => handleSetDefault(method._id)}
                  className="flex-row items-center justify-center gap-2 border border-[rgba(2,222,149,0.3)] rounded-full py-2.5 bg-[rgba(2,222,149,0.08)]"
                >
                  <MaterialIcons name="check-circle-outline" size={18} color="#02de95" />
                  <Text className="text-[#02de95] font-bold text-sm">Definir como padrão</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
