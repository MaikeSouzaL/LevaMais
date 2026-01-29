import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

export function DriverHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  const navigation = useNavigation();

  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#0f231c",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <TouchableOpacity
          onPress={() => (navigation as any).openDrawer?.()}
          activeOpacity={0.85}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(17,24,22,0.9)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="menu" size={22} color="#02de95" />
        </TouchableOpacity>

        <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
          {title}
        </Text>
      </View>

      <View>{right}</View>
    </View>
  );
}

export default DriverHeader;
