import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import theme from "../../../theme";
import type { RegistrationData } from "../../../types/registration";
import Toast from "react-native-toast-message";
import { registerUser } from "../../../services/auth.service";
import { useAuthStore } from "../../../context/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  step3PreferencesSchema,
  completeRegistrationSchema,
} from "../../../schemas/registration.schema";
import OfflineErrorScreen from "./OfflineErrorScreen";

interface Step3PreferencesProps {
  data: RegistrationData;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onFinish: () => void;
  onBack: () => void;
}

export default function Step3Preferences({
  data,
  onUpdate,
  onFinish,
  onBack,
}: Step3PreferencesProps) {
  const navigation = useNavigation();
  const [preferredPayment, setPreferredPayment] = useState<
    "pix" | "cash" | "card"
  >(data.preferredPayment || "pix");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    data.notificationsEnabled ?? true,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(
    data.acceptedTerms || false,
  );
  const [loading, setLoading] = useState(false);
  const [showOfflineError, setShowOfflineError] = useState(false);
  const { login } = useAuthStore();

  function handlePaymentSelect(payment: "pix" | "cash" | "card") {
    setPreferredPayment(payment);
    onUpdate({ preferredPayment: payment });
  }

  function handleOpenTerms() {
    navigation.navigate("Terms", {
      onAccept: () => {
        setAcceptedTerms(true);
        onUpdate({ acceptedTerms: true });
      },
    });
  }

  async function handleFinish() {
    setLoading(true);
    try {
      // Preparar todos os dados coletados desde o início
      const completeData = {
        // Dados pessoais
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        // Tipo de documento
        documentType: data.documentType,
        // Documentos
        cpf: data.cpf || undefined,
        cnpj: data.cnpj || undefined,
        // Dados da empresa (se CNPJ)
        companyName: data.companyName || undefined,
        companyEmail: data.companyEmail || undefined,
        companyPhone: data.companyPhone || undefined,
        // Endereço completo
        address: data.address
          ? {
              street: data.address.street || "",
              number: data.address.number || "",
              complement: data.address.complement || undefined,
              neighborhood: data.address.neighborhood || undefined,
              city: data.address.city || "",
              state: data.address.state || "",
              zipCode: data.address.zipCode || undefined,
              referencePoint: data.address.referencePoint || undefined,
              latitude: data.address.latitude,
              longitude: data.address.longitude,
            }
          : undefined,
        // Preferências
        preferredPayment: preferredPayment,
        notificationsEnabled: notificationsEnabled,
        // Outros
        userType: data.userType,
        acceptedTerms: acceptedTerms,
        city: data.address?.city || data.city || "",

        // Google
        googleId: data.googleId,
        profilePhoto: data.profilePhoto,

        // Driver
        vehicleType: data.vehicleType,
        vehicleInfo: data.vehicleInfo,
      };

      // Validar todos os dados com o schema completo
      try {
        completeRegistrationSchema.parse(completeData);
      } catch (validationError: any) {
        if (validationError.errors && validationError.errors.length > 0) {
          const firstError = validationError.errors[0];
          Toast.show({
            type: "error",
            text1: "Erro de validação",
            text2:
              firstError.message || "Verifique todos os campos obrigatórios",
          });
          setLoading(false);
          return;
        }
        throw validationError;
      }

      // Preparar payload para enviar ao backend
      const registrationPayload = {
        name: completeData.name,
        email: completeData.email,
        password: completeData.password,
        phone: completeData.phone,
        city: completeData.city,
        userType: completeData.userType,
        acceptedTerms: completeData.acceptedTerms,

        // Google
        googleId: completeData.googleId,
        profilePhoto: completeData.profilePhoto,

        // Tipo de documento
        documentType: completeData.documentType,
        // Documentos
        cpf: completeData.cpf,
        cnpj: completeData.cnpj,
        // Dados da empresa (se CNPJ)
        companyName: completeData.companyName,
        companyEmail: completeData.companyEmail,
        companyPhone: completeData.companyPhone,
        // Endereço completo
        address: completeData.address,
        // Preferências
        preferredPayment: completeData.preferredPayment,
        notificationsEnabled: completeData.notificationsEnabled,
        // Driver
        vehicleType: completeData.vehicleType,
        vehicleInfo: completeData.vehicleInfo,
      };

      console.log("Dados completos sendo salvos:", registrationPayload);

      // Chamar API para registrar
      const response = await registerUser(registrationPayload as any);

      if (!response.success || !response.data) {
        // Verificar se é erro de conexão/servidor offline
        const errorMessage = response.message || "";
        const isOfflineError =
          errorMessage.includes("conexão") ||
          errorMessage.includes("internet") ||
          errorMessage.includes("network") ||
          errorMessage.includes("ECONNREFUSED") ||
          errorMessage.includes("timeout") ||
          response.error?.includes("conexão") ||
          response.error?.includes("network");

        if (isOfflineError) {
          // Mostrar tela de erro offline
          setShowOfflineError(true);
          setLoading(false);
          return;
        }

        // Outros erros - mostrar toast
        Toast.show({
          type: "error",
          text1: "Erro ao cadastrar",
          text2: errorMessage || "Tente novamente mais tarde",
        });
        setLoading(false);
        return;
      }

      const { user, token } = response.data;

      // Salvar token
      if (token) {
        await AsyncStorage.setItem("@auth_token", token);
      }

      // Atualizar store
      login(
        user.userType as "client" | "driver" | "admin",
        {
          id: user._id,
          name: user.name,
          nome: user.name,
          email: user.email,
          telefone: user.phone || "",
          cidade: user.city || "",
          fotoPerfil: user.profilePhoto,
          googleId: user.googleId,
          aceitouTermos: user.acceptedTerms,
        },
        token,
      );

      Toast.show({
        type: "success",
        text1: "Cadastro realizado com sucesso!",
      });

      // Redirecionar para tela de permissão de notificações
      navigation.navigate("NotificationPermission", {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          userType: user.userType,
          cidade: user.city || "",
        },
        token: token,
      });

      setLoading(false);
    } catch (error: any) {
      console.error("Erro ao finalizar cadastro:", error);

      // Verificar se é erro de conexão/servidor offline
      const errorMessage = error.message || "";
      const isOfflineError =
        errorMessage.includes("conexão") ||
        errorMessage.includes("internet") ||
        errorMessage.includes("network") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("timeout") ||
        error.code === "ECONNREFUSED" ||
        error.code === "ETIMEDOUT" ||
        !error.response;

      if (isOfflineError) {
        // Mostrar tela de erro offline
        setShowOfflineError(true);
        setLoading(false);
        return;
      }

      // Outros erros - mostrar toast
      Toast.show({
        type: "error",
        text1: "Erro ao cadastrar",
        text2: errorMessage || "Tente novamente mais tarde",
      });
      setLoading(false);
    }
  }

  function handleRetry() {
    setShowOfflineError(false);
    handleFinish();
  }

  // Se mostrar tela de erro offline
  if (showOfflineError) {
    return <OfflineErrorScreen onRetry={handleRetry} />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <View
            className="w-10 h-10 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
          >
            <MaterialCommunityIcons
              name="truck-delivery"
              size={24}
              color={theme.COLORS.WHITE}
            />
          </View>
          <Text className="text-white text-lg font-bold">Leva+</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6">
          {/* Título */}
          <Text className="text-white text-2xl font-bold mb-2">
            Completar cadastro
          </Text>
          <Text className="text-gray-300 text-base mb-6">
            Precisamos de alguns dados para você começar a pedir entregas.
          </Text>

          {/* Progress Steps */}
          <View className="mb-8">
            <View className="flex-row items-center justify-center">
              <View className="items-center" style={{ width: 80 }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                </View>
              </View>
              <View
                className="h-2 flex-1"
                style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
              />
              <View className="items-center" style={{ width: 80 }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={theme.COLORS.WHITE}
                  />
                </View>
              </View>
              <View
                className="h-2 flex-1"
                style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
              />
              <View className="items-center" style={{ width: 80 }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
                >
                  <Text className="text-white font-bold">3</Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center justify-center mt-1">
              <Text
                className="text-brand-light text-xs font-semibold"
                style={{ width: 80, textAlign: "center" }}
              >
                DADOS
              </Text>
              <View style={{ flex: 1, marginHorizontal: 8 }} />
              <Text
                className="text-brand-light text-xs font-semibold"
                style={{ width: 80, textAlign: "center" }}
              >
                ENDEREÇO
              </Text>
              <View style={{ flex: 1, marginHorizontal: 8 }} />
              <Text
                className="text-brand-light text-xs font-semibold"
                style={{ width: 80, textAlign: "center" }}
              >
                PREFERÊNCIAS
              </Text>
            </View>
          </View>

          {/* Pagamento preferido */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
          >
            <Text className="text-white text-lg font-bold mb-1">
              Pagamento preferido
            </Text>
            <Text className="text-gray-300 text-sm mb-4">
              Você poderá alterar isso depois.
            </Text>

            {/* Pix */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 rounded-xl mb-3"
              style={{
                backgroundColor:
                  preferredPayment === "pix"
                    ? theme.COLORS.BRAND_LIGHT + "20"
                    : theme.COLORS.SURFACE_SECONDARY,
                borderWidth: preferredPayment === "pix" ? 2 : 0,
                borderColor:
                  preferredPayment === "pix"
                    ? theme.COLORS.BRAND_LIGHT
                    : "transparent",
              }}
              onPress={() => handlePaymentSelect("pix")}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: theme.COLORS.BRAND_LIGHT + "30" }}
                >
                  <MaterialCommunityIcons
                    name="qrcode"
                    size={24}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                </View>
                <Text className="text-white font-semibold text-base">Pix</Text>
              </View>
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  borderWidth: preferredPayment === "pix" ? 0 : 2,
                  borderColor: theme.COLORS.WHITE,
                  backgroundColor:
                    preferredPayment === "pix"
                      ? theme.COLORS.BRAND_LIGHT
                      : "transparent",
                }}
              >
                {preferredPayment === "pix" && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={theme.COLORS.WHITE}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Dinheiro */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 rounded-xl mb-3"
              style={{
                backgroundColor:
                  preferredPayment === "cash"
                    ? theme.COLORS.BRAND_LIGHT + "20"
                    : theme.COLORS.SURFACE_SECONDARY,
                borderWidth: preferredPayment === "cash" ? 2 : 0,
                borderColor:
                  preferredPayment === "cash"
                    ? theme.COLORS.BRAND_LIGHT
                    : "transparent",
              }}
              onPress={() => handlePaymentSelect("cash")}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#10B98130" }}
                >
                  <MaterialCommunityIcons
                    name="cash"
                    size={24}
                    color="#10B981"
                  />
                </View>
                <Text className="text-white font-semibold text-base">
                  Dinheiro
                </Text>
              </View>
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  borderWidth: preferredPayment === "cash" ? 0 : 2,
                  borderColor: theme.COLORS.WHITE,
                  backgroundColor:
                    preferredPayment === "cash"
                      ? theme.COLORS.BRAND_LIGHT
                      : "transparent",
                }}
              >
                {preferredPayment === "cash" && (
                  <MaterialCommunityIcons
                    name="check"
                    size={16}
                    color={theme.COLORS.WHITE}
                  />
                )}
              </View>
            </TouchableOpacity>

            {/* Cartão (Em breve) */}
            <View
              className="flex-row items-center justify-between p-4 rounded-xl opacity-50"
              style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
            >
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: "#F59E0B30" }}
                >
                  <MaterialCommunityIcons
                    name="credit-card"
                    size={24}
                    color="#F59E0B"
                  />
                </View>
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-base mr-2">
                    Cartão
                  </Text>
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: theme.COLORS.GRAY_700 }}
                  >
                    <Text className="text-gray-300 text-xs">Em breve</Text>
                  </View>
                </View>
              </View>
              <View
                className="w-6 h-6 rounded-full"
                style={{
                  borderWidth: 2,
                  borderColor: theme.COLORS.GRAY_500,
                }}
              />
            </View>
          </View>

          {/* Notificações */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-white text-lg font-bold">Notificações</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                  onUpdate({ notificationsEnabled: value });
                }}
                trackColor={{
                  false: theme.COLORS.GRAY_600,
                  true: theme.COLORS.BRAND_LIGHT,
                }}
                thumbColor={theme.COLORS.WHITE}
              />
            </View>
            <Text className="text-gray-300 text-sm mb-4">
              Recomendado para acompanhar status e chegada do entregador.
            </Text>

            <TouchableOpacity
              className="flex-row items-center justify-center p-4 rounded-xl"
              style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
            >
              <MaterialCommunityIcons
                name="bell"
                size={20}
                color={theme.COLORS.WHITE}
              />
              <Text className="text-white font-semibold ml-2">
                Ativar notificações do sistema
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Termos de Uso e Privacidade */}
      <View className="px-6 pt-4 pb-4">
        <TouchableOpacity
          className="flex-row items-center justify-between p-4 rounded-xl mb-4"
          style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
          onPress={handleOpenTerms}
        >
          <View className="flex-row items-center flex-1">
            <MaterialCommunityIcons
              name="file-document-outline"
              size={24}
              color={theme.COLORS.BRAND_LIGHT}
            />
            <View className="ml-3 flex-1">
              <Text className="text-white font-semibold text-base">
                Termos de Uso e Política de Privacidade
              </Text>
              <Text className="text-gray-400 text-xs mt-1">
                {acceptedTerms
                  ? "Você aceitou os termos"
                  : "Leia e aceite para continuar"}
              </Text>
            </View>
          </View>
          <View
            className={`w-6 h-6 rounded-full items-center justify-center ${
              acceptedTerms ? "bg-brand-light" : "border-2 border-gray-500"
            }`}
          >
            {acceptedTerms && (
              <Feather name="check" size={16} color={theme.COLORS.WHITE} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="px-6 pb-6 pt-2">
        <TouchableOpacity
          className={`h-14 rounded-2xl items-center justify-center mb-4 ${
            acceptedTerms ? "bg-brand-light" : "bg-gray-600"
          }`}
          onPress={handleFinish}
          disabled={loading || !acceptedTerms}
        >
          <Text
            className={`font-bold text-lg ${
              acceptedTerms ? "text-brand-dark" : "text-gray-400"
            }`}
          >
            {loading ? "Finalizando..." : "Finalizar cadastro"}
          </Text>
        </TouchableOpacity>

        {!acceptedTerms && (
          <Text className="text-center text-gray-400 text-xs mb-2">
            Você precisa aceitar os termos para continuar
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
