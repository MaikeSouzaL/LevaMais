import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { Briefcase, ChevronLeft, ChevronRight, Flame, Home as HomeIcon, MapPin, Star, X, History, AlertTriangle } from "lucide-react-native";

import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import { getPlaceDetails, PlaceAutocompleteResult, searchPlaces } from "@/services/googlePlaces.service";
import addressHistoryService from "@/services/addressHistory.service";
import { ClientStackParamList } from "../../types/navigation";

type Mode = "home" | "work" | "favorite" | "favoritesList" | "favoriteName";
type FavoriteFilter = "home" | "work" | "favorite" | null;
type FavoriteDraft = {
  address: string;
  latitude: number;
  longitude: number;
  icon: "home" | "work" | "favorite";
};

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
  {
    title: "Parada de Ônibus Pimenta Bueno",
    subtitle: "Pioneiros, Pimenta Bueno - RO, 76970-000, Brasil",
    distance: "1,4km",
  },
];

export default function FavoriteAddressFlowScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "FavoriteAddressFlow">>();
  const route = useRoute<RouteProp<ClientStackParamList, "FavoriteAddressFlow">>();
  
  const isSelectionMode = route.params?.selectionMode || false;
  const returnScreen = route.params?.returnScreen || "DeliverySenderInfo";
  const isSender = route.params?.isSender || route.params?.returnMode === "sender" || false;
  const returnMode = route.params?.returnMode || (isSender ? "sender" : "receiver");
  const initialScope = ["home", "work", "favorite"].includes(String(route.params?.initialSearchMode))
    ? (route.params?.initialSearchMode as Exclude<FavoriteFilter, null>)
    : null;

  const [mode, setMode] = useState<Mode>(
    initialScope ? "favoritesList" : route.params?.initialSearchMode || (isSelectionMode ? "favorite" : "favoritesList")
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>(initialScope);
  const [historyAddresses, setHistoryAddresses] = useState<any[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<FavoriteDraft | null>(null);
  const [favoriteName, setFavoriteName] = useState("");
  const [favoriteDetails, setFavoriteDetails] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const searchTimeout = useRef<any>(null);

  const loadFavorites = useCallback(async () => {
    const list = await favoriteAddressService.list(initialScope ? { category: initialScope } : undefined);
    setFavorites(list || []);
    setFavoritesLoaded(true);

    try {
      const context = route.params?.returnMode === "sender" || route.params?.returnMode === "receiver"
        ? route.params.returnMode
        : "general";
      const history = await addressHistoryService.list({ context, limit: 8 });
      setHistoryAddresses(history);
    } catch {}
  }, [initialScope, route.params?.returnMode]);

  useEffect(() => {
    loadFavorites().catch(() => setFavorites([]));
  }, [loadFavorites]);

  useEffect(() => {
    if (!favoritesLoaded || !initialScope || mode !== "favoritesList" || favorites.length > 0) return;
    setMode(initialScope);
  }, [favorites.length, favoritesLoaded, initialScope, mode]);

  useEffect(() => {
    if (!route.params?.mapPickedAddress) return;
    const icon = initialScope || "favorite";
    setDraft({
      address: route.params.mapPickedAddress,
      latitude: Number(route.params.mapPickedLatitude || 0),
      longitude: Number(route.params.mapPickedLongitude || 0),
      icon,
    });
    setFavoriteName(icon === "home" ? "Casa" : icon === "work" ? "Trabalho" : "");
    setFavoriteDetails("");
    setContactName("");
    setContactPhone("");
    setQuery("");
    setResults([]);
    setMode("favoriteName");
  }, [
    initialScope,
    route.params?.mapPickedAddress,
    route.params?.mapPickedLatitude,
    route.params?.mapPickedLongitude,
  ]);

  useEffect(() => {
    if (mode === "favoritesList" || mode === "favoriteName") return;
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await searchPlaces(query));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [mode, query]);

  const scopedTitle = favoriteFilter === "home" ? "Casa" : favoriteFilter === "work" ? "Trabalho" : favoriteFilter === "favorite" ? "Favoritos extras" : "Favoritos";
  const scopedAddLabel = favoriteFilter === "home" ? "Adicionar casa" : favoriteFilter === "work" ? "Adicionar trabalho" : "Adicionar favoritos extras";
  const title = mode === "favoriteName"
    ? (draft?.icon === "home" ? "Casa" : draft?.icon === "work" ? "Trabalho" : "Favoritos extras")
    : (isSelectionMode
      ? (favoriteFilter ? scopedTitle : isSender ? "Buscar local para remetente" : "Buscar local para destinatário")
      : scopedTitle);

  const placeholder = isSelectionMode
    ? (isSender ? "Buscar local para remetente" : "Buscar local para destinatário")
    : (mode === "home" ? "Onde você mora?" : mode === "work" ? "Onde você trabalha?" : "Insira o endereço");

  const returnPickedAddress = (payload: {
    address: string;
    latitude: number;
    longitude: number;
    name?: string;
    phone?: string;
    contactName?: string;
    details?: string;
    source?: "search" | "favorite" | "manual";
  }) => {
    if (!isSelectionMode) return false;
    void addressHistoryService.create({
      context: returnMode,
      name: payload.name,
      address: payload.address,
      formattedAddress: payload.address,
      latitude: payload.latitude,
      longitude: payload.longitude,
      details: payload.details,
      contactName: payload.contactName,
      contactPhone: payload.phone,
      source: payload.source || "search",
    });
    navigation.dispatch(StackActions.replace(returnScreen as any, {
      mode: returnMode,
      vehicleType: route.params?.vehicleType,
      flow: route.params?.flow,
      pickupProfile: route.params?.pickupProfile || null,
      dropoffProfile: route.params?.dropoffProfile || null,
      mapPickedAddress: payload.address,
      mapPickedLatitude: payload.latitude,
      mapPickedLongitude: payload.longitude,
      mapPickedName: payload.contactName || payload.name,
      mapPickedPhone: payload.phone || "",
      mapPickedDetails: payload.details || "",
      isFromMapSelection: !!route.params?.isFromMapSelection,
    }));
    return true;
  };

  const resetDraftForm = () => {
    setDraft(null);
    setFavoriteName("");
    setFavoriteDetails("");
    setContactName("");
    setContactPhone("");
  };

  const saveAddress = async (payload: {
    name: string;
    icon: "home" | "work" | "favorite";
    address: string;
    latitude: number;
    longitude: number;
    details?: string;
    contactName?: string;
    contactPhone?: string;
  }) => {
    setSaving(true);
    try {
      const created = await favoriteAddressService.create({
        name: payload.name,
        icon: payload.icon,
        address: payload.address,
        formattedAddress: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        details: payload.details,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
      });
      await addressHistoryService.create({
        context: returnMode,
        name: payload.name,
        address: payload.address,
        formattedAddress: payload.address,
        latitude: payload.latitude,
        longitude: payload.longitude,
        details: payload.details,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        source: "favorite",
      });
      if (created && returnPickedAddress({
        address: created.formattedAddress || created.address,
        latitude: Number(created.latitude),
        longitude: Number(created.longitude),
        name: created.name,
        contactName: created.contactName,
        phone: (created as any).contactPhone,
        details: created.details,
        source: "favorite",
      })) {
        return;
      }
      await loadFavorites();
      setQuery("");
      setResults([]);
      resetDraftForm();
      if (!isSelectionMode) {
        setFavoriteFilter(payload.icon);
      }
      setMode("favoritesList");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectResult = async (item: PlaceAutocompleteResult) => {
    setLoading(true);
    try {
      const details = await getPlaceDetails(item.placeId);
      if (!details) return;
      if (mode === "home") {
        setDraft({
          address: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
          icon: "home",
        });
        setFavoriteName("Casa");
        setFavoriteDetails("");
        setContactName("");
        setContactPhone("");
        setQuery("");
        setResults([]);
        setMode("favoriteName");
        return;
      }
      if (mode === "work") {
        setDraft({
          address: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
          icon: "work",
        });
        setFavoriteName("Trabalho");
        setFavoriteDetails("");
        setContactName("");
        setContactPhone("");
        setQuery("");
        setResults([]);
        setMode("favoriteName");
        return;
      }
      if (isSelectionMode) {
        returnPickedAddress({
          address: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
          name: item.mainText,
        });
        return;
      }
      setDraft({
        address: details.formattedAddress,
        latitude: details.latitude,
        longitude: details.longitude,
        icon: "favorite",
      });
      setFavoriteName(item.mainText || details.street || details.formattedAddress);
      setFavoriteDetails("");
      setContactName("");
      setContactPhone("");
      setQuery("");
      setResults([]);
      setMode("favoriteName");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFavoriteName = async () => {
    if (!draft?.address.trim() || !favoriteName.trim() || !contactName.trim() || !contactPhone.trim()) return;
    await saveAddress({
      name: favoriteName.trim(),
      icon: draft.icon,
      address: draft.address,
      latitude: draft.latitude,
      longitude: draft.longitude,
      details: favoriteDetails.trim(),
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
    });
  };

  const handleDraftAddressChange = (address: string) => {
    setDraft((current) => current ? { ...current, address } : current);
  };

  const openScopedCreateMode = () => {
    if (favoriteFilter === "home") {
      setMode("home");
      return;
    }
    if (favoriteFilter === "work") {
      setMode("work");
      return;
    }
    setMode("favorite");
  };

  const handleBack = () => {
    Keyboard.dismiss();
    if (mode === "favoriteName") {
      setMode(draft?.icon || "favorite");
      return;
    }
    if (mode !== "favoritesList") {
      if (isSelectionMode) {
        navigation.goBack();
      } else {
        setMode("favoritesList");
      }
      return;
    }
    navigation.goBack();
  };

  const handleFavoritePress = (fav: FavoriteAddress) => {
    if (isSelectionMode) {
      returnPickedAddress({
        address: fav.formattedAddress || fav.address,
        latitude: Number(fav.latitude),
          longitude: Number(fav.longitude),
          name: fav.name,
          contactName: fav.contactName,
          phone: (fav as any).contactPhone,
          details: fav.details,
          source: "favorite",
        });
      return;
    }
    navigation.navigate("EditDeliveryAddress", {
      addressId: fav._id,
      addressData: fav,
    });
  };

  const renderSearchIcon = () => {
    if (mode === "home") return <HomeIcon size={18} color="#6b7280" style={{ marginRight: 12 }} />;
    if (mode === "work") return <Briefcase size={18} color="#6b7280" style={{ marginRight: 12 }} />;
    return <Star size={18} color="#6b7280" fill="#6b7280" style={{ marginRight: 12 }} />;
  };

  const getFavoriteKind = (fav: FavoriteAddress): "home" | "work" | "favorite" => {
    const icon = String(fav.icon || "").toLowerCase();
    const name = String(fav.name || "").toLowerCase();
    if (icon === "home" || name === "casa") return "home";
    if (icon === "work" || name === "trabalho") return "work";
    return "favorite";
  };

  const favoritesForFilter = favoriteFilter
    ? favorites.filter((fav) => getFavoriteKind(fav) === favoriteFilter)
    : favorites;

  const getShortcutLabel = (kind: "home" | "work" | "favorite", fallback: string) => {
    const list = favorites.filter((fav) => getFavoriteKind(fav) === kind);
    if (list.length !== 1) return fallback;
    const address = list[0].formattedAddress || list[0].address || list[0].name;
    return address.split(/[,\s]+/).filter(Boolean).slice(0, 2).join(" ") || fallback;
  };

  const handleShortcut = (kind: "home" | "work" | "favorite") => {
    const list = favorites.filter((fav) => getFavoriteKind(fav) === kind);
    setFavoriteFilter(kind);
    setMode(list.length === 0 ? kind : "favoritesList");
  };

  const currentCreateIcon: "home" | "work" | "favorite" =
    mode === "home" ? "home" : mode === "work" ? "work" : favoriteFilter || "favorite";

  const handleOpenMapPicker = () => {
    // Se estiver em modo de seleção e o modo atual for genérico,
    // significa que clicou direto em "Escolher no mapa" sem selecionar Casa/Trabalho primeiro.
    const isDirectSelection = isSelectionMode && (mode === "favorite" || mode === "favoritesList");

    navigation.navigate("DeliveryMapPicker", {
      returnScreen: isDirectSelection ? "DeliverySenderInfo" : "FavoriteAddressFlow",
      returnField: currentCreateIcon,
      favoriteInitialSearchMode: currentCreateIcon,
      selectionMode: isSelectionMode,
      returnMode,
      vehicleType: route.params?.vehicleType,
      flow: route.params?.flow,
      pickupProfile: route.params?.pickupProfile || null,
      dropoffProfile: route.params?.dropoffProfile || null,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 28 : 48, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#f1f1f1" }}>
        <TouchableOpacity onPress={handleBack} style={{ width: 42, height: 42, alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={30} color="#111" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ flex: 1, marginRight: 42, textAlign: "center", color: "#111827", fontSize: 22, fontWeight: "900" }}>
          {title}
        </Text>
      </View>

      {mode === "favoritesList" ? (
        <View style={{ flex: 1 }}>
          {favoritesForFilter.length === 0 ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
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
              <Text style={{ color: "#0f172a", fontSize: 25, fontWeight: "900", marginBottom: 12 }}>{scopedTitle}</Text>
              <Text style={{ color: "#333", textAlign: "center", fontSize: 16, lineHeight: 22, marginBottom: 28 }}>
                Salve e gerencie apenas os endereços deste grupo.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  openScopedCreateMode();
                }}
                activeOpacity={0.85}
                style={{ height: 56, paddingHorizontal: 34, borderRadius: 28, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#091A2F", fontSize: 19, fontWeight: "900" }}>{scopedAddLabel}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {favoritesForFilter.map((fav) => (
                  <TouchableOpacity key={fav._id} onPress={() => handleFavoritePress(fav)} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#9ca3af", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                      <MapPin size={20} color="#fff" fill="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#111827", fontSize: 17, fontWeight: "800" }} numberOfLines={1}>{fav.name}</Text>
                      <Text style={{ color: "#9ca3af", fontSize: 13, marginTop: 2 }} numberOfLines={1}>{fav.formattedAddress || fav.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                onPress={() => {
                  openScopedCreateMode();
                }}
                style={{ position: "absolute", right: 24, bottom: 28, width: 64, height: 64, borderRadius: 32, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center", shadowColor: '#02de95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}
              >
                <Text style={{ color: "#091A2F", fontSize: 42, lineHeight: 46, fontWeight: "300" }}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : mode === "favoriteName" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 28 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: draft?.icon === "home" ? "#e6fff6" : draft?.icon === "work" ? "#eff6ff" : "#fef3c7",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}>
              {draft?.icon === "home" ? (
                <HomeIcon size={22} color="#02de95" />
              ) : draft?.icon === "work" ? (
                <Briefcase size={22} color="#3b82f6" />
              ) : (
                <Star size={22} color="#f59e0b" fill="#f59e0b" />
              )}
            </View>
            <Text style={{ flex: 1, color: "#4b5563", fontSize: 14, lineHeight: 19 }} numberOfLines={2}>
              Confirme o endereço e complete os dados deste local.
            </Text>
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2, marginBottom: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Endereço completo</Text>
            <TextInput
              value={draft?.address || ""}
              onChangeText={handleDraftAddressChange}
              multiline
              placeholder="Edite rua, número, bairro ou nome do local"
              placeholderTextColor="#c4c4c8"
              style={{ color: "#111827", fontSize: 16, fontWeight: "600", minHeight: 58, textAlignVertical: "top" }}
            />
          </View>
          {/* Aviso sobre o número do endereço */}
          {!!draft?.address && (
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fef3c7", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 18, gap: 10, borderWidth: 1, borderColor: "#fde68a" }}>
              <AlertTriangle size={18} color="#d97706" />
              <Text style={{ color: "#b45309", fontSize: 12, fontWeight: "700", flex: 1, lineHeight: 16 }}>
                Atenção: O número do endereço obtido pelo mapa pode não estar 100% correto. Por favor, revise e confirme o número do endereço acima!
              </Text>
            </View>
          )}

          {/* Seletor de Tipo de Favorito */}
          <View style={{ marginBottom: 18 }}>
            <Text style={{ color: "#6b7280", fontSize: 13, fontWeight: "700", marginBottom: 10 }}>
              Salvar endereço como:
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setDraft(curr => curr ? { ...curr, icon: "home" } : null);
                  setFavoriteName("Casa");
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: draft?.icon === "home" ? "#e6fff6" : "#fff",
                  borderWidth: 1.5,
                  borderColor: draft?.icon === "home" ? "#02de95" : "#e5e7eb",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <HomeIcon size={18} color={draft?.icon === "home" ? "#02de95" : "#6b7280"} />
                <Text style={{ color: draft?.icon === "home" ? "#091A2F" : "#4b5563", fontSize: 14, fontWeight: "800" }}>
                  Casa
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDraft(curr => curr ? { ...curr, icon: "work" } : null);
                  setFavoriteName("Trabalho");
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: draft?.icon === "work" ? "#e6fff6" : "#fff",
                  borderWidth: 1.5,
                  borderColor: draft?.icon === "work" ? "#02de95" : "#e5e7eb",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Briefcase size={18} color={draft?.icon === "work" ? "#02de95" : "#6b7280"} />
                <Text style={{ color: draft?.icon === "work" ? "#091A2F" : "#4b5563", fontSize: 14, fontWeight: "800" }}>
                  Trabalho
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setDraft(curr => curr ? { ...curr, icon: "favorite" } : null);
                  setFavoriteName("");
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: draft?.icon === "favorite" ? "#e6fff6" : "#fff",
                  borderWidth: 1.5,
                  borderColor: draft?.icon === "favorite" ? "#02de95" : "#e5e7eb",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Star size={18} color={draft?.icon === "favorite" ? "#02de95" : "#6b7280"} fill={draft?.icon === "favorite" ? "#02de95" : "none"} />
                <Text style={{ color: draft?.icon === "favorite" ? "#091A2F" : "#4b5563", fontSize: 14, fontWeight: "800" }}>
                  Outros
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2, marginBottom: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Nome do local</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={favoriteName}
                onChangeText={setFavoriteName}
                placeholder="Ex.: Casa, Trabalho, Academia"
                placeholderTextColor="#c4c4c8"
                style={{ flex: 1, color: "#111827", fontSize: 17, fontWeight: "600" }}
              />
              {favoriteName.length > 0 && (
                <TouchableOpacity onPress={() => setFavoriteName("")}>
                  <X size={18} color="#c7c7c7" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2, marginBottom: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Detalhes do endereço</Text>
            <TextInput
              value={favoriteDetails}
              onChangeText={setFavoriteDetails}
              placeholder="Ex.: bloco A, apartamento 201"
              placeholderTextColor="#c4c4c8"
              style={{ color: "#111827", fontSize: 16, fontWeight: "600", minHeight: 42 }}
            />
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2, marginBottom: 14 }}>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Nome para contato</Text>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder="Quem atende neste endereço"
              placeholderTextColor="#c4c4c8"
              style={{ color: "#111827", fontSize: 16, fontWeight: "600", minHeight: 42 }}
            />
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 }}>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Número de telefone</Text>
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
              placeholderTextColor="#c4c4c8"
              style={{ color: "#111827", fontSize: 16, fontWeight: "600", minHeight: 42 }}
            />
          </View>
          <View style={{ marginTop: 28, paddingBottom: 16 }}>
            <TouchableOpacity
              onPress={handleSaveFavoriteName}
              disabled={saving || !draft?.address.trim() || !favoriteName.trim() || !contactName.trim() || !contactPhone.trim()}
              style={{
                height: 54,
                borderRadius: 16,
                backgroundColor: "#02de95",
                opacity: saving || !draft?.address.trim() || !favoriteName.trim() || !contactName.trim() || !contactPhone.trim() ? 0.55 : 1,
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text style={{ color: "#091A2F", fontSize: 17, fontWeight: "900" }}>
                {saving ? "Confirmando..." : "Confirmar"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
            <View style={{ flex: 1, height: 54, borderRadius: 27, backgroundColor: "#f5f5f6", flexDirection: "row", alignItems: "center", paddingHorizontal: 18 }}>
              {renderSearchIcon()}
              <TextInput value={query} onChangeText={setQuery} autoFocus placeholder={placeholder} placeholderTextColor="#c4c4c8" style={{ flex: 1, color: "#111827", fontSize: 16, fontWeight: "600" }} />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery("")}>
                  <X size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => {
              if (isSelectionMode) {
                navigation.goBack();
              } else {
                setMode("favoritesList");
              }
            }}>
              <Text style={{ color: "#555", fontSize: 15, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {/* Quick search shortcuts horizontal bar */}
          {!favoriteFilter && (
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f1f1f1" }}>
            <TouchableOpacity
              onPress={() => handleShortcut("home")}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}
            >
              <HomeIcon size={14} color="#666" />
              <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", maxWidth: 86 }} numberOfLines={1}>
                {getShortcutLabel("home", "Casa")}
              </Text>
              <ChevronRight size={12} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShortcut("work")}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}
            >
              <Briefcase size={14} color="#666" />
              <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", maxWidth: 86 }} numberOfLines={1}>
                {getShortcutLabel("work", "Trabalho")}
              </Text>
              <ChevronRight size={12} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShortcut("favorite")}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}
            >
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700", maxWidth: 86 }} numberOfLines={1}>
                {getShortcutLabel("favorite", "Favoritos")}
              </Text>
              <ChevronRight size={12} color="#ccc" />
            </TouchableOpacity>
          </View>
          )}

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity
              onPress={handleOpenMapPicker}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#e6fff6", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                <MapPin size={20} color="#02b77c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#111827", fontSize: 16, fontWeight: "900" }} numberOfLines={1}>
                  Escolher no mapa
                </Text>
                <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                  Arraste o marcador para o ponto exato e confirme o endereço.
                </Text>
              </View>
              <ChevronRight size={18} color="#c7c7c7" />
            </TouchableOpacity>
            {loading && <ActivityIndicator color="#02de95" style={{ marginVertical: 18 }} />}
            {results.map((item) => (
              <TouchableOpacity key={item.placeId} onPress={() => handleSelectResult(item)} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff0e8", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <MapPin size={18} color="#ff7a3d" fill="#ff7a3d" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#333", fontSize: 16, fontWeight: "800" }} numberOfLines={1}>{item.mainText}</Text>
                  <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 2 }} numberOfLines={2}>{item.secondaryText}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {query.length === 0 && !isSelectionMode && favoritesForFilter.length > 0 && (
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingBottom: 8 }}>
                <Text style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 6, color: "#9ca3af", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 }}>{scopedTitle}</Text>
                {favoritesForFilter.map((fav) => (
                  <TouchableOpacity
                    key={fav._id}
                    onPress={() => handleFavoritePress(fav)}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      {fav.name.toLowerCase().includes("casa") ? (
                        <HomeIcon size={16} color="#64748b" />
                      ) : fav.name.toLowerCase().includes("trabalho") ? (
                        <Briefcase size={16} color="#64748b" />
                      ) : (
                        <Star size={16} color="#64748b" fill="#64748b" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#333", fontSize: 16, fontWeight: "800" }} numberOfLines={1}>{fav.name}</Text>
                      <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 2 }} numberOfLines={1}>{fav.formattedAddress || fav.address}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {query.length === 0 && isSelectionMode && historyAddresses.length > 0 && (
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingBottom: 8 }}>
                {historyAddresses.map((hist) => (
                  <TouchableOpacity
                    key={hist._id}
                    onPress={() => {
                      returnPickedAddress({
                        address: hist.formattedAddress || hist.address,
                        latitude: Number(hist.latitude),
                        longitude: Number(hist.longitude),
                        name: hist.name,
                      });
                    }}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 }}
                  >
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff0e8", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                      <History size={16} color="#ff7a3d" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#333", fontSize: 16, fontWeight: "800" }} numberOfLines={1}>
                        {hist.formattedAddress.split(",")[0]}
                      </Text>
                      <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                        {hist.formattedAddress}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {query.length === 0 && !favoriteFilter && nearbySuggestions.map((item) => (
              <TouchableOpacity
                key={item.title}
                onPress={() => {
                  if (isSelectionMode) {
                    returnPickedAddress({
                      address: `${item.title} - ${item.subtitle}`,
                      latitude: -11.6722,
                      longitude: -61.1936,
                      name: item.title,
                    });
                    return;
                  }
                  setDraft({ address: `${item.title} - ${item.subtitle}`, latitude: 0, longitude: 0, icon: "favorite" });
                  setFavoriteName(item.title);
                  setFavoriteDetails("");
                  setContactName("");
                  setContactPhone("");
                  setMode("favoriteName");
                }}
                style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12 }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#fff0e8", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
                  <Flame size={17} color="#ff7a3d" fill="#ff7a3d" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#333", fontSize: 16, fontWeight: "800" }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color: "#9ca3af", fontSize: 14, marginTop: 2 }} numberOfLines={2}>{item.subtitle}</Text>
                </View>
                <Text style={{ color: "#9ca3af", fontSize: 14, marginLeft: 10 }}>{item.distance}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}
