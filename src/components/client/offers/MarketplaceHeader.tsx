import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ChevronLeft, ShoppingBag, Clock } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";

interface MarketplaceHeaderProps {
  onBack: () => void;
  offerCount: number;
}

export function MarketplaceHeader({ onBack, offerCount }: MarketplaceHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute top-0 left-0 right-0 z-50 px-5"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center justify-between">
        {/* Back Circle Glass */}
        <TouchableOpacity 
          onPress={onBack}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#091A2F]/80 shadow-lg h-[52px] w-[52px] items-center justify-center"
          activeOpacity={0.85}
        >
          <BlurView intensity={30} tint="dark" className="w-full h-full items-center justify-center">
            <ChevronLeft color="#FFF" size={24} />
          </BlurView>
        </TouchableOpacity>

        {/* Center Title Capsule (Minimalist, clean, without background) */}
        <View className="flex-1 px-2 items-center justify-center h-[52px]">
          <MotiView
            from={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
              type: "timing",
              duration: 1000,
              loop: true,
              repeatReverse: true
            }}
            className="flex-row items-center justify-center"
          >
            {/* Premium Glowing Pulsing Dot */}
            <View className="w-1.5 h-1.5 rounded-full bg-[#02de95] mr-2 shadow-md shadow-[#02de95]" />
            
            <Text className="text-white font-black text-[10px] tracking-widest uppercase" numberOfLines={1}>
              Buscando Entregadores
            </Text>
          </MotiView>
        </View>

        {/* Right Live Counter Pill (Larger, Elevated design) 🛍️ */}
        <View className="overflow-hidden rounded-2xl border border-[#02de95]/40 bg-[#091A2F]/80 shadow-lg shadow-[#02de95]/5 h-[52px] min-w-[64px] items-center justify-center">
          <BlurView intensity={30} tint="dark" className="h-full flex-row items-center justify-center px-4">
            <ShoppingBag size={19} color="#02de95" fill="rgba(2, 222, 149, 0.15)" />
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={offerCount}
                from={{ opacity: 0, scale: 0.5, translateY: 4 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: "spring", damping: 12 }}
                className="ml-2"
              >
                <Text className="text-[#02de95] font-black text-xl leading-none">
                  {offerCount}
                </Text>
              </MotiView>
            </AnimatePresence>
          </BlurView>
        </View>
      </View>
    </View>
  );
}
