import { useEffect, useState } from "react";
import rideService from "@/services/ride.service";
import { logger } from "@/utils/logger";

interface Availability {
  rideDrivers: number;
  deliveryDrivers: number;
  totalNearby: number;
}

interface UseAvailabilityOptions {
  region?: {
    latitude?: number;
    longitude?: number;
  } | null;
  userRegion?: {
    latitude?: number;
    longitude?: number;
  } | null;
  pollingInterval?: number; // em ms, padrão 15000
  radius?: number; // em metros, padrão 7000
}

/**
 * Hook para monitorar disponibilidade de motoristas próximos.
 * Atualiza automaticamente em intervalos regulares.
 */
export function useAvailability({
  region,
  userRegion,
  pollingInterval = 15000,
  radius = 7000,
}: UseAvailabilityOptions) {
  const [availability, setAvailability] = useState<Availability>({
    rideDrivers: 0,
    deliveryDrivers: 0,
    totalNearby: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadNearbyAvailability = async () => {
      try {
        setLoading(true);
        setError(null);
        const lat = userRegion?.latitude || region?.latitude;
        const lng = userRegion?.longitude || region?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const safeLat = lat as number;
        const safeLng = lng as number;

        const drivers = await rideService.getNearbyDrivers(safeLat, safeLng, radius);
        if (!mounted) return;

        const rideDrivers = drivers.filter((d) =>
          Array.isArray(d.serviceTypes) && d.serviceTypes.includes("ride"),
        ).length;
        const deliveryDrivers = drivers.filter((d) =>
          Array.isArray(d.serviceTypes) && d.serviceTypes.includes("delivery"),
        ).length;

        setAvailability({
          rideDrivers,
          deliveryDrivers,
          totalNearby: drivers.length,
        });
      } catch (err) {
        if (!mounted) return;
        logger.error("useAvailability", "Erro ao buscar motoristas próximos", err);
        setError("Não foi possível validar disponibilidade local agora.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNearbyAvailability();
    const interval = setInterval(loadNearbyAvailability, pollingInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [region?.latitude, region?.longitude, userRegion?.latitude, userRegion?.longitude, pollingInterval, radius]);

  return {
    availability,
    loading,
    error,
  };
}
