import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import theme from "../../../theme";

type ProfileType = "client" | "driver";

interface SelectProfileParams {
  user: {
    _id?: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    city?: string;
    userType?: string;
    googleId?: string;
    profilePhoto?: string;
    acceptedTerms: boolean;
  };
  token?: string;
}

export default function SelectProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, token } = route.params as SelectProfileParams;
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>("client");

  function handleContinue() {
    if (!user) {
      console.error("Dados do usuario nao encontrados");
      return;
    }

    if (selectedProfile === "client") {
      navigation.navigate("CompleteRegistrationClient", { user, token });
      return;
    }

    navigation.navigate("CompleteRegistrationDriver", {
      selectedProfile,
      user,
      token,
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          <View className="mb-8 mt-4" style={{ height: 80 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={{ position: "absolute", left: 0, top: 0, padding: 8 }}
            >
              <Feather name="arrow-left" size={18} color={theme.COLORS.WHITE} />
            </TouchableOpacity>

            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                alignItems: "center",
              }}
            >
              <View
                className="w-20 h-20 rounded-2xl items-center justify-center"
                style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
              >
                <MaterialCommunityIcons
                  name="truck-delivery"
                  size={48}
                  color={theme.COLORS.WHITE}
                />
              </View>
            </View>
          </View>

          <View className="items-center mb-3">
            <Text className="text-white text-2xl font-bold text-center">
              Como voce vai usar o{" "}
              <Text
                className="font-bold"
                style={{ color: theme.COLORS.BRAND_LIGHT }}
              >
                Leva+
              </Text>
              ?
            </Text>
          </View>

          <Text className="text-gray-300 text-center text-base mb-8 px-4">
            Escolha seu perfil inicial. Depois voce pode ajustar seu uso no app
            sem perder sua conta.
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedProfile("client")}
            className="mb-4"
            activeOpacity={0.8}
          >
            <View
              className="rounded-2xl p-5 relative"
              style={{
                backgroundColor: theme.COLORS.SURFACE_PRIMARY,
                borderWidth: selectedProfile === "client" ? 2 : 0,
                borderColor:
                  selectedProfile === "client"
                    ? theme.COLORS.BRAND_LIGHT
                    : "transparent",
              }}
            >
              {selectedProfile === "client" && (
                <View className="absolute top-4 right-4">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={28}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                </View>
              )}

              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${theme.COLORS.BRAND_LIGHT}20` }}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color={theme.COLORS.WHITE}
                  />
                </View>
                <Text className="text-white text-xl font-bold">Cliente</Text>
              </View>

              <Text className="text-gray-300 text-sm mb-4">
                Use para corridas urbanas (Uber/99), entregas rapidas e pedidos
                de comercio/restaurante.
              </Text>

              <View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Pedir corrida para voce e acompanhantes
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Pedir entrega e frete com moto, carro, van ou caminhao
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Acompanhar motorista e pedido em tempo real
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Pagamento integrado com pix, dinheiro e cartao
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Modo pessoal ou comercial com CPF/CNPJ
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedProfile("driver")}
            className="mb-8"
            activeOpacity={0.8}
          >
            <View
              className="rounded-2xl p-5 relative"
              style={{
                backgroundColor: theme.COLORS.SURFACE_SECONDARY,
                borderWidth: selectedProfile === "driver" ? 2 : 0,
                borderColor:
                  selectedProfile === "driver"
                    ? theme.COLORS.BRAND_LIGHT
                    : "transparent",
              }}
            >
              {selectedProfile === "driver" && (
                <View className="absolute top-4 right-4">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={28}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                </View>
              )}

              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${theme.COLORS.BRAND_LIGHT}20` }}
                >
                  <MaterialCommunityIcons
                    name="truck-fast"
                    size={24}
                    color={theme.COLORS.WHITE}
                  />
                </View>
                <Text className="text-white text-xl font-bold">
                  Motorista parceiro
                </Text>
              </View>

              <Text className="text-gray-300 text-sm mb-4">
                Fique online para aceitar corridas de passageiros e entregas
                conforme seu tipo de veiculo.
              </Text>

              <View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Aceitar corridas e entregas por proximidade
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Trabalhar com moto, carro, van ou caminhao
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Ver chamadas disponiveis no mapa em tempo real
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Receber ganhos, extrato e solicitacao de saque
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Controle de disponibilidade online e offline
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinue}
            className="h-14 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
            activeOpacity={0.8}
          >
            <Text className="text-brand-dark font-bold text-lg">Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
