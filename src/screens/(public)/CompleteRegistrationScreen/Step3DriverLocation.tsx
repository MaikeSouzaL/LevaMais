import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import theme from "../../../theme";
import type { RegistrationData } from "../../../types/registration";
import { registerUser } from "../../../services/auth.service";
import { useAuthStore } from "../../../context/authStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getCurrentLocation,
  obterEnderecoPorCoordenadas,
} from "../../../utils/location";

function toUf(value?: string | null) {
  if (!value) return "";
  const s = String(value).trim();
  if (s.length === 2) return s.toUpperCase();
  return s.substring(0, 2).toUpperCase();
}

type Step3DriverLocationProps = {
  data: RegistrationData;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onBack: () => void;
};

export default function Step3DriverLocation({
  data,
  onUpdate,
  onBack,
}: Step3DriverLocationProps) {
  const navigation = useNavigation<any>();
  const { login } = useAuthStore();

  const [selectedState, setSelectedState] = useState<string | null>(
    data.driverLocation?.state || null,
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(
    data.driverLocation?.city || data.city || null,
  );
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "ok" | "denied" | "error"
  >("idle");
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function autofillFromGps() {
    setGpsStatus("loading");
    setGpsMessage("Obtendo sua localizacao...");

    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setGpsStatus("denied");
        setGpsMessage(
          "Sem permissao de localizacao. Voce pode preencher manualmente.",
        );
        return;
      }

      setGpsMessage("Identificando sua cidade...");
      const endereco = await obterEnderecoPorCoordenadas(
        coords.latitude,
        coords.longitude,
      );

      const city = (
        endereco?.city ||
        endereco?.subregion ||
        endereco?.district ||
        ""
      ).trim();
      const uf = toUf(endereco?.region);

      if (!uf || !city) {
        setGpsStatus("error");
        setGpsMessage(
          `Nao foi possivel identificar automaticamente. UF=${uf || "?"} Cidade=${city || "?"}.`,
        );
        return;
      }

      setSelectedState(uf);
      setSelectedCity(city);
      commit({ state: uf, city });

      setGpsStatus("ok");
      setGpsMessage("Localizacao preenchida automaticamente.");
    } catch (e: any) {
      setGpsStatus("error");
      setGpsMessage(e?.message || "Falha ao obter localizacao.");
    }
  }

  useEffect(() => {
    autofillFromGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedUf = String(selectedState || "").trim().toUpperCase();
  const normalizedCity = String(selectedCity || "").trim();
  const hasLocationSelection =
    /^[A-Z]{2}$/.test(normalizedUf) && normalizedCity.length >= 2;

  function commit(
    updates: Partial<NonNullable<RegistrationData["driverLocation"]>>,
  ) {
    onUpdate({
      driverLocation: {
        state: selectedState || undefined,
        city: selectedCity || undefined,
        ...data.driverLocation,
        ...updates,
      },
      city: updates.city ?? selectedCity ?? data.city,
    });
  }

  async function handleFinishDriver() {
    if (!hasLocationSelection) {
      Toast.show({
        type: "error",
        text1: "Localizacao incompleta",
        text2: "Informe UF valida (2 letras) e cidade com pelo menos 2 caracteres",
      });
      return;
    }

    setLoading(true);
    try {
      commit({
        state: normalizedUf,
        city: normalizedCity,
      });

      const registrationPayload: any = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        userType: "driver",
        acceptedTerms: data.acceptedTerms,

        documentType: data.documentType,
        cpf: data.cpf,
        cnpj: data.cnpj,
        companyName: data.companyName,
        companyEmail: data.companyEmail,
        companyPhone: data.companyPhone,

        city: normalizedCity,

        vehicleType: data.vehicleType,
        vehicleInfo: data.vehicleInfo,

        preferredPayment: data.preferredPayment,
        notificationsEnabled: data.notificationsEnabled,

        googleId: data.googleId,
        profilePhoto: data.profilePhoto,

        driverLocation: {
          state: normalizedUf,
          city: normalizedCity,
        },
      };

      const response = await registerUser(registrationPayload);

      if (!response.success || !response.data) {
        Toast.show({
          type: "error",
          text1: "Erro ao cadastrar",
          text2: response.message || "Tente novamente",
        });
        return;
      }

      const { user, token } = response.data;
      if (token) await AsyncStorage.setItem("@auth_token", token);

      login(
        user.userType as any,
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

      navigation.navigate("NotificationPermission", {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          userType: user.userType,
          cidade: user.city || "",
        },
        token,
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro inesperado",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="flex-1 px-5 pt-3">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={onBack} className="p-2 -ml-2">
            <Feather name="arrow-left" size={22} color="#EAF4F0" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-brand-green items-center justify-center mr-2">
              <MaterialCommunityIcons
                name="truck-delivery"
                size={20}
                color="#0F231C"
              />
            </View>
            <Text className="text-white text-lg font-semibold">Leva+</Text>
          </View>
          <View className="w-10" />
        </View>

        <Text className="text-white text-2xl font-bold mb-2">
          Sua area de atuacao
        </Text>
        <Text className="text-white/70 mb-6">
          Vamos pegar sua cidade automaticamente pelo GPS.
        </Text>

        <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-5">
          <Text className="text-white/80 font-semibold mb-1">GPS</Text>
          <Text className="text-white">
            {gpsMessage ||
              (gpsStatus === "loading"
                ? "Obtendo localizacao..."
                : "Pronto para obter localizacao")}
          </Text>

          {gpsStatus !== "loading" ? (
            <TouchableOpacity
              onPress={autofillFromGps}
              className="mt-3 self-start px-4 py-2 rounded-xl bg-white/10"
            >
              <Text className="text-white font-semibold">Usar GPS</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-5">
          <Text className="text-white/80 font-semibold mb-1">Resumo</Text>
          {hasLocationSelection ? (
            <Text className="text-white">
              {selectedState} - {selectedCity}
            </Text>
          ) : (
            <Text className="text-white/60">
              Aguardando o GPS preencher sua cidade...
            </Text>
          )}
          <Text className="text-white/50 text-xs mt-1">
            Se estiver errado, toque em "Usar GPS" novamente ou ajuste manualmente.
          </Text>
        </View>

        <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-8">
          <Text className="text-white/80 font-semibold mb-1">
            Ajuste manual (se necessario)
          </Text>
          <Text className="text-white/60 text-xs mb-3">
            Se o GPS falhar, preencha sua UF e cidade para continuar.
          </Text>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Text className="text-white/70 text-xs mb-1">UF</Text>
              <TextInput
                value={selectedState || ""}
                onChangeText={(text) => {
                  const uf = toUf(text);
                  setSelectedState(uf);
                  commit({ state: uf });
                }}
                maxLength={2}
                autoCapitalize="characters"
                placeholder="SP"
                placeholderTextColor="rgba(255,255,255,0.35)"
                className="rounded-xl px-3 py-3 text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
            </View>
            <View className="flex-[2]">
              <Text className="text-white/70 text-xs mb-1">Cidade</Text>
              <TextInput
                value={selectedCity || ""}
                onChangeText={(text) => {
                  const city = text.trimStart();
                  setSelectedCity(city);
                  commit({ city });
                }}
                autoCapitalize="words"
                placeholder="Sao Paulo"
                placeholderTextColor="rgba(255,255,255,0.35)"
                className="rounded-xl px-3 py-3 text-white"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
            </View>
          </View>
        </View>

        <View className="pb-5">
          <TouchableOpacity
            disabled={loading || !hasLocationSelection}
            onPress={handleFinishDriver}
            className={`h-14 rounded-2xl items-center justify-center shadow-lg ${
              loading || !hasLocationSelection
                ? "bg-gray-700"
                : "bg-brand-light shadow-brand-light/20"
            }`}
          >
            <Text
              className={`font-bold text-lg ${
                loading || !hasLocationSelection ? "text-gray-400" : "text-brand-dark"
              }`}
            >
              {loading
                ? "Finalizando..."
                : hasLocationSelection
                  ? "Finalizar cadastro"
                  : "Informe sua localizacao"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
