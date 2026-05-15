import React, { useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
} from "react-native";
import MapView, {
  MapViewProps,
  Region,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { darkMapStyle } from "@/utils/mapStyle";

export interface GlobalMapProps extends Omit<MapViewProps, "customMapStyle"> {
  initialRegion?: Region;
  region?: Region;
  showsUserLocation?: boolean;
  /**
   * Alterna o estilo (dark) do mapa.
   * - true (default): aplica o darkMapStyle
   * - false: usa o estilo padrão do provider
   */
  useDarkStyle?: boolean;
  onMapRef?: (ref: MapView | null) => void;
  onPressMyLocation?: () => void;
  /**
   * Se verdadeiro, o mapa fará uma animação de câmera inclinada 3D quando estiver pronto.
   * Ideal para a Home Screen do motorista.
   */
  animateTo3DOnReady?: boolean;
}

export const GlobalMap = forwardRef<MapView, GlobalMapProps>(({
  initialRegion,
  region,
  showsUserLocation = true,
  useDarkStyle = true,
  onMapRef,
  onPressMyLocation,
  animateTo3DOnReady = false,
  children,
  onMapReady,
  ...restProps
}, ref) => {
  const mapRef = useRef<MapView>(null);
  const didApply3DRef = useRef(false);

  // Expose the internal ref to the parent ref provided via React.forwardRef
  useImperativeHandle(ref, () => mapRef.current!);

  useEffect(() => {
    if (mapRef.current) {
      onMapRef?.(mapRef.current);
    }
  }, [onMapRef]);

  const handleMapReady = () => {
    onMapReady?.();

    if (animateTo3DOnReady && !didApply3DRef.current) {
      didApply3DRef.current = true;
      const center = region || initialRegion;
      if (center && mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: {
              latitude: center.latitude,
              longitude: center.longitude,
            },
            heading: 0,
            pitch: 45,
            zoom: 16,
          },
          { duration: 700 }
        );
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        key={useDarkStyle ? "map-dark" : "map-light"}
        ref={mapRef}
        provider={
          Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        }
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        region={region}
        customMapStyle={useDarkStyle ? darkMapStyle : undefined}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={true}
        toolbarEnabled={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}
        onMapReady={handleMapReady}
        {...restProps}
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
              backgroundColor: "rgba(9,26,47,0.9)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="my-location" size={24} color="#02de95" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default GlobalMap;
