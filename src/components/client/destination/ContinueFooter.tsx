import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { Clock, Map as MapIcon, ChevronRight } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "@/theme";

interface ContinueFooterProps {
  visible: boolean;
  distance?: string;
  duration?: string;
  onPressContinue: () => void;
  isLoading?: boolean;
}

export const ContinueFooter = ({
  visible,
  distance,
  duration,
  onPressContinue,
  isLoading = false,
}: ContinueFooterProps) => {
  const insets = useSafeAreaInsets();

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: 100 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 100 }}
          transition={{ type: "timing", duration: 400 }}
          style={[styles.container, { paddingBottom: insets.bottom + spacing.lg }]}
        >
          <BlurView intensity={60} tint="dark" style={styles.glass}>
            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <View style={styles.statItem}>
                <Clock size={16} color={colors.primary[400]} />
                <Text style={styles.statText}>{duration || "-- min"}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <MapIcon size={16} color={colors.primary[400]} />
                <Text style={styles.statText}>{distance || "-- km"}</Text>
              </View>
            </View>

            {/* Button */}
            <TouchableOpacity
              onPress={onPressContinue}
              disabled={isLoading}
              style={styles.button}
              activeOpacity={0.8}
            >
              <View style={styles.buttonBg} />
              {isLoading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continuar</Text>
                  <ChevronRight size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </MotiView>
      )}
    </AnimatePresence>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 110,
    paddingHorizontal: spacing.lg,
  },
  glass: {
    borderRadius: borderRadius["2xl"],
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  button: {
    height: 56,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary[500],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    // Glower effect
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
  },
  buttonText: {
    color: "#000",
    fontSize: fontSize.sm,
    fontWeight: "bold",
    letterSpacing: 0.5,
    position: "relative",
  }
});
