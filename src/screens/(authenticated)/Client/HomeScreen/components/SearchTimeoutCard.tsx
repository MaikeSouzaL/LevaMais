import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import ActionButton from "../../../../../components/ui/ActionButton";

export type SearchTimeoutCardProps = {
  visible: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
  onRetry?: () => void;
};

export default function SearchTimeoutCard(props: SearchTimeoutCardProps) {
  if (!props.visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 18,
        backgroundColor: "rgba(17,24,22,0.98)",
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(245,158,11,0.35)",
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 16,
        minHeight: 220,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: "rgba(245,158,11,0.18)",
            borderWidth: 1,
            borderColor: "rgba(245,158,11,0.28)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="schedule" size={22} color="#f59e0b" />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            {props.title || "Sem motoristas no momento"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
            {props.message ||
              "Não encontramos motoristas disponíveis. Você pode tentar novamente."}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <ActionButton
          title="Fechar"
          variant="secondary"
          onPress={props.onClose}
          style={{ flex: 1 }}
        />
        <ActionButton
          title="Tentar novamente"
          variant="primary"
          onPress={props.onRetry}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
