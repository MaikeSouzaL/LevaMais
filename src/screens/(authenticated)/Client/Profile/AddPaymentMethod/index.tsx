import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../Shared/components";

export default function AddPaymentMethodScreen() {
  const navigation = useNavigation<any>();

  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  function formatCardNumber(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  }

  function formatExpiry(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  const brand = (() => {
    const first = cardNumber.replace(/\s/g, "");
    if (/^4/.test(first)) return "visa";
    if (/^5[1-5]/.test(first)) return "mastercard";
    if (/^3[47]/.test(first)) return "amex";
    return null;
  })();

  const brandLabel: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
  };

  async function handleSave() {
    if (cardNumber.replace(/\s/g, "").length < 13) {
      Toast.show({ type: "error", text1: "Numero do cartao invalido" });
      return;
    }
    if (!holderName.trim()) {
      Toast.show({ type: "error", text1: "Nome do titular obrigatorio" });
      return;
    }
    if (expiry.length < 5) {
      Toast.show({ type: "error", text1: "Validade invalida" });
      return;
    }
    if (cvv.length < 3) {
      Toast.show({ type: "error", text1: "CVV invalido" });
      return;
    }

    setSaving(true);
    try {
      // TODO: integrar com backend quando endpoint existir
      await new Promise((r) => setTimeout(r, 1000));
      Toast.show({ type: "success", text1: "Cartao salvo com sucesso!" });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Adicionar cartao" subtitle="Cartao de credito ou debito" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.cardPreview}>
            <View style={styles.cardPreviewHeader}>
              <Text style={styles.cardPreviewLabel}>Cartao</Text>
              {brand && <FontAwesome5 name={`cc-${brand}` as any} size={28} color="#fff" />}
            </View>
            <Text style={styles.cardPreviewNumber}>
              {cardNumber || "•••• •••• •••• ••••"}
            </Text>
            <View style={styles.cardPreviewFooter}>
              <View>
                <Text style={styles.cardPreviewHint}>Titular</Text>
                <Text style={styles.cardPreviewValue}>{holderName || "Seu nome"}</Text>
              </View>
              <View>
                <Text style={styles.cardPreviewHint}>Validade</Text>
                <Text style={styles.cardPreviewValue}>{expiry || "MM/AA"}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>DADOS DO CARTAO</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Numero do cartao</Text>
            <TextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={cardNumber}
              onChangeText={(t) => setCardNumber(formatCardNumber(t))}
              maxLength={19}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nome do titular</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome impresso no cartao"
              placeholderTextColor="#555"
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: spacing.md }]}>
              <Text style={styles.label}>Validade</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/AA"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                maxLength={5}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="123"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={cvv}
                onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 4))}
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.securityNote}>
            <MaterialIcons name="lock" size={16} color={colors.text.tertiary} />
            <Text style={styles.securityNoteText}>
              Seus dados sao criptografados e armazenados com seguranca.
            </Text>
          </View>

          <LoadingButton
            title="Salvar cartao"
            onPress={handleSave}
            variant="primary"
            loading={saving}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  cardPreview: {
    backgroundColor: "#1a2d47",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.15)",
    minHeight: 180,
    justifyContent: "space-between",
  },
  cardPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPreviewLabel: { color: "#8ea6a3", fontSize: fontSize.sm, fontWeight: fontWeight.bold, textTransform: "uppercase" },
  cardPreviewNumber: { color: "#fff", fontSize: 20, fontWeight: "800", letterSpacing: 3, marginVertical: spacing.lg },
  cardPreviewFooter: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewHint: { color: "#8ea6a3", fontSize: fontSize.xs, marginBottom: 2 },
  cardPreviewValue: { color: "#fff", fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  field: { marginBottom: spacing.lg },
  label: { color: colors.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: "#fff",
    fontSize: fontSize.base,
  },
  row: { flexDirection: "row" },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  securityNoteText: { color: colors.text.tertiary, fontSize: fontSize.xs, flex: 1 },
});
