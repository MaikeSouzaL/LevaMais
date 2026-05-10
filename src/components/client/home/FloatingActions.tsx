import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Crosshair, ShieldAlert } from "lucide-react-native";
import { colors, spacing } from "@/theme";

interface FloatingActionsProps {
  onLocationPress: () => void;
  onSosPress: () => void;
  bottomOffset?: number;
}

export const FloatingActions = ({
  onLocationPress,
  onSosPress,
}: FloatingActionsProps) => {
  const insets = useSafeAreaInsets();
  
  // Calculated to sit cleanly below the Floating Header
  const topPosition = insets.top + 90;

  return (
    <View
      style={[styles.container, { top: topPosition }]}
    >
      {/* SOS Button - High Contrast Red */}
      <TouchableOpacity style={styles.sosFab} onPress={onSosPress} activeOpacity={0.8}>
        <ShieldAlert size={24} color="#FFF" />
      </TouchableOpacity>

      {/* Location Center Button */}
      <TouchableOpacity style={styles.locationFab} onPress={onLocationPress} activeOpacity={0.8}>
        <Crosshair size={24} color={colors.text.primary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing.lg,
    alignItems: "center",
    gap: spacing.md,
    zIndex: 90,
  },
  sosFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ef4444", // Alert red
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  locationFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
