import React, { useRef, useEffect } from "react";
import { StyleSheet, Platform, View, TouchableOpacity } from "react-native";
import MapView, {
  MapViewProps,
  Region,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#101816" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#101816" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1b2823" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#16201d" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#1f2d29" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#23332d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2d29" }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1410" }],
  },
];

export type GlobalMapProps = {
  initialRegion: Region;
  region?: Region;
  showsUserLocation?: boolean;
  onMapRef?: (ref: MapView | null) => void;
  onPressMyLocation?: () => void;
  onMapRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: MapViewProps["children"];
};

export function GlobalMap({
  initialRegion,
  region,
  showsUserLocation = true,
  onMapRef,
  onPressMyLocation,
  onMapRegionChange,
  onRegionChangeComplete,
  children,
}: GlobalMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    onMapRef?.(mapRef.current);
  }, [onMapRef]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        region={region}
        onRegionChange={onMapRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        customMapStyle={darkMapStyle}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        toolbarEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
      >
        {children}
      </MapView>

      {onPressMyLocation && (
        <View style={{ position: "absolute", top: 176, right: 16, zIndex: 20 }}>
          <TouchableOpacity
            onPress={onPressMyLocation}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(21,46,38,0.9)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 12,
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="my-location" size={24} color="#02de95" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default GlobalMap;
