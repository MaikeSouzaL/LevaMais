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
      <View className="flex-row items-start justify-between">
        {/* Back Circle Glass */}
        <TouchableOpacity 
          onPress={onBack}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#091A2F]/80 shadow-lg h-[52px] w-[52px] items-center justify-center"
          activeOpacity={0.85}
        >
          <BlurView intensity={30} tint="dark" className="flex-1 w-full h-full items-center justify-center">
            <ChevronLeft color="#FFF" size={24} />
          </BlurView>
        </TouchableOpacity>

        {/* Center Title Capsule */}
        <View className="flex-1 px-4 items-center">
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="bg-[#091A2F]/85 border border-white/10 rounded-2xl px-5 py-3 shadow-xl overflow-hidden items-center w-full"
          >
            <BlurView intensity={25} tint="dark" className="absolute inset-0" />
            
            <Text className="text-white font-extrabold text-lg tracking-tight text-center">
              Mercado ao Vivo
            </Text>
            <Text className="text-white/60 text-xs font-medium text-center">
              Escolha o melhor negócio
            </Text>
          </MotiView>
        </View>

        {/* Right Live Counter Pill */}
        <View className="overflow-hidden rounded-2xl border border-[#02de95]/30 bg-[#091A2F]/80 shadow-lg h-[52px] px-3 items-center justify-center">
          <BlurView intensity={30} tint="dark" className="flex-1 flex-row items-center justify-center w-full space-x-2">
            <ShoppingBag size={16} color="#02de95" />
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={offerCount}
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
                className="ml-1.5"
              >
                <Text className="text-[#02de95] font-black text-lg">
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
