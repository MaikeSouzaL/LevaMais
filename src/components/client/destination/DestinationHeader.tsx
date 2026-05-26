import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { ArrowLeft } from "lucide-react-native";

interface DestinationHeaderProps {
  title?: string;
  onBack: () => void;
}

export const DestinationHeader = ({ title = "Para onde vamos?", onBack }: DestinationHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400 }}
      className="flex-row items-center px-6 pb-5 z-[100] bg-[#091A2F] border-b border-white/10 shadow-xl"
      style={{ paddingTop: insets.top + 12 }}
    >
      <TouchableOpacity
        onPress={onBack}
        className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 items-center justify-center mr-4"
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color="#fff" />
      </TouchableOpacity>
      
      <Text className="text-white text-xl font-bold tracking-wide">{title}</Text>
    </MotiView>
  );
};
