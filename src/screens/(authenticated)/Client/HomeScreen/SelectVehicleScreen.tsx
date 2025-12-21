import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function SelectVehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;

  const handleBack = () => {
    if ((navigation as any).canGoBack()) {
      (navigation as any).goBack();
    } else {
      (navigation as any).navigate("LocationPicker");
    }
  };

  const handleSelect = (type: "motorcycle" | "car" | "van" | "truck") => {
    (navigation as any).navigate("ServicePurpose", {
      vehicleType: type,
      pickup: params?.pickup,
      dropoff: params?.dropoff,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f231c", paddingTop: insets.top }}>
      <View
        style={{
          paddingTop: 8,
          paddingBottom: 12,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <TouchableOpacity onPress={handleBack} style={{ padding: 4, marginRight: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            Qual o tamanho?
          </Text>
          <Text style={{ color: "#9bbbb0", fontSize: 13, textAlign: "center" }}>
            Selecione o veículo ideal
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 24) }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelect("motorcycle")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#162e26",
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text
                style={{
                  color: "#06db94",
                  backgroundColor: "rgba(6,219,148,0.2)",
                  fontSize: 10,
                  fontWeight: "700",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  textTransform: "uppercase",
                }}
              >
                Mais rápido
              </Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Moto</Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Pequenos pacotes e documentos até 20kg
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="two-wheeler" size={32} color="#06db94" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelect("car")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#162e26",
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Carro</Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Compras de mercado ou caixas médias
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="directions-car" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelect("van")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#162e26",
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Van</Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Móveis pequenos ou muitas caixas
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="airport-shuttle" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handleSelect("truck")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
            borderRadius: 16,
            backgroundColor: "#162e26",
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View style={{ flex: 1, marginRight: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <Text
                style={{
                  color: "rgba(255,255,255,0.8)",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  fontSize: 10,
                  fontWeight: "700",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 9999,
                  textTransform: "uppercase",
                }}
              >
                Grandes volumes
              </Text>
            </View>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Caminhão</Text>
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Mudanças e grandes cargas comerciais
            </Text>
          </View>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="local-shipping" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
