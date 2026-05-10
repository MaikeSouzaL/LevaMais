import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { CheckCircle2, LucideIcon } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts, fontSize } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/dimensions";

interface ModeSelectionCardProps {
  isSelected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
  Icon: LucideIcon;
  iconBgColor?: string;
  accentColor?: string;
}

export const ModeSelectionCard = ({
  isSelected,
  onSelect,
  title,
  description,
  Icon,
  iconBgColor = "rgba(255,255,255,0.05)",
  accentColor = "#FFF",
}: ModeSelectionCardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onSelect}
      style={styles.touchable}
    >
      <MotiView
        animate={{
          scale: isSelected ? 1.03 : 1,
          borderColor: isSelected ? colors.primary[500] : "rgba(255,255,255,0.06)",
          backgroundColor: isSelected ? "rgba(17, 37, 62, 0.9)" : "rgba(17, 37, 62, 0.45)",
        }}
        transition={{ type: "timing", duration: 250 }}
        style={styles.cardContainer}
      >
        {/* 💎 Active Indicator Badge */}
        <AnimatePresence>
          {isSelected && (
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={styles.activeCheck}
            >
              <CheckCircle2 size={22} color={colors.primary[500]} />
            </MotiView>
          )}
        </AnimatePresence>

        <View style={styles.iconOuterContainer}>
          <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
            <Icon color={accentColor} size={30} strokeWidth={1.5} />
          </View>
        </View>

        <View style={styles.textContent}>
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.descText}>{description}</Text>
        </View>
      </MotiView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: "100%",
    marginBottom: spacing.md,
  },
  cardContainer: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1.5,
    padding: spacing.xl,
    minHeight: 145,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  activeCheck: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 20,
  },
  iconOuterContainer: {
    marginRight: spacing.lg,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 4,
  },
  descText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 19,
    letterSpacing: 0.2,
  },
});
