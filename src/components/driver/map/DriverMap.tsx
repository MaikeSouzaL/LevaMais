import React, { forwardRef } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import MapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { darkMapStyle } from '@/utils/mapStyle';

interface DriverMapProps extends Omit<MapViewProps, 'provider'> {
  useDarkStyle?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * DriverMap — Mapa base padronizado para o motorista.
 *
 * Features:
 * - Google Maps como provider padrão
 * - Tema escuro por padrão
 * - Configurações otimizadas para uso como motorista
 */
const DriverMap = forwardRef<MapView, DriverMapProps>(
  ({ useDarkStyle = true, containerStyle, customMapStyle, children, ...props }, ref) => {
    const resolvedMapStyle = useDarkStyle && !customMapStyle ? darkMapStyle : customMapStyle;

    return (
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        customMapStyle={resolvedMapStyle}
        style={[styles.map, containerStyle]}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        rotateEnabled={true}
        pitchEnabled={false}
        toolbarEnabled={false}
        {...props}
      >
        {children}
      </MapView>
    );
  },
);

DriverMap.displayName = 'DriverMap';

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default DriverMap;
