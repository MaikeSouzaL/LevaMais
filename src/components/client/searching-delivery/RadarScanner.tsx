import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";

interface RadarScannerProps {
  size?: number;
}

export function RadarScanner({ size = 300 }: RadarScannerProps) {
  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      {[...Array(5).keys()].map((index) => (
        <MotiView
          key={index}
          from={{ opacity: 0.5, scale: 0.05 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{
            type: "timing",
            duration: 4000,
            easing: Easing.out(Easing.ease),
            delay: index * 800,
            loop: true,
            repeatReverse: false,
          }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1.5,
            borderColor: "#02de95",
            backgroundColor: "rgba(2, 222, 149, 0.03)",
            position: "absolute",
          }}
        />
      ))}
      {/* Absolute Center Point Indicator */}
      <View 
        className="w-6 h-6 bg-[#02de95] rounded-full items-center justify-center border-4 border-[#091A2F]"
        style={{
          shadowColor: "#02de95",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View className="w-2 h-2 bg-white rounded-full" />
      </View>
    </View>
  );
}
