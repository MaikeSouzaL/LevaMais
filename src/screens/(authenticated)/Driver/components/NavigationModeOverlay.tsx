import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ImageSourcePropType,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { MotiView } from "moti";
import { darkMapStyle } from "@/utils/mapStyle";
import {
  resolveHeading,
  smoothHeading,
  Coordinate,
} from "@/utils/heading";

// Seta de navegação (PNG único disponível na pasta assets).
// Deve estar apontando para CIMA (Norte) conforme diretriz.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const SETA_NAVEGACAO: ImageSourcePropType = require("../../../../assets/gps-chevron-green.png");

// Cores primárias da identidade Leva Mais usadas no mapa de navegação.
const NavigationColors = {
  primaryGreen: "#00E573",
  primaryPurple: "#7C3AED",
  accent: "#02de95",
  darkBg: "#091A2F",
};

/**
 * Navigation Mode Overlay
 * --------------------------------------------------------------
 * Overlay turn-by-turn para o estado "indo para coleta / indo para entrega"
 * (status: driver_arriving | in_progress).
 *
 * Sobrepõe o GlobalMap com:
 *  - Câmera em perspectiva (pitch 60, zoom 18, duration 1000ms)
 *  - Marcador do veículo em PNG (moto) com `flat={true}` + rotação
 *  - Seta de navegação (chevron) opcional
 *  - Rota via MapViewDirections (Google Directions API)
 *  - Pin do destino
 *
 * Regras seguidas:
 *  - Câmera nunca usa `region` estática em movimento
 *  - heading resolvido com fallback (GPS -> bearing -> último conhecido)
 *  - Marcadores PNG com anchor {0.5, 0.5} e flat=true
 *  - Sem SVG; tudo PNG leve + Views estilizadas em fallback
 */

type NavigationModeOverlayProps = {
  driverPosition: (Coordinate & { heading?: number | null }) | null;
  destinationPoint: Coordinate | null;
  status: string;
  isDelivery?: boolean;
  onClose?: () => void;
  onArrivedPress?: () => void;
  googleMapsApiKey?: string;
};

const CHEVRON_SIZE = 50;
const VEHICLE_SIZE = 50;
const PIN_SIZE = 36;

function shouldRender(status: string): boolean {
  return status === "driver_arriving" || status === "in_progress";
}

