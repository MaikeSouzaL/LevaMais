import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { CheckCircle2, LucideIcon } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";
import { CategoryBadge } from "./CategoryBadge";

interface CategoryCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  isSelected: boolean;
  onSelect: () => void;
  delay?: number;
}

export const CategoryCard = ({
  title,
  description,
  icon: Icon,
  badge,
  isSelected,
  onSelect,
  delay = 0,
}: CategoryCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 400, delay }}
      style={styles.outer}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onSelect}>
        <MotiView
          animate={{
            borderColor: isSelected ? colors.primary[500] : "rgba(255, 255, 255, 0.06)",
            backgroundColor: isSelected ? "rgba(17, 37, 62, 0.9)" : "rgba(17, 37, 62, 0.45)",
            scale: isSelected ? 1.02 : 1,
          }}
          transition={{ type: "timing", duration: 250 }}
          style={styles.container}
        >
          {/* Selection indicator */}
          <AnimatePresence>
            {isSelected && (
              <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={styles.checkMark}
              >
                <CheckCircle2 size={20} color={colors.primary[500]} />
              </MotiView>
            )}
          </AnimatePresence>

          <View style={styles.leftPane}>
            <View style={[
              styles.iconHost, 
              { backgroundColor: isSelected ? "rgba(2, 222, 149, 0.1)" : "rgba(255,255,255,0.04)" }
            ]}>
              <Icon size={28} color={isSelected ? colors.primary[500] : "#FFF"} strokeWidth={1.5} />
            </View>
          </View>

          <View style={styles.bodyPane}>
            <View style={styles.topRow}>
              <Text style={styles.cardTitle}>{title}</Text>
              {badge && <CategoryBadge label={badge} />}
            </View>
            <Text style={styles.cardDesc}>{description}</Text>
          </View>
        </MotiView>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  outer: {
    width: "100%",
    marginBottom: spacing.md,
  },
  container: {
    borderRadius: borderRadius["2xl"],
    borderWidth: 1.5,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  checkMark: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  leftPane: {
    marginRight: spacing.lg,
  },
  iconHost: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  bodyPane: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    fontWeight: "800",
    color: colors.text.primary,
  },
  cardDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs + 1,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
