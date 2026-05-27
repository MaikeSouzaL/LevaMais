import React, { useState, useEffect } from "react";
import { View, Dimensions, StatusBar, Platform, Modal, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView } from "react-native";
import { Heart, X, Star, Info } from "lucide-react-native";
import favoriteAddressService from "@/services/favoriteAddress.service";
import Toast from "react-native-toast-message";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Car, Bike } from "lucide-react-native";

import { darkMapStyle } from "@/utils/mapStyle";
import { useMapLocation } from "../../../Shared/hooks/useMapLocation";
import { PlaceDetails } from "@/services/googlePlaces.service";

// Architectural UI Imports
import { DestinationHeader } from "@/components/client/destination/DestinationHeader";
import { FloatingSearchCard } from "@/components/client/destination/FloatingSearchCard";
import { RecentPlaces } from "@/components/client/destination/RecentPlaces";
import { RouteBottomCard } from "@/components/client/destination/RouteBottomCard";

import { MapActionButtons } from "@/components/MapActionButtons";

// Refined Realtime Core Mapping Imports 🚀
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";
import { PremiumDottedRoute } from "@/components/routes/PremiumDottedRoute";
import { MotiView } from "moti";

const { width, height } = Dimensions.get("window");
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface RealtimeVehicle {
  id: string;
  type: "car" | "motorcycle";
  lat: number;
  lng: number;
  rotation: number;
}

