import React, { useState, useEffect } from "react";
import { View, Dimensions, StatusBar, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Car, Bike } from "lucide-react-native";

import { darkMapStyle } from "@/utils/mapStyle";
import { useMapLocation } from "../../../Shared/hooks/useMapLocation";
import { PlaceDetails } from "@/services/googlePlaces.service";

// Architectural UI Imports
import { DestinationHeader } from "@/components/client/destination/DestinationHeader";
import { FloatingSearchCard } from "@/components/client/destination/FloatingSearchCard";
import { RecentPlaces } from "@/components/client/destination/RecentPlaces";
import { RouteBottomCard } from "@/components/client/destination/RouteBottomCard";

// Refined Realtime Core Mapping Imports 🚀
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";
import { PremiumDottedRoute } from "@/components/routes/PremiumDottedRoute";

const { width, height } = Dimensions.get("window");
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface RealtimeVehicle {
  id: string;
  type: "car" | "moto";
  lat: number;
  lng: number;
  rotation: number;
}

export default function DestinationSearchScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params || {}) as any;

  const { userRegion, currentAddress, region, mapRef } = useMapLocation();

  const [destinationTxt, setDestinationTxt] = useState("");
  const [destinationDetails, setDestinationDetails] = useState<PlaceDetails | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  
  const [distanceStr, setDistanceStr] = useState("");
  const [durationStr, setDurationStr] = useState("");
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [vehicles, setVehicles] = useState<RealtimeVehicle[]>([]);

  const origin = params.pickup || {
    latitude: userRegion?.latitude || region?.latitude || -23.55,
    longitude: userRegion?.longitude || region?.longitude || -46.63,
    address: currentAddress || "Local Atual",
  };

  useEffect(() => {
    const baseLat = userRegion?.latitude || origin.latitude;
    const baseLng = userRegion?.longitude || origin.longitude;
    const initialVehicles: RealtimeVehicle[] = [
      { id: "r_v1", type: "car", lat: baseLat + 0.0012, lng: baseLng + 0.001, rotation: 40 },
      { id: "r_v2", type: "moto", lat: baseLat - 0.0018, lng: baseLng + 0.0015, rotation: 130 },
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
    navigation.navigate("DeliverySetup", {
      vehicleType: params.initialVehicle || "motorcycle",
      pickup: {
        address: origin.address,
        latitude: Number(origin.latitude),
        longitude: Number(origin.longitude),
      },
      dropoff: {
        address: destinationDetails.formattedAddress,
        latitude: Number(destinationDetails.latitude),
        longitude: Number(destinationDetails.longitude),
      },
    });
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
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1, width: '100%', height: '100%' }}
          customMapStyle={darkMapStyle}
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
              <View className={`w-5 h-5 rounded-lg items-center justify-center shadow shadow-black elevation-4 ${veh.type === "moto" ? 'bg-blue-400' : 'bg-primary'}`}>
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
        </MapView>
      </View>

      {/* 💎 Overlaid User Controls without styleSheet */}
      <View className="absolute inset-0 z-[100]" pointerEvents="box-none">
        <DestinationHeader />

        <FloatingSearchCard
          originText={origin.address}
          destinationText={destinationTxt}
          onDestinationChange={setDestinationTxt}
          onSelectDestination={handleSelectDestination}
        />

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
    </View>
  );
}
