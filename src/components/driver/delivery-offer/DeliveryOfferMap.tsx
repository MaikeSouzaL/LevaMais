import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Marker } from "react-native-maps";
import MapView from "react-native-maps";
import { GlobalMap } from "@/components/GlobalMap";
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";
import MapViewDirections from "react-native-maps-directions";
import Constants from "expo-constants";

interface DeliveryOfferMapProps {
  pickup: { latitude: number; longitude: number; address?: string };
  destination: { latitude: number; longitude: number; address?: string };
  isSmall?: boolean;
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export function DeliveryOfferMap({ pickup, destination, isSmall }: DeliveryOfferMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      const padding = isSmall 
        ? { top: 35, right: 35, bottom: 35, left: 35 }
        : { top: 120, right: 50, bottom: 400, left: 50 };

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ],
          {
            edgePadding: padding,
            animated: true,
          }
        );
      }, 800);
    }
  }, [pickup, destination, isSmall]);

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F", width: "100%", height: "100%" }}>
      <GlobalMap
        ref={mapRef}
        showsUserLocation={false}
        useDarkStyle={true}
        initialRegion={{
          latitude: (pickup.latitude + destination.latitude) / 2,
          longitude: (pickup.longitude + destination.longitude) / 2,
          latitudeDelta: Math.abs(pickup.latitude - destination.latitude) * 2,
          longitudeDelta: Math.abs(pickup.longitude - destination.longitude) * 2,
        }}
      >
        {/* Route 🛣️ */}
        {!!GOOGLE_MAPS_KEY && (
          <MapViewDirections
            origin={pickup}
            destination={destination}
            apikey={GOOGLE_MAPS_KEY}
            strokeWidth={4}
            strokeColor="#02de95"
            mode="DRIVING"
            lineDashPattern={[1, 0]} // Solid premium line
          />
        )}

        {/* Pickup Node */}
        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }}>
          <PremiumMapMarker type="origin" />
        </Marker>

        {/* Dropoff Node */}
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }}>
          <PremiumMapMarker type="destination" />
        </Marker>
      </GlobalMap>
    </View>
  );
}