export default function DestinationSearchScreen({ navigation, route }: any) {
  const params = route.params || {};

  const { userRegion, currentAddress, region, mapRef, centerOnUser } = useMapLocation();

  // Map Operational Visual States & Handlers 🎨
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  const handleToggleMapStyle = () => {
    if (isSwitchingStyle) return;
    setIsSwitchingStyle(true);
    setUseDarkMap(prev => !prev);
    setTimeout(() => setIsSwitchingStyle(false), 350);
  };

  const handleCenterMyLocation = async () => {
    if (isCentering) return;
    setIsCentering(true);
    try {
      if (typeof centerOnUser === "function") {
        await centerOnUser();
      } else if (userRegion?.latitude && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: userRegion.latitude,
          longitude: userRegion.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }, 800);
      }
    } catch {}
    setTimeout(() => setIsCentering(false), 500);
  };

  const handleSOS = () => {
    try {
      navigation.navigate("SafetyCenter");
    } catch {
      Alert.alert("SOS", "Ativando modo de emergência do passageiro...");
    }
  };

  const [destinationTxt, setDestinationTxt] = useState(params.dropoff?.address || "");
  const [destinationDetails, setDestinationDetails] = useState<PlaceDetails | null>(
    params.dropoff
      ? {
          placeId: "predefined",
          formattedAddress: params.dropoff.address || "",
          latitude: Number(params.dropoff.latitude),
          longitude: Number(params.dropoff.longitude),
        }
      : null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  
  const [distanceStr, setDistanceStr] = useState("");
  const [durationStr, setDurationStr] = useState("");
  const [distanceRaw, setDistanceRaw] = useState<number | null>(null);
  const [durationRaw, setDurationRaw] = useState<number | null>(null);
  const [isReadyToContinue, setIsReadyToContinue] = useState(!!params.dropoff);
  const [vehicles, setVehicles] = useState<RealtimeVehicle[]>([]);

  // 🔥 Mutable Origin States
  const [originTxt, setOriginTxt] = useState(params.pickup?.address || "");
  const [originDetails, setOriginDetails] = useState<PlaceDetails | null>(
    params.pickup
      ? {
          placeId: "predefined",
          formattedAddress: params.pickup.address || "",
          latitude: Number(params.pickup.latitude),
          longitude: Number(params.pickup.longitude),
        }
      : null
  );

  // Preenche origem automaticamente se o usuário ainda não digitou nada
  useEffect(() => {
    if (!originDetails && !originTxt && currentAddress && userRegion) {
      setOriginTxt(currentAddress);
      setOriginDetails({
        placeId: "current",
        formattedAddress: currentAddress,
        latitude: userRegion.latitude,
        longitude: userRegion.longitude,
      });
    }
  }, [userRegion, currentAddress]);

  // Reset selected details and route readiness when user clears the search texts
  useEffect(() => {
    if (!destinationTxt.trim()) {
      setDestinationDetails(null);
      setIsReadyToContinue(false);
      setRouteCoordinates([]);
      setDistanceStr("");
      setDurationStr("");
      setDistanceRaw(null);
      setDurationRaw(null);
    }
  }, [destinationTxt]);

  useEffect(() => {
    if (!originTxt.trim()) {
      setOriginDetails(null);
    }
  }, [originTxt]);

  const origin = {
    latitude: originDetails?.latitude || userRegion?.latitude || region?.latitude || -23.55,
    longitude: originDetails?.longitude || userRegion?.longitude || region?.longitude || -46.63,
    address: originDetails?.formattedAddress || originTxt || currentAddress || "Local Atual",
  };

  // 🔥 Advanced Dynamic Favorites State
  const [favModalVisible, setFavModalVisible] = useState(false);
  const [favInputName, setFavInputName] = useState("");
  const [targetAddressToSave, setTargetAddressToSave] = useState<any>(null);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [showVerifTip, setShowVerifTip] = useState(true);

  const triggerFavoriteModal = (addrData: any) => {
    setTargetAddressToSave(addrData);
    setFavInputName(""); // reset
    setFavModalVisible(true);
  };

  const handleSaveFavorite = async () => {
    if (!favInputName.trim()) {
      Alert.alert("Atenção", "Por favor, dê um nome para este favorito.");
      return;
    }
    if (!targetAddressToSave) return;

    setIsSavingFav(true);
    try {
      await favoriteAddressService.create({
        name: favInputName.trim(),
        address: targetAddressToSave.address,
        formattedAddress: targetAddressToSave.address,
        latitude: Number(targetAddressToSave.latitude),
        longitude: Number(targetAddressToSave.longitude),
        icon: "place"
      });
      
      Toast.show({
        type: "success",
        text1: "Favorito salvo!",
        text2: `"${favInputName}" foi adicionado aos seus locais.`,
      });
      
      setFavModalVisible(false);
    } catch (err) {
      Alert.alert("Erro", "Não foi possível salvar o favorito no momento. Verifique sua conexão.");
    } finally {
      setIsSavingFav(false);
    }
  };

  useEffect(() => {
    const baseLat = userRegion?.latitude || origin.latitude;
    const baseLng = userRegion?.longitude || origin.longitude;
    const initialVehicles: RealtimeVehicle[] = [
      { id: "r_v1", type: "car", lat: baseLat + 0.0012, lng: baseLng + 0.001, rotation: 40 },
      { id: "r_v2", type: "motorcycle", lat: baseLat - 0.0018, lng: baseLng + 0.0015, rotation: 130 },
      { id: "r_v3", type: "car", lat: baseLat + 0.0005, lng: baseLng - 0.002, rotation: 280 },
    ];
    setVehicles(initialVehicles);
    const interval = setInterval(() => {
      setVehicles((c) => c.map(v => ({
        ...v,
        lat: v.lat + (Math.random() - 0.5) * 0.00012,
        lng: v.lng + (Math.random() - 0.5) * 0.00012,
        rotation: v.rotation + (Math.random() - 0.5) * 6,
      })));
    }, 4000);
    return () => clearInterval(interval);
  }, [userRegion?.latitude, origin.latitude]);

  const handleSelectDestination = (details: PlaceDetails) => {
    setDestinationDetails(details);
    setIsReadyToContinue(true);
  };

  const handleQuickSelect = (place: any) => {
    const details: PlaceDetails = {
      placeId: place.id,
      formattedAddress: place.address,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    };
    setDestinationTxt(place.address);
    handleSelectDestination(details);
  };

  const onDirectionsReady = (result: any) => {
    setDistanceStr(`${result.distance.toFixed(1)} km`);
    setDurationStr(`${Math.ceil(result.duration)} min`);
    setDistanceRaw(result.distance); // in KM
    setDurationRaw(result.duration); // in MINUTES
    setRouteCoordinates(result.coordinates);
    
    mapRef.current?.fitToCoordinates(result.coordinates, {
      edgePadding: {
        right: width / 8,
        bottom: height / 3, 
        left: width / 8,
        top: height / 3.5,
      },
      animated: true,
    });
  };

  const handleContinue = () => {
    if (!destinationDetails) return;
    
    const isDelivery = params.serviceType === "delivery";
    
    const pickupData = {
      address: origin.address,
      latitude: Number(origin.latitude),
      longitude: Number(origin.longitude),
    };
    
    const dropoffData = {
      address: destinationDetails.formattedAddress,
      latitude: Number(destinationDetails.latitude),
      longitude: Number(destinationDetails.longitude),
    };

    if (isDelivery) {
      navigation.navigate("DeliverySetup", {
        vehicleType: params.initialVehicle || "motorcycle",
        preferScheduled: Boolean(params.preferScheduled),
        pickup: pickupData,
        dropoff: dropoffData,
        routeCoordinates,
        initialDistanceKm: distanceRaw,
        initialDurationMin: durationRaw,
      });
    } else {
      navigation.navigate("RideBidSetup", {
        pickup: pickupData,
        dropoff: dropoffData,
        routeCoordinates,
        initialDistanceKm: distanceRaw,
        initialDurationMin: durationRaw,
      });
    }
  };

  useEffect(() => {
    if (userRegion?.latitude && !destinationDetails && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userRegion.latitude,
        longitude: userRegion.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 1000);
    }
  }, [userRegion?.latitude, destinationDetails]);

  return (
    <View className="flex-1 bg-[#0f231c]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🗺️ Maps Implementation using 100% absolute placement utility */}
      <View className="absolute inset-0">
        <GlobalMap
          key={useDarkMap ? "client-dest-dark" : "client-dest-light"}
          ref={mapRef}
          
          style={{ flex: 1, width: '100%', height: '100%' }}
          useDarkStyle={useDarkMap}
          showsCompass={false}
          showsPointsOfInterest={false}
          showsBuildings={true}
          showsUserLocation={false}
          initialRegion={{
            latitude: origin.latitude,
            longitude: origin.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Origin Marker */}
          <Marker coordinate={{ latitude: origin.latitude, longitude: origin.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <PremiumMapMarker type="origin" />
          </Marker>

          {/* Realtime Vehicle Background Traffic */}
          {!isReadyToContinue && vehicles.map((veh) => (
            <Marker
              key={veh.id}
              coordinate={{ latitude: veh.lat, longitude: veh.lng }}
              rotation={veh.rotation}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={Platform.OS === "ios"}
            >
              <View className={`w-5 h-5 rounded-lg items-center justify-center shadow shadow-black elevation-4 ${veh.type === "motorcycle" ? 'bg-blue-400' : 'bg-primary'}`}>
                {veh.type === "car" ? <Car size={10} color="#000" /> : <Bike size={10} color="#000" />}
              </View>
            </Marker>
          ))}

          {/* Final Logic Sync: Realtime High Definition Route System */}
          {destinationDetails && (
            <>
              {/* Precision Particle Interopolator Path Wrapper */}
              <PremiumDottedRoute coordinates={routeCoordinates} />
              
              <Marker
                coordinate={{
                  latitude: destinationDetails.latitude,
                  longitude: destinationDetails.longitude,
                }}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <PremiumMapMarker type="destination" />
              </Marker>

              <MapViewDirections
                origin={{ latitude: origin.latitude, longitude: origin.longitude }}
                destination={{
                  latitude: destinationDetails.latitude,
                  longitude: destinationDetails.longitude,
                }}
                apikey={GOOGLE_API_KEY}
                mode="DRIVING"
                precision="high"
                strokeWidth={0}
                strokeColor="transparent" 
                onReady={onDirectionsReady}
              />
            </>
          )}
        </GlobalMap>
      </View>

      {/* 💎 Overlaid User Controls without styleSheet */}
      <View className="absolute inset-0 z-[100]" pointerEvents="box-none">
        <DestinationHeader 
          onBack={navigation.goBack}
          title={params.serviceType === "delivery" ? "Definir endereços" : "Para onde vamos?"} 
        />

        {/* 📡 Absolute Map Controls Right Wing (Placed first to render behind input cards!) */}
        <MapActionButtons 
          onLocationPress={handleCenterMyLocation}
          onSosPress={handleSOS}
          onMapStylePress={handleToggleMapStyle}
          useDarkMap={useDarkMap}
          isCentering={isCentering}
          isSwitchingStyle={isSwitchingStyle}
          topOffset={Platform.OS === 'ios' ? 360 : 340}
        />

        <FloatingSearchCard
          originText={originTxt}
          destinationText={destinationTxt}
          onOriginChange={setOriginTxt}
          onDestinationChange={setDestinationTxt}
          onSelectOrigin={(details) => {
             setOriginDetails(details);
             setOriginTxt(details.formattedAddress);
          }}
          onSelectDestination={handleSelectDestination}
          onFavoriteOrigin={() => {
            triggerFavoriteModal({
              address: origin.address,
              latitude: origin.latitude,
              longitude: origin.longitude
            });
          }}
          onFavoriteDestination={destinationDetails ? () => {
             triggerFavoriteModal({
               address: destinationDetails.formattedAddress,
               latitude: destinationDetails.latitude,
               longitude: destinationDetails.longitude
             });
          } : undefined}
        />

        {/* 💡 FRIENDLY TIP BANNER (ADDRESS NUMBER VERIFICATION) */}
        {showVerifTip && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 600, type: "timing", duration: 400 }}
            className="mx-6 mt-3 bg-[#091A2F] border border-[#FFB900]/30 px-3 py-2.5 rounded-xl flex-row items-center relative shadow-lg"
          >
            <View className="bg-[#FFB900]/10 p-1.5 rounded-full mr-3">
               <Info size={14} color="#FFB900" />
            </View>
            <View className="flex-1 pr-6">
              <Text className="text-[#FFB900] font-bold text-[12px] leading-tight">
                Confirme o Número da Casa
              </Text>
              <Text className="text-white/70 text-[11px] mt-0.5">
                Verifique se o número do local está preenchido corretamente para evitar atrasos.
              </Text>
            </View>
            <TouchableOpacity 
               onPress={() => setShowVerifTip(false)}
               className="absolute right-2 top-2 bg-white/5 p-1 rounded-full"
               hitSlop={8}
            >
              <X size={12} color="#FFB900" />
            </TouchableOpacity>
          </MotiView>
        )}

        {!isReadyToContinue && (
          <RecentPlaces onSelect={handleQuickSelect} />
        )}
      </View>

      <RouteBottomCard
        visible={isReadyToContinue}
        distance={distanceStr}
        duration={durationStr}
        onConfirm={handleContinue}
      />

      {/* 🌟 PREMIUM MODAL: Add Favorite Inline Inline Builder */}
      <Modal
        visible={favModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFavModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-end px-6 pb-8">
          <KeyboardAvoidingView
             behavior={Platform.OS === "ios" ? "padding" : "padding"}
             keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
             className="w-full"
          >
            <View className="bg-[#091A2F] rounded-3xl border border-white/10 w-full p-6 shadow-2xl overflow-hidden relative">
               {/* Small Glow Circle background decoration */}
               <View className="absolute -top-10 -right-10 w-32 h-32 bg-[#02de95]/10 rounded-full blur-2xl" />

               <View className="flex-row justify-between items-center mb-6">
                 <View className="flex-row items-center">
                   <View className="bg-[#02de95]/10 p-2 rounded-xl mr-3">
                     <Star size={18} color="#02de95" fill="#02de95" />
                   </View>
                   <Text className="text-white font-black text-lg tracking-tight">Salvar Favorito</Text>
                 </View>
                 <TouchableOpacity 
                   onPress={() => setFavModalVisible(false)}
                   className="bg-white/10 p-1.5 rounded-full"
                 >
                   <X size={16} color="#fff" opacity={0.7} />
                 </TouchableOpacity>
               </View>

               <Text className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2">Endereço Selecionado</Text>
               <View className="bg-white/5 rounded-xl p-3 border border-white/5 mb-5">
                 <Text className="text-white/80 text-xs leading-relaxed" numberOfLines={2}>
                   {targetAddressToSave?.address || "..."}
                 </Text>
               </View>

               <Text className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-2">Dê um nome (ex: Casa, Trabalho)</Text>
               <View className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
                 <TextInput
                   value={favInputName}
                   onChangeText={setFavInputName}
                   placeholder="Digite o nome do favorito"
                   placeholderTextColor="rgba(255,255,255,0.3)"
                   className="text-white font-bold text-base p-0"
                   autoFocus
                   returnKeyType="done"
                   onSubmitEditing={handleSaveFavorite}
                 />
               </View>

               <View className="flex-row gap-3">
                 <TouchableOpacity 
                   onPress={() => setFavModalVisible(false)}
                   disabled={isSavingFav}
                   className="flex-1 h-12 rounded-xl border border-white/10 items-center justify-center bg-white/5"
                 >
                   <Text className="text-white/70 font-bold">Cancelar</Text>
                 </TouchableOpacity>

                 <TouchableOpacity 
                   onPress={handleSaveFavorite}
                   disabled={isSavingFav}
                   className="flex-[1.5] h-12 rounded-xl bg-[#02de95] items-center justify-center flex-row shadow-lg shadow-[#02de95]/20"
                 >
                   {isSavingFav ? (
                     <ActivityIndicator color="#091A2F" size="small" />
                   ) : (
                     <>
                       <Heart size={16} color="#091A2F" fill="#091A2F" className="mr-2" />
                       <Text className="text-[#091A2F] font-black uppercase tracking-wide text-sm">Salvar Agora</Text>
                     </>
                   )}
                 </TouchableOpacity>
               </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
