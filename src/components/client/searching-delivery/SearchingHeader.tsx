import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ChevronLeft, ShieldAlert, Timer } from "lucide-react-native";
import { MotiView } from "moti";

interface SearchingHeaderProps {
  onBack: () => void;
  secondsLeft: number;
  networkUnstable?: boolean;
}

export function SearchingHeader({ onBack, secondsLeft, networkUnstable }: SearchingHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute top-0 left-0 right-0 z-50 px-4"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center justify-between">
        {/* Left Side Glass Button */}
        <TouchableOpacity 
          onPress={onBack}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#091A2F]/80 shadow-lg"
          activeOpacity={0.85}
        >
          <BlurView intensity={30} tint="dark" className="p-3.5">
            <ChevronLeft color="#FFF" size={22} strokeWidth={2.5} />
          </BlurView>
        </TouchableOpacity>

        {/* Center Dynamic Status Capsule */}
        <View className="flex-1 mx-4">
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="bg-[#091A2F]/85 border border-white/10 rounded-2xl px-4 py-3 shadow-xl overflow-hidden flex-row items-center justify-center space-x-3"
          >
            <BlurView intensity={25} tint="dark" className="absolute inset-0" />
            
            <Timer size={18} color="#02de95" className="mr-2" />
            
            <View>
              <Text className="text-white font-bold text-base tracking-tight">
                Buscando Entregadores
              </Text>
              <Text className="text-white/60 text-xs font-medium">
                Aproximadamente {Math.max(1, Math.ceil(secondsLeft / 60))} min restantes
              </Text>
            </View>
          </MotiView>
        </View>

        {/* Right Side Timer / Connection Status */}
        <View className="overflow-hidden rounded-2xl border border-white/10 bg-[#091A2F]/80 shadow-lg h-[52px] w-[52px] items-center justify-center">
          <BlurView intensity={30} tint="dark" className="flex-1 items-center justify-center w-full">
            {networkUnstable ? (
              <ShieldAlert size={20} color="#F59E0B" />
            ) : (
              <Text className="text-[#02de95] font-bold text-lg">
                {secondsLeft}s
              </Text>
            )}
          </BlurView>
        </View>
      </View>
    </View>
  );
}
