import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ArrowLeft, Timer } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";

interface DeliveryOfferHeaderProps {
  expiresInSeconds: number | null;
}

export function DeliveryOfferHeader({ expiresInSeconds }: DeliveryOfferHeaderProps) {
  const navigation = useNavigation();

  return (
    <View className="absolute top-12 left-4 right-4 z-50 flex-row items-center justify-between">
      {/* Back Button 🔙 */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="h-[54px] w-[54px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
      >
        <BlurView intensity={40} tint="dark" className="w-full h-full items-center justify-center bg-[#091A2F]/60">
           <ArrowLeft size={22} color="#FFF" />
        </BlurView>
      </TouchableOpacity>

      {/* Live Countdown ⏱️ */}
      {expiresInSeconds !== null && (
        <MotiView
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-[54px] rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10"
        >
          <BlurView intensity={40} tint="dark" className="h-full flex-row items-center px-4 bg-amber-500/10">
             <Timer size={18} color="#FBBF24" className="mr-2" />
             <View>
                <Text className="text-white/50 text-[10px] font-bold tracking-widest uppercase">Expira em</Text>
                <Text className="text-[#FBBF24] font-black text-lg leading-none">{expiresInSeconds}s</Text>
             </View>
          </BlurView>
        </MotiView>
      )}
    </View>
  );
}
