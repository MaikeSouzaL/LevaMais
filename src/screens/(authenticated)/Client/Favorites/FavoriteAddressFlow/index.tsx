import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Briefcase, ChevronLeft, ChevronRight, Flame, Home as HomeIcon, MapPin, Star, X, History } from "lucide-react-native";

import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import { getPlaceDetails, PlaceAutocompleteResult, searchPlaces } from "@/services/googlePlaces.service";
import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../types/navigation";

type Mode = "home" | "work" | "favorite" | "favoritesList" | "favoriteName";

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

  const [mode, setMode] = useState<Mode>(
    route.params?.initialSearchMode || (isSelectionMode ? "favorite" : "favoritesList")
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [historyAddresses, setHistoryAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [favoriteName, setFavoriteName] = useState("");
  const searchTimeout = useRef<any>(null);

  const loadFavorites = useCallback(async () => {
    const list = await favoriteAddressService.list();
    setFavorites(list || []);

    try {
      const history = await rideService.getHistory({ limit: 5 });
      if (history?.rides) {
        const histList: any[] = [];
        const seen = new Set((list || []).map(f => f.formattedAddress || f.address));
        
        history.rides.forEach(ride => {
          const addLocation = (loc: any, type: string) => {
            if (loc && loc.address && !seen.has(loc.address)) {
              seen.add(loc.address);
              histList.push({
                _id: `hist_${ride._id}_${type}`,
                name: ride.details?.recipientName || "Endereço recente",
                address: loc.address,
                formattedAddress: loc.address,
                latitude: loc.latitude,
                longitude: loc.longitude,
              });
            }
          };
          addLocation(ride.dropoff, "dropoff");
          addLocation(ride.pickup, "pickup");
        });
        setHistoryAddresses(histList);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadFavorites().catch(() => setFavorites([]));
  }, [loadFavorites]);

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

  const title = isSelectionMode
    ? (isSender ? "Buscar local para remetente" : "Buscar local para destinatário")
    : (mode === "favoriteName" ? "Nome do local" : mode === "favoritesList" ? "Favoritos" : "Favoritos");

  const placeholder = isSelectionMode
    ? (isSender ? "Buscar local para remetente" : "Buscar local para destinatário")
    : (mode === "home" ? "Onde você mora?" : mode === "work" ? "Onde você trabalha?" : "Insira o endereço");

  const returnPickedAddress = (payload: {
    address: string;
    latitude: number;
    longitude: number;
    name?: string;
    phone?: string;
    details?: string;
  }) => {
    if (!isSelectionMode) return false;
    navigation.dispatch(StackActions.replace(returnScreen as any, {
      mode: returnMode,
      vehicleType: route.params?.vehicleType,
      flow: route.params?.flow,
      pickupProfile: route.params?.pickupProfile || null,
      dropoffProfile: route.params?.dropoffProfile || null,
      mapPickedAddress: payload.address,
      mapPickedLatitude: payload.latitude,
      mapPickedLongitude: payload.longitude,
      mapPickedName: payload.name,
      mapPickedPhone: payload.phone || "",
      mapPickedDetails: payload.details || "",
    }));
    return true;
  };

  const saveAddress = async (name: string, icon: "home" | "work" | "favorite", address: string, latitude: number, longitude: number) => {
    setSaving(true);
    try {
      const created = await favoriteAddressService.create({
        name,
        icon,
        address,
        formattedAddress: address,
        latitude,
        longitude,
      });
      if (created && returnPickedAddress({
        address: created.formattedAddress || created.address,
        latitude: Number(created.latitude),
        longitude: Number(created.longitude),
        name: created.name,
        phone: (created as any).contactPhone,
        details: created.details,
      })) {
        return;
      }
      await loadFavorites();
      setQuery("");
      setResults([]);
      setDraft(null);
      setFavoriteName("");
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
      if (isSelectionMode) {
        returnPickedAddress({
          address: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
          name: item.mainText,
        });
        return;
      }
      if (mode === "home") {
        await saveAddress("Casa", "home", details.formattedAddress, details.latitude, details.longitude);
        return;
      }
      if (mode === "work") {
        await saveAddress("Trabalho", "work", details.formattedAddress, details.latitude, details.longitude);
        return;
      }
      setDraft({
        address: details.formattedAddress,
        latitude: details.latitude,
        longitude: details.longitude,
      });
      setFavoriteName(item.mainText || details.street || details.formattedAddress);
      setQuery("");
      setResults([]);
      setMode("favoriteName");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFavoriteName = async () => {
    if (!draft || !favoriteName.trim()) return;
    await saveAddress(favoriteName.trim(), "favorite", draft.address, draft.latitude, draft.longitude);
  };

  const handleBack = () => {
    Keyboard.dismiss();
    if (mode === "favoriteName") {
      setMode("favorite");
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
        phone: (fav as any).contactPhone,
        details: fav.details,
      });
      return;
    }
    Alert.alert(
      fav.name,
      fav.formattedAddress || fav.address,
      [
        {
          text: "Usar endereço",
          onPress: () => {
            navigation.navigate("DestinationSearch", {
              initialVehicle: "car",
              serviceType: "ride",
              pickup: {
                address: fav.formattedAddress || fav.address,
                latitude: fav.latitude,
                longitude: fav.longitude,
              }
            });
          }
        },
        {
          text: "Excluir favorito",
          style: "destructive",
          onPress: async () => {
            try {
              await favoriteAddressService.delete(fav._id);
              await loadFavorites();
            } catch (err) {
              Alert.alert("Erro", "Não foi possível excluir o favorito.");
            }
          }
        },
        {
          text: "Cancelar",
          style: "cancel"
        }
      ]
    );
  };

  const renderSearchIcon = () => {
    if (mode === "home") return <HomeIcon size={18} color="#6b7280" style={{ marginRight: 12 }} />;
    if (mode === "work") return <Briefcase size={18} color="#6b7280" style={{ marginRight: 12 }} />;
    return <Star size={18} color="#6b7280" fill="#6b7280" style={{ marginRight: 12 }} />;
  };

  const casaFav = favorites.find(f => f.name.toLowerCase() === "casa" || f.icon === "home");
  const trabalhoFav = favorites.find(f => f.name.toLowerCase() === "trabalho" || f.icon === "work");

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
          {favorites.length === 0 ? (
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
              <Text style={{ color: "#0f172a", fontSize: 25, fontWeight: "900", marginBottom: 12 }}>Locais favoritos</Text>
              <Text style={{ color: "#333", textAlign: "center", fontSize: 16, lineHeight: 22, marginBottom: 28 }}>
                É mais fácil chegar a um destino se ele já estiver salvo
              </Text>
              <TouchableOpacity
                onPress={() => setMode("favorite")}
                activeOpacity={0.85}
                style={{ height: 56, paddingHorizontal: 34, borderRadius: 28, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ color: "#091A2F", fontSize: 19, fontWeight: "900" }}>Adicionar favorito</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {favorites.map((fav) => (
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
                onPress={() => setMode("favorite")}
                style={{ position: "absolute", right: 24, bottom: 28, width: 64, height: 64, borderRadius: 32, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center", shadowColor: '#02de95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 }}
              >
                <Text style={{ color: "#091A2F", fontSize: 42, lineHeight: 46, fontWeight: "300" }}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : mode === "favoriteName" ? (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 34 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#9ca3af", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
              <MapPin size={20} color="#fff" fill="#fff" />
            </View>
            <Text style={{ flex: 1, color: "#4b5563", fontSize: 14, lineHeight: 19 }} numberOfLines={2}>{draft?.address}</Text>
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, borderWidth: 1, borderColor: "#f3f4f6", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 }}>
            <Text style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Nome do local</Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput value={favoriteName} onChangeText={setFavoriteName} autoFocus style={{ flex: 1, color: "#111827", fontSize: 17, fontWeight: "600" }} />
              {favoriteName.length > 0 && (
                <TouchableOpacity onPress={() => setFavoriteName("")}>
                  <X size={18} color="#c7c7c7" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={{ alignItems: "flex-end", marginTop: 32 }}>
            <TouchableOpacity
              onPress={handleSaveFavoriteName}
              disabled={saving || !draft || !favoriteName.trim()}
              style={{ height: 58, paddingHorizontal: 34, borderRadius: 29, backgroundColor: "#02de95", opacity: saving || !favoriteName.trim() ? 0.55 : 1, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#091A2F", fontSize: 20, fontWeight: "900" }}>{saving ? "Salvando..." : "Salvar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: "#f1f1f1" }}>
            <TouchableOpacity
              onPress={() => {
                if (casaFav) {
                  returnPickedAddress({
                    address: casaFav.formattedAddress || casaFav.address,
                    latitude: Number(casaFav.latitude),
                    longitude: Number(casaFav.longitude),
                    name: casaFav.name,
                    phone: (casaFav as any).contactPhone,
                    details: casaFav.details,
                  });
                } else {
                  setMode("home");
                }
              }}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}
            >
              <HomeIcon size={14} color="#666" />
              <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700" }}>Casa</Text>
              <ChevronRight size={12} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (trabalhoFav) {
                  returnPickedAddress({
                    address: trabalhoFav.formattedAddress || trabalhoFav.address,
                    latitude: Number(trabalhoFav.latitude),
                    longitude: Number(trabalhoFav.longitude),
                    name: trabalhoFav.name,
                    phone: (trabalhoFav as any).contactPhone,
                    details: trabalhoFav.details,
                  });
                } else {
                  setMode("work");
                }
              }}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}
            >
              <Briefcase size={14} color="#666" />
              <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700" }}>Trabalho</Text>
              <ChevronRight size={12} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMode("favoritesList");
              }}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#f3f4f6", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 }}
            >
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text style={{ color: "#374151", fontSize: 13, fontWeight: "700" }}>Favorit...</Text>
              <ChevronRight size={12} color="#ccc" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
            {query.length === 0 && !isSelectionMode && favorites.length > 0 && (
              <View style={{ borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingBottom: 8 }}>
                <Text style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 6, color: "#9ca3af", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 }}>Meus Favoritos</Text>
                {favorites.map((fav) => (
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

            {query.length === 0 && nearbySuggestions.map((item) => (
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
                  setDraft({ address: `${item.title} - ${item.subtitle}`, latitude: 0, longitude: 0 });
                  setFavoriteName(item.title);
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
