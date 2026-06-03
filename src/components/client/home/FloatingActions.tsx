import React from "react";
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert, Layers } from "lucide-react-native";
import { Icon } from "@/components/ui/Icon";
import { spacing } from "@/theme";

interface FloatingActionsProps {
  onLocationPress: () => void;
  onSosPress: () => void;
  onMapStylePress?: () => void;
  useDarkMap?: boolean;
  isCentering?: boolean;
  isSwitchingStyle?: boolean;
  topOffset?: number;
}

export const FloatingActions = ({
  onLocationPress,
  onSosPress,
  onMapStylePress,
  useDarkMap = true,
  isCentering = false,
  isSwitchingStyle = false,
  topOffset,
}: FloatingActionsProps) => {
  const insets = useSafeAreaInsets();
  
  // Positioning math carefully tuned to float in absolute layer right below header/inputs
  const topPosition = topOffset !== undefined ? topOffset : (insets.top + 110);

  return (
    <View
      style={[styles.container, { top: topPosition }]}
      pointerEvents="box-none"
    >
      {/* SOS Panic - EXACT MATCH DRIVER RED 🚨 */}
      <TouchableOpacity 
        style={styles.sosFab} 
        onPress={onSosPress} 
        activeOpacity={0.8}
      >
        <ShieldAlert size={22} color="#EF4444" />
      </TouchableOpacity>

      {/* Center Map - EXACT MATCH DRIVER TARGET 🎯 */}
      <TouchableOpacity 
        style={styles.locationFab} 
        onPress={onLocationPress} 
        disabled={isCentering}
        activeOpacity={0.8}
      >
        {isCentering ? (
          <ActivityIndicator size="small" color="#02de95" />
        ) : (
          <Icon name="my-location" size={24} color="#02de95" />
        )}
      </TouchableOpacity>

      {/* Map Style Layers - EXACT MATCH DRIVER LAYERS 🥞 */}
      {onMapStylePress && (
        <TouchableOpacity 
          style={[
            styles.layerFab,
            !useDarkMap && styles.layerFabActive
          ]} 
          onPress={onMapStylePress} 
          disabled={isSwitchingStyle}
          activeOpacity={0.8}
        >
          {isSwitchingStyle ? (
            <ActivityIndicator size="small" color={useDarkMap ? "#FFF" : "#091A2F"} />
          ) : (
            <Layers 
              size={22} 
              color={!useDarkMap ? "#091A2F" : "#FFF"} 
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: spacing.lg,
    alignItems: "center",
    gap: 12,
  },
  sosFab: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#091A2F", // 🔥 100% Opaque Base to prevent any Map POIs/Icons bleeding through
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.5)", // Clear high-contrast red border
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#ef4444", // Glowing panic shadow effect
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  locationFab: {
    width: 48,
    height: 48,
    borderRadius: 12, // rounded-xl
    backgroundColor: "#091A2F", // 🔥 Solid Base to block map elements
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // border-white/10
  },
  layerFab: {
    width: 48,
    height: 48,
    borderRadius: 12, // rounded-xl
    backgroundColor: "#091A2F", // 🔥 Solid Base to block map elements
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // border-white/10
  },
  layerFabActive: {
    backgroundColor: "#02de95",
    borderColor: "#02de95",
  },
});
