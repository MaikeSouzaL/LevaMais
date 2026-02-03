import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Text, TextInput, Alert, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Region } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';

// Design System
import { colors } from '@/theme';

// Componentes Compartilhados
import { LoadingButton } from '../../../Shared/components';
import AddressAutocomplete from '../../../../../../components/AddressAutocomplete'; 

// Hooks, Services e Utils
import { useMapLocation } from '../../../Shared/hooks';
import { darkMapStyle } from '@/utils/mapStyle';
import googlePlacesService from '@/services/googlePlaces.service';
import favoriteAddressService from '@/services/favoriteAddress.service';

export default function AddressPickerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectionMode, returnScreen, initialLocation, favoriteId, favoriteData, initialVehicle, initialService } = (route.params as any) || {};
  const isEditMode = !!favoriteId;
  
  const mapLocation = useMapLocation();
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // O endereço texto exibido no input
  const [selectedAddress, setSelectedAddress] = useState(favoriteData?.address || initialLocation?.formattedAddress || '');
  
  // Coordenada central atual
  const initialRegion = (favoriteData || initialLocation) ? {
       latitude: favoriteData?.latitude || initialLocation.latitude,
       longitude: favoriteData?.longitude || initialLocation.longitude,
       latitudeDelta: 0.002,
       longitudeDelta: 0.002,
  } : mapLocation.region;

  // Referência para evitar loop de geocoding quando seleciona via autocomplete
  const isSelectingRef = useRef(false);

  // Estados para Favoritar
  const [modalVisible, setModalVisible] = useState(false);
  const [favName, setFavName] = useState(favoriteData?.name || '');
  const [savingFav, setSavingFav] = useState(false);
  
  // Estado para detalhes completos do endereço (para enviar ao backend com riqueza)
  const [addressDetails, setAddressDetails] = useState<any>(favoriteData || initialLocation || null);

  // Efeito para carregar dados se for edição (caso não tenham vindo via params completos)
  useEffect(() => {
    if (isEditMode && !favoriteData) {
        favoriteAddressService.list().then(favs => {
            const fav = favs.find(f => f._id === favoriteId);
            if (fav) {
                setFavName(fav.name);
                setSelectedAddress(fav.address);
                setAddressDetails(fav);
                
                if (mapLocation.mapRef.current) {
                    mapLocation.mapRef.current.animateCamera({
                        center: { latitude: fav.latitude, longitude: fav.longitude },
                        zoom: 18
                    });
                }
            }
        });
    }
  }, [favoriteId]);

  // Efeito para centrar no initialLocation se vier
  useEffect(() => {
    if (initialLocation && mapLocation.mapRef.current) {
       mapLocation.mapRef.current.animateCamera({
         center: {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
         },
         pitch: 45, // Inclinação 3D
         heading: 0,
         zoom: 18, 
       }, { duration: 1000 });
    }
  }, [initialLocation]);

  // Efeito para aproximar zoom quando GPS detecta localização inicial
  useEffect(() => {
    if (!initialLocation && !favoriteData && mapLocation.region && mapLocation.mapRef.current) {
        mapLocation.mapRef.current.animateCamera({
            center: {
                latitude: mapLocation.region.latitude,
                longitude: mapLocation.region.longitude,
            },
            pitch: 45,
            heading: 0,
            zoom: 18,
        }, { duration: 1200 });
    }
  }, [mapLocation.region?.latitude]); 

  const handleSelectAddress = (details: any) => {
    isSelectingRef.current = true;
    setSelectedAddress(details.formattedAddress);
    setAddressDetails(details);
    
    let lat, lng;
    if (details.latitude && details.longitude) {
       lat = details.latitude;
       lng = details.longitude;
    } else if (details.geometry?.location) {
       lat = details.geometry.location.lat;
       lng = details.geometry.location.lng;
    }

    if (lat && lng) {
       mapLocation.mapRef.current?.animateCamera({
         center: { latitude: lat, longitude: lng },
         pitch: 45,
         heading: 0,
         zoom: 17.5,
       }, { duration: 1000 });
       
       setTimeout(() => { isSelectingRef.current = false; }, 1500);
    }
  };

  const onRegionChangeComplete = async (region: Region) => {
    mapLocation.handleRegionChangeComplete(region);
    
    if (isSelectingRef.current) return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
       try {
         const details = await googlePlacesService.reverseGeocode(region.latitude, region.longitude);
         if (details && details.formattedAddress) {
            setSelectedAddress(details.formattedAddress);
            setAddressDetails(details);
         }
       } catch (error) {
         console.log("Erro ao obter endereço reverso:", error);
       }
    }, 800);
  };

  const handleConfirm = () => {
    if (isEditMode) {
        setModalVisible(true);
        return;
    }

    const center = mapLocation.region;
    if (!center) return;

    (navigation as any).navigate(returnScreen || 'Home', {
      [selectionMode]: {
        address: selectedAddress || 'Local selecionado no mapa',
        latitude: center.latitude,
        longitude: center.longitude,
      },
      initialVehicle,
      initialService
    });
  };

  const handleOpenFavModal = () => {
      setFavName('');
      setModalVisible(true);
  };

  const handleSaveFavorite = async () => {
      if (!favName.trim()) {
          Alert.alert('Atenção', 'Digite um nome para o favorito (ex: Casa).');
          return;
      }

      const center = mapLocation.region;
      if (!center || !selectedAddress) {
          Alert.alert('Erro', 'Localização inválida.');
          return;
      }

      try {
          setSavingFav(true);
          
          if (isEditMode) {
              await favoriteAddressService.update(favoriteId, {
                  name: favName,
                  address: selectedAddress,
                  formattedAddress: selectedAddress,
                  street: addressDetails?.street,
                  streetNumber: addressDetails?.streetNumber,
                  neighborhood: addressDetails?.neighborhood,
                  city: addressDetails?.city,
                  state: addressDetails?.state,
                  postalCode: addressDetails?.postalCode,
                  latitude: center.latitude,
                  longitude: center.longitude,
              });
          } else {
              await favoriteAddressService.create({
                  name: favName,
                  address: selectedAddress,
                  formattedAddress: selectedAddress,
                  street: addressDetails?.street,
                  streetNumber: addressDetails?.streetNumber,
                  neighborhood: addressDetails?.neighborhood,
                  city: addressDetails?.city,
                  state: addressDetails?.state,
                  postalCode: addressDetails?.postalCode,
                  latitude: center.latitude,
                  longitude: center.longitude,
                  icon: 'place', 
              });
          }
          
          setModalVisible(false);
          
          if (selectionMode === 'favorite_creation' || isEditMode) {
              // Se o fluxo era apenas criar/editar favorito, voltamos direto
              navigation.navigate(returnScreen || 'Home' as any, { 
                  favorite_creation: true 
              });
          } else {
              Alert.alert('Sucesso', 'Endereço salvo nos favoritos!');
          }
      } catch (error: any) {
          console.log(error); 
          const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Erro desconhecido';
          Alert.alert('Erro ao Salvar', `O servidor retornou: ${errorMessage}`);
      } finally {
          setSavingFav(false);
      }
  };

  // Se ainda não temos localização, mostra Loading
  if (!initialRegion) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#02de95" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <MapView
            ref={mapLocation.mapRef}
            style={styles.map}
            customMapStyle={darkMapStyle}
            initialRegion={initialRegion}
            onRegionChange={mapLocation.handleRegionChange}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
            showsBuildings={true}
            pitchEnabled={true}
            showsIndoors={true}
        />

        {/* Pin Fixo no Centro */}
        <View style={styles.centerMarkerContainer} pointerEvents="none">
            <MaterialIcons name="location-on" size={40} color="#02de95" style={{ marginBottom: 40 }} />
        </View>

        {/* Botão Voltar (Cancelar) */}
        <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
        >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Input de Busca */}
        <View style={styles.searchContainer}>
            <AddressAutocomplete
            query={selectedAddress}
            setQuery={setSelectedAddress}
            onSelect={handleSelectAddress}
            placeholder="Buscar endereço..."
            containerStyle={{ marginBottom: 0 }}
            />
        </View>

        <View style={styles.bottomPanel}>
            <View style={styles.dragHandle} />
            
            <View style={styles.addressRow}>
                 <View style={styles.locationIconBg}>
                     <MaterialIcons name="location-on" size={24} color="#02de95" />
                 </View>
                 <View style={styles.addressTexts}>
                     <Text style={styles.addressLabel}>Endereço selecionado</Text>
                     <Text style={styles.addressMain} numberOfLines={2}>
                         {selectedAddress || "Arraste o mapa para ajustar"}
                     </Text>
                 </View>
                 {/* Botão Salvar Favorito (Apenas para Origem ou Criação) */}
                 {['currentLocation', 'favorite_creation', 'pickup'].includes(selectionMode) && (
                    <TouchableOpacity 
                        onPress={handleOpenFavModal} 
                        style={styles.favBtnIcon}
                        activeOpacity={0.7}
                    >
                        <MaterialIcons name="add" size={28} color="#02de95" />
                    </TouchableOpacity>
                 )}
            </View>

            <View style={{ marginTop: 24 }}>
                <LoadingButton
                    title={
                        isEditMode 
                            ? "Atualizar Endereço" 
                            : (selectionMode?.includes('dropoff') ? "Confirmar Destino" : "Confirmar Localização")
                    }
                    onPress={handleConfirm}
                    variant="primary"
                />
            </View>
        </View>

        <Modal
            visible={modalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setModalVisible(false)}
        >
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{isEditMode ? 'Editar Favorito' : 'Salvar Favorito'}</Text>
                        <Text style={styles.modalSubtitle}>Dê um nome para este local:</Text>
                        
                        <TextInput 
                            value={favName}
                            onChangeText={setFavName}
                            placeholder="Ex: Casa, Trabalho, Academia"
                            placeholderTextColor="#6b8f8f"
                            style={styles.input}
                            autoFocus
                        />

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.modalBtnTextCancel}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.modalBtnSave]}
                                onPress={handleSaveFavorite}
                                disabled={savingFav}
                            >
                                {savingFav ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalBtnTextSave}>Salvar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  map: { ...StyleSheet.absoluteFillObject },
  centerMarkerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 16,
    zIndex: 20,
    backgroundColor: '#11253E', // Fundo escuro para contraste
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(2,222,149,0.3)', // Borda verde sutil
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  searchContainer: { position: 'absolute', top: 60, left: 16, right: 16, zIndex: 10 },
  
  bottomPanel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#11253E',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 34,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      elevation: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(2,222,149,0.1)'
  },
  dragHandle: {
      width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 2, alignSelf: 'center', marginBottom: 20
  },
  addressRow: { flexDirection: 'row', alignItems: 'center' },
  locationIconBg: {
      width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(2,222,149,0.1)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12
  },
  addressTexts: { flex: 1, marginRight: 8 },
  addressLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  addressMain: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  favBtnIcon: { 
      width: 44, height: 44, borderRadius: 12, 
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      padding: 24
  },
  modalContent: {
      backgroundColor: '#11253E',
      borderRadius: 16,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(2,222,149,0.2)',
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 8
  },
  modalSubtitle: {
      fontSize: 14,
      color: '#9abcb0',
      marginBottom: 16
  },
  input: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 8,
      padding: 12,
      color: '#fff',
      fontSize: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      marginBottom: 24
  },
  modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12
  },
  modalBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center'
  },
  modalBtnCancel: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnSave: {
      backgroundColor: '#02de95',
  },
  modalBtnTextCancel: {
      color: '#9abcb0',
      fontWeight: '600'
  },
  modalBtnTextSave: {
      color: '#091A2F',
      fontWeight: 'bold'
  }
});
