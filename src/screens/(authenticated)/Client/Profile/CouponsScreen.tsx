import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../Shared/components";
import promotionService, { Promotion } from "@/services/promotion.service";

const KEY = "client-coupons-v2";

export default function CouponsScreen() {
  const [input, setInput] = useState("");
  const [savedCodes, setSavedCodes] = useState<string[]>([]);
  const [available, setAvailable] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (!raw) return;
        setSavedCodes(JSON.parse(raw));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setFetching(true);
      try {
        const promos = await promotionService.listActive();
        if (!mounted) return;
        setAvailable(promos);
      } catch {
        if (!mounted) return;
        setAvailable([]);
      } finally {
        if (mounted) setFetching(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizedInput = useMemo(() => input.trim().toUpperCase(), [input]);

  const saveCodes = async (next: string[]) => {
    setSavedCodes(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  };

  const applyCoupon = async (value?: string) => {
    const code = (value || normalizedInput).trim().toUpperCase();
    if (!code) {
      Toast.show({ type: "error", text1: "Informe um cupom" });
      return;
    }

    if (savedCodes.includes(code)) {
      Toast.show({ type: "info", text1: "Cupom ja adicionado" });
      return;
    }

    setLoading(true);
    try {
      const validated = await promotionService.validateCode({
        code,
        amount: 0,
      });

      const next = [code, ...savedCodes];
      await saveCodes(next);
      setInput("");

      setAvailable((prev) => {
        const exists = prev.some((item) => item.code === code);
        if (exists) return prev;
        return [
          {
            code: validated.code,
            title: validated.title,
            description: validated.description,
            discountType: validated.discountType,
            discountValue: validated.discountValue,
          },
          ...prev,
        ];
      });

      Toast.show({ type: "success", text1: `Cupom ${code} adicionado` });
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Cupom invalido";
      Toast.show({ type: "error", text1: apiMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Cupons" subtitle="Promocoes e descontos" />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
        <Text className="text-xs font-bold text-gray-500 tracking-wider">ADICIONAR CUPOM</Text>
        <View className="mb-2">
          <TextInput
            className="bg-[#0d2838] border border-gray-700 rounded-lg px-4 py-3 text-white text-base"
            placeholder="Ex: LEVA10"
            placeholderTextColor={colors.text.tertiary}
            value={input}
            onChangeText={setInput}
            autoCapitalize="characters"
          />
        </View>

        <LoadingButton
          title="Aplicar cupom"
          onPress={() => applyCoupon()}
          variant="primary"
          loading={loading}
        />

        <Text className="text-xs font-bold text-gray-500 tracking-wider mt-3">CUPONS DISPONIVEIS</Text>
        {fetching ? (
          <View className="border border-gray-700 rounded-lg p-4 bg-[#0d2838]">
            <Text className="text-gray-500 text-center">Carregando cupons...</Text>
          </View>
        ) : available.length === 0 ? (
          <View className="border border-gray-700 rounded-lg p-4 bg-[#0d2838]">
            <Text className="text-gray-500 text-center">Nenhum cupom disponivel agora</Text>
          </View>
        ) : (
          available.map((item) => (
            <TouchableOpacity key={item.code} className="flex-row items-center bg-[#0d2838] border border-gray-700 rounded-lg p-4" onPress={() => applyCoupon(item.code)}>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{item.code}</Text>
                <Text className="text-gray-400 text-sm mt-1">{item.description || item.title}</Text>
              </View>
              <Text className="text-[#02de95] font-bold">Usar</Text>
            </TouchableOpacity>
          ))
        )}

        <Text className="text-xs font-bold text-gray-500 tracking-wider mt-3">SEUS CUPONS</Text>
        {savedCodes.length === 0 ? (
          <View className="border border-gray-700 rounded-lg p-4 bg-[#0d2838]">
            <Text className="text-gray-500 text-center">Nenhum cupom salvo</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {savedCodes.map((code) => (
              <View key={code} className="border border-[rgba(2,222,149,0.35)] rounded-full px-4 py-1.5 bg-[rgba(2,222,149,0.1)]">
                <Text className="text-[#02de95] font-bold text-sm">{code}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

