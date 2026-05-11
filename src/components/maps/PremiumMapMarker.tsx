import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { MapPin, Flag } from "lucide-react-native";

interface PremiumMapMarkerProps {
  type: "origin" | "destination";
}

export const PremiumMapMarker = ({ type }: PremiumMapMarkerProps) => {
  const isOrigin = type === "origin";

  return (
    <View className="w-10 h-10 items-center justify-center relative">
      {/* Breath wave animation using nativewind base styling wrapped in Moti */}
      <MotiView
        from={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 2200,
        }}
        className={`absolute w-6 h-6 rounded-full ${isOrigin ? 'bg-primary' : 'bg-red-500'}`}
      />

      {/* Core Hub - Solid visual center */}
      <View className={`w-7 h-7 rounded-full items-center justify-center z-10 border-2 bg-[#11253E] elevation-5 shadow-xl 
        ${isOrigin ? 'border-primary' : 'border-red-500'}`}
      >
        {isOrigin ? (
          <Flag size={13} color="#fff" className="fill-white" />
        ) : (
          <MapPin size={14} color="#fff" className="fill-red-500" />
        )}
      </View>

      {/* Base drop perspective shadow anchor */}
      <View className="absolute bottom-1 w-2 h-1 bg-black/50 rounded-full" />
    </View>
  );
};
