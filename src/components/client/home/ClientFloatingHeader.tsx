import React from "react";
import { StyleSheet, View, TouchableOpacity, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Menu, Search, Wallet } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize } from "@/theme";

interface ClientFloatingHeaderProps {
  onMenuPress: () => void;
  onSearchPress: () => void;
  onWalletPress: () => void;
  currentAddress?: string;
}

export const ClientFloatingHeader = ({
  onMenuPress,
  onSearchPress,
  onWalletPress,
  currentAddress,
}: ClientFloatingHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500 }}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <BlurView intensity={Platform.OS === "ios" ? 45 : 100} tint="dark" style={styles.glassContainer}>
        {/* Menu Button */}
        <TouchableOpacity style={styles.iconButton} onPress={onMenuPress} activeOpacity={0.7}>
          <Menu size={22} color={colors.text.primary} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Search Input Overlay */}
        <TouchableOpacity style={styles.searchInput} onPress={onSearchPress} activeOpacity={0.85}>
          <View style={styles.searchDot} />
          <Text style={styles.searchText} numberOfLines={1}>
            {currentAddress || "Para onde vamos?"}
          </Text>
          <Search size={16} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Wallet / Quick Profile */}
        <TouchableOpacity style={[styles.iconButton, styles.walletButton]} onPress={onWalletPress} activeOpacity={0.7}>
          <Wallet size={20} color={colors.primary[500]} strokeWidth={2.5} />
        </TouchableOpacity>
      </BlurView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: spacing.lg,
  },
  glassContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 41, 59, 0.65)", // Transparent Navy
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  walletButton: {
    borderColor: "rgba(2, 222, 149, 0.2)",
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  searchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginRight: spacing.sm,
  },
  searchText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: "600",
  }
});
