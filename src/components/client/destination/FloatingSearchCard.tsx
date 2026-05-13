import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard, Modal, Alert } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { Navigation, MapPin, X, Search, Heart, Trash2, AlertTriangle } from "lucide-react-native";
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

  // ✍️ Edição & Exclusão Suporte Dinâmico
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingFav, setEditingFav] = useState<FavoriteAddress | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingAddress, setEditingAddress] = useState("");
  
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingFav, setDeletingFav] = useState<FavoriteAddress | null>(null);
  
  const [isActionLoading, setIsActionLoading] = useState(false);

  const refreshFavorites = async () => {
    try {
      const data = await favoriteAddressService.list();
      setFavorites(data || []);
    } catch (e) {}
  };
  
  useEffect(() => {
    refreshFavorites();
    
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
      console.error("Error getting place details:", e);
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

  const handleDeleteFavorite = (fav: FavoriteAddress) => {
    setDeletingFav(fav);
    setDeleteModalVisible(true);
  };

  const confirmDeleteFavorite = async () => {
    if (!deletingFav) return;
    setIsActionLoading(true);
    try {
      await favoriteAddressService.delete(deletingFav._id);
      setDeleteModalVisible(false);
      setDeletingFav(null);
      refreshFavorites();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível excluir o favorito.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleTriggerEdit = (fav: FavoriteAddress) => {
    setEditingFav(fav);
    setEditingName(fav.name);
    setEditingAddress(fav.formattedAddress || fav.address || "");
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFav) return;
    if (!editingName.trim() || !editingAddress.trim()) {
      Alert.alert("Atenção", "Insira dados válidos nos dois campos.");
      return;
    }

    setIsActionLoading(true);
    try {
      await favoriteAddressService.update(editingFav._id, { 
        name: editingName.trim(),
        address: editingAddress.trim(),
        formattedAddress: editingAddress.trim()
      });
      setEditModalVisible(false);
      setEditingFav(null);
      refreshFavorites();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar a alteração.");
    } finally {
      setIsActionLoading(false);
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
                  {originText.length > 0 ? (
                     <>
                       {onFavoriteOrigin && (
                          <TouchableOpacity onPress={onFavoriteOrigin} hitSlop={8}>
                            <Heart size={15} color="#ffffff" opacity={0.35} />
                          </TouchableOpacity>
                       )}
                       <TouchableOpacity onPress={() => onOriginChange("")} hitSlop={8}>
                         <X size={16} color="rgba(255,255,255,0.5)" />
                       </TouchableOpacity>
                     </>
                   ) : (
                     <Search size={16} color="rgba(255,255,255,0.3)" />
                   )}
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
                        onEdit={isFav ? () => handleTriggerEdit(item) : undefined}
                        onDelete={isFav ? () => handleDeleteFavorite(item) : undefined}
                      />
                    );
                  }}
                />
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {/* ✍️ MODAL DE EDICÃO DE FAVORITOS PREMIUM */}
      <Modal
        visible={editModalVisible}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ backgroundColor: 'rgba(0,0,0,0.65)' }} className="flex-1 justify-center items-center px-6">
          <View className="bg-[#091A2F] border border-white/10 rounded-3xl w-full overflow-hidden shadow-2xl max-w-xs">
            {/* Neon Bar Accent */}
            <View className="h-[3px] w-full bg-[#02de95]" />
            
            <View className="p-5">
              <Text className="text-white text-base font-black mb-1">
                Editar Favorito
              </Text>
              <Text className="text-white/50 text-xs mb-4 leading-tight">
                Modifique as informações deste local.
              </Text>
              
              {/* Apelido Field */}
              <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-1.5 ml-1">
                Nome / Apelido
              </Text>
              <View className="h-11 bg-white/5 border border-white/10 rounded-xl flex-row items-center px-3 mb-3">
                <TextInput
                  value={editingName}
                  onChangeText={setEditingName}
                  placeholder="Ex: Minha Casa, Trabalho..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  className="flex-1 text-white text-sm font-bold h-full p-0"
                  autoFocus
                />
              </View>

              {/* Endereço Field */}
              <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-1.5 ml-1">
                Endereço Completo
              </Text>
              <View className="h-16 bg-white/5 border border-white/10 rounded-xl px-3 py-2 mb-5">
                <TextInput
                  value={editingAddress}
                  onChangeText={setEditingAddress}
                  placeholder="Rua, Número, Bairro..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  className="flex-1 text-white text-xs font-semibold h-full p-0"
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>
              
              <View className="flex-row items-center gap-2">
                <TouchableOpacity 
                  onPress={() => setEditModalVisible(false)}
                  className="flex-1 h-10 bg-white/5 border border-white/5 rounded-xl items-center justify-center"
                >
                  <Text className="text-white/60 font-bold text-xs">Voltar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleSaveEdit}
                  disabled={isActionLoading}
                  className="flex-1 h-10 bg-[#02de95] rounded-xl items-center justify-center shadow-lg shadow-[#02de95]/20"
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="#091A2F" />
                  ) : (
                    <Text className="text-[#091A2F] font-extrabold text-xs">Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🔥 MODAL DE EXCLUSÃO DE FAVORITOS PREMIUM */}
      <Modal
        visible={deleteModalVisible}
        animationType="fade"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} className="flex-1 justify-center items-center px-6">
          <View className="bg-[#091A2F] border border-white/10 rounded-3xl w-full overflow-hidden shadow-2xl max-w-xs">
            {/* Red Neon Bar Accent */}
            <View className="h-[3px] w-full bg-[#ef4444]" />
            
            <View className="p-5 items-center">
              <View className="w-12 h-12 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-full items-center justify-center mb-3">
                <Trash2 size={20} color="#ef4444" />
              </View>

              <Text className="text-white text-base font-black mb-1 text-center">
                Excluir Favorito
              </Text>
              <Text className="text-white/60 text-xs mb-5 text-center leading-relaxed px-1">
                Tem certeza que deseja remover "<Text className="text-white font-extrabold">{deletingFav?.name}</Text>" dos favoritos?
              </Text>
              
              <View className="flex-row items-center gap-2 w-full">
                <TouchableOpacity 
                  onPress={() => setDeleteModalVisible(false)}
                  className="flex-1 h-10 bg-white/5 border border-white/5 rounded-xl items-center justify-center"
                >
                  <Text className="text-white/60 font-bold text-xs">Voltar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={confirmDeleteFavorite}
                  disabled={isActionLoading}
                  className="flex-1 h-10 bg-[#ef4444] rounded-xl items-center justify-center shadow-lg shadow-[#ef4444]/20"
                >
                  {isActionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-extrabold text-xs">Excluir</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </MotiView>
  );
};
