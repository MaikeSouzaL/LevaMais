import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { LoadingButton } from "../../../Shared/components";
import Toast from "react-native-toast-message";

interface PromoCodeSheetProps {
  visible?: boolean;
  onApply: (code: string, discount: number) => void;
  onClose: () => void;
  currentTotal?: number;
}

export default function PromoCodeSheet({ onApply, onClose, currentTotal }: PromoCodeSheetProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!code.trim()) {
      setError("Digite um codigo promocional");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: integrar com endpoint de validacao de cupom (GET /promotions/:code)
      await new Promise((r) => setTimeout(r, 800));

      const mockDiscount = 5;
      onApply(code.trim().toUpperCase(), mockDiscount);

      Toast.show({
        type: "success",
        text1: "Cupom aplicado!",
        text2: `Desconto de R$ ${mockDiscount.toFixed(2)}`,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Codigo invalido ou expirado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.headerRow}>
        <Text style={styles.title}>Cupom de desconto</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#8ea6a3" />
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Insira um codigo promocional para obter desconto na sua corrida
        {currentTotal ? ` de ${currentTotal.toFixed(2)}` : ""}
      </Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ex: LEVA10"
          placeholderTextColor="#555"
          value={code}
          onChangeText={(t) => {
            setCode(t.toUpperCase());
            setError(null);
          }}
          autoCapitalize="characters"
          maxLength={20}
        />
      </View>

      {error && (
        <View style={styles.errorRow}>
          <MaterialIcons name="error-outline" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <LoadingButton
        title="Aplicar cupom"
        onPress={handleApply}
        variant="primary"
        loading={loading}
      />

      <Text style={styles.hint}>
        Cupons validos sao aplicados automaticamente ao valor final
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.light,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  closeButton: { padding: spacing.xs },
  subtitle: { color: colors.text.tertiary, fontSize: fontSize.sm, marginBottom: spacing.lg },
  inputRow: { marginBottom: spacing.md },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    color: "#fff",
    fontSize: fontSize.xl,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 3,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  errorText: { color: "#ef4444", fontSize: fontSize.sm },
  hint: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
