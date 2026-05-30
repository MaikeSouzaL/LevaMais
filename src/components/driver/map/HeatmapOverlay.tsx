/**
 * HeatmapOverlay — Overlay de mapa de calor para motoristas.
 *
 * Renderiza círculos coloridos no mapa baseado nos dados de demanda:
 * - Verde: baixa demanda (1-2 solicitações)
 * - Amarelo: média (3-5)
 * - Laranja: alta (6-10)
 * - Vermelho: muito alta (10+)
 */
import React from 'react';
import { Circle, Marker } from 'react-native-maps';

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  count?: number;
}

interface HeatmapOverlayProps {
  points: HeatmapPoint[];
  visible?: boolean;
}

function getHeatColor(weight: number): string {
  if (weight >= 10) return 'rgba(239,68,68,0.45)';   // vermelho
  if (weight >= 6) return 'rgba(249,115,22,0.40)';    // laranja
  if (weight >= 3) return 'rgba(251,191,36,0.35)';    // amarelo
  return 'rgba(2,222,149,0.25)';                       // verde
}

function getRadius(weight: number): number {
  if (weight >= 10) return 800;
  if (weight >= 6) return 600;
  if (weight >= 3) return 450;
  return 350;
}

export function HeatmapOverlay({ points, visible = true }: HeatmapOverlayProps) {
  if (!visible || points.length === 0) return null;

  return (
    <>
      {points.map((point, index) => (
        <Circle
          key={`heat-${index}`}
          center={{ latitude: point.lat, longitude: point.lng }}
          radius={getRadius(point.weight)}
          fillColor={getHeatColor(point.weight)}
          strokeColor="transparent"
          strokeWidth={0}
          zIndex={1}
        />
      ))}
    </>
  );
}

export default HeatmapOverlay;
