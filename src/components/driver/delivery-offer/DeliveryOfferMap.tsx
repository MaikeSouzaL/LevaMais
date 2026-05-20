import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { darkMapStyle } from "@/utils/mapStyle";
import MapMarker from "@/components/MapMarker";
import Constants from "expo-constants";

interface DeliveryOfferMapProps {
  pickup: { latitude: number; longitude: number; address?: string };
  destination: { latitude: number; longitude: number; address?: string };
}

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export function DeliveryOfferMap({ pickup, destination }: DeliveryOfferMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: pickup.latitude, longitude: pickup.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
          ],
          {
            edgePadding: { top: 120, right: 50, bottom: 400, left: 50 },
            animated: true,
          }
        );
      }, 800);
    }
  }, [pickup, destination]);

  return (
    <View className="flex-1 bg-[#091A2F]">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        className="w-full h-full"
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
        <Marker coordinate={pickup} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          <MapMarker type="pickup" size={32} />
        </Marker>

        {/* Dropoff Node */}
        <Marker coordinate={destination} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
          <MapMarker type="dropoff" size={32} />
        </Marker>
      </MapView>
    </View>
  );
}
