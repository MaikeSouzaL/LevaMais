import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import type { RegistrationData } from "../../../types/registration";
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

interface Step2AddressProps {
  data: RegistrationData;
  onUpdate: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2Address({
  data,
  onUpdate,
  onNext,
  onBack,
}: Step2AddressProps) {
  const [selectedState, setSelectedState] = useState<string | null>(
    data.address?.state || null,
  );
  const [selectedCity, setSelectedCity] = useState<string | null>(
    data.address?.city || data.city || null,
  );
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "loading" | "ok" | "denied" | "error"
  >("idle");
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  // Debug: log do estado inicial ao entrar na tela
  useEffect(() => {
    console.log("[ClientAddress][Enter] initial:", {
      city: data.city,
      address: data.address,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      console.log("[ClientAddress][GPS] reverseGeocode:", {
        city: endereco?.city,
        region: endereco?.region,
        subregion: endereco?.subregion,
        district: endereco?.district,
        street: endereco?.street,
        name: endereco?.name,
        isoCountryCode: endereco?.isoCountryCode,
      });

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
          `Não foi possível identificar automaticamente. UF=${uf || "?"} Cidade=${city || "?"}.`,
        );
        return;
      }

      setSelectedState(uf);
      setSelectedCity(city);

      commit({
        state: uf,
        city,
        latitude: coords.latitude,
        longitude: coords.longitude,
        street: endereco?.street || "",
        neighborhood: endereco?.district || "",
      });

      setGpsStatus("ok");
      setGpsMessage("Localização preenchida automaticamente.");
    } catch (e: any) {
      setGpsStatus("error");
      setGpsMessage(e?.message || "Falha ao obter localização.");
    }
  }

  useEffect(() => {
    // Auto-preencher no primeiro carregamento
    autofillFromGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedUf = String(selectedState || "").trim().toUpperCase();
  const normalizedCity = String(selectedCity || "").trim();
  const hasLocationSelection =
    /^[A-Z]{2}$/.test(normalizedUf) && normalizedCity.length >= 2;

  function commit(updates: Partial<NonNullable<RegistrationData["address"]>>) {
    const currentAddress = data.address || {
      street: "",
      number: "",
      complement: "",
      city: "",
      state: "",
      zipCode: "",
      neighborhood: "",
      referencePoint: "",
      latitude: undefined,
      longitude: undefined,
    };

    onUpdate({
      address: {
        ...currentAddress,
        state: selectedState || "",
        city: selectedCity || "",
        ...updates,
      },
      // mantém city (campo legado usado no backend) sincronizado
      city: updates.city ?? selectedCity ?? data.city,
    });
  }

  function handleNext() {
    if (!hasLocationSelection) {
      Toast.show({
        type: "error",
        text1: "Localização incompleta",
        text2: "Informe UF valida (2 letras) e cidade com pelo menos 2 caracteres",
      });
      return;
    }

    // Atualiza antes de ir para o próximo step
    commit({
      state: normalizedUf,
      city: normalizedCity,
    });

    onNext();
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1">
          {/* Header fixo */}
          <View className="px-5 pt-3">
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
              Seu endereço
            </Text>
            <Text className="text-white/70 mb-6">
              Vamos pegar sua localização automaticamente pelo GPS.
            </Text>
          </View>

          {/* Conteúdo com scroll */}
          <ScrollView
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
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

            <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-4 mb-5">
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

            {/* Resumo */}
            <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-8">
              <Text className="text-white/80 font-semibold mb-1">Resumo</Text>
              {hasLocationSelection ? (
                <Text className="text-white">
                  {selectedState} • {selectedCity}
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
          </ScrollView>

          {/* Botão fixo no rodapé */}
          <View className="px-5 pb-5">
            <TouchableOpacity
              disabled={!hasLocationSelection}
              onPress={handleNext}
              className={`h-14 rounded-2xl items-center justify-center shadow-lg ${
                !hasLocationSelection
                  ? "bg-gray-700"
                  : "bg-brand-light shadow-brand-light/20"
              }`}
            >
              <Text
                className={`font-bold text-lg ${
                  !hasLocationSelection ? "text-gray-400" : "text-brand-dark"
                }`}
              >
                {hasLocationSelection ? "Próximo" : "Informe sua localizacao"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
