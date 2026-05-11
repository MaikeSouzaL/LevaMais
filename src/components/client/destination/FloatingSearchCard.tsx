import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { Navigation, MapPin, X, Search } from "lucide-react-native";
import googlePlacesService, { PlaceAutocompleteResult, PlaceDetails } from "@/services/googlePlaces.service";
import { SearchResultItem } from "./SearchResultItem";

interface FloatingSearchCardProps {
  originText: string;
  destinationText: string;
  onDestinationChange: (txt: string) => void;
  onSelectDestination: (details: PlaceDetails) => void;
}

export const FloatingSearchCard = ({
  originText,
  destinationText,
  onDestinationChange,
  onSelectDestination,
}: FloatingSearchCardProps) => {
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDrop, setShowDrop] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      return;
    }
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
      setResults([]); // Clear immediate render
      setIsSelecting(true); // Lock recursive useEffect
      Keyboard.dismiss();
      const details = await googlePlacesService.getPlaceDetails(item.placeId);
      if (details) {
        onDestinationChange(details.formattedAddress);
        onSelectDestination(details);
      }
    } catch (e) {
      console.log("Select fail", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="px-6 mt-4 z-[100]"
    >
      <View className="shadow-2xl shadow-black elevation-12">
        <BlurView intensity={65} tint="dark" className="rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden p-4 relative">
          {/* Light Glow overlay simulation */}
          <View className="absolute inset-0 border border-primary/10 rounded-2xl pointer-events-none" />

          <View>
            {/* Origin Group */}
            <View className="flex-row items-center">
              <View className="w-7 items-center justify-center">
                <View className="w-2 h-2 rounded-full bg-primary" />
                <View className="w-[1px] h-[22px] border border-dashed border-white/20 mt-0.5 -mb-0.5" />
              </View>
              <View className="flex-1 h-10 bg-black/30 rounded-md flex-row items-center px-3 justify-between">
                <Text className="text-white/50 text-sm flex-1 mr-2" numberOfLines={1}>{originText || "Local Atual"}</Text>
                <Navigation size={14} color="#02de95" />
              </View>
            </View>

            {/* Destination Group */}
            <View className="flex-row items-center mt-1.5">
              <View className="w-7 items-center justify-center">
                <MapPin size={16} color="#ef4444" />
              </View>
              <View className="flex-1 h-11 bg-white/5 border border-primary/20 rounded-md flex-row items-center px-3">
                <TextInput
                  value={destinationText}
                  onChangeText={onDestinationChange}
                  placeholder="Insira o destino"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  className="flex-1 text-white text-sm h-full p-0"
                  autoFocus
                  returnKeyType="search"
                />
                {loading ? (
                  <ActivityIndicator size="small" color="#02de95" />
                ) : destinationText.length > 0 ? (
                  <TouchableOpacity onPress={() => onDestinationChange("")}>
                    <X size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                ) : (
                  <Search size={16} color="rgba(255,255,255,0.3)" />
                )}
              </View>
            </View>
          </View>
        </BlurView>

        <AnimatePresence>
          {showDrop && results.length > 0 && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 320 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 rounded-2xl overflow-hidden"
            >
              <BlurView intensity={85} tint="dark" className="flex-1 bg-slate-950/85 border border-white/10">
                <FlatList
                  data={results}
                  keyExtractor={(i) => i.placeId}
                  keyboardShouldPersistTaps="handled"
                  ItemSeparatorComponent={() => <View className="h-[1px] bg-white/5 mx-4" />}
                  renderItem={({ item }) => (
                    <SearchResultItem
                      mainText={item.mainText}
                      secondaryText={item.secondaryText}
                      isHistory={false}
                      onPress={() => handleSelect(item)}
                    />
                  )}
                />
              </BlurView>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </MotiView>
  );
};
