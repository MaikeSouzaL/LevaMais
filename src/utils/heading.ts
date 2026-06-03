/**
 * Cálculo de Azimute (Heading) - Leva Mais
 *
 * Função utilitária para calcular a direção geográfica (0–360°)
 * a partir de duas coordenadas (currentCoordinate vs previousCoordinate).
 *
 * Usado como FALLBACK quando a API nativa de Geolocation
 * (ou a bridge do React Native) não fornece a propriedade `heading`
 * com precisão (ex: GPS ainda em calibração, ambientes fechados).
 *
 * - 0° = Norte
 * - 90° = Leste
 * - 180° = Sul
 * - 270° = Oeste
 *
 * O desenho interno de todos os PNGs deve estar apontando para CIMA
 * (Norte) para que a rotação aplicada via `Marker.rotation` funcione
 * corretamente com a perspectiva da câmera.
 */

export interface Coordinate {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000; // raio médio da Terra em metros

const toRadians = (deg: number) => (deg * Math.PI) / 180;
const toDegrees = (rad: number) => (rad * 180) / Math.PI;

/**
 * Normaliza qualquer ângulo para o intervalo [0, 360).
 */
export function normalizeHeading(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Distância em metros entre duas coordenadas (haversine).
 * Útil para decidir se a diferença entre duas amostras é significativa
 * o bastante para recalcular o heading.
 */
export function distanceMeters(
  from: Coordinate,
  to: Coordinate,
): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Azimute (bearing) inicial entre dois pontos, em graus [0, 360).
 * 0° = Norte geográfico.
 *
 * Fórmula do bearing inicial great-circle:
 *   θ = atan2(sin Δλ · cos φ2,
 *             cos φ1 · sin φ2 − sin φ1 · cos φ2 · cos Δλ)
 */
export function bearingDegrees(from: Coordinate, to: Coordinate): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLng = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const brng = toDegrees(Math.atan2(y, x));
  return normalizeHeading(brng);
}

/**
 * Resolve o heading final do veículo com fallback em 3 níveis:
 *  1) heading fornecido pelo GPS nativo (precisão nativa, tempo real)
 *  2) bearing calculado a partir de previousCoordinate -> currentCoordinate
 *  3) último heading conhecido (para evitar snap visual a 0)
 *
 * Retorna `null` se for impossível determinar uma direção
 * (ex: primeira leitura, sem histórico e GPS sem heading).
 *
 * Parâmetros:
 *  - gpsHeading: heading vindo do Geolocation (`pos.coords.heading`)
 *  - current: coordenada atual
 *  - previous: coordenada anterior (opcional, mas melhora a estabilidade)
 *  - lastKnown: último heading aplicado na câmera (opcional, fallback final)
 *  - minDistanceMeters: distância mínima entre duas amostras para
 *     considerar que o veículo se moveu o bastante. Padrão 1.5m
 *     (evita heading ruidoso em parado / GPS tremido).
 */
export function resolveHeading(
  gpsHeading: number | null | undefined,
  current: Coordinate,
  previous: Coordinate | null | undefined,
  lastKnown?: number | null,
  minDistanceMeters = 1.5,
): number | null {
  // 1) GPS nativo tem prioridade se for válido
  if (
    typeof gpsHeading === "number" &&
    Number.isFinite(gpsHeading) &&
    gpsHeading >= 0
  ) {
    return normalizeHeading(gpsHeading);
  }

  // 2) Bearing entre duas amostras consecutivas
  if (previous) {
    const moved = distanceMeters(previous, current);
    if (moved >= minDistanceMeters) {
      return bearingDegrees(previous, current);
    }
  }

  // 3) Mantém o último heading conhecido para não "pular" a câmera
  if (typeof lastKnown === "number" && Number.isFinite(lastKnown)) {
    return normalizeHeading(lastKnown);
  }

  return null;
}

/**
 * Suavização exponencial (low-pass filter) para o heading.
 * Reduz jitter quando a câmera segue o veículo, sem introduzir
 * lag perceptível na rotação.
 *
 *  - alpha: 0..1. Quanto mais próximo de 1, mais responsivo.
 *           Padrão 0.4 (bom equilíbrio entre suavidade e responsividade).
 */
export function smoothHeading(
  prev: number | null | undefined,
  next: number,
  alpha = 0.4,
): number {
  if (prev == null || !Number.isFinite(prev)) {
    return normalizeHeading(next);
  }

  // lidar com a descontinuidade em 0/360
  let delta = next - prev;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;

  const smoothed = prev + alpha * delta;
  return normalizeHeading(smoothed);
}
