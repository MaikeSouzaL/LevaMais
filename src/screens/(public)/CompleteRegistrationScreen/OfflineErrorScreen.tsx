import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import theme from "../../../theme";

interface OfflineErrorScreenProps {
  onRetry: () => void;
}

export default function OfflineErrorScreen({
  onRetry,
}: OfflineErrorScreenProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center">
          {/* Ícone animado */}
          <View
            className="w-32 h-32 rounded-full items-center justify-center mb-6"
            style={{
              backgroundColor: theme.COLORS.BRAND_LIGHT + "20",
            }}
          >
            <MaterialCommunityIcons
              name="wifi-off"
              size={64}
              color={theme.COLORS.BRAND_LIGHT}
            />
          </View>

          {/* Título */}
          <Text className="text-white text-3xl font-bold mb-4 text-center">
            Servidor Offline
          </Text>

          {/* Descrição */}
          <Text className="text-gray-400 text-base text-center mb-8 leading-6 px-4">
            Não foi possível conectar ao servidor. Verifique sua conexão com a
            internet e tente novamente.
          </Text>

          {/* Cards informativos */}
          <View className="w-full gap-4 mb-8">
            <View
              className="bg-surface-primary rounded-2xl p-5 flex-row items-center"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{
                  backgroundColor: theme.COLORS.BRAND_LIGHT + "20",
                }}
              >
                <MaterialCommunityIcons
                  name="wifi"
                  size={24}
                  color={theme.COLORS.BRAND_LIGHT}
                />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base mb-1">
                  Verifique sua conexão
                </Text>
                <Text className="text-gray-400 text-sm">
                  Certifique-se de que está conectado à internet
                </Text>
              </View>
            </View>

            <View
              className="bg-surface-primary rounded-2xl p-5 flex-row items-center"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <View
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{
                  backgroundColor: theme.COLORS.BRAND_LIGHT + "20",
                }}
              >
                <MaterialCommunityIcons
                  name="server-network-off"
                  size={24}
                  color={theme.COLORS.BRAND_LIGHT}
                />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base mb-1">
                  Servidor temporariamente indisponível
                </Text>
                <Text className="text-gray-400 text-sm">
                  Nossos servidores podem estar em manutenção
                </Text>
              </View>
            </View>
          </View>

          {/* Botões de ação */}
          <View className="w-full gap-3">
            <TouchableOpacity
              className="h-14 rounded-2xl items-center justify-center flex-row"
              style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
              onPress={onRetry}
            >
              <MaterialCommunityIcons
                name="refresh"
                size={24}
                color={theme.COLORS.BRAND_DARK}
              />
              <Text className="text-brand-dark font-bold text-lg ml-2">
                Tentar Novamente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="h-14 rounded-2xl items-center justify-center flex-row border-2"
              style={{
                borderColor: theme.COLORS.GRAY_600,
              }}
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={20} color={theme.COLORS.WHITE} />
              <Text className="text-white font-bold text-lg ml-2">Voltar</Text>
            </TouchableOpacity>
          </View>

          {/* Mensagem de ajuda */}
          <View
            className="mt-8 bg-surface-secondary rounded-2xl p-5"
            style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
          >
            <View className="flex-row items-start">
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={theme.COLORS.BRAND_LIGHT}
                style={{ marginRight: 12, marginTop: 2 }}
              />
              <View className="flex-1">
                <Text className="text-white font-bold text-sm mb-1">
                  Seus dados estão seguros
                </Text>
                <Text className="text-gray-400 text-xs leading-4">
                  Não se preocupe, seus dados não foram perdidos. Você pode
                  tentar novamente quando a conexão for restabelecida.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
