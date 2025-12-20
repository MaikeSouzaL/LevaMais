import React, { fo](({ onClose }, ref) => {
  const snapPoints = useMemo(() => ["85%"], []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleCallEmergency = async () => {dRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import GorhomBottomSheet, { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";

interface SafetyHelpSheetProps {
  onClose?: () => void;
}

export const SafetyHelpSheet = forwardRef<
  GorhomBottomSheet,
  SafetyHelpSheetProps
>(({ onClose }, ref) => {
  const snapPoints = useMemo(() => ["85%"], []);

  const handleCallEmergency = async () => {
    try {
      const phoneNumber = "tel:190";
      const canOpen = await Linking.canOpenURL(phoneNumber);
      if (canOpen) {
        await Linking.openURL(phoneNumber);
      }
    } catch (error) {
      console.error("Erro ao tentar ligar para emergência:", error);
    }
  };

  const handleHelpCenter = () => {
    console.log("Abrir Central de Ajuda");
    // TODO: Navegar para tela de FAQ/Central de Ajuda
  };

  const handleSupport = () => {
    console.log("Abrir Chat de Suporte");
    // TODO: Abrir chat ou WhatsApp de suporte
  };

  const handleShareLocation = () => {
    console.log("Compartilhar Localização");
    // TODO: Implementar compartilhamento de localização
  };

  return (
    <GorhomBottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onClose={onClose}
      backgroundStyle={{
        backgroundColor: "rgba(11, 26, 21, 0.85)",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
      }}
      handleIndicatorStyle={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        width: 64,
        height: 4,
        opacity: 0,
      }}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.37,
        shadowRadius: 32,
        elevation: 20,
        zIndex: 9999,
      }}
    >
      <View className="flex-1 relative overflow-hidden">
        {/* Glow Effect - canto superior direito */}
        <View
          className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          style={{
            backgroundColor: "rgba(2, 222, 149, 0.1)",
            borderRadius: 9999,
            transform: [{ translateX: 64 }, { translateY: -64 }],
            opacity: 0.5,
          }}
        />

        {/* Header */}
        <View className="px-6 pt-6 pb-4 flex-row items-center justify-between relative z-10">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold tracking-tight">
              Ajuda Rápida
            </Text>
            <Text className="text-gray-400 text-xs mt-1 font-medium">
              Segurança em primeiro lugar
            </Text>
          </View>
          <View className="h-10 w-10 rounded-full bg-white/5 items-center justify-center border border-white/10">
            <MaterialIcons name="shield" size={20} color="#02de95" />
          </View>
        </View>

        {/* Divider */}
        <View className="h-px w-full mb-2 bg-white/10" />

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="flex flex-col gap-3">
            {/* Central de Ajuda */}
            <TouchableOpacity
              onPress={handleHelpCenter}
              className="flex-row items-center gap-4 bg-surface-dark/60 border border-white/5 p-4 rounded-2xl active:opacity-70"
              activeOpacity={0.98}
            >
              <View className="items-center justify-center rounded-xl bg-white/5 w-12 h-12">
                <MaterialIcons name="help-center" size={24} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold leading-tight">
                  Central de Ajuda
                </Text>
                <Text className="text-gray-500 text-[11px] mt-0.5">
                  Dúvidas frequentes
                </Text>
              </View>
              <MaterialIcons
                name="arrow-forward-ios"
                size={14}
                color="#4B5563"
              />
            </TouchableOpacity>

            {/* Falar com suporte */}
            <TouchableOpacity
              onPress={handleSupport}
              className="flex-row items-center gap-4 bg-surface-dark/60 border border-white/5 p-4 rounded-2xl active:opacity-70"
              activeOpacity={0.98}
            >
              <View className="items-center justify-center rounded-xl bg-white/5 w-12 h-12">
                <MaterialIcons name="support-agent" size={24} color="#9CA3AF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold leading-tight">
                  Falar com suporte
                </Text>
                <Text className="text-gray-500 text-[11px] mt-0.5">
                  Atendimento 24h
                </Text>
              </View>
              <MaterialIcons
                name="arrow-forward-ios"
                size={14}
                color="#4B5563"
              />
            </TouchableOpacity>

            {/* Compartilhar localização */}
            <TouchableOpacity
              onPress={handleShareLocation}
              className="flex-row items-center gap-4 bg-surface-dark/60 border border-white/5 p-4 rounded-2xl active:opacity-70"
              activeOpacity={0.98}
            >
              <View className="items-center justify-center rounded-xl bg-white/5 w-12 h-12">
                <MaterialIcons
                  name="share-location"
                  size={24}
                  color="#9CA3AF"
                />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-semibold leading-tight">
                  Compartilhar localização
                </Text>
                <Text className="text-gray-500 text-[11px] mt-0.5">
                  Enviar para amigos
                </Text>
              </View>
              <MaterialIcons
                name="arrow-forward-ios"
                size={14}
                color="#4B5563"
              />
            </TouchableOpacity>

            {/* Emergência - Destaque */}
            <TouchableOpacity
              onPress={handleCallEmergency}
              className="flex-row items-center gap-4 p-4 rounded-2xl mt-2 active:opacity-70"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.3)",
              }}
              activeOpacity={0.98}
            >
              <View
                className="items-center justify-center rounded-xl w-12 h-12"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  shadowColor: "rgba(239, 68, 68, 0.2)",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: 15,
                  elevation: 5,
                }}
              >
                <MaterialIcons name="warning" size={24} color="#EF4444" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-bold leading-tight">
                  Emergência
                </Text>
                <Text
                  className="text-[11px] mt-0.5 font-medium tracking-wide"
                  style={{ color: "rgba(252, 165, 165, 0.7)" }}
                >
                  LIGAR 190
                </Text>
              </View>
              <View
                className="h-8 w-8 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                }}
              >
                <MaterialIcons name="call" size={18} color="#EF4444" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </GorhomBottomSheet>
  );
});

SafetyHelpSheet.displayName = "SafetyHelpSheet";