export function NavigationModeOverlay({
  driverPosition,
  destinationPoint,
  status,
  isDelivery = false,
  onClose,
  onArrivedPress,
  googleMapsApiKey,
}: NavigationModeOverlayProps) {
  const mapRef = useRef<MapView>(null);
  const previousCoordRef = useRef<Coordinate | null>(null);
  const lastHeadingRef = useRef<number | null>(null);
  const lastCameraAtRef = useRef(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showChevron, setShowChevron] = useState(false);

  // Alterna seta/moto a cada 6s para feedback visual no modo de navegação
  useEffect(() => {
    const id = setInterval(() => setShowChevron((v) => !v), 6000);
    return () => clearInterval(id);
  }, []);

  // Resolved heading: GPS -> bearing entre amostras -> último conhecido.
  // Calculado ANTES de qualquer `return` para manter a ordem dos hooks estável.
  const resolvedHeading = driverPosition
    ? resolveHeading(
        driverPosition.heading ?? null,
        {
          latitude: driverPosition.latitude,
          longitude: driverPosition.longitude,
        },
        previousCoordRef.current,
        lastHeadingRef.current,
      )
    : null;

  const smoothedHeading =
    driverPosition == null
      ? 0
      : resolvedHeading == null
      ? lastHeadingRef.current ?? 0
      : (() => {
          const v = smoothHeading(lastHeadingRef.current, resolvedHeading, 0.4);
          lastHeadingRef.current = v;
          return v;
        })();

  // Efeito de Câmera: pitch 60, zoom 18, duration 1000ms
  // Declarado SEMPRE, antes do `return null`, para manter a ordem dos hooks.
  useEffect(() => {
    if (!isMapReady || !driverPosition || !mapRef.current) return;

    const now = Date.now();
    if (now - lastCameraAtRef.current < 900) return;
    lastCameraAtRef.current = now;

    mapRef.current.animateCamera(
      {
        center: {
          latitude: driverPosition.latitude,
          longitude: driverPosition.longitude,
        },
        pitch: 60,
        heading: smoothedHeading,
        zoom: 18,
      },
      { duration: 1000 },
    );

    previousCoordRef.current = {
      latitude: driverPosition.latitude,
      longitude: driverPosition.longitude,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isMapReady,
    driverPosition?.latitude,
    driverPosition?.longitude,
    smoothedHeading,
  ]);

  // Early return APÓS todos os hooks. A ordem dos hooks fica estável em todos os renders.
  if (!shouldRender(status) || !driverPosition) {
    return null;
  }

  const initialRegion: Region = {
    latitude: driverPosition.latitude,
    longitude: driverPosition.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const headingLabel = isDelivery
    ? status === "driver_arriving"
      ? "Indo para coleta"
      : "Indo para entrega"
    : status === "driver_arriving"
    ? "Indo buscar passageiro"
    : "Indo para o destino";

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "timing", duration: 600 }}
        style={StyleSheet.absoluteFillObject}
      >
        <MapView
          ref={mapRef}
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          pitchEnabled={false}
          rotateEnabled={false}
          customMapStyle={darkMapStyle}
          onMapReady={() => setIsMapReady(true)}
        >
          {/* TRAÇADO DE ROTA - Google Directions */}
          {driverPosition && destinationPoint && googleMapsApiKey && (
            <MapViewDirections
              origin={{
                latitude: driverPosition.latitude,
                longitude: driverPosition.longitude,
              }}
              destination={{
                latitude: destinationPoint.latitude,
                longitude: destinationPoint.longitude,
              }}
              apikey={googleMapsApiKey}
              strokeWidth={5}
              strokeColor={NavigationColors.primaryGreen}
              optimizeWaypoints={true}
            />
          )}

          {/* MARCADOR DO VEÍCULO - flat=true + anchor 0.5 */}
          <Marker
            coordinate={{
              latitude: driverPosition.latitude,
              longitude: driverPosition.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={smoothedHeading}
            flat={true}
            tracksViewChanges={false}
          >
            {showChevron ? (
              <NavigationChevron source={SETA_NAVEGACAO} />
            ) : (
              <VehiclePuck source={SETA_NAVEGACAO} />
            )}
          </Marker>

          {/* PIN DO DESTINO (fallback em View, sem PNG próprio) */}
          {destinationPoint && (
            <Marker
              coordinate={{
                latitude: destinationPoint.latitude,
                longitude: destinationPoint.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              <DestinationPin source={null} />
            </Marker>
          )}
        </MapView>
      </MotiView>

      {/* Top status pill */}
      <View pointerEvents="box-none" style={styles.topBar}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{headingLabel}</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom action: "Cheguei" para o estado driver_arriving */}
      {onArrivedPress && status === "driver_arriving" && (
        <MotiView
          from={{ translateY: 60, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18 }}
          style={styles.bottomBar}
        >
          <TouchableOpacity
            onPress={onArrivedPress}
            activeOpacity={0.85}
            style={styles.arrivedBtn}
          >
            <Text style={styles.arrivedBtnText}>CHEGUEI</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

/* ----------------------------- Sub-componentes ----------------------------- */

const NavigationChevron: React.FC<{ source: ImageSourcePropType | null }> = ({ source }) => {
  if (source) {
    return (
      <Image
        source={source}
        style={{ width: CHEVRON_SIZE, height: CHEVRON_SIZE }}
        resizeMode="contain"
      />
    );
  }
  return (
    <MotiView
      from={{ scale: 0.85, opacity: 0.85 }}
      animate={{ scale: 1.1, opacity: 1 }}
      transition={{ loop: true, type: "timing", duration: 1200 }}
      style={chevronStyles.fallback}
    >
      <Text style={chevronStyles.fallbackText}>▲</Text>
    </MotiView>
  );
};

const chevronStyles = StyleSheet.create({
  fallback: {
    width: CHEVRON_SIZE,
    height: CHEVRON_SIZE,
    borderRadius: CHEVRON_SIZE / 2,
    backgroundColor: "rgba(2, 222, 149, 0.18)",
    borderWidth: 2,
    borderColor: NavigationColors.primaryGreen,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: NavigationColors.primaryGreen,
    fontSize: 24,
    fontWeight: "900",
  },
});

const VehiclePuck: React.FC<{ source: ImageSourcePropType | null }> = ({ source }) => {
  return (
    <View style={vehicleStyles.container}>
      <MotiView
        from={{ scale: 0.6, opacity: 0.9 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ loop: true, type: "timing", duration: 1800 }}
        style={[vehicleStyles.pulse, { backgroundColor: NavigationColors.primaryGreen }]}
      />
      {source ? (
        <Image
          source={source}
          style={{ width: VEHICLE_SIZE, height: VEHICLE_SIZE }}
          resizeMode="contain"
        />
      ) : (
        <View style={vehicleStyles.fallbackPuck}>
          <Text style={vehicleStyles.fallbackText}>🛵</Text>
        </View>
      )}
    </View>
  );
};

const vehicleStyles = StyleSheet.create({
  container: {
    width: VEHICLE_SIZE,
    height: VEHICLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.4,
  },
  fallbackPuck: {
    width: VEHICLE_SIZE - 6,
    height: VEHICLE_SIZE - 6,
    borderRadius: (VEHICLE_SIZE - 6) / 2,
    backgroundColor: NavigationColors.primaryGreen,
    borderWidth: 2,
    borderColor: "#091A2F",
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: { fontSize: 20 },
});

const DestinationPin: React.FC<{ source: ImageSourcePropType | null }> = ({ source }) => {
  if (source) {
    return (
      <Image
        source={source}
        style={{ width: PIN_SIZE, height: PIN_SIZE }}
        resizeMode="contain"
      />
    );
  }
  return (
    <View style={pinStyles.fallback}>
      <View style={pinStyles.fallbackInner} />
    </View>
  );
};

const pinStyles = StyleSheet.create({
  fallback: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: "#ea580c",
    borderWidth: 3,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  fallbackInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
});

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 76,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(9, 26, 47, 0.92)",
    borderColor: "rgba(2, 222, 149, 0.45)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: NavigationColors.primaryGreen,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(9, 26, 47, 0.92)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },
  bottomBar: {
    position: "absolute",
    bottom: 320,
    left: 16,
    right: 16,
  },
  arrivedBtn: {
    height: 54,
    backgroundColor: NavigationColors.primaryGreen,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: NavigationColors.primaryGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  arrivedBtnText: {
    color: "#091A2F",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
});
