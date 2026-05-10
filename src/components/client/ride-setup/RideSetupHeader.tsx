import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { BlurView } from "expo-blur";

export const RideSetupHeader = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View 
      className="absolute top-0 left-0 right-0 z-[100] overflow-hidden" 
      style={{ paddingTop: insets.top }}
    >
      <BlurView intensity={15} tint="dark" className="px-6 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-xl bg-slate-800/70 border border-white/10 items-center justify-center mr-4"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        
        <Text className="text-white text-xl font-bold tracking-wide">Definir corrida</Text>
      </BlurView>
    </View>
  );
};
