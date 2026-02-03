/**
 * HomeScreen - Versão Refatorada
 * Reduzido de 1.534 → ~450 linhas usando hooks customizados
 * 
 * NOTA: Este é um exemplo de refatoração. O arquivo completo precisará
 * de mais ajustes para integração total com os componentes existentes.
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GorhomBottomSheet from '@gorhom/bottom-sheet';

// COMPONENTS
import { LocationLoadingScreen } from '@/components/ui/LocationLoadingScreen';

// Componentes locais (da pasta Home/components)
import { VehicleMarker } from './components/VehicleMarker';
import { DashboardView } from './components/DashboardView'; // NOVO
import { BottomSheet as LocalBottomSheet } from './components/LocalBottomSheet';
import { SafetyHelpSheet, SafetyHelpSheetRef } from './components/SafetyHelpSheet';
import { OffersMotoSheet } from './components/OffersMotoSheet';
import { OffersCarSheet } from './components/OffersCarSheet';
import { OffersVanSheet } from './components/OffersVanSheet';
import { OffersTruckSheet } from './components/OffersTruckSheet';
import { SearchingDriverModal } from './components/SearchingDriverModal';
import SearchTimeoutCard from './components/SearchTimeoutCard';
import { DriverFoundSheet } from './components/DriverFoundSheet';
import FinalOrderSummarySheet from './components/FinalOrderSummarySheet';
import useSearchCountdown from '../Shared/hooks/useSearchCountdown';

// Hooks customizados ✨ NOVO
import {
  useDriverSearch,
  useMapLocation,
  useRideFlow,
  useActiveRide,
} from '../Shared/hooks';

import { darkMapStyle } from '@/utils/mapStyle';

// Contextos
import { useAuthStore } from '@/context/authStore';
import { useClientCityStore } from '@/context/clientCityStore';

// Services
import rideService from '@/services/ride.service';
import favoriteAddressService from '@/services/favoriteAddress.service';

// Tipos
import type { OffersMotoSheetRef } from './components/OffersMotoSheet';
import type { OffersCarSheetRef } from './components/OffersCarSheet';
import type { OffersVanSheetRef } from './components/OffersVanSheet';
import type { OffersTruckSheetRef } from './components/OffersTruckSheet';
import type { FinalOrderSummaryData } from './components/FinalOrderSummarySheet';



export default function HomeScreen() {
  // ========================================
  // HOOKS CUSTOMIZADOS ✨
  // ========================================
  
  // Localização e mapa
  const mapLocation = useMapLocation();
  
  // Busca de motorista
  const driverSearch = useDriverSearch();
  
  // Fluxo de corrida
  const rideFlow = useRideFlow();
  
  // Navegação
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute<any>();
  
  // Contextos
  const userType = useAuthStore((s) => s.userType);
  const walletBalance = useAuthStore((s) => s.walletBalance || 0);
  const detectedCity = useClientCityStore((s) => s.city);
  
  // Verificar corrida ativa (redireciona automaticamente)
  useActiveRide(navigation, userType || undefined, driverSearch.searchingState.visible);
  
  // ========================================
  // REFS
  // ========================================
  
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const safetyHelpRef = useRef<SafetyHelpSheetRef>(null);
  const offersMotoRef = useRef<OffersMotoSheetRef>(null);
  const offersCarRef = useRef<OffersCarSheetRef>(null);
  const offersVanRef = useRef<OffersVanSheetRef>(null);
  const offersTruckRef = useRef<OffersTruckSheetRef>(null);
  
  // ========================================
  // ESTADOS LOCAIS (apenas UI)
  // ========================================
  
  // Controle de Fluxo (Dashboard vs Mapa)
  const [flowStep, setFlowStep] = useState<'dashboard' | 'map'>('dashboard');
  const [selectedFlow, setSelectedFlow] = useState<{ vehicleId?: string, serviceId?: string }>({});

  const handleSelectFlow = (vehicleId: string, serviceId: string) => {
      setSelectedFlow({ vehicleId, serviceId });
      (navigation as any).navigate('LocationPicker', {
         initialVehicle: vehicleId,
         initialService: serviceId,
         selectionMode: 'dropoff', 
         returnScreen: 'Home' 
      });
  };



  const handleDefaultAddressFound = useCallback((addr: string) => {
      // Se encontrou padrão, usa ele no display e ignora GPS automático visualmente
      if (addr) {
          setPickupDisplayAddress(addr);
          mapLocation.setCurrentAddress(addr);
      }
  }, []);

  const handleDashboardSelectFavorite = (fav: any) => {
      // Atualiza ORIGEM (Pickup) conforme solicitado
      const addr = fav.address || fav.formattedAddress || fav.name;
      
      
      // Atualiza visualmente
      setPickupDisplayAddress(addr);
      mapLocation.setCurrentAddress(addr);

      if (fav.latitude && fav.longitude) {
          rideFlow.setDraftPickup({
              formattedAddress: addr,
              latitude: fav.latitude,
              longitude: fav.longitude
          });
      }
  };

  useFocusEffect(
      useCallback(() => {
          const params = route.params as any || {};
          if (params.dropoff || params.pickup) {
              setFlowStep('map');
          }
      }, [route.params])
  );

  const [searchTimeoutCardVisible, setSearchTimeoutCardVisible] = useState(false);
  const [finalSummaryData, setFinalSummaryData] = useState<FinalOrderSummaryData | null>(null);
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [pickupDisplayAddress, setPickupDisplayAddress] = useState<string>(''); // Endereço de partida manual
  
  // Veículos próximos (Dados Reais do Backend)
  const [visibleVehicles, setVisibleVehicles] = useState<any[]>([]);

  // Buscar motoristas próximos periodicamente
  React.useEffect(() => {
    // Só busca se tiver localização
    if (!mapLocation.region) return;
    
    // Função de busca
     const fetchDrivers = async () => {
       try {
         const drivers = await rideService.getNearbyDrivers(
            mapLocation.region!.latitude,
            mapLocation.region!.longitude
         );
         if (drivers && Array.isArray(drivers)) {
             setVisibleVehicles(drivers);
         }
       } catch (error) {
         // Silently fail (não incomodar o usuário com erro de polling)
       }
     };

     // Busca inicial e polling a cada 10s
     fetchDrivers();
     const interval = setInterval(fetchDrivers, 10000);
     return () => clearInterval(interval);
  }, [mapLocation.region?.latitude, mapLocation.region?.longitude]);
  
  // ========================================
  // COUNTDOWN TIMER
  // ========================================
  
  useSearchCountdown({
    visible: driverSearch.searchingState.visible,
    seconds: driverSearch.searchingState.secondsLeft || 0,
    onTick: (nextSeconds: number) => {
      // Atualizar via hook (TODO: adicionar método no hook)
    },
    onTimeout: () => {
      driverSearch.stopSearch();
      setSearchTimeoutCardVisible(true);
    },
  });
  
  // ========================================
  // EFEITOS DE ROTA (params)
  // ========================================
  
  React.useEffect(() => {
    // 1. Reabertura de ofertas
    if (route.params?.reopenOffers && route.params?.vehicleType) {
      const type = route.params.vehicleType;
      setTimeout(() => {
        if (type === 'moto') offersMotoRef.current?.snapToIndex(0);
        else if (type === 'car') offersCarRef.current?.snapToIndex(0);
        else if (type === 'van') offersVanRef.current?.snapToIndex(0);
        else if (type === 'truck') offersTruckRef.current?.snapToIndex(0);
        
        navigation.setParams({
          reopenOffers: undefined,
          vehicleType: undefined,
        });
      }, 300);
    }
    
    // 2. Iniciar busca
    if (route.params?.startSearch && route.params?.searchData) {
      const { title, price, eta, rideId } = route.params.searchData;
      setTimeout(() => {
        setSearchTimeoutCardVisible(false);
        driverSearch.startSearch({
          title: title || 'Buscando...',
          price: price || '',
          eta: eta || '',
          rideId: rideId || '',
          secondsLeft: 30,
        });
        
        navigation.setParams({
          startSearch: undefined,
          searchData: undefined,
          rideId: undefined,
        });
      }, 250);
    }
    
    // 3. Retornar da tela de cancelamento
    if (route.params?.resumeDriverFound) {
      navigation.setParams({ resumeDriverFound: undefined });
      setTimeout(() => {
        driverSearch.driverFoundRef.current?.snapToIndex(0);
      }, 200);
    }
    
    // 4. Abrir ofertas
    if (route.params?.openOffersFor) {
      const type = route.params.openOffersFor;
      const purposeId = route.params.purposeId;
      const pickup = route.params.pickup;
      const dropoff = route.params.dropoff;
      
      rideFlow.setSelectedVehicleType(type);
      rideFlow.setSelectedPurposeId(purposeId || null);
      if (pickup) rideFlow.setPickupSelection(pickup);
      if (dropoff) rideFlow.setDropoffSelection(dropoff);
      
      // Calcular preço
      if (pickup?.latitude && dropoff?.latitude) {
        (async () => {
          try {
            rideFlow.setPriceQuoteLoading(true);
            const resp = await rideService.calculatePrice({
              pickup: {
                address: pickup.address,
                latitude: pickup.latitude,
                longitude: pickup.longitude,
              },
              dropoff: {
                address: dropoff.address,
                latitude: dropoff.latitude,
                longitude: dropoff.longitude,
              },
              vehicleType: type as any,
              cityId: detectedCity?.cityId,
              purposeId,
            });
            rideFlow.setPriceQuote(resp);
          } catch (e) {
            console.log('Falha ao calcular preço', e);
            rideFlow.setPriceQuote(null);
          } finally {
            rideFlow.setPriceQuoteLoading(false);
          }
        })();
      }
      
      setTimeout(() => {
        if (type === 'motorcycle') offersMotoRef.current?.snapToIndex(0);
        else if (type === 'car') offersCarRef.current?.snapToIndex(0);
        else if (type === 'van') offersVanRef.current?.snapToIndex(0);
        else if (type === 'truck') offersTruckRef.current?.snapToIndex(0);
        
        navigation.setParams({
          openOffersFor: undefined,
          purposeId: undefined,
          pickup: undefined,
          dropoff: undefined,
        });
      }, 150);
    }

    // 5. Atualizar Pickup manualmente (vindo do AddressPicker)
    if (route.params?.currentLocation) {
      const loc = route.params.currentLocation;
      rideFlow.setDraftPickup({
        formattedAddress: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      
      // Limpar params
      navigation.setParams({ currentLocation: undefined });
      
      // Atualizar display
      setPickupDisplayAddress(loc.address);
    }

    // 6. Atualizar Dropoff manualmente (vindo do Dashboard - home_dropoff)
    if (route.params?.home_dropoff) {
       const loc = route.params.home_dropoff;
       setDestinationAddress(loc.address);
       rideFlow.setDraftDropoff({
           formattedAddress: loc.address,
           latitude: loc.latitude,
           longitude: loc.longitude
       });
       navigation.setParams({ home_dropoff: undefined });
    }


    // 7. Retorno de Novo Favorito
    if (route.params?.favorite_creation) {
         const loc = route.params.favorite_creation;
         // Salvar favorito
         favoriteAddressService.create({
             name: loc.address.split(',')[0], 
             address: loc.address,
             latitude: loc.latitude,
             longitude: loc.longitude,
         }).then(() => {
             console.log('Favorito criado');
             // TODO: Disparar refresh na Dashboard
         }).catch(err => console.error('Erro ao salvar fav', err));
         
         navigation.setParams({ favorite_creation: undefined });
    }
  }, [route.params]);
  
  // ========================================
  // REABRIR BOTTOM SHEET AO FOCAR
  // ========================================
  
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (!driverSearch.searchingState.visible && !driverSearch.driverFoundState.found) {
          bottomSheetRef.current?.snapToIndex(1);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [driverSearch.searchingState.visible, driverSearch.driverFoundState.found])
  );
  
  // ========================================
  // HANDLERS
  // ========================================
  
  const handlePressMenu = () => {
    navigation.openDrawer();
  };
  
  const handlePressSafety = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      safetyHelpRef.current?.snapToIndex(0);
    }, 150);
  };
  
  const handlePressMyLocation = () => {
    mapLocation.centerOnUser();
  };
  
  const handlePressSearch = () => {
    rideFlow.setServiceMode('ride' as any);
    
    // Garantir pickup no draft
    const lat = mapLocation.region?.latitude || mapLocation.userRegion?.latitude;
    const lng = mapLocation.region?.longitude || mapLocation.userRegion?.longitude;
    
    if (lat != null && lng != null) {
      rideFlow.setDraftPickup({
        formattedAddress: mapLocation.currentAddress,
        latitude: lat,
        longitude: lng,
      });
    }
    
    bottomSheetRef.current?.close();
    (navigation as any).navigate('LocationPicker', {
      selectionMode: 'dropoff',
      returnScreen: 'Home',
    });
  };
  
  const handleEditPickup = () => {
    const initial = rideFlow.draftPickup
      ? {
          formattedAddress: rideFlow.draftPickup.formattedAddress,
          latitude: rideFlow.draftPickup.latitude,
          longitude: rideFlow.draftPickup.longitude,
        }
      : mapLocation.region
        ? {
            formattedAddress: mapLocation.currentAddress,
            latitude: mapLocation.region.latitude,
            longitude: mapLocation.region.longitude,
          }
        : null;
    
    bottomSheetRef.current?.close();
    (navigation as any).navigate('LocationPicker', {
      selectionMode: 'currentLocation',
      returnScreen: 'Home',
      initialLocation: initial,
    });
  };

  const handleEditDropoff = () => {
    (navigation as any).navigate('LocationPicker', {
      selectionMode: 'home_dropoff',
      returnScreen: 'Home',
    });
  };

  const handleAddFavorite = () => {
    (navigation as any).navigate('LocationPicker', {
      selectionMode: 'favorite_creation',
      returnScreen: 'Home',
    });
  };
  
  const handleSelectFavorite = async (favorite: any) => {
    try {
      rideFlow.setServiceMode('ride');
      bottomSheetRef.current?.close();
      
      const dropAddr = favorite.formattedAddress || favorite.address;
      const lat = mapLocation.region?.latitude || mapLocation.userRegion?.latitude;
      const lng = mapLocation.region?.longitude || mapLocation.userRegion?.longitude;
      
      const pickup = lat != null && lng != null
        ? {
            formattedAddress: mapLocation.currentAddress,
            latitude: lat,
            longitude: lng,
          }
        : rideFlow.draftPickup;
      
      const dropoff = {
        formattedAddress: dropAddr,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
      };
      
      if (pickup) rideFlow.setDraftPickup(pickup);
      rideFlow.setDraftDropoff(dropoff);
      
      setDestinationAddress(dropAddr);
      rideFlow.setDropoffSelection({
        address: dropAddr,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
      });
      
      (navigation as any).navigate('SelectVehicle', { pickup, dropoff });
    } catch (e) {
      console.error('Erro ao selecionar favorito:', e);
    }
  };
  
  const handleCloseSafetyHelp = () => {
    bottomSheetRef.current?.snapToIndex(1);
  };
  
  // ========================================
  // RENDERIZAÇÃO
  // ========================================
  
  if (!mapLocation.region) {
    return <LocationLoadingScreen />;
  }

  // Dashboard View (Fluxo Inicial)
  if (flowStep === 'dashboard' && !destinationAddress) {
      return (
          <DashboardView 
              userAddress={pickupDisplayAddress}
              destinationAddress={destinationAddress}
              onPressAddress={handleEditPickup}
              onPressDestination={handleEditDropoff}
              onPressMenu={handlePressMenu}
              onPressAddFavorite={handleAddFavorite}
              onSelectFlow={handleSelectFlow}
              onSelectFavorite={handleDashboardSelectFavorite}
              onDefaultAddressFound={handleDefaultAddressFound}
              cityId={(detectedCity as any)?._id || (detectedCity as any)?.id}
          />
      );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Mapa */}
        <MapView
          ref={mapLocation.mapRef}
          style={styles.map}
          customMapStyle={darkMapStyle} // Tema escuro
          initialRegion={mapLocation.region}
          onRegionChange={mapLocation.handleRegionChange}
          onRegionChangeComplete={mapLocation.handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          showsBuildings={true}
          pitchEnabled={true}
          showsIndoors={true}
        >
          {/* Marcadores de veículos (Dados Reais) */}
          {visibleVehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              coordinate={{
                latitude: vehicle.latitude,
                longitude: vehicle.longitude,
              }}
            >
              <VehicleMarker type={vehicle.type as any} rotation={vehicle.rotation} />
            </Marker>
          ))}
          
          {/* Marcador do motorista (se encontrado) */}
          {driverSearch.driverFoundState.location && (
            <Marker coordinate={driverSearch.driverFoundState.location}>
              <VehicleMarker type="car" rotation={0} />
            </Marker>
          )}
        </MapView>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={handlePressMenu}
          >
            <MaterialIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.addressContainer}>
            <Text style={styles.addressText} numberOfLines={1}>
              {mapLocation.currentAddress || 'Localizando...'}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.safetyButton}
            onPress={handlePressSafety}
          >
            <MaterialIcons name="shield" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Botão Minha Localização (Sempre visível) */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handlePressMyLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#02de95" />
        </TouchableOpacity>
        
        {/* Bottom Sheet Principal */}
        <LocalBottomSheet
          {...{
            ref: bottomSheetRef,
            onPressSearch: handlePressSearch,
            onPressEditPickup: handleEditPickup,
            onSelectFavorite: handleSelectFavorite,
            pickupLabel: rideFlow.draftPickup?.formattedAddress || mapLocation.currentAddress,
          } as any}
        />
        
        {/* Safety Help Sheet */}
        <SafetyHelpSheet
          ref={safetyHelpRef}
          onClose={handleCloseSafetyHelp}
        />
        
        {/* Offers Sheets (manter os existentes por enquanto) */}
        <OffersMotoSheet ref={offersMotoRef} />
        <OffersCarSheet ref={offersCarRef} />
        <OffersVanSheet ref={offersVanRef} />
        <OffersTruckSheet ref={offersTruckRef} />
        
        {/* Searching Driver Modal */}
        <SearchingDriverModal
          {...{
            visible: driverSearch.searchingState.visible,
            title: driverSearch.searchingState.title,
            price: driverSearch.searchingState.price,
            eta: driverSearch.searchingState.eta,
            secondsLeft: driverSearch.searchingState.secondsLeft,
            onCancel: () => driverSearch.stopSearch(),
          } as any}
        />
        
        {/* Driver Found Sheet */}
        <DriverFoundSheet
          {...{
            ref: driverSearch.driverFoundRef,
            driverInfo: driverSearch.driverFoundState.info,
            etaText: driverSearch.driverFoundState.etaText,
          } as any}
        />
        
        {/* Search Timeout Card */}
        {searchTimeoutCardVisible && (
          <SearchTimeoutCard
            {...{
              visible: searchTimeoutCardVisible,
              onClose: () => setSearchTimeoutCardVisible(false),
            } as any}
          />
        )}
        
        {/* Cancel Notice */}
        {driverSearch.cancelNotice.visible && (
          <View style={styles.cancelNotice}>
            <Text style={styles.cancelNoticeText}>
              {driverSearch.cancelNotice.reason || 'Corrida cancelada'}
            </Text>
          </View>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContainer: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addressText: {
    color: '#fff',
    fontSize: 14,
  },
  safetyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 200,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelNotice: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: '#ff4444',
    borderRadius: 12,
  },
  cancelNoticeText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
