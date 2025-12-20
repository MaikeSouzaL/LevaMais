import React, { forwardRef, useImperativeHandle, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

interface SafetyHelpSheetProps {
  onClose?: () => void;
}

export interface SafetyHelpSheetRef {
  snapToIndex: (index: number) => void;
  close: () => void;
}

export const SafetyHelpSheet = forwardRef<
  SafetyHelpSheetRef,
  SafetyHelpSheetProps
>(({ onClose }, ref) => {
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    snapToIndex: (index: number) => {
      if (index === 0) {
        setVisible(true);
      }
    },
    close: () => {
      setVisible(false);
      onClose?.();
    },
  }));

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

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
  };

  const handleSupport = () => {
    console.log("Abrir Chat de Suporte");
  };

  const handleShareLocation = () => {
    console.log("Compartilhar Localização");
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/40 items-center justify-center"
        onPress={handleClose}
      >
        {/* Modal Content */}
        <Pressable
          className="w-11/12 max-w-md rounded-[2rem] overflow-hidden"
          style={{
            maxHeight: height * 0.85,
            backgroundColor: "rgba(11, 26, 21, 0.98)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.37,
            shadowRadius: 32,
            elevation: 20,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-1 relative">
            {/* Glow Effect - canto superior direito */}
            <View
              className="absolute top-0 right-0 w-32 h-32 pointer-events-none rounded-full"
              style={{
                backgroundColor: "rgba(2, 222, 149, 0.15)",
                transform: [{ translateX: 64 }, { translateY: -64 }],
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
                  className="flex-row items-center gap-4 p-4 rounded-2xl border border-white/5"
                  style={{
                    backgroundColor: "rgba(21, 46, 38, 0.6)",
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className="items-center justify-center rounded-xl w-12 h-12"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <MaterialIcons
                      name="help-center"
                      size={24}
                      color="#D1D5DB"
                    />
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
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {/* Falar com suporte */}
                <TouchableOpacity
                  onPress={handleSupport}
                  className="flex-row items-center gap-4 p-4 rounded-2xl border border-white/5"
                  style={{
                    backgroundColor: "rgba(21, 46, 38, 0.6)",
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className="items-center justify-center rounded-xl w-12 h-12"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <MaterialIcons
                      name="support-agent"
                      size={24}
                      color="#D1D5DB"
                    />
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
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {/* Compartilhar localização */}
                <TouchableOpacity
                  onPress={handleShareLocation}
                  className="flex-row items-center gap-4 p-4 rounded-2xl border border-white/5"
                  style={{
                    backgroundColor: "rgba(21, 46, 38, 0.6)",
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    className="items-center justify-center rounded-xl w-12 h-12"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <MaterialIcons
                      name="share-location"
                      size={24}
                      color="#D1D5DB"
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
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {/* Emergência - Botão Vermelho Destaque */}
                <TouchableOpacity
                  onPress={handleCallEmergency}
                  className="flex-row items-center gap-4 p-4 rounded-2xl mt-2 border"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                  }}
                  activeOpacity={0.7}
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
        </Pressable>
      </Pressable>
    </Modal>
  );
});

SafetyHelpSheet.displayName = "SafetyHelpSheet";
