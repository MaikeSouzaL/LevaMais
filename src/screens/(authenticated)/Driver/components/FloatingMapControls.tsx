import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Navigation, Layers } from "lucide-react-native";

type FloatingMapControlsProps = {
  duration?: string;
  onCenterLocation?: () => void;
  onToggleStyle?: () => void;
  isCentering?: boolean;
  isSwitchingStyle?: boolean;
};

export function FloatingMapControls({
  duration,
  onCenterLocation,
  onToggleStyle,
  isCentering,
  isSwitchingStyle,
}: FloatingMapControlsProps) {
  return (
    <View className="absolute right-4 top-24 gap-3 items-center">
      {/* ETA Bubble */}
      {duration && (
        <View className="w-14 h-14 rounded-full bg-[#091A2F]/90 border border-[#02de95]/35 items-center justify-center shadow-lg">
          <Text className="text-white/60 text-[8px] font-black uppercase tracking-wider">ETA</Text>
          <Text className="text-[#02de95] text-xs font-black -mt-0.5">
            {duration.replace("mins", "min").replace("minutos", "min")}
          </Text>
        </View>
      )}

      {/* Center Location Button */}
      {onCenterLocation && (
        <TouchableOpacity
          onPress={onCenterLocation}
          disabled={isCentering}
          activeOpacity={0.8}
          className="w-12 h-12 rounded-full bg-[#091A2F]/90 border border-white/10 items-center justify-center shadow-lg"
        >
          <Navigation size={18} color="#02de95" fill="rgba(2, 222, 149, 0.15)" />
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
