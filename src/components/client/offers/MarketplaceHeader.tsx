import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { ChevronLeft, ShoppingBag, Clock } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";

interface MarketplaceHeaderProps {
  onBack: () => void;
  offerCount: number;
  useDarkMap?: boolean;
}

export function MarketplaceHeader({ onBack, offerCount, useDarkMap = true }: MarketplaceHeaderProps) {
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

        {/* Center Title Capsule - Augmented Live State Radar 📡 */}
        <View className="flex-1 items-center justify-center h-[52px] px-2">
          <View className="bg-white/[0.03] border border-white/10 rounded-[20px] px-3 py-2 flex-row items-center shadow-2xl">
            <View className="mr-2 relative items-center justify-center">
              <MotiView
                from={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ loop: true, duration: 2000, type: "timing" }}
                className="absolute w-2.5 h-2.5 rounded-full bg-[#02de95]"
              />
              <View className="w-2 h-2 rounded-full bg-[#02de95] shadow-sm shadow-[#02de95] z-10" />
            </View>
            <View className="items-start">
              <Text className="text-white font-black text-[10.5px] tracking-[1.5px] uppercase leading-none mb-0.5">
                Propostas Ativas
              </Text>
              <Text className="text-[#02de95] font-black text-[8px] tracking-wider uppercase leading-none">
                {offerCount} {offerCount === 1 ? 'parceiro em negociação' : 'parceiros em negociação'}
              </Text>
            </View>
          </View>
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
