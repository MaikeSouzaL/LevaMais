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
import { Icon } from "@/components/ui/Icon";
import { MapPin } from "lucide-react-native";
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
  theme?: "light" | "dark";
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
    theme = "dark",
  } = props;

  const isDark = theme === "dark";

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
            color: isDark ? "#9abcb0" : "#475569",
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
            backgroundColor: isDark ? "#11253E" : "#F1F5F9",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
            borderRadius: 12,
            paddingHorizontal: 12,
            height: 48,
          }}
        >
          <Icon name="search" size={20} color={isDark ? "#9abcb0" : "#64748B"} />

          <TextInput
            value={query}
            onChangeText={setQuery}
            editable={!disabled}
            placeholder={placeholder}
            placeholderTextColor={isDark ? "#6b8f8f" : "#94A3B8"}
            style={{
              flex: 1,
              color: isDark ? "#fff" : "#0F172A",
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
              <Icon name="close" size={20} color={isDark ? "#9abcb0" : "#64748B"} />
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
              backgroundColor: isDark ? "#11253E" : "#FFFFFF",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
              maxHeight: 260,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
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
                    borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
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
                      backgroundColor: isDark ? "rgba(2, 222, 149, 0.12)" : "rgba(2, 222, 149, 0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MapPin
                      size={16}
                      color="#02de95"
                      strokeWidth={2.5}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isDark ? "#fff" : "#0F172A",
                        fontSize: 14,
                        fontWeight: "700",
                      }}
                      numberOfLines={1}
                    >
                      {item.mainText}
                    </Text>
                    <Text
                      style={{ color: isDark ? "#9abcb0" : "#64748B", fontSize: 12, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {item.secondaryText}
                    </Text>
                  </View>

                  <Icon name="north-west" size={16} color={isDark ? "#9abcb0" : "#94A3B8"} />
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}
