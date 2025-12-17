import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import type { RegistrationData } from "../../../types/registration";
import {
  getCurrentLocationAndAddress,
  getAddressFromCoordinates,
} from "../../../utils/location";
import { step2AddressSchema } from "../../../schemas/registration.schema";
import LocationPermissionScreen from "./LocationPermissionScreen";

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
  const [locationLoading, setLocationLoading] = useState(false);
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);
  const mapRef = useRef<MapView>(null);
  const camera = useRef({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const watchSub = useRef<Location.LocationSubscription | null>(null);
  
  // Sempre usar o valor mais recente de data.address
  const address = React.useMemo(() => {
    const addr = data.address || {
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
    console.log("Address atualizado no useMemo:", addr);
    return addr;
  }, [data.address]);

  const handleUpdateAddress = React.useCallback(
    (updates: Partial<typeof address>) => {
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
      
      const newAddress = {
        ...currentAddress,
        ...updates,
      };
      
      console.log("handleUpdateAddress - Updates recebidos:", updates);
      console.log("handleUpdateAddress - Endereço atual:", currentAddress);
      console.log("handleUpdateAddress - Novo endereço:", newAddress);
      
      onUpdate({
        address: newAddress,
      });
    },
    [data.address, onUpdate]
  );

  async function handleAllowLocation() {
    setShowPermissionScreen(false);
    setLocationLoading(true);
    try {
      // Solicitar permissão
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permissão negada",
          text2: "É necessário permitir a localização para continuar",
        });
        setLocationLoading(false);
        setShowPermissionScreen(true); // Voltar para tela de permissão
        return;
      }

      // Obter localização
      await handleGetLocation();
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao solicitar permissão",
        text2: "Tente novamente",
      });
      setLocationLoading(false);
      setShowPermissionScreen(true); // Voltar para tela de permissão
    }
  }

  async function handleGetLocation() {
    setLocationLoading(true);
    try {
      const result = await getCurrentLocationAndAddress();

      if (result) {
        const { address: detectedAddress, location } = result;

        console.log("Endereço detectado:", detectedAddress);
        console.log("Localização:", location);

        // Atualizar todos os campos do endereço
        const addressUpdate = {
          street: detectedAddress.street || "",
          number: detectedAddress.number || "",
          city: detectedAddress.city || "",
          state: detectedAddress.state || "",
          zipCode: detectedAddress.zipCode || "",
          neighborhood: detectedAddress.neighborhood || "",
          latitude: location.latitude,
          longitude: location.longitude,
        };

        console.log("Atualizando endereço com:", addressUpdate);
        handleUpdateAddress(addressUpdate);

        // iniciar acompanhamento contínuo para maior precisão
        await startWatchingLocation();

        Toast.show({
          type: "success",
          text1: "Localização detectada",
          text2: `Endereço encontrado em ${
            detectedAddress.city || "sua cidade"
          }`,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao obter localização",
          text2: "Não foi possível detectar seu endereço automaticamente",
        });
      }
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao obter localização",
        text2: "Verifique se a localização está ativada",
      });
    } finally {
      setLocationLoading(false);
    }
  }

  function handleSkipLocation() {
    setShowPermissionScreen(false);
    // Permite que o usuário continue sem localização
    // Ele pode preencher manualmente ou usar o mapa
  }

  // Verificar permissão de localização ao montar e buscar automaticamente se já tiver permissão
  useEffect(() => {
    let isMounted = true;

    async function checkPermissionAndGetLocation() {
      // Se já tem endereço completo, não precisa buscar novamente
      if (address.latitude && address.longitude && address.city) {
        if (isMounted) {
          setHasCheckedPermission(true);
        }
        return;
      }

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          if (status === "granted") {
            // Já tem permissão, buscar localização automaticamente
            setShowPermissionScreen(false);
            setHasCheckedPermission(true);
            await handleGetLocation();
          } else {
            // Não tem permissão, mostrar tela de permissão
            setShowPermissionScreen(true);
            setHasCheckedPermission(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        if (isMounted) {
          setShowPermissionScreen(true);
          setHasCheckedPermission(true);
        }
      }
    }

    checkPermissionAndGetLocation();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startWatchingLocation() {
    // cancelar assinatura anterior se existir
    if (watchSub.current) {
      watchSub.current.remove();
      watchSub.current = null;
    }
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== "granted") return;
    watchSub.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 5,
      },
      async (loc) => {
        const { latitude, longitude } = loc.coords;
        handleUpdateAddress({ latitude, longitude });
      }
    );
  }

  useEffect(() => {
    return () => {
      if (watchSub.current) watchSub.current.remove();
    };
  }, []);

  useEffect(() => {
    if (address.latitude && address.longitude && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: address.latitude,
          longitude: address.longitude,
          latitudeDelta: 0.0005,
          longitudeDelta: 0.0005,
        },
        350
      );
    }
  }, [address.latitude, address.longitude]);

  async function fetchAddressForCoordinates(
    latitude: number,
    longitude: number
  ) {
    try {
      const result = await getAddressFromCoordinates({ latitude, longitude });

      if (result) {
        console.log("Endereço obtido das coordenadas:", result);
        
        const addressUpdate = {
          street: result.street || "",
          number: result.number || "",
          city: result.city || "",
          state: result.state || "",
          zipCode: result.zipCode || "",
          neighborhood: result.neighborhood || "",
          latitude,
          longitude,
        };

        console.log("Atualizando endereço com:", addressUpdate);
        handleUpdateAddress(addressUpdate);
      }
    } catch (error) {
      console.error("Erro ao buscar endereço:", error);
    }
  }

  function getInitialRegion() {
    return {
      latitude: address.latitude ?? camera.current.latitude,
      longitude: address.longitude ?? camera.current.longitude,
      latitudeDelta: camera.current.latitudeDelta,
      longitudeDelta: camera.current.longitudeDelta,
    };
  }

  function handleNext() {
    if (!address.latitude || !address.longitude) {
      Toast.show({
        type: "error",
        text1: "Localização obrigatória",
        text2: "Por favor, ative a localização ou selecione no mapa",
      });
      return;
    }

    try {
      step2AddressSchema.parse({ address });
      onNext();
    } catch (error: any) {
      if (error.errors && error.errors.length > 0) {
        const firstError = error.errors[0];
        Toast.show({
          type: "error",
          text1: "Verifique os campos",
          text2: firstError.message,
        });
      }
    }
  }

  // Mostrar tela de permissão se necessário
  if (showPermissionScreen && hasCheckedPermission) {
    return (
      <LocationPermissionScreen
        onAllow={handleAllowLocation}
        onSkip={handleSkipLocation}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={onBack}>
          <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-brand-light rounded-full items-center justify-center mr-2">
            <MaterialCommunityIcons
              name="truck-delivery"
              size={18}
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
          <Text className="text-white text-2xl font-bold mb-2">
            Completar cadastro
          </Text>
          <Text className="text-gray-400 text-sm mb-6">
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
                  <Text className="text-white font-bold">2</Text>
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
                className="text-brand-light text-xs font-semibold"
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

          {/* Endereço Favorito Section */}
          <View className="bg-surface-primary rounded-3xl p-5 mb-6">
            <View className="flex-row items-center mb-4">
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={theme.COLORS.BRAND_LIGHT}
              />
              <Text className="text-white font-bold text-lg ml-2">
                Endereço favorito
              </Text>
            </View>

            {/* Status da Localização */}
            {address.latitude && address.longitude && (
              <View className="bg-surface-secondary border border-brand-light/30 rounded-xl p-4 mb-4 flex-row items-center">
                <View className="w-10 h-10 bg-brand-light/20 rounded-full items-center justify-center mr-3">
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={theme.COLORS.BRAND_LIGHT}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">
                    Localização detectada
                  </Text>
                  <Text className="text-brand-light text-xs">
                    {address.city || "Endereço encontrado"}
                  </Text>
                </View>
                <View className="bg-brand-light/20 px-3 py-1 rounded-full">
                  <Text className="text-brand-light text-xs font-bold">
                    Ativa
                  </Text>
                </View>
              </View>
            )}

            {/* Map Preview */}
            <View className="h-64 rounded-xl overflow-hidden mb-6 border border-gray-700 relative bg-surface-secondary">
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={PROVIDER_DEFAULT}
                initialRegion={getInitialRegion()}
                onPress={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  fetchAddressForCoordinates(latitude, longitude);
                }}
              >
                {address.latitude && address.longitude && (
                  <Marker
                    coordinate={{
                      latitude: address.latitude,
                      longitude: address.longitude,
                    }}
                    draggable
                    onDragEnd={(e) => {
                      const { latitude, longitude } = e.nativeEvent.coordinate;
                      fetchAddressForCoordinates(latitude, longitude);
                    }}
                  />
                )}
              </MapView>
            </View>

            {/* Inputs */}
            <View className="gap-y-4">
              <View>
                <Text className="text-gray-400 text-xs mb-2">
                  Buscar endereço
                </Text>
                <View className="flex-row items-center bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12">
                  <Feather
                    name="search"
                    size={18}
                    color={theme.COLORS.GRAY_400}
                  />
                  <TextInput
                    key={`street-${address.street || ""}`}
                    className="flex-1 text-white ml-3 text-sm"
                    placeholder="Rua, Avenida, CEP..."
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.street || ""}
                    onChangeText={(text) =>
                      handleUpdateAddress({ street: text })
                    }
                  />
                </View>
              </View>

              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-2">Número</Text>
                  <TextInput
                    key={`number-${address.number || ""}`}
                    className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                    placeholder="123"
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.number || ""}
                    onChangeText={(text) =>
                      handleUpdateAddress({ number: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-2">
                    Complemento
                  </Text>
                  <TextInput
                    key={`complement-${address.complement || ""}`}
                    className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                    placeholder="Apto 101"
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.complement || ""}
                    onChangeText={(text) =>
                      handleUpdateAddress({ complement: text })
                    }
                  />
                </View>
              </View>

              <View>
                <Text className="text-gray-400 text-xs mb-2">
                  Ponto de referência{" "}
                  <Text className="text-gray-600">(opcional)</Text>
                </Text>
                <TextInput
                  key={`reference-${address.referencePoint || ""}`}
                  className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                  placeholder="Próximo ao mercado..."
                  placeholderTextColor={theme.COLORS.GRAY_500}
                  value={address.referencePoint || ""}
                  onChangeText={(text) =>
                    handleUpdateAddress({ referencePoint: text })
                  }
                />
              </View>

              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-2">Bairro</Text>
                  <TextInput
                    key={`neighborhood-${address.neighborhood || ""}`}
                    className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                    placeholder="Bairro"
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.neighborhood || ""}
                    onChangeText={(text) =>
                      handleUpdateAddress({ neighborhood: text })
                    }
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-2">CEP</Text>
                  <TextInput
                    key={`zipCode-${address.zipCode || ""}`}
                    className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                    placeholder="00000-000"
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.zipCode || ""}
                    onChangeText={(text) =>
                      handleUpdateAddress({ zipCode: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-2">Cidade</Text>
                  <TextInput
                    key={`city-${address.city || ""}`}
                    className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                    placeholder="Cidade"
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.city || ""}
                    onChangeText={(text) => handleUpdateAddress({ city: text })}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-xs mb-2">Estado</Text>
                  <TextInput
                    key={`state-${address.state || ""}`}
                    className="bg-surface-secondary border border-gray-700 rounded-xl px-4 h-12 text-white text-sm"
                    placeholder="UF"
                    placeholderTextColor={theme.COLORS.GRAY_500}
                    value={address.state || ""}
                    onChangeText={(text) =>
                      handleUpdateAddress({ state: text.toUpperCase() })
                    }
                    maxLength={2}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="flex-row px-6 py-4 bg-brand-dark border-t border-gray-800">
        <TouchableOpacity
          className="flex-1 mr-3 h-12 rounded-xl items-center justify-center border border-gray-600"
          onPress={onBack}
        >
          <Text className="text-white font-bold">Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 ml-3 h-12 bg-brand-light rounded-xl items-center justify-center flex-row"
          onPress={handleNext}
        >
          <Text className="text-brand-dark font-bold mr-2">Próximo</Text>
          <Feather
            name="arrow-right"
            size={18}
            color={theme.COLORS.BRAND_DARK}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
