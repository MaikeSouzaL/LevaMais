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
  const canGoBack = (navigation as any).canGoBack();
  // Se estiver numa stack e não for a rota inicial da history, mostra voltar.
  // Porém, como estamos num drawer, às vezes canGoBack() retorna true mas não queremos mostrar
  // se for a tela raiz do Drawer. Mas aqui vamos assumir que as telas internas serão Stacks.
  
  // Melhor abordagem: verificar se existe um parent stack ou flag explicita
  // Para simplificar: se passarmos "showBack" ou se canGoBack for true E não for openDrawer.
  
  const handlePressConfig = () => {
    if (canGoBack) {
        navigation.goBack();
    } else {
        (navigation as any).openDrawer?.();
    }
  };

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
          onPress={handlePressConfig}
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
          <MaterialIcons 
            name={canGoBack ? "arrow-back" : "menu"} 
            size={22} 
            color={canGoBack ? "#fff" : "#02de95"} 
          />
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
