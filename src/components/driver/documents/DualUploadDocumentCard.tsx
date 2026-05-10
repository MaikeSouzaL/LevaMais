import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import { MotiView } from "moti";
import { Camera, Image as ImageIcon, CheckCircle2, X, LucideIcon, CreditCard } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

interface SlotProps {
  label: string;
  uri?: string | null;
  loading?: boolean;
  onPick: (source: "camera" | "gallery") => void;
  onClear: () => void;
}

const Slot = ({ label, uri, loading, onPick, onClear }: SlotProps) => {
  const showOptions = () => {
    Alert.alert(
      `Enviar ${label}`,
      "Escolha a fonte do documento",
      [
        { text: "Câmera", onPress: () => onPick("camera") },
        { text: "Galeria", onPress: () => onPick("gallery") },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  return (
    <View style={styles.slot}>
      <Text style={styles.slotLabel}>{label}</Text>
      
      <TouchableOpacity 
        style={[
          styles.slotContainer, 
          uri ? styles.slotHasFile : styles.slotEmpty
        ]}
        onPress={uri ? undefined : showOptions}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary[500]} />
        ) : uri ? (
          <View style={StyleSheet.absoluteFill}>
            <Image source={{ uri }} style={styles.slotImg} resizeMode="cover" />
            <TouchableOpacity style={styles.slotClose} onPress={onClear}>
              <X size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.slotPlaceholder}>
            <Camera size={24} color="rgba(255,255,255,0.35)" />
            <Text style={styles.slotActionTxt}>Tocar p/ Enviar</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

interface DualUploadDocumentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  front: { uri: string | null; loading: boolean };
  back: { uri: string | null; loading: boolean };
  onPickFront: (source: "camera" | "gallery") => void;
  onClearFront: () => void;
  onPickBack: (source: "camera" | "gallery") => void;
  onClearBack: () => void;
  delay?: number;
}

export const DualUploadDocumentCard = ({
  title,
  description,
  icon: Icon,
  front,
  back,
  onPickFront,
  onClearFront,
  onPickBack,
  onClearBack,
  delay = 0,
}: DualUploadDocumentCardProps) => {
  const bothDone = !!front.uri && !!back.uri;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay }}
      style={styles.outer}
    >
      <View style={[
        styles.container, 
        bothDone && { borderColor: colors.primary[500], backgroundColor: "rgba(17, 37, 62, 0.8)" }
      ]}>
        
        {/* Upper Identity Row */}
        <View style={styles.header}>
          <View style={[styles.iconBox, bothDone && { backgroundColor: "rgba(2, 222, 149, 0.1)" }]}>
            <Icon size={22} color={bothDone ? colors.primary[500] : "rgba(255,255,255,0.6)"} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.title}>{title}</Text>
              {bothDone && <CheckCircle2 size={16} color={colors.primary[500]} style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.desc}>{description}</Text>
          </View>
        </View>

        {/* Content Grid (Slots) */}
        <View style={styles.slotsGrid}>
          <Slot 
            label="Frente"
            uri={front.uri}
            loading={front.loading}
            onPick={onPickFront}
            onClear={onClearFront}
          />
          <View style={{ width: spacing.md }} />
          <Slot 
            label="Verso"
            uri={back.uri}
            loading={back.loading}
            onPick={onPickBack}
            onClear={onClearBack}
          />
        </View>

      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  container: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(17, 37, 62, 0.4)",
    overflow: "hidden",
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: "700",
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  slotsGrid: {
    flexDirection: "row",
    width: "100%",
  },
  slot: {
    flex: 1,
  },
  slotLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  slotContainer: {
    height: 100,
    borderRadius: borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  slotEmpty: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  slotHasFile: {
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  slotPlaceholder: {
    alignItems: "center",
  },
  slotActionTxt: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    marginTop: 6,
  },
  slotImg: {
    width: "100%",
    height: "100%",
  },
  slotClose: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(220,38,38,0.9)",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
