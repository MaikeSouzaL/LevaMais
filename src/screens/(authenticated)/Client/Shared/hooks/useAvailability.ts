import { useEffect, useRef, useState } from "react";
import rideService from "@/services/ride.service";
import { supabase } from "@/lib/supabase";
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
  radius?: number; // em metros, padrão 7000
}

/**
 * Hook para monitorar disponibilidade de motoristas próximos em TEMPO REAL.
 * Apenas a primeira carga mostra loading; atualizações Realtime são silenciosas.
 */
export function useAvailability({
  region,
  userRegion,
  radius = 7000,
}: UseAvailabilityOptions) {
  const [availability, setAvailability] = useState<Availability>({
    rideDrivers: 0,
    deliveryDrivers: 0,
    totalNearby: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let mounted = true;

    const lat = userRegion?.latitude || region?.latitude;
    const lng = userRegion?.longitude || region?.longitude;

    const fetchAvailability = async (isInitial: boolean) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      if (!mounted) return;
      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        }
        const drivers = await rideService.getNearbyDrivers(lat as number, lng as number, radius);
        if (!mounted) return;

        const rideDrivers = drivers.filter((d) =>
          Array.isArray(d.serviceTypes) && d.serviceTypes.includes("ride"),
        ).length;
        const deliveryDrivers = drivers.filter((d) =>
          Array.isArray(d.serviceTypes) && d.serviceTypes.includes("delivery"),
        ).length;

        setAvailability({ rideDrivers, deliveryDrivers, totalNearby: drivers.length });
      } catch (err) {
        if (!mounted) return;
        logger.warn("useAvailability", "Erro ao buscar motoristas próximos", err);
        setError("Não foi possível validar disponibilidade local agora.");
      } finally {
        if (mounted && isInitial) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    };

    // Fetch inicial com loading visível
    fetchAvailability(true);

    // Supabase Realtime: atualizações silenciosas sem loading flicker
    const channel = supabase
      .channel(`home-nearby-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        () => {
          fetchAvailability(false);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [region?.latitude, region?.longitude, userRegion?.latitude, userRegion?.longitude, radius]);

  return { availability, loading, error };
}
