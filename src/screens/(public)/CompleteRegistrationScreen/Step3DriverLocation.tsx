import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
  // Se por algum motivo vier "RO" já, mantém.
  const s = String(value).trim();
  if (s.length === 2) return s.toUpperCase();
  // Alguns provedores retornam "Rondônia" em `region`, então pegamos as 2 primeiras letras.
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

  const stateLabel = useMemo(() => {
    // Sem lista/seleção manual: exibimos apenas a UF (quando existir).
    return selectedState || "";
  }, [selectedState]);

  async function autofillFromGps() {
    setGpsStatus("loading");
    setGpsMessage("Obtendo sua localização...");

    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        setGpsStatus("denied");
        setGpsMessage(
          "Sem permissão de localização. Você pode preencher manualmente.",
        );
        return;
      }

      setGpsMessage("Identificando sua cidade...");
      const endereco = await obterEnderecoPorCoordenadas(
        coords.latitude,
        coords.longitude,
      );

      // Debug seguro (sem vazar coords): ajuda a entender quando o provider retorna campos diferentes
      console.log("[DriverLocation][GPS] reverseGeocode:", {
        city: endereco?.city,
        region: endereco?.region,
        subregion: endereco?.subregion,
        district: endereco?.district,
        isoCountryCode: endereco?.isoCountryCode,
      });

      // Algumas variações comuns:
      // - Android: city ok, region = "Rondônia"
      // - iOS: city ok, region = "Rondônia"
      // - Alguns casos: city vem vazio; aí a gente tenta subregion/district
      const city = (
        endereco?.city ||
        endereco?.subregion ||
        endereco?.district ||
        ""
      ).trim();
      const uf = toUf(endereco?.region);

      // Aqui a regra é simples: se não vier cidade ou UF, não dá para exibir o resumo.
      if (!uf || !city) {
        setGpsStatus("error");
        setGpsMessage(
          `Não foi possível identificar automaticamente. UF=${uf || "?"} Cidade=${city || "?"}.`,
        );
        return;
      }

      setSelectedState(uf);
      setSelectedCity(city);

      commit({ state: uf, city });

      setGpsStatus("ok");
      setGpsMessage("Localização preenchida automaticamente.");
    } catch (e: any) {
      setGpsStatus("error");
      setGpsMessage(e?.message || "Falha ao obter localização.");
    }
  }

  useEffect(() => {
    // Auto-preencher no primeiro carregamento. Sem mapa.
    autofillFromGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gpsFilled = gpsStatus === "ok" && !!selectedState && !!selectedCity;

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
    if (!selectedState || !selectedCity) {
      Toast.show({
        type: "error",
        text1: "Localização incompleta",
        text2: "Aguarde o GPS preencher sua cidade ou tente novamente",
      });
      return;
    }

    setLoading(true);
    try {
      // Atualiza os dados no estado pai
      commit({
        state: selectedState,
        city: selectedCity,
      });

      // Payload final (driver) — sem mapa/coords
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

        // Campo legado usado no backend
        city: selectedCity,

        // Driver
        vehicleType: data.vehicleType,
        vehicleInfo: data.vehicleInfo,

        preferredPayment: data.preferredPayment,
        notificationsEnabled: data.notificationsEnabled,

        googleId: data.googleId,
        profilePhoto: data.profilePhoto,

        // Extra (não quebra se backend ignorar)
        driverLocation: {
          state: selectedState,
          city: selectedCity,
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

      // Mantém o fluxo já existente (permissão de notificações)
      // Importante: não navegar daqui porque esse Step não tem access ao navigation.
      // A tela seguinte do app (NotificationPermission) já é aberta em outros fluxos.
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
          Sua área de atuação
        </Text>
        <Text className="text-white/70 mb-6">
          Vamos pegar sua cidade automaticamente pelo GPS.
        </Text>

        {/* Status do GPS */}
        <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-5">
          <Text className="text-white/80 font-semibold mb-1">GPS</Text>
          <Text className="text-white">
            {gpsMessage ||
              (gpsStatus === "loading"
                ? "Obtendo localização..."
                : "Pronto para obter localização")}
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

        {/* Resumo */}
        <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-8">
          <Text className="text-white/80 font-semibold mb-1">Resumo</Text>
          {gpsFilled ? (
            <Text className="text-white">
              {selectedState} • {selectedCity}
            </Text>
          ) : (
            <Text className="text-white/60">
              Aguardando o GPS preencher sua cidade...
            </Text>
          )}
          <Text className="text-white/50 text-xs mt-1">
            Se estiver errado, toque em "Usar GPS" novamente.
          </Text>
        </View>

        <View className="pb-5">
          <TouchableOpacity
            disabled={loading || !gpsFilled}
            onPress={handleFinishDriver}
            className={`h-14 rounded-2xl items-center justify-center shadow-lg ${
              loading || !gpsFilled
                ? "bg-gray-700"
                : "bg-brand-light shadow-brand-light/20"
            }`}
          >
            <Text
              className={`font-bold text-lg ${
                loading || !gpsFilled ? "text-gray-400" : "text-brand-dark"
              }`}
            >
              {loading
                ? "Finalizando..."
                : gpsFilled
                  ? "Finalizar cadastro"
                  : "Aguardando GPS..."}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
