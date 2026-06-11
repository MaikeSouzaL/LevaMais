import React from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { darkMapStyle } from "@/utils/mapStyle";
import { LinearGradient } from "expo-linear-gradient";

interface PremiumMapBackgroundProps {
  pickupCoords: { latitude: number; longitude: number } | null;
}

const { width, height } = Dimensions.get("window");

export function PremiumMapBackground({ pickupCoords }: PremiumMapBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-[#091A2F]">
      {pickupCoords ? (
        <MapView
          style={{ width, height }}
          provider={PROVIDER_GOOGLE}
          customMapStyle={darkMapStyle}
          pitchEnabled={false}
          rotateEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          initialRegion={{
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
        />
      ) : null}

      {/* Deep Dark Futuristic Overlays */}
      <View style={StyleSheet.absoluteFillObject} className="bg-[#091A2F]/80" />

      <LinearGradient
        colors={["#091A2F", "transparent", "#091A2F"]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}
