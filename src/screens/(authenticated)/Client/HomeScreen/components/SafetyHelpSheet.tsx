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
  Platform,
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
  const Content = (
    <Pressable
      onPress={(e) => e.stopPropagation()}
      style={{
        width: "91.666%",
        maxWidth: 420,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "rgba(15, 35, 28, 0.85)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.37,
        shadowRadius: 32,
        elevation: 20,
      }}
    >
      <View
        style={{ paddingTop: 20, paddingBottom: 12, paddingHorizontal: 24 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
              Ajuda Rápida
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                fontSize: 11,
                marginTop: 4,
                fontWeight: "500",
              }}
            >
              Segurança em primeiro lugar
            </Text>
          </View>
          <View
            style={{
              height: 40,
              width: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.05)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <MaterialIcons name="shield" size={20} color="#02de95" />
          </View>
        </View>
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.1)",
          marginHorizontal: 0,
          marginBottom: 8,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        <View style={{ gap: 12 }}>
          {/* Card: Central de Ajuda */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleHelpCenter}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              backgroundColor: "rgba(21,46,38,0.6)",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              <MaterialIcons name="help-center" size={24} color="#D1D5DB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Central de Ajuda
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>
                Dúvidas frequentes
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={14} color="#6B7280" />
          </TouchableOpacity>

          {/* Card: Falar com suporte */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSupport}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              backgroundColor: "rgba(21,46,38,0.6)",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              <MaterialIcons name="support-agent" size={24} color="#D1D5DB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Falar com suporte
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>
                Atendimento 24h
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={14} color="#6B7280" />
          </TouchableOpacity>

          {/* Card: Compartilhar localização */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShareLocation}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              backgroundColor: "rgba(21,46,38,0.6)",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            >
              <MaterialIcons name="share-location" size={24} color="#D1D5DB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
                Compartilhar localização
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 11, marginTop: 4 }}>
                Enviar para amigos
              </Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={14} color="#6B7280" />
          </TouchableOpacity>

          {/* Botão: Emergência */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleCallEmergency}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.3)",
              backgroundColor: "rgba(239,68,68,0.1)",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(239,68,68,0.2)",
              }}
            >
              <MaterialIcons name="warning" size={24} color="#EF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                Emergência
              </Text>
              <Text
                style={{
                  color: "#FCA5A5",
                  opacity: 0.7,
                  fontSize: 11,
                  marginTop: 4,
                  fontWeight: "500",
                }}
              >
                LIGAR 190
              </Text>
            </View>
            <View
              style={{
                height: 32,
                width: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(239,68,68,0.2)",
              }}
            >
              <MaterialIcons name="call" size={18} color="#EF4444" />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Pressable>
  );

  if (!visible) return null;

  // iOS/Android usam Modal; Web usa overlay absoluto por limitações do Modal
  if (Platform.OS !== "web") {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <Pressable
          className="flex-1 items-center justify-center"
          onPress={handleClose}
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          {Content}
        </Pressable>
      </Modal>
    );
  }

  // Fallback Web
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <Pressable
        className="flex-1 items-center justify-center"
        onPress={handleClose}
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        {Content}
      </Pressable>
    </View>
  );
});

SafetyHelpSheet.displayName = "SafetyHelpSheet";
