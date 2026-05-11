import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { Navigation, MapPin, X, Search, Heart } from "lucide-react-native";
import googlePlacesService, { PlaceAutocompleteResult, PlaceDetails } from "@/services/googlePlaces.service";
import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import { SearchResultItem } from "./SearchResultItem";

interface FloatingSearchCardProps {
  originText: string;
  destinationText: string;
  onOriginChange: (txt: string) => void;
  onDestinationChange: (txt: string) => void;
  onSelectOrigin: (details: PlaceDetails) => void;
  onSelectDestination: (details: PlaceDetails) => void;
  onFavoriteOrigin?: () => void;
  onFavoriteDestination?: () => void;
}

export const FloatingSearchCard = ({
  originText,
  destinationText,
  onOriginChange,
  onDestinationChange,
  onSelectOrigin,
  onSelectDestination,
  onFavoriteOrigin,
  onFavoriteDestination,
}: FloatingSearchCardProps) => {
  const [results, setResults] = useState<PlaceAutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [showDrop, setShowDrop] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // 🔥 Dynamic Favorites Loading
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  
  useEffect(() => {
    favoriteAddressService.list().then(data => setFavorites(data || [])).catch(() => {});
    
    // 🔥 AUTO-FOCUS TRIGGER ON MOUNT IF EMPTY
    if (!originText) {
       setActiveField('origin');
       setShowDrop(true);
    }
  }, []);
  
  // Dual-input intelligence track active field
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);

  // Dynamic effect tracking active field input
  useEffect(() => {
    if (isSelecting) {
      setIsSelecting(false);
      return;
    }
    if (!activeField) return;

    const currentText = activeField === 'origin' ? originText : destinationText;
    const trimmed = currentText.trim();

    if (trimmed.length < 3) {
      setResults([]);
      // Do not hide dropdown if favorites are available!
      setShowDrop(true); 
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
  }, [originText, destinationText, activeField]);

  const handleSelect = async (item: PlaceAutocompleteResult) => {
    try {
      setLoading(true);
      setShowDrop(false);
      setResults([]);
      setIsSelecting(true); 
      Keyboard.dismiss();
      
      const details = await googlePlacesService.getPlaceDetails(item.placeId);
      if (details) {
        finalizeSelect(details);
      }
    } catch (e) {
      console.log("Select fail", e);
    } finally {
      setLoading(false);
    }
  };

  const finalizeSelect = (details: PlaceDetails) => {
    if (activeField === 'origin') {
      onOriginChange(details.formattedAddress);
      onSelectOrigin(details);
    } else {
      onDestinationChange(details.formattedAddress);
      onSelectDestination(details);
    }
    setShowDrop(false);
    setActiveField(null);
  };

  const handleSelectFavorite = (fav: FavoriteAddress) => {
    setIsSelecting(true);
    Keyboard.dismiss();
    finalizeSelect({
      placeId: "fav",
      formattedAddress: fav.formattedAddress || fav.address,
      latitude: Number(fav.latitude),
      longitude: Number(fav.longitude)
    });
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="px-6 mt-4 z-[100]"
    >
      <View className="shadow-2xl shadow-black elevation-12">
        {/* 🎨 SOLIDIFIED BACKGROUND (Anti-transparency Fix) */}
        <View className="rounded-3xl bg-[#0B1522] border border-white/10 overflow-hidden p-4 relative">
          {/* Light Glow overlay simulation */}
          <View className="absolute inset-0 border border-primary/10 rounded-2xl pointer-events-none" />

          <View>
            {/* Origin Group (NOW EDITABLE 🚀) */}
            <View className="flex-row items-center">
              <View className="w-7 items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-[#02de95]" />
                <View className="w-[1px] h-[22px] border border-dashed border-white/20 mt-0.5 -mb-0.5" />
              </View>
              
              <View className={`flex-1 h-11 bg-white/5 border ${activeField === 'origin' ? 'border-[#02de95]/40' : 'border-white/5'} rounded-xl flex-row items-center px-3`}>
                <TextInput
                  value={originText}
                  onChangeText={onOriginChange}
                  placeholder="Local de Coleta"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  className="flex-1 text-white text-sm h-full p-0"
                  autoFocus={!originText}
                  onFocus={() => {
                     setActiveField('origin');
                     setShowDrop(true);
                  }}
                  returnKeyType="search"
                />
                
                <View className="flex-row items-center gap-2">
                  {activeField === 'origin' && loading && <ActivityIndicator size="small" color="#02de95" />}
                  
                  {onFavoriteOrigin && originText.length > 0 && (
                     <TouchableOpacity onPress={onFavoriteOrigin} hitSlop={8}>
                       <Heart size={15} color="#ffffff" opacity={0.35} />
                     </TouchableOpacity>
                  )}
                  <Navigation size={15} color="#02de95" opacity={0.8} />
                </View>
              </View>
            </View>

            {/* Destination Group */}
            <View className="flex-row items-center mt-2">
              <View className="w-7 items-center justify-center">
                <MapPin size={16} color="#ef4444" fill="#ef4444" opacity={0.9} />
              </View>
              <View className={`flex-1 h-11 bg-white/5 border ${activeField === 'destination' ? 'border-red-400/40' : 'border-white/5'} rounded-xl flex-row items-center px-3`}>
                <TextInput
                  value={destinationText}
                  onChangeText={onDestinationChange}
                  placeholder="Insira o destino"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  className="flex-1 text-white text-sm h-full p-0"
                  onFocus={() => {
                    setActiveField('destination');
                    setShowDrop(true);
                  }}
                  returnKeyType="search"
                />
                
                <View className="flex-row items-center gap-2">
                  {activeField === 'destination' && loading && <ActivityIndicator size="small" color="#02de95" />}
                  
                  {destinationText.length > 0 ? (
                    <>
                      {onFavoriteDestination && (
                         <TouchableOpacity onPress={onFavoriteDestination} hitSlop={8}>
                           <Heart size={15} color="#ffffff" opacity={0.35} />
                         </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => onDestinationChange("")}>
                        <X size={16} color="rgba(255,255,255,0.5)" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Search size={16} color="rgba(255,255,255,0.3)" />
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* DROPDOWN RESULTS: Suggestions OR Favorites */}
        <AnimatePresence>
          {showDrop && activeField && (results.length > 0 || favorites.length > 0) && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 300 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 rounded-2xl overflow-hidden shadow-2xl shadow-black"
            >
              <View className="flex-1 bg-[#0B1522] border border-white/10">
                {results.length === 0 && favorites.length > 0 && (
                  <View className="px-4 pt-3 pb-1">
                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Seus Favoritos</Text>
                  </View>
                )}
                
                <FlatList
                  data={results.length > 0 ? results : favorites}
                  keyExtractor={(i: any) => i.placeId || i._id}
                  keyboardShouldPersistTaps="handled"
                  ItemSeparatorComponent={() => <View className="h-[1px] bg-white/5 mx-4" />}
                  renderItem={({ item }: any) => {
                    const isFav = !!item._id;
                    return (
                      <SearchResultItem
                        mainText={isFav ? item.name : item.mainText}
                        secondaryText={isFav ? (item.formattedAddress || item.address) : item.secondaryText}
                        isHistory={isFav}
                        onPress={() => isFav ? handleSelectFavorite(item) : handleSelect(item)}
                      />
                    );
                  }}
                />
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </MotiView>
  );
};
