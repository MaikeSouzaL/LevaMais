import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

import AddressAutocomplete from "../../../../components/AddressAutocomplete";
import FavoriteFormModal from "../../../../components/FavoriteFormModal";
import { Modal } from "../../../../components/Modal";
import favoriteAddressService from "../../../../services/favoriteAddress.service";
import { type PlaceAutocompleteResult } from "../../../../services/googlePlaces.service";
import {
  obterEnderecoPorCoordenadas,
  getCurrentLocation,
  formatarEndereco,
} from "../../../../utils/location";
import { useRideDraftStore } from "../../../../context/rideDraftStore";

export default function AddressPickerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = useRef<MapView>(null);

  const { returnScreen, selectionMode, initialLocation } =
    (route.params as any) || {};
  const isPickupMode = selectionMode === "currentLocation";

  const pickupDraft = useRideDraftStore((s) => s.pickup);
  const dropoffDraft = useRideDraftStore((s) => s.dropoff);
  const setPickup = useRideDraftStore((s) => s.setPickup);
  const setDropoff = useRideDraftStore((s) => s.setDropoff);

  // Estilo do mapa (dark)
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#0f231c" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9db9b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b1814" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9db9b9" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9db9b9" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#0b1f19" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b8f8f" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#132b23" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9db9b9" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#1a3b31" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b8f8f" }],
    },
  ];

  const [address, setAddress] = useState("Buscando endereço...");
  const [searchQuery, setSearchQuery] = useState("");
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [suppressNextReverseGeocode, setSuppressNextReverseGeocode] =
    useState(false);

  const [userCity, setUserCity] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string>("");

  const [referencePoint, setReferencePoint] = useState("");

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  const [lastSelectedPlace, setLastSelectedPlace] = useState<any>(null);

  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isReferenceFocused, setIsReferenceFocused] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info" | "warning";
    onClose?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates?.height || 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    // Se a tela foi aberta para salvar favorito de um endereço já escolhido,
    // podemos inicializar o mapa nessa coordenada.
    if (initialLocation?.latitude && initialLocation?.longitude) {
      const newRegion = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);

      if (initialLocation.formattedAddress) {
        setAddress(initialLocation.formattedAddress);
        setSearchQuery(initialLocation.formattedAddress);
        setLastSelectedPlace({
          formattedAddress: initialLocation.formattedAddress,
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
        });
        setSuppressNextReverseGeocode(true);
      }

      // move o mapa sem disparar update agressivo
      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 0);
      }, 0);

      return;
    }

    const detectUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          const newRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);

          const endereco = await obterEnderecoPorCoordenadas(
            location.latitude,
            location.longitude,
          );

          const cidadeDetectada =
            endereco?.city || endereco?.subregion || endereco?.district;
          if (cidadeDetectada) setUserCity(cidadeDetectada);
          if (endereco?.region) setUserRegion(endereco.region);

          setAddress(formatarEndereco(endereco));
        }
      } catch (error) {
        console.error("Erro ao detectar localização:", error);
      }
    };

    detectUserLocation();

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleRegionChangeComplete = async (newRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    if (suppressNextReverseGeocode) {
      setSuppressNextReverseGeocode(false);
      return;
    }

    // Se o usuário selecionou um endereço pelo autocomplete, o mapa pode disparar
    // pequenos ajustes de região que acabam fazendo reverse-geocode e trocando o número.
    // Aqui nós evitamos sobrescrever o endereço enquanto o centro do mapa estiver
    // "em cima" do ponto selecionado.
    if (
      lastSelectedPlace?.latitude != null &&
      lastSelectedPlace?.longitude != null
    ) {
      const dLat = Math.abs(newRegion.latitude - lastSelectedPlace.latitude);
      const dLng = Math.abs(newRegion.longitude - lastSelectedPlace.longitude);

      // ~0.00015 ≈ 15-20m (suficiente pra ignorar jitter do mapa)
      const isSameSpot = dLat < 0.00015 && dLng < 0.00015;
      if (isSameSpot) {
        return;
      }

      // Se saiu do ponto selecionado, aí sim consideramos que o usuário moveu o mapa
      // e passamos a usar reverse-geocode.
      setLastSelectedPlace(null);
    }

    setIsGeocodingLoading(true);
    setAddress("Localizando...");
    try {
      const endereco = await obterEnderecoPorCoordenadas(
        newRegion.latitude,
        newRegion.longitude,
      );

      const formatted = formatarEndereco(endereco);
      setAddress(formatted || "Endereço não encontrado");
    } catch (error) {
      console.error("Erro no geocoding:", error);
      setAddress("Erro ao buscar endereço");
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const handleSelectResult = async (details: any, raw: PlaceAutocompleteResult) => {
    setAddress(details.formattedAddress);
    setLastSelectedPlace({ ...details, placeId: raw.placeId });
    setSuppressNextReverseGeocode(true);

    const newRegion = {
      latitude: details.latitude,
      longitude: details.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleConfirm = () => {
    const latitude = region?.latitude;
    const longitude = region?.longitude;
    if (latitude == null || longitude == null) {
      return;
    }

    const payload = lastSelectedPlace
      ? {
          formattedAddress: lastSelectedPlace.formattedAddress,
          latitude: lastSelectedPlace.latitude,
          longitude: lastSelectedPlace.longitude,
          placeId: lastSelectedPlace.placeId,
          street: lastSelectedPlace.street,
          streetNumber: lastSelectedPlace.streetNumber,
          neighborhood: lastSelectedPlace.neighborhood,
          city: lastSelectedPlace.city,
          state: lastSelectedPlace.state,
          stateCode: lastSelectedPlace.stateCode,
          postalCode: lastSelectedPlace.postalCode,
          country: lastSelectedPlace.country,
          referencePoint: referencePoint.trim() || undefined,
        }
      : {
          formattedAddress: address,
          latitude,
          longitude,
          referencePoint: referencePoint.trim() || undefined,
        };

    const isPickup = selectionMode === "currentLocation";

    if (isPickup) setPickup(payload);
    else setDropoff(payload);

    // Fluxo desejado:
    // - Home -> AddressPicker(dropoff) -> Confirmar -> SelectVehicle
    // - Editar local atual -> AddressPicker(pickup) -> Confirmar -> Home (ou SelectVehicle se dropoff já existir)
    if (!isPickup) {
      const pickup = pickupDraft;
      (navigation as any).navigate("SelectVehicle", {
        pickup,
        dropoff: payload,
      });
      return;
    }

    // pickup confirmado
    if (dropoffDraft) {
      (navigation as any).navigate("SelectVehicle", {
        pickup: payload,
        dropoff: dropoffDraft,
      });
      return;
    }

    (navigation as any).navigate("Home", { reopenBottomSheet: true });
  };

  const handleBack = () => {
    if ((navigation as any).canGoBack?.()) return (navigation as any).goBack();
    (navigation as any).navigate("Home");
  };

  const handleSaveFavorite = async (data: { name: string; icon: string }) => {
    const latitude = region?.latitude;
    const longitude = region?.longitude;
    if (latitude == null || longitude == null) {
      setModalConfig({
        visible: true,
        type: "error",
        title: "Erro",
        message: "Localização inválida. Tente novamente.",
      });
      return;
    }

    const payload = lastSelectedPlace
      ? {
          formattedAddress: lastSelectedPlace.formattedAddress,
          street: lastSelectedPlace.street,
          streetNumber: lastSelectedPlace.streetNumber,
          address: lastSelectedPlace.formattedAddress,
          neighborhood: lastSelectedPlace.neighborhood,
          city: lastSelectedPlace.city,
          state: lastSelectedPlace.stateCode || lastSelectedPlace.state,
          region: lastSelectedPlace.state,
          postalCode: lastSelectedPlace.postalCode,
          latitude: lastSelectedPlace.latitude,
          longitude: lastSelectedPlace.longitude,
        }
      : {
          formattedAddress: address,
          address,
          latitude,
          longitude,
        };

    // validações (pra evitar 400 por payload incompleto)
    const nameTrim = data.name.trim();
    const addrText = (payload.formattedAddress || payload.address || "").trim();

    if (!nameTrim) {
      setModalConfig({
        visible: true,
        type: "warning",
        title: "Atenção",
        message: "Por favor, digite um nome para o favorito.",
      });
      return;
    }

    if (
      !addrText ||
      addrText === "Buscando endereço..." ||
      addrText === "Localizando..." ||
      addrText === "Endereço não encontrado" ||
      addrText === "Erro ao buscar endereço"
    ) {
      setModalConfig({
        visible: true,
        type: "warning",
        title: "Atenção",
        message: "Selecione um endereço válido antes de salvar como favorito.",
      });
      return;
    }

    const baseCreatePayload = {
      icon: data.icon,
      formattedAddress: payload.formattedAddress,
      street: payload.street,
      streetNumber: payload.streetNumber,
      address: payload.address,
      neighborhood: payload.neighborhood,
      city: payload.city,
      state: payload.state,
      region: payload.region,
      postalCode: payload.postalCode,
      latitude: payload.latitude,
      longitude: payload.longitude,
    };

    const isDuplicateNameError = (err: any) => {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      return (
        typeof msg === "string" &&
        (msg.includes("já possui um favorito com o nome") ||
          msg.includes("favorito com o nome"))
      );
    };

    const buildUniqueName = (base: string, attempt: number) => {
      // 1 => "Casa (2)", 2 => "Casa (3)" ...
      const n = attempt + 1;
      return `${base} (${n})`;
    };

    try {
      // Backend não aceita nomes duplicados. Para "deixar cadastrar mesmo se for o mesmo nome",
      // a gente tenta salvar com sufixo automaticamente.
      let finalName = nameTrim;
      let attempts = 0;

      // tenta o nome original primeiro
      while (attempts < 10) {
        try {
          await favoriteAddressService.create({
            name: finalName,
            ...baseCreatePayload,
          });
          break;
        } catch (err: any) {
          if (err?.response?.status === 400 && isDuplicateNameError(err)) {
            attempts += 1;
            finalName = buildUniqueName(nameTrim, attempts);
            continue;
          }
          throw err;
        }
      }

      if (attempts >= 10) {
        throw new Error(
          "Não foi possível salvar: muitos favoritos com o mesmo nome. Tente outro nome."
        );
      }

      setModalConfig({
        visible: true,
        type: "success",
        title: "Sucesso",
        message:
          finalName === nameTrim
            ? "Favorito salvo com sucesso!"
            : `Favorito salvo como "${finalName}" (nome repetido).`,
      });
    } catch (error: any) {
      const dataResp = error?.response?.data;
      const message =
        dataResp?.error ||
        dataResp?.message ||
        (typeof dataResp === "string" ? dataResp : null) ||
        error?.message ||
        "Erro ao salvar favorito";

      setModalConfig({
        visible: true,
        type: "error",
        title: "Erro",
        message,
      });
      throw error;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <Modal
        visible={modalConfig.visible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          if (modalConfig.onClose) return modalConfig.onClose();
          setModalConfig((p) => ({ ...p, visible: false }));
        }}
      />

      <FavoriteFormModal
        visible={favoriteModalOpen}
        onClose={() => setFavoriteModalOpen(false)}
        onSave={handleSaveFavorite as any}
      />

      {!region ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#02de95" />
          <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>
            Buscando sua localização...
          </Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            region={region}
            customMapStyle={darkMapStyle}
            onRegionChangeComplete={(r) => {
              setRegion(r);
              handleRegionChangeComplete(r);
            }}
            showsUserLocation
            showsMyLocationButton={false}
          />

          {/* Pin fixo */}
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              pointerEvents: "none",
              paddingBottom: 48,
            }}
          >
            <MaterialIcons name="location-on" size={48} color="#02de95" />
          </View>

          {/* Topo: voltar + busca */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingTop: Math.max(insets.top, 20),
              paddingHorizontal: 16,
              paddingBottom: 16,
              zIndex: 20,
            }}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 48,
                height: 48,
                borderRadius: 9999,
                backgroundColor: "#1c2727",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <AddressAutocomplete
              label=""
              placeholder={
                userCity
                  ? `Buscar em ${userCity}${userRegion ? ` - ${userRegion}` : ""}`
                  : "Buscar endereço"
              }
              query={searchQuery}
              setQuery={setSearchQuery}
              onSelect={handleSelectResult}
              containerStyle={{ marginBottom: 0, zIndex: 50 }}
            />
          </View>

          {/* Bottom sheet */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Math.max(insets.top, 20)}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: isReferenceFocused ? keyboardHeight : 0,
              zIndex: 30,
            }}
          >
            <View
              style={{
                backgroundColor: "#111818",
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.05)",
                paddingBottom: Math.max(insets.bottom, 24),
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -10 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
                elevation: 20,
              }}
            >
              <View style={{ height: 24, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 44, height: 5, borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.15)" }} />
              </View>

              <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
                <Text style={{ color: "#9db9b9", fontSize: 12, fontWeight: "800", marginBottom: 6 }}>
                  {isPickupMode ? "CONFIRMAR LOCAL DE PARTIDA" : "CONFIRMAR DESTINO"}
                </Text>

                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }} numberOfLines={2}>
                  {address}
                </Text>

                {isGeocodingLoading && (
                  <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#02de95" />
                    <Text style={{ color: "#9db9b9" }}>Atualizando endereço...</Text>
                  </View>
                )}

                <View style={{ marginTop: 14, flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => setFavoriteModalOpen(true)}
                    activeOpacity={0.9}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "rgba(2,222,149,0.12)",
                      borderWidth: 1,
                      borderColor: "rgba(2,222,149,0.35)",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <MaterialIcons name="star" size={18} color="#02de95" />
                    <Text style={{ color: "#02de95", fontWeight: "800" }}>Adicionar favorito</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirm}
                    activeOpacity={0.9}
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "#02de95",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    <Text style={{ color: "#111818", fontWeight: "900" }}>
                      {isPickupMode ? "Confirmar local" : "Confirmar destino"}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={18} color="#111818" />
                  </TouchableOpacity>
                </View>

                <View style={{ marginTop: 12 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#1c2727",
                      borderRadius: 12,
                      padding: 12,
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      gap: 12,
                    }}
                  >
                    <MaterialIcons name="edit" size={18} color="#02de95" />
                    <TextInput
                      value={referencePoint}
                      onChangeText={setReferencePoint}
                      onFocus={() => setIsReferenceFocused(true)}
                      onBlur={() => setIsReferenceFocused(false)}
                      placeholder="Adicionar ponto de referência (opcional)"
                      placeholderTextColor="#9db9b9"
                      style={{ flex: 1, color: "#fff", fontSize: 14, padding: 0 }}
                    />
                  </View>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  );
}
