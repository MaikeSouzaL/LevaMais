import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { MapPin, Search, X, Navigation, History } from "lucide-react-native";
import { colors, spacing, borderRadius, fontSize, fontWeight } from "@/theme";
import googlePlacesService, {
  PlaceAutocompleteResult,
  PlaceDetails,
} from "@/services/googlePlaces.service";

interface DestinationSearchInputProps {
  originText: string;
  destinationText: string;
  onDestinationChange: (txt: string) => void;
  onSelectDestination: (details: PlaceDetails) => void;
}

export const DestinationSearchInput = ({
  originText = "Local atual",
  destinationText,
  onDestinationChange,
  onSelectDestination,
}: DestinationSearchInputProps) => {
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDrop, setShowDrop] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const trimmed = destinationText.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setShowDrop(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setShowDrop(true);
      try {
        const r = await googlePlacesService.searchPlaces(trimmed);
        setResults(r);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [destinationText]);

  const handleSelect = async (item: PlaceAutocompleteResult) => {
    try {
      setLoading(true);
      setShowDrop(false);
      Keyboard.dismiss();
      const details = await googlePlacesService.getPlaceDetails(item.placeId);
      if (details) {
        onDestinationChange(details.formattedAddress);
        onSelectDestination(details);
      }
    } catch (e) {
      console.error("Error getting place details:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 500, delay: 100 }}
      className="mx-6 mt-6 z-90"
    >
      <BlurView intensity={50} tint="dark" className="rounded-2xl bg-slate-800/50 border border-white/10 p-4 overflow-hidden">
        {/* Origin Display Row */}
        <View className="flex-row items-center">
          <View className="w-[30px] items-center justify-center h-11">
            <View className="w-2 h-2 rounded-full bg-emerald-400" />
            <View className="w-[1px] flex-1 border border-dashed border-white/20 my-1" />
          </View>
          
          <View className="flex-1 h-11 flex-row items-center bg-slate-900/30 rounded-lg px-3">
            <TextInput
              value={originText}
              editable={false}
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.6)",
                fontSize: fontSize.sm,
                height: "100%",
                padding: 0,
              }}
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            <Navigation size={16} color={colors.primary[400]} className="ml-2" />
          </View>
        </View>

        {/* Destination Input Row */}
        <View className="flex-row items-center mt-3">
          <View className="w-[30px] items-center justify-center h-11">
            <MapPin size={18} color="#ef4444" />
          </View>

          <View className="flex-1 h-11 flex-row items-center bg-white/5 border border-emerald-500/20 rounded-lg px-3">
            <TextInput
              ref={searchInputRef}
              value={destinationText}
              onChangeText={onDestinationChange}
              placeholder="Para onde vamos?"
              placeholderTextColor={colors.text.secondary}
              style={{
                flex: 1,
                color: colors.text.primary,
                fontSize: fontSize.sm,
                height: "100%",
                padding: 0,
              }}
              autoFocus
              returnKeyType="search"
            />
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary[500]} className="ml-2" />
            ) : destinationText.length > 0 ? (
              <TouchableOpacity onPress={() => onDestinationChange("")} className="ml-2">
                <X size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            ) : (
              <Search size={16} color={colors.text.secondary} className="ml-2" />
            )}
          </View>
        </View>
      </BlurView>

      {/* Dropdown Results */}
      <AnimatePresence>
        {showDrop && results.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -10, height: 0 }}
            animate={{ opacity: 1, translateY: 0, height: 300 }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-2xl overflow-hidden"
          >
            <BlurView intensity={80} tint="dark" className="flex-1 bg-slate-900/80 border border-white/10">
              <FlatList
                data={results}
                keyExtractor={(item) => item.placeId}
                keyboardShouldPersistTaps="handled"
                ItemSeparatorComponent={() => <View className="h-[1px] bg-white/5 mx-4" />}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className="flex-row items-center px-4 py-3"
                    activeOpacity={0.7}
                  >
                    <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-3">
                      <History size={16} color={colors.text.tertiary} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-sm font-semibold" numberOfLines={1}>{item.mainText}</Text>
                      <Text className="text-slate-400 text-xs font-medium mt-0.5" numberOfLines={1}>{item.secondaryText}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </BlurView>
          </MotiView>
        )}
      </AnimatePresence>
    </MotiView>
  );
};
