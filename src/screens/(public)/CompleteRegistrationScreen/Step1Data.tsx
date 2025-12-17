import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import type { RegistrationData } from "../../../types/registration";
import { step1DataSchema } from "../../../schemas/registration.schema";

interface Step1DataProps {
  data: RegistrationData;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step1Data({
  data,
  onUpdate,
  onNext,
  onBack,
}: Step1DataProps) {
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">(
    data.documentType || "cpf"
  );

  function handleDocumentTypeChange(type: "cpf" | "cnpj") {
    setDocumentType(type);
    onUpdate({ documentType: type });
  }

  function formatCPF(text: string) {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return text;
  }

  function formatCNPJ(text: string) {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 14) {
      return cleaned
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
    }
    return text;
  }

  function formatPhone(text: string) {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return text;
  }

  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const phoneInputRef = useRef<TextInput>(null);
  const cpfCnpjInputRef = useRef<TextInput>(null);
  const companyNameInputRef = useRef<TextInput>(null);
  const companyEmailInputRef = useRef<TextInput>(null);
  const companyPhoneInputRef = useRef<TextInput>(null);
  const cpfCnpjInputPositionRef = useRef<{ y: number } | null>(null);
  const cpfCnpjContainerRef = useRef<View>(null);

  // Função auxiliar para fazer scroll automático quando um input recebe foco
  function handleInputFocus(scrollY: number) {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: scrollY,
          animated: true,
        });
      }
    }, 300);
  }

  function handleNext() {
    try {
      // Validar com Zod
      const validationData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        documentType,
        cpf: data.cpf,
        cnpj: data.cnpj,
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,
      };

      step1DataSchema.parse(validationData);

      // Garantir que documentType está atualizado no registro
      onUpdate({ documentType });

      // Navegar para o próximo step
      onNext();
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        Toast.show({
          type: "error",
          text1: "Erro de validação",
          text2: firstError.message,
        });
      }
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
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
        <TouchableOpacity>
          <Feather name="help-circle" size={24} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 400, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled={true}
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
                  <Text className="text-white font-bold">1</Text>
                </View>
              </View>
              <View
                className="h-2 flex-1"
                style={{ backgroundColor: theme.COLORS.GRAY_700 }}
              />
              <View className="items-center" style={{ width: 80 }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.COLORS.GRAY_700 }}
                >
                  <Text className="text-gray-400 font-bold">2</Text>
                </View>
              </View>
              <View
                className="h-2 flex-1"
                style={{ backgroundColor: theme.COLORS.GRAY_700 }}
              />
              <View className="items-center" style={{ width: 80 }}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.COLORS.GRAY_700 }}
                >
                  <Text className="text-gray-400 font-bold">3</Text>
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
                className="text-gray-400 text-xs"
                style={{ width: 80, textAlign: "center" }}
              >
                ENDEREÇO
              </Text>
              <View style={{ flex: 1, marginHorizontal: 8 }} />
              <Text
                className="text-gray-400 text-xs"
                style={{ width: 80, textAlign: "center" }}
              >
                PREFERÊNCIAS
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            className="rounded-2xl p-5 mb-6"
            style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
          >
            {/* Nome completo */}
            <View className="mb-4">
              <Text className="text-white text-sm font-semibold mb-2">
                Nome completo
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3"
                style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
              >
                <TextInput
                  ref={nameInputRef}
                  className="flex-1 text-white"
                  placeholder="Ex: João Silva"
                  placeholderTextColor={theme.COLORS.GRAY_400}
                  value={data.name}
                  onChangeText={(text) => onUpdate({ name: text.trimStart() })}
                  onSubmitEditing={() => emailInputRef.current?.focus()}
                  returnKeyType="next"
                  onFocus={() => handleInputFocus(150)}
                />
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color={theme.COLORS.WHITE}
                />
              </View>
            </View>

            {/* Email */}
            <View className="mb-4">
              <Text className="text-white text-sm font-semibold mb-2">
                E-mail
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3"
                style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
              >
                <TextInput
                  ref={emailInputRef}
                  className="flex-1 text-white"
                  placeholder="Ex: joao@exemplo.com"
                  placeholderTextColor={theme.COLORS.GRAY_400}
                  value={data.email}
                  onChangeText={(text) =>
                    onUpdate({ email: text.toLowerCase().trim() })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onSubmitEditing={() => phoneInputRef.current?.focus()}
                  returnKeyType="next"
                  onFocus={() => handleInputFocus(230)}
                />
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color={theme.COLORS.WHITE}
                />
              </View>
            </View>

            {/* Telefone */}
            <View className="mb-4">
              <Text className="text-white text-sm font-semibold mb-2">
                Telefone
              </Text>
              <View
                className="flex-row items-center rounded-xl px-4 py-3"
                style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
              >
                <Text className="text-white mr-2">+55</Text>
                <TextInput
                  ref={phoneInputRef}
                  className="flex-1 text-white"
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={theme.COLORS.GRAY_400}
                  value={data.phone}
                  onChangeText={(text) =>
                    onUpdate({ phone: formatPhone(text) })
                  }
                  keyboardType="phone-pad"
                  onSubmitEditing={() => cpfCnpjInputRef.current?.focus()}
                  returnKeyType="next"
                  onFocus={() => handleInputFocus(310)}
                />
                <MaterialCommunityIcons
                  name="phone"
                  size={20}
                  color={theme.COLORS.WHITE}
                />
              </View>
            </View>

            {/* CPF ou CNPJ */}
            <View
              className="mb-4"
              onLayout={(event) => {
                // Guardar a posição Y do container para scroll automático
                const layout = event.nativeEvent.layout;
                // @ts-ignore
                cpfCnpjInputPositionRef.current = { y: layout.y };
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-sm font-semibold">
                  CPF ou CNPJ
                </Text>
                <Text className="text-gray-400 text-xs">Opcional</Text>
              </View>

              {/* Toggle CPF/CNPJ */}
              <View className="flex-row mb-3">
                <TouchableOpacity
                  className="flex-1 mr-2 rounded-xl py-3 items-center"
                  style={{
                    backgroundColor:
                      documentType === "cpf"
                        ? theme.COLORS.BRAND_LIGHT
                        : theme.COLORS.SURFACE_SECONDARY,
                  }}
                  onPress={() => handleDocumentTypeChange("cpf")}
                >
                  <Text className="text-white font-semibold">CPF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 ml-2 rounded-xl py-3 items-center"
                  style={{
                    backgroundColor:
                      documentType === "cnpj"
                        ? theme.COLORS.BRAND_LIGHT
                        : theme.COLORS.SURFACE_SECONDARY,
                  }}
                  onPress={() => handleDocumentTypeChange("cnpj")}
                >
                  <Text className="text-white font-semibold">CNPJ</Text>
                </TouchableOpacity>
              </View>

              {/* Input CPF/CNPJ */}
              <View
                ref={cpfCnpjContainerRef}
                className="flex-row items-center rounded-xl px-4 py-3 mb-3"
                style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
                onLayout={(event) => {
                  const layout = event.nativeEvent.layout;
                  if (cpfCnpjInputPositionRef.current) {
                    cpfCnpjInputPositionRef.current.y = layout.y;
                  } else {
                    cpfCnpjInputPositionRef.current = { y: layout.y };
                  }
                }}
              >
                <TextInput
                  ref={cpfCnpjInputRef}
                  className="flex-1 text-white"
                  placeholder={
                    documentType === "cpf"
                      ? "000.000.000-00"
                      : "00.000.000/0000-00"
                  }
                  placeholderTextColor={theme.COLORS.GRAY_400}
                  value={
                    documentType === "cpf" ? data.cpf || "" : data.cnpj || ""
                  }
                  onChangeText={(text) => {
                    const formatted =
                      documentType === "cpf"
                        ? formatCPF(text)
                        : formatCNPJ(text);
                    if (documentType === "cpf") {
                      onUpdate({ cpf: formatted });
                    } else {
                      onUpdate({ cnpj: formatted });
                    }
                  }}
                  keyboardType="numeric"
                  returnKeyType="done"
                  onFocus={() => handleInputFocus(550)}
                />
                <MaterialCommunityIcons
                  name={documentType === "cpf" ? "account" : "office-building"}
                  size={20}
                  color={theme.COLORS.WHITE}
                />
              </View>

              {/* Informação sobre CNPJ */}
              {documentType === "cnpj" && (
                <View className="flex-row items-start mb-4">
                  <MaterialCommunityIcons
                    name="information"
                    size={20}
                    color={theme.COLORS.BRAND_LIGHT}
                    style={{ marginRight: 8, marginTop: 2 }}
                  />
                  <Text className="text-gray-300 text-xs flex-1">
                    Se você for empresa, use CNPJ. Isso ajuda na emissão de
                    recibos e suporte corporativo.
                  </Text>
                </View>
              )}

              {/* Campos adicionais para CNPJ */}
              {documentType === "cnpj" && (
                <>
                  <View className="mb-4">
                    <Text className="text-white text-sm font-semibold mb-2">
                      Nome da empresa
                    </Text>
                    <View
                      className="rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: theme.COLORS.SURFACE_SECONDARY,
                      }}
                    >
                      <TextInput
                        ref={companyNameInputRef}
                        className="text-white"
                        placeholder="Ex: Empresa Ltda"
                        placeholderTextColor={theme.COLORS.GRAY_400}
                        value={data.companyName || ""}
                        onChangeText={(text) => onUpdate({ companyName: text })}
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          companyEmailInputRef.current?.focus()
                        }
                        onFocus={() => handleInputFocus(650)}
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-white text-sm font-semibold mb-2">
                      E-mail da empresa
                    </Text>
                    <View
                      className="rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: theme.COLORS.SURFACE_SECONDARY,
                      }}
                    >
                      <TextInput
                        ref={companyEmailInputRef}
                        className="text-white"
                        placeholder="Ex: contato@empresa.com"
                        placeholderTextColor={theme.COLORS.GRAY_400}
                        value={data.companyEmail || ""}
                        onChangeText={(text) =>
                          onUpdate({ companyEmail: text })
                        }
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={() =>
                          companyPhoneInputRef.current?.focus()
                        }
                        onFocus={() => handleInputFocus(730)}
                      />
                    </View>
                  </View>

                  <View className="mb-4">
                    <Text className="text-white text-sm font-semibold mb-2">
                      Telefone da empresa
                    </Text>
                    <View
                      className="rounded-xl px-4 py-3"
                      style={{
                        backgroundColor: theme.COLORS.SURFACE_SECONDARY,
                      }}
                    >
                      <TextInput
                        ref={companyPhoneInputRef}
                        className="text-white"
                        placeholder="(11) 99999-9999"
                        placeholderTextColor={theme.COLORS.GRAY_400}
                        value={data.companyPhone || ""}
                        onChangeText={(text) =>
                          onUpdate({ companyPhone: formatPhone(text) })
                        }
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        onFocus={() => handleInputFocus(810)}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Privacy Statement */}
          <View className="flex-row items-center mb-6 px-2">
            <Feather name="lock" size={16} color={theme.COLORS.WHITE} />
            <Text className="text-gray-300 text-xs ml-2">
              Seus dados são usados apenas para segurança e suporte.
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            className="h-14 rounded-2xl items-center justify-center flex-row"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
            onPress={handleNext}
          >
            <Text className="text-brand-dark font-bold text-lg mr-2">
              Próximo
            </Text>
            <Feather
              name="arrow-right"
              size={20}
              color={theme.COLORS.BRAND_DARK}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
