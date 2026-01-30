import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import googlePlacesService, {
  PlaceAutocompleteResult,
  PlaceDetails,
} from "../services/googlePlaces.service";

type AddressAutocompleteProps = {
  label?: string;
  placeholder?: string;

  query: string;
  setQuery: (value: string) => void;

  disabled?: boolean;
  minChars?: number;
  debounceMs?: number;

  onSelect: (details: PlaceDetails, raw: PlaceAutocompleteResult) => void;

  // Optional styling tweaks
  containerStyle?: any;
};

export default function AddressAutocomplete(props: AddressAutocompleteProps) {
  const {
    label = "Buscar endereço",
    placeholder = "Digite um endereço...",
    query,
    setQuery,
    disabled,
    minChars = 3,
    debounceMs = 400,
    onSelect,
    containerStyle,
  } = props;

  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (disabled) {
        setResults([]);
        setShowResults(false);
        return;
      }

      if (trimmed.length >= minChars) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const r = await googlePlacesService.searchPlaces(trimmed);
          setResults(r);
        } catch (error) {
          console.error("Erro na busca (Google Places):", error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [trimmed, disabled, minChars, debounceMs]);

  const handleSelect = async (item: PlaceAutocompleteResult) => {
    try {
      setIsSearching(true);
      const details = await googlePlacesService.getPlaceDetails(item.placeId);
      if (!details) return;

      // Preenche o input com o endereço completo
      setQuery(details.formattedAddress);
      setShowResults(false);
      Keyboard.dismiss();

      onSelect(details, item);
    } catch (error) {
      console.error("Erro ao obter detalhes do lugar:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <View style={[{ marginBottom: 24, zIndex: 10 }, containerStyle]}>
      {!!label && (
        <Text
          style={{
            color: "#9abcb0",
            fontSize: 13,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}

      <View style={{ position: "relative" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#162e25",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 48,
          }}
        >
          <MaterialIcons name="search" size={20} color="#9abcb0" />

          <TextInput
            value={query}
            onChangeText={setQuery}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor="#6b8f8f"
            style={{
              flex: 1,
              color: "#fff",
              fontSize: 15,
              marginLeft: 8,
              paddingVertical: 0,
            }}
          />

          {isSearching && (
            <ActivityIndicator size="small" color="#02de95" />
          )}

          {!isSearching && query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <MaterialIcons name="close" size={20} color="#9abcb0" />
            </TouchableOpacity>
          )}
        </View>

        {showResults && results.length > 0 && (
          <View
            style={{
              position: "absolute",
              top: 52,
              left: 0,
              right: 0,
              backgroundColor: "#162e25",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              maxHeight: 260,
              overflow: "hidden",
            }}
          >
            <FlatList
              data={results}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.06)",
                    flexDirection: "row",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: "rgba(2, 222, 149, 0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons
                      name="location-on"
                      size={18}
                      color="#02de95"
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                      numberOfLines={1}
                    >
                      {item.mainText}
                    </Text>
                    <Text
                      style={{ color: "#9abcb0", fontSize: 12, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  </View>

                  <MaterialIcons name="north-west" size={16} color="#9abcb0" />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}
