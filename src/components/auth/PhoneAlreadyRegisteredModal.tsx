import React from "react";
import {
  Modal as RNModal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { MotiView } from "moti";
import { PhoneOff, Lock, ArrowRight, Smartphone } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface PhoneAlreadyRegisteredModalProps {
  visible: boolean;
  phone: string;
  onClose: () => void;
  onLogin: () => void;
}

const { width } = Dimensions.get("window");

export function PhoneAlreadyRegisteredModal({
  visible,
  phone,
  onClose,
  onLogin,
}: PhoneAlreadyRegisteredModalProps) {
  // Normalize and format phone number for display: (XX) XXXXX-XXXX
  const formatPhoneForDisplay = (rawPhone: string) => {
    const cleaned = rawPhone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }
    return phone;
  };

  if (!visible) return null;

  const formatted = formatPhoneForDisplay(phone);

  return (
    <RNModal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop overlay blur effect */}
        <View style={styles.backdrop} />

        <MotiView
          from={{ opacity: 0, scale: 0.92, translateY: 15 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15, stiffness: 180 }}
          style={styles.cardContainer}
        >
          {/* Glowing Red Warning Header */}
          <View style={styles.glowOuterRing}>
            <View style={styles.glowInnerRing}>
              <PhoneOff size={28} color="#ef4444" />
            </View>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>Celular já Cadastrado</Text>
          <Text style={styles.subtitle}>
            O telefone <Text style={styles.phoneHighlight}>{formatted}</Text> já está associado a outra conta do Leva+.
          </Text>

          <Text style={styles.calloutText}>
            Como deseja prosseguir?
          </Text>

          {/* Interactive Option Cards */}
          <TouchableOpacity
            style={styles.loginCard}
            onPress={onLogin}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: "rgba(2, 222, 149, 0.15)" }]}>
              <Lock size={18} color="#02de95" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Entrar na Conta Existente</Text>
              <Text style={styles.cardSubtitle}>Fazer login com a conta associada a este número.</Text>
            </View>
            <ArrowRight size={16} color="#02de95" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelCard}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <View style={[styles.iconBox, { backgroundColor: "rgba(255, 255, 255, 0.05)" }]}>
              <Smartphone size={18} color="rgba(255, 255, 255, 0.6)" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Usar Outro Número</Text>
              <Text style={styles.cardSubtitle}>Digitar outro celular para esta nova conta.</Text>
            </View>
            <ArrowRight size={16} color="rgba(255, 255, 255, 0.4)" />
          </TouchableOpacity>

          {/* Bottom helper button to dismiss */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.dismissText}>Voltar e Alterar</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 8, 16, 0.85)",
  },
  cardContainer: {
    width: width * 0.88,
    backgroundColor: colors.background.secondary,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glowOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  glowInnerRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.text.primary,
    textAlign: "center",
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  phoneHighlight: {
    color: colors.primary[500],
    fontFamily: fonts.bold,
    fontWeight: "800",
  },
  calloutText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.text.disabled,
    alignSelf: "flex-start",
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "700",
  },
  loginCard: {
    width: "100%",
    backgroundColor: "rgba(2, 222, 149, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.25)",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cancelCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "800",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.text.tertiary,
    lineHeight: 14,
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  dismissText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text.tertiary,
    fontWeight: "700",
  },
});
