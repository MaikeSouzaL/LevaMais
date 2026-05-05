import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import MapView, {
  MapViewProps,
  Region,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { darkMapStyle } from "@/utils/mapStyle";

export type GlobalMapProps = {
  initialRegion: Region;
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
  onMapRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: MapViewProps["children"];
};

export function GlobalMap({
  initialRegion,
  region,
  showsUserLocation = true,
  useDarkStyle = true,
  onMapRef,
  onPressMyLocation,
  onMapRegionChange,
  onRegionChangeComplete,
  children,
}: GlobalMapProps) {
  const mapRef = useRef<MapView>(null);
  const didApply3DRef = useRef(false);

  useEffect(() => {
    onMapRef?.(mapRef.current);
  }, [onMapRef]);

  // Log de diagnóstico pro dev verificar se as tiles do Google Maps carregaram
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(
        "[GlobalMap] Se o mapa está branco/vazio (só pin de localização), verifique:\n" +
          "1) Google Maps API Key configurada no AndroidManifest.xml\n" +
          "2) Maps SDK for Android habilitado no Google Cloud Console\n" +
          "3) Key sem restrições de package/SHA1 (ou package correto adicionado)",
      );
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
        onRegionChange={onMapRegionChange}
        onRegionChangeComplete={onRegionChangeComplete}
        // Em alguns devices o Google Maps não aplica/remove o style dinamicamente.
        // Forçamos remount via key e usamos [] para resetar.
        customMapStyle={useDarkStyle ? darkMapStyle : []}
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
        onMapReady={() => {
          console.log("[GlobalMap] MapView ready (tiles devem carregar agora)");
          if (didApply3DRef.current) return;
          didApply3DRef.current = true;
          const center = region || initialRegion;
          mapRef.current?.animateCamera(
            {
              center: {
                latitude: center.latitude,
                longitude: center.longitude,
              },
              heading: 0,
              pitch: 45,
              zoom: 16,
            },
            { duration: 700 },
          );
        }}
        onMapLoaded={() => {
          console.log("[GlobalMap] MapView loaded completamente");
        }}
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
