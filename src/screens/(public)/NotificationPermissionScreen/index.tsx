import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as Device from "expo-device";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import {
  requestNotificationPermissions,
  getPushToken,
  setupNotificationHandler,
} from "../../../services/notification.service";
import { savePushToken } from "../../../services/auth.service";

interface NotificationPermissionParams {
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    userType: string;
    cidade: string;
  };
  token: string;
}

export default function NotificationPermissionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as NotificationPermissionParams;
  const [loading, setLoading] = useState(false);

  async function requestNotificationPermissionsHandler() {
    setLoading(true);

    try {
      // Verificar se é um dispositivo físico
      if (!Device.isDevice) {
        Alert.alert(
          "Aviso",
          "Notificações push não funcionam em emulador/simulador. Use um dispositivo físico para testar."
        );
        handleSkip();
        return;
      }

      // Configurar handler de notificações
      setupNotificationHandler();

      // Solicitar permissões usando o serviço
      const permissionGranted = await requestNotificationPermissions();

      if (!permissionGranted) {
        Toast.show({
          type: "error",
          text1: "Permissão negada",
          text2: "Você pode ativar depois nas configurações do app",
        });
        handleSkip();
        return;
      }

      // Obter token do dispositivo
      const pushToken = await getPushToken("seu-project-id-aqui"); // Configurar com o projectId do app.json

      if (!pushToken) {
        console.warn("Não foi possível obter push token");
        Toast.show({
          type: "warning",
          text1: "Aviso",
          text2: "Notificações ativadas, mas token não foi gerado",
        });
        handleContinue();
        return;
      }

      console.log("Push Token obtido:", pushToken);

      // Salvar token no backend
      const saveResponse = await savePushToken(pushToken, params.token);

      if (saveResponse.success) {
        console.log("Push token salvo no backend com sucesso!");
        Toast.show({
          type: "success",
          text1: "Notificações ativadas!",
          text2: "Você receberá atualizações sobre suas entregas",
        });
      } else {
        console.warn("Erro ao salvar push token:", saveResponse.message);
        Toast.show({
          type: "warning",
          text1: "Notificações ativadas",
          text2: "Mas houve um problema ao salvar. Tente novamente mais tarde.",
        });
      }

      handleContinue();
    } catch (error: any) {
      console.error("Erro ao solicitar permissões de notificação:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao ativar notificações",
        text2: error.message || "Tente novamente mais tarde",
      });
      handleSkip();
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    // Pular permissão de notificação
    handleContinue();
  }

  function handleContinue() {
    // O store já foi atualizado no Step3Preferences
    // A navegação será automática através do componente Routes
    // que verifica isAuthenticated e userType
    // Apenas fazemos goBack para permitir que o Routes redirecione
    navigation.reset({
      index: 0,
      routes: [{ name: "SignIn" }],
    });
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Ilustração */}
        <View className="items-center mb-8">
          <View
            className="w-32 h-32 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT + "20" }}
          >
            <MaterialCommunityIcons
              name="bell-ring"
              size={64}
              color={theme.COLORS.BRAND_LIGHT}
            />
          </View>
        </View>

        {/* Título */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-white text-center mb-3">
            Ative as notificações
          </Text>
          <Text className="text-base text-gray-400 text-center leading-6">
            Fique por dentro de tudo que acontece com suas entregas em tempo
            real
          </Text>
        </View>

        {/* Benefícios */}
        <View className="mb-10">
          <View className="flex-row items-start mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={theme.COLORS.BRAND_LIGHT}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Acompanhe em tempo real
              </Text>
              <Text className="text-gray-400 text-sm leading-5">
                Receba atualizações sobre o status das suas entregas mesmo com o
                app fechado
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <MaterialCommunityIcons
                name="message-alert"
                size={24}
                color={theme.COLORS.BRAND_LIGHT}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Mensagens importantes
              </Text>
              <Text className="text-gray-400 text-sm leading-5">
                Não perca nenhuma mensagem do entregador ou atualizações
                urgentes
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color={theme.COLORS.BRAND_LIGHT}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Alertas de segurança
              </Text>
              <Text className="text-gray-400 text-sm leading-5">
                Receba notificações sobre confirmações de entrega e avisos
                importantes
              </Text>
            </View>
          </View>
        </View>

        {/* Observação de privacidade */}
        <View
          className="flex-row items-center p-4 rounded-xl mb-8"
          style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
        >
          <Feather
            name="lock"
            size={20}
            color={theme.COLORS.BRAND_LIGHT}
            style={{ marginRight: 12 }}
          />
          <Text className="flex-1 text-gray-300 text-xs leading-5">
            Suas notificações são privadas e seguras. Você pode desativar a
            qualquer momento nas configurações do app.
          </Text>
        </View>
      </ScrollView>

      {/* Botões fixos na parte inferior */}
      <View className="px-6 pb-6">
        <TouchableOpacity
          className="h-14 rounded-2xl items-center justify-center mb-3 shadow-lg"
          style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
          onPress={requestNotificationPermissionsHandler}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text className="text-brand-dark font-bold text-lg">
            {loading ? "Ativando..." : "Ativar notificações"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="h-14 rounded-2xl items-center justify-center border border-gray-600"
          onPress={handleSkip}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text className="text-gray-400 font-semibold text-base">
            Agora não
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
