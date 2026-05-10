import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
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
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Cupons" subtitle="Promocoes e descontos" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>ADICIONAR CUPOM</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
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

        <Text style={styles.sectionTitle}>CUPONS DISPONIVEIS</Text>
        {fetching ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Carregando cupons...</Text>
          </View>
        ) : available.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum cupom disponivel agora</Text>
          </View>
        ) : (
          available.map((item) => (
            <TouchableOpacity key={item.code} style={styles.couponCard} onPress={() => applyCoupon(item.code)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.couponCode}>{item.code}</Text>
                <Text style={styles.couponDesc}>{item.description || item.title}</Text>
              </View>
              <Text style={styles.useText}>Usar</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionTitle}>SEUS CUPONS</Text>
        {savedCodes.length === 0 ? (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhum cupom salvo</Text></View>
        ) : (
          savedCodes.map((code) => (
            <View key={code} style={styles.savedCoupon}><Text style={styles.savedCouponText}>{code}</Text></View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
  },
  inputRow: { marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: fontSize.base,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
  },
  couponCode: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  couponDesc: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: 2 },
  useText: { color: colors.primary[500], fontWeight: fontWeight.bold },
  emptyState: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  emptyText: { color: colors.text.tertiary },
  savedCoupon: {
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(2,222,149,0.1)",
  },
  savedCouponText: { color: colors.primary[500], fontWeight: fontWeight.bold },
});
