import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

export const DestinationHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 400 }}
      className="flex-row items-center px-6 z-[100]"
      style={{ paddingTop: insets.top + 16 }}
    >
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="w-10 h-10 rounded-xl bg-slate-800/70 border border-white/10 items-center justify-center mr-4"
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color="#fff" />
      </TouchableOpacity>
      
      <Text className="text-white text-xl font-bold tracking-wide">Para onde vamos?</Text>
    </MotiView>
  );
};
