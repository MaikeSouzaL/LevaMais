import React, { useRef, useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { CameraView } from "expo-camera";
import { MotiView } from "moti";
import { User } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { ScannerOverlay } from "./ScannerOverlay";

interface FaceScannerProps {
  isActive: boolean;
  cameraRef: React.RefObject<CameraView | null>;
  permissionGranted: boolean;
  onInit: () => void;
}

export const FaceScanner = ({ isActive, cameraRef, permissionGranted, onInit }: FaceScannerProps) => {

  useEffect(() => {
    if (!permissionGranted) {
      onInit();
    }
  }, []);

  return (
    <View className="items-center justify-center my-5">
      {/* 💿 Circular Visual Frame Wrapper (W: 260px) */}
      <MotiView
        animate={{
          borderColor: isActive ? colors.primary[500] : "rgba(255,255,255,0.1)",
          scale: isActive ? 1.02 : 1,
        }}
        transition={{ type: "timing", duration: 300 }}
        className="w-[260px] h-[260px] rounded-full border-2 items-center justify-center bg-transparent"
      >
        {/* 🎥 Camera Mask (W: 240px) */}
        <View className="w-[240px] h-[240px] rounded-full bg-[#050A0F] overflow-hidden relative items-center justify-center border border-white/5">
          {permissionGranted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mode="picture"
            />
          ) : (
            <View className="items-center justify-center">
              <User size={60} color="rgba(255,255,255,0.15)" strokeWidth={1.2} />
              <Text className="text-white/40 text-xs mt-2">Aguardando Permissão</Text>
            </View>
          )}

          {/* Absolute technical scanning lines layer */}
          <ScannerOverlay active={isActive} />
        </View>
      </MotiView>

      {/* 🚥 Status Indicator Row */}
      <View className="flex-row items-center mt-5 bg-white/5 px-4 py-2 rounded-full">
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ loop: true, type: "timing", duration: 1000, repeatReverse: true }}
          className="w-2 h-2 rounded-full mr-2 bg-primary"
        />
        <Text className="font-bold text-[13px] text-white tracking-wide">
          {isActive ? "Escaneando pontos da face..." : "Posicione seu rosto"}
        </Text>
      </View>
    </View>
  );
};
