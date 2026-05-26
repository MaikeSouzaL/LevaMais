import React from "react";
import { StyleSheet, View, TouchableOpacity, ActivityIndicator, ViewStyle } from "react-native";
import { ShieldAlert, Layers, LocateFixed } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MapActionButtonsProps {
  onSosPress?: () => void;
  onLocationPress?: () => void;
  onMapStylePress?: () => void;
  useDarkMap?: boolean;
  mapStyleMode?: "light" | "dark" | "satellite";
  isCentering?: boolean;
  isSwitchingStyle?: boolean;
  containerStyle?: ViewStyle;
  topOffset?: number;
  bottomOffset?: number;
}

export function MapActionButtons({
  onSosPress,
  onLocationPress,
  onMapStylePress,
  useDarkMap = true,
  mapStyleMode,
  isCentering = false,
  isSwitchingStyle = false,
  containerStyle,
  topOffset,
  bottomOffset,
}: MapActionButtonsProps) {
  const insets = useSafeAreaInsets();
  
  // Construct dynamic layout constraints based on safe areas and explicitly provided offsets
  const layoutStyle: ViewStyle = {};
  
  if (topOffset !== undefined) {
    layoutStyle.top = topOffset;
  } else if (bottomOffset !== undefined) {
    layoutStyle.bottom = bottomOffset;
  } else if (!containerStyle?.top && !containerStyle?.bottom && !containerStyle?.position) {
    // Fallback default: float nicely right below the top status bar + padding
    layoutStyle.top = insets.top + 110;
  }

  return (
    <View 
      style={[
        styles.container, 
        layoutStyle,
        containerStyle
      ]} 
      pointerEvents="box-none"
    >
      
      {/* 1. SOS Panic Button 🚨 */}
      {onSosPress && (
        <TouchableOpacity 
          onPress={onSosPress}
          activeOpacity={0.8}
          style={styles.sosFab}
        >
          <ShieldAlert size={22} color="#EF4444" />
        </TouchableOpacity>
      )}

      {/* 2. Center Map Button 🎯 */}
      {onLocationPress && (
        <TouchableOpacity 
          onPress={onLocationPress}
          disabled={isCentering}
          activeOpacity={0.8}
          style={styles.locationFab}
        >
          {isCentering ? (
            <ActivityIndicator size="small" color="#02de95" />
          ) : (
            <LocateFixed size={22} color="#02de95" />
          )}
        </TouchableOpacity>
      )}

      {/* 3. Map Style Layers Button 🥞 */}
      {onMapStylePress && (
        <TouchableOpacity 
          onPress={onMapStylePress}
          disabled={isSwitchingStyle}
          activeOpacity={0.8}
          style={styles.layerFab}
        >
          {isSwitchingStyle ? (
            <ActivityIndicator size="small" color="#02de95" />
          ) : (
            <Layers size={22} color="#02de95" />
          )}
        </TouchableOpacity>
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 40,
    flexDirection: "column",
    gap: 12,
  },
  sosFab: {
    width: 48,
    height: 48,
    borderRadius: 12, // rounded-xl
    backgroundColor: "rgba(9, 26, 47, 0.95)", // Extra Opaque Base
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)", // Glow outline
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  locationFab: {
    width: 48,
    height: 48,
    borderRadius: 12, // rounded-xl
    backgroundColor: "rgba(9, 26, 47, 0.85)", 
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  layerFab: {
    width: 48,
    height: 48,
    borderRadius: 12, // rounded-xl
    backgroundColor: "rgba(9, 26, 47, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  layerFabActive: {
    backgroundColor: "#02de95",
    borderColor: "#02de95",
  },
});
