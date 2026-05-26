import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { ChevronRight, Clock, Route as RouteIcon } from "lucide-react-native";

interface RouteBottomCardProps {
  visible: boolean;
  distance?: string;
  duration?: string;
  isLoading?: boolean;
  onConfirm: () => void;
}

export const RouteBottomCard = ({
  visible,
  distance,
  duration,
  isLoading = false,
  onConfirm,
}: RouteBottomCardProps) => {
  const insets = useSafeAreaInsets();

  return (
    <AnimatePresence>
      {visible && (
        <MotiView
          from={{ opacity: 0, translateY: 80 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 80 }}
          transition={{ type: "spring", damping: 16, stiffness: 100 }}
          className="absolute bottom-0 left-0 right-0 px-6 z-[120]"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="rounded-3xl bg-[#091A2F] border border-white/10 p-6 shadow-2xl shadow-black overflow-hidden elevation-15">
            <View className="flex-row justify-around items-center mb-6">
              <View className="flex-row items-center gap-2">
                <Clock size={18} color="#02de95" />
                <View>
                  <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Tempo</Text>
                  <Text className="text-white text-lg font-bold">{duration || "..."}</Text>
                </View>
              </View>

              <View className="w-[1px] h-8 bg-white/10" />

              <View className="flex-row items-center gap-2">
                <RouteIcon size={18} color="#02de95" />
                <View>
                  <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Distância</Text>
                  <Text className="text-white text-lg font-bold">{distance || "..."}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              className="h-14 rounded-xl overflow-hidden relative bg-primary"
              onPress={onConfirm}
              disabled={isLoading}
            >
              <MotiView
                from={{ opacity: 0.5, scale: 0.96 }}
                animate={{ opacity: 0.8, scale: 1.04 }}
                transition={{ type: "timing", duration: 1200, loop: true }}
                className="absolute inset-0 bg-primary rounded-xl"
              />
              <View className="absolute inset-0 flex-row items-center justify-center gap-1">
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text className="text-black text-base font-bold tracking-wider">Confirmar Corrida</Text>
                    <ChevronRight size={18} color="#000" strokeWidth={3} />
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
};
