import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuthStore } from "../../../context/authStore";
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
  const { login } = useAuthStore();
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>("client");

  const { user, token } = (route.params as SelectProfileParams) || {
    user: null,
    token: null,
  };

  function handleContinue() {
    if (!user) {
      console.error("Dados do usuário não encontrados");
      return;
    }

    // Se for cliente, navegar para tela de completar cadastro
    if (selectedProfile === "client") {
      navigation.navigate("CompleteRegistration", {
        user,
        userType: selectedProfile,
      });
    } else {
      // Se for driver, navegar para tela apropriada (a implementar)
      console.log("Perfil selecionado:", selectedProfile);
      console.log("Dados do usuário:", user);
    }
  }

  function handleGoBack() {
    // Voltar para a tela anterior mantendo os dados preenchidos
    navigation.goBack();
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/* Ícone do Caminhão */}
          <View className="items-center mb-8 mt-4">
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

          {/* Título */}
          <View className="items-center mb-3">
            <Text className="text-white text-2xl font-bold text-center">
              Como você vai usar o{" "}
              <Text
                className="font-bold"
                style={{ color: theme.COLORS.BRAND_LIGHT }}
              >
                Leva+?
              </Text>
            </Text>
          </View>

          {/* Subtítulo */}
          <Text className="text-gray-300 text-center text-base mb-8 px-4">
            Escolha um perfil para continuar. Você pode trocar depois nas
            configurações.
          </Text>

          {/* Card Cliente */}
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
              {/* Check no canto superior direito quando selecionado */}
              {selectedProfile === "client" && (
                <View className="absolute top-4 right-4">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={28}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                </View>
              )}

              {/* Header do Card */}
              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: theme.COLORS.BRAND_LIGHT + "20" }}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={24}
                    color={theme.COLORS.WHITE}
                  />
                </View>
                <Text className="text-white text-xl font-bold">Cliente</Text>
              </View>

              {/* Descrição */}
              <Text className="text-gray-300 text-sm mb-4">
                Solicite entregas, fretes e transporte de encomendas. Escolha o
                veículo ideal para sua necessidade (moto, carro, van ou
                caminhão).
              </Text>

              {/* Features */}
              <View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Solicite entregas, fretes e transportes com poucos toques
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Escolha o tipo de veículo ideal para sua encomenda
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Acompanhe seu pedido em tempo real no mapa
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Pagamento integrado e seguro
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Histórico detalhado de todas as suas solicitações
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card Entregador/Transportador */}
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
              {/* Check no canto superior direito quando selecionado */}
              {selectedProfile === "driver" && (
                <View className="absolute top-4 right-4">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={28}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                </View>
              )}

              {/* Header do Card */}
              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: theme.COLORS.BRAND_LIGHT + "20" }}
                >
                  <MaterialCommunityIcons
                    name="truck-fast"
                    size={24}
                    color={theme.COLORS.WHITE}
                  />
                </View>
                <Text className="text-white text-xl font-bold">Entregador</Text>
              </View>

              {/* Descrição */}
              <Text className="text-gray-300 text-sm mb-4">
                Ofereça serviços de entrega, frete e transporte com moto,
                bicicleta, carro, van ou caminhão.
              </Text>

              {/* Features */}
              <View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Aceite encomendas, fretes e entregas
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Trabalhe com seu veículo (moto, carro, van, caminhão)
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Visualize solicitações próximas no mapa
                  </Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Receba seus ganhos na hora
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="lightning-bolt"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                  <Text className="text-gray-200 text-sm ml-2">
                    Defina seus horários de trabalho
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Botão Continuar */}
          <TouchableOpacity
            onPress={handleContinue}
            className="h-14 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
            activeOpacity={0.8}
          >
            <Text className="text-brand-dark font-bold text-lg">Continuar</Text>
          </TouchableOpacity>

          {/* Link Voltar/Cancelar */}
          <TouchableOpacity
            onPress={handleGoBack}
            className="items-center py-3"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Feather
                name="arrow-left"
                size={18}
                color={theme.COLORS.WHITE}
                style={{ marginRight: 8 }}
              />
              <Text className="text-white text-base">Voltar</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
