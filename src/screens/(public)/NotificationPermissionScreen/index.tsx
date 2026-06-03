import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import * as Device from "expo-device";
import Constants from "expo-constants";
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
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as NotificationPermissionParams;
  const [loading, setLoading] = useState(false);

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;

  async function requestNotificationPermissionsHandler() {
    setLoading(true);

    try {
      if (!Device.isDevice) {
        Alert.alert(
          "Aviso",
          "Notificacoes push nao funcionam em emulador/simulador. Use dispositivo fisico.",
        );
        handleSkip();
        return;
      }

      setupNotificationHandler();

      const permissionGranted = await requestNotificationPermissions();

      if (!permissionGranted) {
        Toast.show({
          type: "error",
          text1: "Permissao negada",
          text2: "Voce pode ativar depois nas configuracoes do app",
        });
        handleSkip();
        return;
      }

      const hasValidProjectId =
        !!projectId && projectId !== "seu-project-id-aqui";

      if (!hasValidProjectId) {
        Toast.show({
          type: "warning",
          text1: "Project ID nao configurado",
          text2: "Configure o EAS Project ID para push remoto",
        });
        handleContinue();
        return;
      }

      const pushToken = await getPushToken(projectId);

      if (!pushToken) {
        Toast.show({
          type: "warning",
          text1: "Aviso",
          text2: "Permissao ativa, mas nao foi possivel gerar push token",
        });
        handleContinue();
        return;
      }

      const saveResponse = await savePushToken(pushToken, params.token);

      if (saveResponse.success) {
        Toast.show({
          type: "success",
          text1: "Notificacoes ativadas",
          text2: "Voce recebera atualizacoes em tempo real",
        });
      } else {
        Toast.show({
          type: "warning",
          text1: "Notificacoes ativadas",
          text2: "Houve problema ao salvar token no backend",
        });
      }

      handleContinue();
    } catch (error: any) {
            Toast.show({
        type: "error",
        text1: "Erro ao ativar notificacoes",
        text2: error.message || "Tente novamente mais tarde",
      });
      handleSkip();
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    handleContinue();
  }

  function handleContinue() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
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
        <View className="items-center mb-8">
          <View
            className="w-32 h-32 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: `${theme.COLORS.BRAND_LIGHT}20` }}
          >
            <Icon
              name="bell-ring"
              size={64}
              color={theme.COLORS.BRAND_LIGHT}
            />
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-3xl font-bold text-white text-center mb-3">
            Ative as notificacoes
          </Text>
          <Text className="text-base text-gray-400 text-center leading-6">
            Fique por dentro do status da corrida, entrega e mensagens.
          </Text>
        </View>

        <View className="mb-10">
          <View className="flex-row items-start mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <Icon
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
                Atualizacoes mesmo com app fechado.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <Icon
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
                Nao perca alertas e recados do fluxo.
              </Text>
            </View>
          </View>

          <View className="flex-row items-start mb-5">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <Icon
                name="shield-check"
                size={24}
                color={theme.COLORS.BRAND_LIGHT}
              />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold mb-1">
                Alertas de seguranca
              </Text>
              <Text className="text-gray-400 text-sm leading-5">
                Confirmacoes e eventos importantes de seguranca.
              </Text>
            </View>
          </View>
        </View>

        <View
          className="flex-row items-center p-4 rounded-xl mb-8"
          style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
        >
          <Icon
            name="lock"
            size={20}
            color={theme.COLORS.BRAND_LIGHT}
            style={{ marginRight: 12 }}
          />
          <Text className="flex-1 text-gray-300 text-xs leading-5">
            Suas notificacoes sao privadas e podem ser desativadas quando quiser.
          </Text>
        </View>
      </ScrollView>

      <View className="px-6 pb-6">
        <TouchableOpacity
          className="h-14 rounded-2xl items-center justify-center mb-3 shadow-lg"
          style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
          onPress={requestNotificationPermissionsHandler}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text className="text-brand-dark font-bold text-lg">
            {loading ? "Ativando..." : "Ativar notificacoes"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="h-14 rounded-2xl items-center justify-center border border-gray-600"
          onPress={handleSkip}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text className="text-gray-400 font-semibold text-base">Agora nao</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
