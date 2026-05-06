import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
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
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Pagamentos"
        subtitle="Gerencie cartoes e forma padrao"
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <LoadingButton
          title="Adicionar cartao"
          onPress={() => navigation.navigate("AddPaymentMethod")}
          variant="primary"
          loading={loading}
        />

        <Text style={styles.sectionTitle}>SEUS CARTOES</Text>

        {methods.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="credit-card-off" size={42} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Nenhum cartao cadastrado</Text>
          </View>
        ) : (
          methods.map((method) => (
            <View key={method._id} style={styles.methodCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>
                  {String(method.brand || "card").toUpperCase()} •••• {method.last4}
                </Text>
                <Text style={styles.methodSubtitle}>{method.holderName}</Text>
                <Text style={styles.methodSubtitle}>
                  Validade: {String(method.expiryMonth).padStart(2, "0")}/{String(method.expiryYear).padStart(2, "0")}
                </Text>
                {method.isDefault && <Text style={styles.defaultBadge}>Padrao</Text>}
              </View>

              <TouchableOpacity onPress={() => handleDelete(method._id)} style={styles.deleteBtn}>
                <MaterialIcons name="delete-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
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
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    marginTop: spacing.md,
  },
  methodCard: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    alignItems: "flex-start",
  },
  methodTitle: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  methodSubtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: 2 },
  defaultBadge: {
    color: colors.primary[500],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
    textTransform: "uppercase",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
});
