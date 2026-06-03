import React, { useState, useEffect, useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Keyboard, Modal, Alert } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { Navigation, MapPin, X, Search, Heart, Trash2, AlertTriangle, ArrowUpDown } from "lucide-react-native";
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
  onSwap?: () => void;
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
  onSwap,
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
  const [animatingSwap, setAnimatingSwap] = useState(false);
  const [rotated, setRotated] = useState(false);

  const handleSwapPress = () => {
    if (animatingSwap) return;
    setAnimatingSwap(true);
    setRotated(prev => !prev);
    onSwap?.();
    setTimeout(() => {
      setAnimatingSwap(false);
    }, 350);
  };

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

  const isOriginFavorite = favorites.some(fav => {
    const favAddr = (fav.formattedAddress || fav.address || "").trim().toLowerCase();
    const inpAddr = originText.trim().toLowerCase();
    return inpAddr.length > 0 && favAddr === inpAddr;
  });

  const isDestinationFavorite = favorites.some(fav => {
    const favAddr = (fav.formattedAddress || fav.address || "").trim().toLowerCase();
    const inpAddr = destinationText.trim().toLowerCase();
    return inpAddr.length > 0 && favAddr === inpAddr;
  });

  // 🧠 Smart Concatenation & Filter: Mantém favoritos visíveis no topo junto com resultados de busca!
  const combinedList = useMemo(() => {
    const typed = (activeField === 'origin' ? originText : destinationText) || "";
    
    // Se nada estiver digitado, mostra todos os favoritos
    if (!typed.trim()) return favorites;

    const term = typed.toLowerCase();
    const filteredFavorites = favorites.filter(f => 
      f.name.toLowerCase().includes(term) ||
      (f.formattedAddress || f.address || "").toLowerCase().includes(term)
    );

    // Concatena os favoritos filtrados no topo e os resultados do Google logo abaixo!
    return [...filteredFavorites, ...results];
  }, [favorites, results, activeField, originText, destinationText]);

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="px-6 mt-4 z-[100]"
    >
      <View className="shadow-2xl shadow-black elevation-12">
        {/* 🎨 SOLIDIFIED BACKGROUND (Anti-transparency Fix) */}
        <View className="rounded-3xl bg-white border border-slate-200 overflow-hidden p-4 relative">
          {/* Light Glow overlay simulation */}
          <View className="absolute inset-0 border border-slate-100 rounded-3xl pointer-events-none" />

          <View className="flex-row items-center">
            {/* Column 1: Pins, connecting line and Swap button in the center */}
            <View className="w-8 items-center justify-between relative" style={{ height: 96, paddingVertical: 10 }}>
              <MapPin size={18} color="#02de95" fill="#02de95" />
              <View className="flex-1 w-[1px] border-l border-dashed border-slate-300 my-1.5" />
              <MapPin size={18} color="#ef4444" fill="#ef4444" />

              {onSwap && (
                <TouchableOpacity
                  onPress={handleSwapPress}
                  className="absolute bg-white items-center justify-center"
                  style={{ 
                    top: 38, // (96 / 2) - 10
                    left: 6,  // (32 / 2) - 10
                    height: 20,
                    width: 20,
                    zIndex: 10,
                  }}
                  activeOpacity={0.7}
                  hitSlop={15}
                >
                  <MotiView
                    animate={{
                      rotate: rotated ? "180deg" : "0deg"
                    }}
                    transition={{
                      type: "timing",
                      duration: 300
                    }}
                  >
                    <ArrowUpDown size={16} color="#64748b" />
                  </MotiView>
                </TouchableOpacity>
              )}
            </View>

            {/* Column 2: Inputs */}
            <View className="flex-1 gap-2">
              {/* Origin Group (NOW EDITABLE 🚀) */}
              <MotiView
                animate={{
                  translateY: animatingSwap ? 52 : 0
                }}
                transition={{
                  type: "timing",
                  duration: 300
                }}
                style={{ zIndex: animatingSwap ? 10 : 1 }}
                className={`h-11 bg-slate-50 border ${activeField === 'origin' ? 'border-[#02de95]/50' : 'border-slate-200'} rounded-xl flex-row items-center px-3`}
              >
                <TextInput
                  value={originText}
                  onChangeText={onOriginChange}
                  placeholder="Local de Coleta"
                  placeholderTextColor="rgba(15,23,42,0.4)"
                  className="flex-1 text-slate-800 text-sm h-full p-0 pr-4 font-medium"
                  autoFocus={!originText}
                  onFocus={() => {
                     setActiveField('origin');
                     setShowDrop(true);
                  }}
                  returnKeyType="search"
                />
                
                <View className="flex-row items-center gap-2 ml-3">
                  {activeField === 'origin' && loading && <ActivityIndicator size="small" color="#02de95" />}
                  {originText.length > 0 ? (
                     <>
                       {onFavoriteOrigin && (
                          <TouchableOpacity onPress={onFavoriteOrigin} hitSlop={8}>
                            <Heart 
                              size={15} 
                              color={isOriginFavorite ? "#ef4444" : "#64748b"} 
                              fill={isOriginFavorite ? "#ef4444" : "transparent"}
                              opacity={isOriginFavorite ? 1 : 0.5} 
                            />
                          </TouchableOpacity>
                       )}
                       <TouchableOpacity onPress={() => onOriginChange("")} hitSlop={8}>
                         <X size={16} color="rgba(15,23,42,0.5)" />
                       </TouchableOpacity>
                     </>
                   ) : (
                     <Search size={16} color="rgba(15,23,42,0.4)" />
                   )}
                </View>
              </MotiView>

              {/* Destination Group */}
              <MotiView
                animate={{
                  translateY: animatingSwap ? -52 : 0
                }}
                transition={{
                  type: "timing",
                  duration: 300
                }}
                style={{ zIndex: animatingSwap ? 10 : 1 }}
                className={`h-11 bg-slate-50 border ${activeField === 'destination' ? 'border-red-400/50' : 'border-slate-200'} rounded-xl flex-row items-center px-3`}
              >
                <TextInput
                  value={destinationText}
                  onChangeText={onDestinationChange}
                  placeholder="Insira o destino"
                  placeholderTextColor="rgba(15,23,42,0.4)"
                  className="flex-1 text-slate-800 text-sm h-full p-0 pr-4 font-medium"
                  onFocus={() => {
                    setActiveField('destination');
                    setShowDrop(true);
                  }}
                  returnKeyType="search"
                />
                
                <View className="flex-row items-center gap-2 ml-3">
                  {activeField === 'destination' && loading && <ActivityIndicator size="small" color="#02de95" />}
                  
                  {destinationText.length > 0 ? (
                    <>
                      {onFavoriteDestination && (
                         <TouchableOpacity onPress={onFavoriteDestination} hitSlop={8}>
                           <Heart 
                             size={15} 
                             color={isDestinationFavorite ? "#ef4444" : "#64748b"} 
                             fill={isDestinationFavorite ? "#ef4444" : "transparent"}
                             opacity={isDestinationFavorite ? 1 : 0.5} 
                           />
                         </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => onDestinationChange("")}>
                        <X size={16} color="rgba(15,23,42,0.5)" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Search size={16} color="rgba(15,23,42,0.4)" />
                  )}
                </View>
              </MotiView>
            </View>
          </View>
        </View>

        {/* DROPDOWN RESULTS: UNIFIED FAVORITES + GOOGLE SUGGESTIONS */}
        <AnimatePresence>
          {showDrop && activeField && combinedList.length > 0 && (
            <MotiView
              from={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 300 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 rounded-2xl overflow-hidden shadow-2xl shadow-black"
            >
              <View className="flex-1 bg-white border border-slate-200">
                {results.length === 0 && favorites.length > 0 && (
                  <View className="px-4 pt-3 pb-1">
                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Seus Favoritos</Text>
                  </View>
                )}
                
                <FlatList
                  data={combinedList}
                  keyExtractor={(i: any, index) => (i.placeId || i._id || index.toString())}
                  keyboardShouldPersistTaps="handled"
                  ItemSeparatorComponent={() => <View className="h-[1px] bg-slate-100 mx-4" />}
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
