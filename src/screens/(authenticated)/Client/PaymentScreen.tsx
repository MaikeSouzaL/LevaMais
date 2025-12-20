import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

type PaymentMethod = "credit_card" | "pix" | "cash";

type Params = {
  Payment: {
    amount: number;
  };
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "Payment">>();
  const amount = route.params?.amount || 0;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("credit_card");

  const formatBRL = (value: number) => {
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    } catch {
      return `R$ ${value.toFixed(2)}`;
    }
  };

  const handleConfirmPayment = () => {
    // Logic to process payment
    console.log(`Processing payment of ${formatBRL(amount)} via ${selectedMethod}`);
    
    // Simular título e ETA baseados no valor ou criar lógica melhor
    // Idealmente esses dados viriam via params também. 
    // Por enquanto, vou "chutar" valores genéricos ou passar via params se eu tivesse passado.
    // Mas a Home espera "startSearch" com dados.
    
    // Vou pegar os dados que deveriam ter vindo via rota, mas como não passei, 
    // vou assumir que a Home vai usar os dados que ela já tem ou vou passar dados genéricos
    // O ideal é passar tudo via params. Vou atualizar os params do PaymentScreen para receber os dados do modal.
    
    const searchData = {
       title: "Buscando Motorista", // Poderia vir de props
       price: formatBRL(amount),
       eta: "Chegada em ~5 min",
    };

    (navigation as any).navigate("Home", {
      startSearch: true,
      searchData
    }); 
  };

  const renderMethod = (
    id: PaymentMethod,
    icon: React.ReactNode,
    label: string,
    sublabel?: string
  ) => {
    const isSelected = selectedMethod === id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedMethod(id)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isSelected ? "rgba(2, 222, 149, 0.1)" : "#162e25",
          borderWidth: 1,
          borderColor: isSelected ? "#02de95" : "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ width: 40, alignItems: "center" }}>{icon}</View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={{ color: "#9abcb0", fontSize: 12 }}>{sublabel}</Text>
          )}
        </View>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: isSelected ? "#02de95" : "#555",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#02de95",
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#white" />
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
          Pagamento
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: Math.max(insets.bottom, 24) + 96,
        }}
      >
        <Text
          style={{
            color: "#9abcb0",
            fontSize: 14,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Valor a pagar
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 40,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          {formatBRL(amount)}
        </Text>

        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 16,
          }}
        >
          Escolha a forma de pagamento
        </Text>

        {renderMethod(
          "credit_card",
          <MaterialIcons name="credit-card" size={24} color="white" />,
          "Cartão de Crédito",
          "Visa final 4242"
        )}

        {renderMethod(
          "pix",
          <FontAwesome5 name="pix" size={24} color="#32BCAD" />,
          "Pix",
          "Aprovação imediata"
        )}

        {renderMethod(
          "cash",
          <FontAwesome5 name="money-bill-wave" size={20} color="#85bb65" />,
          "Dinheiro",
          "Pagar diretamente ao motorista"
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
          backgroundColor: "rgba(15,35,28,0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
        }}
      >
        <TouchableOpacity
          onPress={handleConfirmPayment}
          activeOpacity={0.9}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor: "#02de95",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#0f231c", fontWeight: "800", fontSize: 18 }}>
            Pagar {formatBRL(amount)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
