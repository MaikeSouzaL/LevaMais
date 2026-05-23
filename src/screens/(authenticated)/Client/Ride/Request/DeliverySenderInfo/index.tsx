import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Modal as RNModal,
  Dimensions,
} from "react-native";
import { CommonActions, NavigationProp, RouteProp, StackActions, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, ChevronRight, MapPin, Edit3, X, Home as HomeIcon, Briefcase, Star, Phone, User, Flame, Plus, Pencil, History } from "lucide-react-native";
import { MotiView } from "moti";
import { ClientStackParamList, DeliveryAddressProfile, DeliveryVehicleType } from "../../../types/navigation";
import { useAuthStore } from "@/context/authStore";
import { useMapLocation } from "../../../Shared/hooks/useMapLocation";
import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import senderService from "@/services/sender.service";
import rideService from "@/services/ride.service";
import { searchPlaces, getPlaceDetails, PlaceAutocompleteResult } from "@/services/googlePlaces.service";

export default function DeliverySenderInfoScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "DeliverySenderInfo">>();
  const { userData: user } = useAuthStore();
  const { currentAddress, userRegion } = useMapLocation();

  const mode = route.params?.mode || "sender"; // "sender" | "receiver"
  const isSender = mode === "sender";
  const title = isSender ? "Informações do remetente" : "Informações do destinatário";
  const flow = route.params?.flow === "receive" ? "receive" : "send"; // "send" | "receive"
  const vehicleType = (["motorcycle", "car", "van", "truck"].includes(String(route.params?.vehicleType))
    ? route.params?.vehicleType
    : "motorcycle") as DeliveryVehicleType;


  // Form fields
  const [address, setAddress] = useState("");
  const [addressCoords, setAddressCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [addressDetails, setAddressDetails] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [savedSenderProfile, setSavedSenderProfile] = useState<any>(null);

  // Address search state
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlaceAutocompleteResult[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [searchMode, setSearchMode] = useState<"address" | "home" | "work" | "favorite" | "favoritesList" | "favoriteName">("address");
  const [favoriteDraft, setFavoriteDraft] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [favoriteName, setFavoriteName] = useState("");
  const searchTimeout = useRef<any>(null);
  const isSearchingAddressRef = useRef(false);
  const isInitialized = useRef(false);
  const windowHeight = Dimensions.get("window").height;

  // Recent addresses / favorites
  const [recentAddresses, setRecentAddresses] = useState<FavoriteAddress[]>([]);
  const nearbySuggestions = [
    {
      title: "Supermercado Irmãos Gonçalves",
      subtitle: "Avenida Marechal Rondon, 1993 - A Apidia, Pimenta Bueno - RO, 76970-000, Brasil",
      distance: "2km",
    },
    {
      title: "Matriz Transportes",
      subtitle: "Box25 - Rodoviária, Pimenta Bueno - RO, 78984-000, Brasil",
      distance: "1,4km",
    },
    {
      title: "Posto Itaporanga",
      subtitle: "BR-364 - ITAPORANGA, Pimenta Bueno - RO, 76970-000, Brasil",
      distance: "4.4km",
    },
  ];
  const [showGpsWarning, setShowGpsWarning] = useState(false);

  // Pre-fill with user data
  useEffect(() => {
    const existingProfile = isSender ? route.params?.pickupProfile : route.params?.dropoffProfile;
    setAddress(existingProfile?.address || "");
    setAddressCoords(existingProfile?.addressCoords || null);
    setAddressDetails(existingProfile?.details || "");
    setContactName(existingProfile?.contactName || "");
    setContactPhone(existingProfile?.contactPhone || "");
    isInitialized.current = true;
  }, [isSender, route.params?.dropoffProfile, route.params?.pickupProfile]);

  useEffect(() => {
    if (route.params?.mapPickedAddress) {
      setAddress(route.params.mapPickedAddress);
      if (route.params.mapPickedLatitude && route.params.mapPickedLongitude) {
        setAddressCoords({
          latitude: route.params.mapPickedLatitude,
          longitude: route.params.mapPickedLongitude,
        });
      }
      if (route.params.mapPickedName) {
        setContactName(route.params.mapPickedName);
      }
      if (route.params.mapPickedPhone) {
        setContactPhone(route.params.mapPickedPhone);
      }
      if (route.params.mapPickedDetails) {
        setAddressDetails(route.params.mapPickedDetails);
      }
      setIsSearchingAddress(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [
    route.params?.mapPickedAddress,
    route.params?.mapPickedLatitude,
    route.params?.mapPickedLongitude,
    route.params?.mapPickedName,
    route.params?.mapPickedPhone,
    route.params?.mapPickedDetails
  ]);

  useEffect(() => {
    isSearchingAddressRef.current = isSearchingAddress;
  }, [isSearchingAddress]);

  const closeAddressSearch = useCallback(() => {
    setIsSearchingAddress(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchMode("address");
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      if (isSearchingAddressRef.current) {
        closeAddressSearch();
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [closeAddressSearch]);

  // Load recent / favorite addresses
  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const favs = await favoriteAddressService.list();
          setRecentAddresses(favs || []);
        } catch {}
      };
      loadFavorites();
    }, [])
  );

  // Search addresses with debounce
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setIsLoadingSearch(true);
      try {
        const results = await searchPlaces(searchQuery);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
      setIsLoadingSearch(false);
    }, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  // Handle selecting a search result
  const applyPickedAddress = async (
    pickedAddress: string,
    coords: { latitude: number; longitude: number } | null,
    options?: { saveAs?: "Casa" | "Trabalho" },
  ) => {
    setAddress(pickedAddress);
    if (coords) setAddressCoords(coords);
    if (options?.saveAs && coords) {
      try {
        await favoriteAddressService.create({
          name: options.saveAs,
          icon: options.saveAs === "Casa" ? "home" : "work",
          address: pickedAddress,
          formattedAddress: pickedAddress,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        const favs = await favoriteAddressService.list();
        setRecentAddresses(favs);
      } catch {}
    }
    setIsSearchingAddress(false);
    setSearchQuery("");
    setSearchResults([]);
    setSearchMode("address");
  };

  const handleSelectResult = async (result: PlaceAutocompleteResult) => {
    setIsLoadingDetails(true);
    try {
      const details = await getPlaceDetails(result.placeId);
      if (details) {
        const coords = { latitude: details.latitude, longitude: details.longitude };
        if (searchMode === "favorite") {
          setFavoriteDraft({ address: details.formattedAddress, ...coords });
          setFavoriteName(result.mainText || details.street || details.formattedAddress);
          setSearchMode("favoriteName");
          setSearchQuery("");
          setSearchResults([]);
          setIsLoadingDetails(false);
          return;
        }
        await applyPickedAddress(details.formattedAddress, coords, {
          saveAs: searchMode === "home" ? "Casa" : searchMode === "work" ? "Trabalho" : undefined,
        });
      }
    } catch {}
    setIsLoadingDetails(false);
  };

  // Handle selecting a recent/favorite address
  const handleSelectRecent = (fav: FavoriteAddress) => {
    setAddress(fav.formattedAddress || fav.address || "");
    setAddressCoords({ latitude: Number(fav.latitude), longitude: Number(fav.longitude) });
    
    // Fill contact details if available
    if (fav.name && fav.name !== "Endereço recente" && fav.name !== "Casa" && fav.name !== "Trabalho") {
      setContactName(fav.name);
    }
    if ((fav as any).contactPhone) {
      setContactPhone((fav as any).contactPhone);
    }
    if (fav.details) {
      setAddressDetails(fav.details);
    }

    setIsSearchingAddress(false);
    setSearchMode("address");
    setSearchQuery("");
  };

  const findFavoriteByShortcut = (shortcut: "home" | "work") => {
    const expectedName = shortcut === "home" ? "casa" : "trabalho";
    return recentAddresses.find((fav) => {
      const icon = String((fav as any).icon || "").toLowerCase();
      const name = String(fav.name || (fav as any).label || "").toLowerCase();
      return icon === shortcut || name === expectedName;
    });
  };

  const openFavoriteFlow = (initialSearchMode: "home" | "work" | "favorite" | "favoritesList") => {
    setIsSearchingAddress(false);
    setSearchQuery("");
    setSearchResults([]);
    navigation.navigate("FavoriteAddressFlow", {
      selectionMode: true,
      initialSearchMode,
      returnScreen: "DeliverySenderInfo",
      returnMode: mode,
      vehicleType,
      flow,
      pickupProfile: route.params?.pickupProfile || null,
      dropoffProfile: route.params?.dropoffProfile || null,
      isSender,
    });
  };

  const handleShortcutPress = (shortcut: "home" | "work") => {
    const favorite = findFavoriteByShortcut(shortcut);
    if (favorite) {
      handleSelectRecent(favorite);
      return;
    }
    openFavoriteFlow(shortcut);
  };

  const handleSaveFavoriteDraft = async () => {
    if (!favoriteDraft || !favoriteName.trim()) return;
    setIsLoadingDetails(true);
    try {
      const created = await favoriteAddressService.create({
        name: favoriteName.trim(),
        icon: "favorite",
        address: favoriteDraft.address,
        formattedAddress: favoriteDraft.address,
        latitude: favoriteDraft.latitude,
        longitude: favoriteDraft.longitude,
      });
      const favs = await favoriteAddressService.list();
      setRecentAddresses(favs);
      setFavoriteDraft(null);
      setFavoriteName("");
      setSearchMode("favoritesList");
      setSearchQuery("");
      if (created) {
        setAddress(created.formattedAddress || created.address);
        setAddressCoords({ latitude: Number(created.latitude), longitude: Number(created.longitude) });
      }
    } catch {} finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenMapPicker = () => {
    Keyboard.dismiss();
    setIsSearchingAddress(false);
    setSearchQuery("");
    setSearchResults([]);
    navigation.navigate("LocationPicker", {
      selectionMode: "delivery_address",
      returnScreen: "DeliverySenderInfo",
      returnMode: mode,
      senderData: route.params?.senderData,
      pickupProfile: route.params?.pickupProfile || null,
      dropoffProfile: route.params?.dropoffProfile || null,
      initialLocation: addressCoords
        ? {
            formattedAddress: address,
            latitude: addressCoords.latitude,
            longitude: addressCoords.longitude,
          }
        : userRegion
          ? {
              formattedAddress: currentAddress || address,
              latitude: userRegion.latitude,
              longitude: userRegion.longitude,
            }
          : undefined,
      initialVehicle: vehicleType,
      vehicleType,
      flow,
    });
  };

  // Format phone for display
  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return phone;
  };

  // Handle confirm
  const handleConfirm = async () => {
    if (!address || !contactName || !contactPhone) return;

    const profile: DeliveryAddressProfile = {
      address,
      addressCoords,
      details: addressDetails,
      contactName,
      contactPhone,
    };

    const nextPickupProfile = isSender ? profile : route.params?.pickupProfile || null;
    const nextDropoffProfile = isSender ? route.params?.dropoffProfile || null : profile;

    if (!nextPickupProfile || !nextDropoffProfile) {
      navigation.dispatch(CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Home",
            params: {
              deliveryDraftProfile: {
                role: isSender ? "pickup" : "dropoff",
                profile,
                vehicleType,
                flow,
              },
            },
          },
        ],
      }));
      return;
    }

    navigation.dispatch(StackActions.replace("DeliveryDetails", {
      flow,
      vehicleType,
      pickupProfile: nextPickupProfile,
      dropoffProfile: nextDropoffProfile,
    }));
  };

  const isFormValid = address.trim().length > 0 && contactName.trim().length > 0 && contactPhone.trim().length > 0;

  // ────────────────────── Main Form Screen ──────────────────────
  return (
    <View className="flex-1 bg-white" style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 44 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-[36px] h-[36px] items-center justify-center mr-3"
        >
          <ChevronLeft size={26} color="#111" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-gray-900 text-[18px] font-black">{title}</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Address Field */}
          <View className="px-5 pt-6">
            <Text className="text-gray-500 text-[13px] font-semibold mb-1">
              Endereço<Text className="text-[#02de95]">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("FavoriteAddressFlow", {
                  selectionMode: true,
                  initialSearchMode: "favorite",
                  returnScreen: "DeliverySenderInfo",
                  returnMode: mode,
                  vehicleType,
                  flow,
                  pickupProfile: route.params?.pickupProfile,
                  dropoffProfile: route.params?.dropoffProfile,
                  isSender,
                });
              }}
              className="flex-row items-center justify-between py-3 border-b border-gray-200"
            >
              <Text
                className={`text-[16px] flex-1 ${address ? "text-gray-900 font-semibold" : "text-gray-300"}`}
                numberOfLines={1}
              >
                {address || (isSender ? "Selecionar endereço de coleta" : "Selecionar endereço de entrega")}
              </Text>
              <ChevronRight size={20} color="#ccc" />
            </TouchableOpacity>
          </View>

          {/* Address Details */}
          <View className="px-5 pt-5">
            <Text className="text-gray-500 text-[13px] font-semibold mb-1">
              Detalhes do endereço
            </Text>
            <TextInput
              value={addressDetails}
              onChangeText={setAddressDetails}
              placeholder="Ex.: bloco A, apartamento 201"
              placeholderTextColor="#ccc"
              className="text-[16px] text-gray-900 py-3 border-b border-gray-200 font-medium"
            />
          </View>

          {/* Contact Name */}
          <View className="px-5 pt-5">
            <Text className="text-gray-500 text-[13px] font-semibold mb-1">
              Nome para contato<Text className="text-[#02de95]">*</Text>
            </Text>
            <View className="flex-row items-center border-b border-gray-200">
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder={isSender ? "Digite o nome do remetente" : "Digite o nome do destinatário"}
                placeholderTextColor="#ccc"
                className="flex-1 text-[16px] text-gray-900 py-3 font-medium"
              />
              <User size={20} color="#bbb" />
            </View>
          </View>

          {/* Phone */}
          <View className="px-5 pt-5">
            <Text className="text-gray-500 text-[13px] font-semibold mb-1">
              Número de telefone<Text className="text-[#02de95]">*</Text>
            </Text>
            <View className="flex-row items-center py-3 border-b border-gray-200">
              <Text className="text-[16px] mr-1">🇧🇷</Text>
              <Text className="text-gray-500 text-[16px] font-medium mr-2">+55 ▾</Text>
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder={isSender ? "Telefone do remetente" : "Telefone do destinatário"}
                placeholderTextColor="#ccc"
                keyboardType="phone-pad"
                className="flex-1 text-[16px] text-gray-900 font-medium"
              />
            </View>
          </View>

          {/* Confirm Button */}
          <View className="px-5 pt-8">
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={!isFormValid}
              className="h-[56px] rounded-2xl items-center justify-center"
              style={{
                backgroundColor: isFormValid ? "#02de95" : "#e5e7eb",
              }}
              activeOpacity={0.85}
            >
              <Text
                className="text-[18px] font-black"
                style={{ color: isFormValid ? "#091A2F" : "#9ca3af" }}
              >
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Seus Favoritos */}
          <View className="pt-7 px-5">
            <Text className="text-gray-500 text-[14px] font-semibold mb-3">Seus Favoritos</Text>

            {recentAddresses.map((fav) => {
              const nameLower = (fav.name || "").toLowerCase();
              const isHome = nameLower.includes("casa");
              const isWork = nameLower.includes("trabalho") || nameLower.includes("work");
              
              return (
                <TouchableOpacity
                  key={fav._id}
                  onPress={() => handleSelectRecent(fav)}
                  className="flex-row items-center py-3.5 border-b border-gray-50"
                >
                  <View className="w-[36px] h-[36px] rounded-full bg-orange-50 items-center justify-center mr-3">
                    {isHome ? (
                      <HomeIcon size={18} color="#ff7a3d" />
                    ) : isWork ? (
                      <Briefcase size={18} color="#ff7a3d" />
                    ) : (
                      <Star size={18} color="#ff7a3d" fill="#ff7a3d" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-[15px] font-semibold" numberOfLines={1}>
                      {fav.name}
                    </Text>
                    <Text className="text-gray-400 text-[12px] mt-0.5" numberOfLines={1}>
                      {fav.address || fav.formattedAddress}
                    </Text>
                    {((fav as any).contactPhone || fav.details) && (
                      <Text className="text-gray-400 text-[10px] mt-0.5" numberOfLines={1}>
                        {[fav.details, (fav as any).contactPhone].filter(Boolean).join(" • ")}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            {recentAddresses.length === 0 && (
              <View className="py-4 items-center justify-center">
                <Text className="text-gray-400 text-[13px]">Nenhum local favorito salvo.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ────────── Address Search Bottom Sheet ────────── */}
      <RNModal
        visible={isSearchingAddress}
        animationType="slide"
        transparent={true}
        onRequestClose={closeAddressSearch}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
          {/* Tap backdrop to close */}
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={closeAddressSearch}
          />

          {/* Bottom Sheet Container */}
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              height: isKeyboardVisible ? windowHeight * 0.88 : undefined,
              maxHeight: windowHeight * (isKeyboardVisible ? 0.95 : 0.82),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            {/* Handle bar */}
            <View className="items-center pt-3 pb-1">
              <View className="w-[36px] h-[4px] rounded-full bg-gray-300" />
            </View>

            {searchMode === "favoritesList" ? (
              <View style={{ height: isKeyboardVisible ? windowHeight * 0.82 : windowHeight * 0.72 }}>
                <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                  <TouchableOpacity onPress={() => setSearchMode("address")} className="w-[40px] h-[40px] items-center justify-center mr-3">
                    <ChevronLeft size={26} color="#111" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text className="flex-1 text-center text-[20px] font-black text-gray-950 mr-[52px]">Favoritos</Text>
                </View>

                {recentAddresses.length === 0 ? (
                  <View className="flex-1 items-center justify-center px-8">
                    <View style={{ width: 128, height: 128, borderRadius: 64, backgroundColor: "#f0f4f8", alignItems: "center", justifyContent: "center", marginBottom: 28, overflow: 'hidden', position: 'relative' }}>
                      {/* Decorative background circles */}
                      <View style={{ position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: '#e2ebf5', left: -8, top: 34 }} />
                      <View style={{ position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2ebf5', right: -8, bottom: 24 }} />
                      
                      {/* Pin with star badge */}
                      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: '#d1fae5', alignItems: 'center', justifyContent: 'center', shadowColor: '#02de95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }}>
                        <MapPin size={46} color="#02de95" fill="#02de95" />
                        <View style={{ position: 'absolute', top: 20 }}>
                          <Star size={16} color="#fff" fill="#fff" />
                        </View>
                      </View>
                    </View>
                    <Text className="text-gray-950 text-[24px] font-black mb-3">Locais favoritos</Text>
                    <Text className="text-gray-700 text-[15px] text-center mb-6">
                      É mais fácil chegar a um destino se ele já estiver salvo
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSearchMode("favorite");
                        setSearchQuery("");
                      }}
                      className="h-[54px] px-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#02de95" }}
                    >
                      <Text className="text-[#091A2F] text-[18px] font-black">Adicionar favorito</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View className="flex-1">
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      {recentAddresses.map((fav) => (
                        <TouchableOpacity
                          key={fav._id}
                          onPress={() => handleSelectRecent(fav)}
                          className="flex-row items-center px-5 py-4 border-b border-gray-50"
                        >
                          <View className="w-[34px] h-[34px] rounded-full bg-gray-400 items-center justify-center mr-3">
                            <MapPin size={18} color="#fff" fill="#fff" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-950 text-[16px] font-semibold" numberOfLines={1}>{fav.name}</Text>
                            <Text className="text-gray-400 text-[12px] mt-0.5" numberOfLines={1}>
                              {fav.formattedAddress || fav.address}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TouchableOpacity
                      onPress={() => {
                        setSearchMode("favorite");
                        setSearchQuery("");
                      }}
                      className="absolute right-6 bottom-6 w-[62px] h-[62px] rounded-full items-center justify-center"
                      style={{ backgroundColor: "#ffc43d" }}
                    >
                      <Text className="text-white text-[42px] leading-[46px] font-light">+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : searchMode === "favoriteName" ? (
              <View style={{ height: isKeyboardVisible ? windowHeight * 0.82 : windowHeight * 0.72 }}>
                <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                  <TouchableOpacity onPress={() => setSearchMode("favorite")} className="w-[40px] h-[40px] items-center justify-center mr-3">
                    <ChevronLeft size={26} color="#111" strokeWidth={2.5} />
                  </TouchableOpacity>
                  <Text className="flex-1 text-center text-[20px] font-black text-gray-950 mr-[52px]">Nome do local</Text>
                </View>

                <View className="px-5 py-8">
                  <View className="flex-row items-center mb-8">
                    <View className="w-[34px] h-[34px] rounded-full bg-gray-400 items-center justify-center mr-4">
                      <MapPin size={18} color="#fff" fill="#fff" />
                    </View>
                    <Text className="flex-1 text-gray-600 text-[13px]" numberOfLines={2}>
                      {favoriteDraft?.address}
                    </Text>
                  </View>

                  <View className="rounded-2xl bg-white px-5 py-3 shadow-sm border border-gray-50">
                    <Text className="text-gray-500 text-[12px] mb-1">Nome do local</Text>
                    <View className="flex-row items-center">
                      <TextInput
                        value={favoriteName}
                        onChangeText={setFavoriteName}
                        autoFocus
                        placeholder="Nome do local"
                        placeholderTextColor="#bbb"
                        className="flex-1 text-gray-950 text-[16px]"
                      />
                      {favoriteName.length > 0 && (
                        <TouchableOpacity onPress={() => setFavoriteName("")}>
                          <X size={18} color="#c7c7c7" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View className="items-end mt-9">
                    <TouchableOpacity
                      onPress={handleSaveFavoriteDraft}
                      disabled={!favoriteDraft || !favoriteName.trim()}
                      className="h-[56px] px-9 rounded-full items-center justify-center"
                      style={{ backgroundColor: "#ffbd31", opacity: favoriteDraft && favoriteName.trim() ? 1 : 0.5 }}
                    >
                      <Text className="text-gray-950 text-[20px] font-black">Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
            <>
            {/* Search Input */}
            <View className="px-4 pb-3">
              <View className="flex-row items-center gap-3">
                <View className="flex-row flex-1 items-center rounded-full px-4 h-[52px]" style={{ backgroundColor: "#f5f5f6" }}>
                  {searchMode === "home" ? (
                    <HomeIcon size={16} color="#6b7280" style={{ marginRight: 12 }} />
                  ) : searchMode === "work" ? (
                    <Briefcase size={16} color="#6b7280" style={{ marginRight: 12 }} />
                  ) : searchMode === "favorite" ? (
                    <Star size={16} color="#6b7280" fill="#6b7280" style={{ marginRight: 12 }} />
                  ) : (
                    <View
                      className="w-[8px] h-[8px] rounded-full mr-3"
                      style={{ backgroundColor: isSender ? "#02de95" : "#ff7a3d" }}
                    />
                  )}
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={
                      searchMode === "home"
                        ? "Onde você mora?"
                        : searchMode === "work"
                          ? "Onde você trabalha?"
                          : searchMode === "favorite"
                            ? "Insira o endereço"
                            : isSender
                              ? "Buscar local para remetente"
                              : "Buscar local para destinatário"
                    }
                    placeholderTextColor="#b8b8be"
                    autoFocus
                    className="flex-1 text-[15px] text-gray-900 font-medium"
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")} className="ml-2">
                      <X size={18} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  onPress={closeAddressSearch}
                >
                  <Text className="text-gray-500 text-[15px] font-medium">Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Filters */}
            <View className="flex-row px-4 py-2.5 gap-4 border-b border-gray-100">
              <TouchableOpacity
                className="flex-row items-center gap-1.5"
                onPress={() => handleShortcutPress("home")}
              >
                <HomeIcon size={14} color="#02de95" />
                <Text className="text-gray-700 text-[13px] font-semibold">Casa</Text>
                <ChevronRight size={12} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-1.5"
                onPress={() => handleShortcutPress("work")}
              >
                <Briefcase size={14} color="#666" />
                <Text className="text-gray-700 text-[13px] font-semibold">Trabalho</Text>
                <ChevronRight size={12} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center gap-1.5"
                onPress={() => openFavoriteFlow("favoritesList")}
              >
                <Star size={14} color="#F59E0B" />
                <Text className="text-gray-700 text-[13px] font-semibold">Favorit...</Text>
                <ChevronRight size={12} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Results List */}
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: windowHeight * (isKeyboardVisible ? 0.72 : 0.5) }}
            >
              {/* Loading */}
              {isLoadingSearch && (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#02de95" />
                </View>
              )}

              {/* Suggested current location */}
              {isSender && currentAddress && searchQuery.length === 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setAddress(currentAddress);
                    if (userRegion) {
                      setAddressCoords({ latitude: userRegion.latitude, longitude: userRegion.longitude });
                    }
                    setIsSearchingAddress(false);
                    setSearchQuery("");
                  }}
                  className="flex-row items-center px-4 py-4 border-b border-gray-50"
                >
                  <View className="w-[36px] h-[36px] rounded-full bg-[#02de95]/10 items-center justify-center mr-3">
                    <MapPin size={18} color="#02de95" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-gray-900 text-[15px] font-semibold" numberOfLines={1}>
                        {currentAddress}
                      </Text>
                      <View className="bg-[#02de95]/15 px-2 py-0.5 rounded-full">
                        <Text className="text-[#02de95] text-[10px] font-bold">Sugerido</Text>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-[12px] mt-0.5" numberOfLines={1}>
                      Sua localização atual
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Google Places Results */}
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={result.placeId || index}
                  onPress={() => handleSelectResult(result)}
                  className="flex-row items-center px-4 py-4 border-b border-gray-50"
                >
                  <View className="w-[36px] h-[36px] rounded-full bg-gray-100 items-center justify-center mr-3">
                    <MapPin size={18} color="#666" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 text-[15px] font-semibold" numberOfLines={1}>
                      {result.mainText}
                    </Text>
                    <Text className="text-gray-400 text-[12px] mt-0.5" numberOfLines={1}>
                      {result.secondaryText}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Empty state */}
              {searchQuery.length >= 3 && !isLoadingSearch && searchResults.length === 0 && (
                <View className="py-10 items-center">
                  <Text className="text-gray-400 text-[14px]">Nenhum endereço encontrado</Text>
                </View>
              )}

              {/* Recent and Favorite addresses when no search */}
              {searchQuery.length === 0 && recentAddresses.length > 0 && (
                <View>
                  {recentAddresses.map((fav) => {
                    const isHistory = fav._id.startsWith("hist_");
                    return (
                      <TouchableOpacity
                        key={fav._id}
                        onPress={() => handleSelectRecent(fav)}
                        className="flex-row items-center px-4 py-3.5 border-b border-gray-50"
                      >
                        <View className="w-[32px] h-[32px] rounded-full bg-orange-50 items-center justify-center mr-3">
                          {isHistory ? (
                            <History size={16} color="#ff7a3d" />
                          ) : fav.name.toLowerCase().includes("casa") ? (
                            <HomeIcon size={16} color="#ff7a3d" />
                          ) : fav.name.toLowerCase().includes("trabalho") ? (
                            <Briefcase size={16} color="#ff7a3d" />
                          ) : (
                            <Star size={16} color="#ff7a3d" fill="#ff7a3d" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-800 text-[15px] font-semibold" numberOfLines={1}>
                            {fav.name || (isHistory ? "Endereço recente" : "Local Salvo")}
                          </Text>
                          <Text className="text-gray-400 text-[13px] mt-0.5" numberOfLines={2}>
                            {fav.formattedAddress || fav.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Quick actions when no search */}
              {searchQuery.length === 0 && (
                <View>
                  {nearbySuggestions.map((item) => (
                    <TouchableOpacity
                      key={item.title}
                      onPress={() => {
                        setAddress(`${item.title} - ${item.subtitle}`);
                        if (userRegion) {
                          setAddressCoords({
                            latitude: userRegion.latitude,
                            longitude: userRegion.longitude,
                          });
                        }
                        setIsSearchingAddress(false);
                        setSearchQuery("");
                      }}
                      className="flex-row items-center px-4 py-3.5 border-b border-gray-50"
                    >
                      <View className="w-[32px] h-[32px] rounded-full bg-orange-50 items-center justify-center mr-3">
                        <Flame size={16} color="#ff7a3d" fill="#ff7a3d" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 text-[15px] font-semibold" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-gray-400 text-[13px] mt-0.5" numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-[13px] ml-2">{item.distance}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* ALWAYS visible action list under results */}
              <View>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-4 border-b border-gray-50"
                  onPress={handleOpenMapPicker}
                >
                  <View className="w-[36px] h-[36px] rounded-full bg-gray-100 items-center justify-center mr-3">
                    <MapPin size={18} color="#666" />
                  </View>
                  <Text className="text-gray-700 text-[15px] font-medium">Marque o local no mapa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center px-4 py-4 border-b border-gray-50"
                  onPress={() => {
                    setIsSearchingAddress(false);
                    setSearchQuery("");
                    openFavoriteFlow("favoritesList");
                  }}
                >
                  <View className="w-[36px] h-[36px] rounded-full bg-gray-100 items-center justify-center mr-3">
                    <Plus size={18} color="#666" strokeWidth={3} />
                  </View>
                  <Text className="text-gray-700 text-[15px] font-medium">Adicionar local</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center px-4 py-4 border-b border-gray-50"
                  onPress={handleOpenMapPicker}
                >
                  <View className="w-[36px] h-[36px] rounded-full bg-gray-100 items-center justify-center mr-3">
                    <Pencil size={16} color="#666" />
                  </View>
                  <Text className="text-gray-700 text-[15px] font-medium">Sugerir alteração de local</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
            </>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>

        {/* Loading Details Overlay */}
        {isLoadingDetails && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <View className="bg-white rounded-2xl p-6 items-center shadow-xl">
              <ActivityIndicator size="large" color="#02de95" />
              <Text className="text-gray-700 font-bold mt-3">Carregando endereço...</Text>
            </View>
          </View>
        )}
      </RNModal>
    </View>
  );
}
