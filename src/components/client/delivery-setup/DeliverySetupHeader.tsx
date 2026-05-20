import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { BlurView } from "expo-blur";

interface DeliverySetupHeaderProps {
  title?: string;
  subtitle?: string;
  onBack: () => void;
}

export const DeliverySetupHeader = ({ onBack, title = 'Definir entrega', subtitle }: DeliverySetupHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute top-0 left-0 right-0 z-[100] overflow-hidden bg-[#091A2F]" 
      style={{ paddingTop: insets.top }}
    >
      <View className="px-6 py-4 flex-row items-center bg-[#091A2F] border-b border-white/[0.03]">
        <TouchableOpacity
          onPress={onBack}
          className="w-10 h-10 rounded-xl bg-slate-800/70 border border-white/10 items-center justify-center mr-4"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        
        <View className="flex-1">
          <Text className="text-white text-xl font-bold tracking-wide">{title}</Text>
          <Text className="text-slate-400 text-[11px] font-medium mt-0.5" numberOfLines={1}>
            {subtitle || "Escolha o veículo ideal para sua entrega."}
          </Text>
        </View>
      </View>
    </View>
  );
};

