import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { CheckCircle2, LucideIcon } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  // Determine gradient based on selection and profile type
  const isDriver = accentColor === "#00F3FF" || accentColor === "#FFF";
  
  const gradientColors = isSelected
    ? isDriver
      ? ["rgba(0, 243, 255, 0.08)", "rgba(0, 243, 255, 0.01)"]
      : ["rgba(2, 222, 149, 0.08)", "rgba(2, 222, 149, 0.01)"]
    : ["rgba(255, 255, 255, 0.02)", "rgba(255, 255, 255, 0.005)"];

  const activeBorderColor = isDriver ? "#00F3FF" : colors.primary[500];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onSelect}
      style={styles.touchable}
    >
      <MotiView
        animate={{
          borderColor: isSelected ? activeBorderColor : "rgba(255, 255, 255, 0.06)",
          shadowColor: isSelected ? activeBorderColor : "#000",
          shadowOpacity: isSelected ? 0.25 : 0.1,
          shadowRadius: isSelected ? 12 : 6,
          backgroundColor: isSelected 
            ? "rgba(17, 37, 62, 0.75)" 
            : "rgba(11, 23, 38, 0.45)",
        }}
        transition={{ type: "timing", duration: 150 }}
        style={styles.cardContainer}
      >
        <LinearGradient
          colors={gradientColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 22 }]}
        />

        {/* 💎 Active Indicator Badge */}
        <AnimatePresence>
          {isSelected && (
            <MotiView
              from={{ opacity: 0, scale: 0.5, translateY: -5 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 0.5, translateY: -5 }}
              transition={{ type: "timing", duration: 120 }}
              style={styles.activeCheck}
            >
              <CheckCircle2 size={20} color={activeBorderColor} />
            </MotiView>
          )}
        </AnimatePresence>

        {/* Icon Container */}
        <View style={styles.iconOuterContainer}>
          <View
            style={[
              styles.iconCircle,
              { 
                backgroundColor: iconBgColor,
                borderColor: isSelected ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.05)"
              }
            ]}
          >
            <Icon color={accentColor} size={28} strokeWidth={1.5} />
          </View>
        </View>

        <View style={styles.textContent}>
          <Text style={[
            styles.titleText,
            isSelected && { color: "#FFF" }
          ]}>
            {title}
          </Text>
          <Text style={[
            styles.descText,
            isSelected && { color: "rgba(255, 255, 255, 0.8)" }
          ]}>
            {description}
          </Text>
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
    height: 140,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    backgroundColor: "rgba(11, 23, 38, 0.45)",

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
  },
  textContent: {
    flex: 1,
    justifyContent: "center",
    zIndex: 2,
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
