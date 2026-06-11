import React from "react";
import { View, TouchableOpacity } from "react-native";
import { LocateFixed, Layers } from "lucide-react-native";

type FloatingMapControlsProps = {
  duration?: string;
  onCenterLocation?: () => void;
  onToggleStyle?: () => void;
  isCentering?: boolean;
  isSwitchingStyle?: boolean;
};

export function FloatingMapControls({
  onCenterLocation,
  onToggleStyle,
  isCentering,
  isSwitchingStyle,
}: FloatingMapControlsProps) {
  return (
    <View className="absolute right-4 top-24 gap-3 items-center">
      {/* Center Location Button (GPS) */}
      {onCenterLocation && (
        <TouchableOpacity
          onPress={onCenterLocation}
          disabled={isCentering}
          activeOpacity={0.8}
          className="w-12 h-12 rounded-full bg-[#091A2F]/90 border border-white/10 items-center justify-center shadow-lg"
        >
          <LocateFixed size={20} color="#02de95" />
        </TouchableOpacity>
      )}

      {/* Map Layers Button */}
      {onToggleStyle && (
        <TouchableOpacity
          onPress={onToggleStyle}
          disabled={isSwitchingStyle}
          activeOpacity={0.8}
          className="w-12 h-12 rounded-full bg-[#091A2F]/90 border border-white/10 items-center justify-center shadow-lg"
        >
          <Layers size={18} color="#02de95" />
        </TouchableOpacity>
      )}
    </View>
  );
}
