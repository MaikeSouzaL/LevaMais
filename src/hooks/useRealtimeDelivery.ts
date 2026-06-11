import { useState, useEffect, useMemo } from "react";
import rideService from "@/services/ride.service";
import { supabase } from "@/lib/supabase";

export interface NearbyDriver {
  id: string;
  name?: string;
  profilePhoto?: string | null;
  rating?: number;
  latitude: number;
  longitude: number;
  vehicleType: string;
  rotation?: number;
  status?: "scanning" | "analyzing" | "idle";
  isUnavailable?: boolean;
}

export function useRealtimeDelivery(
  centerLat?: number,
  centerLng?: number,
  type: string = "motorcycle",
  secondsElapsed: number = 0,
  serviceType: string = "ride"
) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [feedMessage, setFeedMessage] = useState("Iniciando mapeamento urbano...");

  const searchState = useMemo(() => {
    const radiusConfig: Record<string, { nearby: number; expanded: number; regional: number }> = {
      motorcycle: { nearby: 2.5, expanded: 8.0, regional: 15.0 },
      car: { nearby: 5.0, expanded: 15.0, regional: 30.0 },
      van: { nearby: 10.0, expanded: 35.0, regional: 80.0 },
      truck: { nearby: 15.0, expanded: 80.0, regional: 200.0 },
    };
    const active = radiusConfig[type] || radiusConfig.motorcycle;
    if (secondsElapsed < 20) return { stage: "nearby" as const, radius: active.nearby, label: "Busca Local" };
    if (secondsElapsed < 60) return { stage: "expanded" as const, radius: active.expanded, label: "Raio Expandido" };
    return { stage: "regional" as const, radius: active.regional, label: "Busca Regional" };
  }, [secondsElapsed, type]);

  const mapToNearbyDriver = (d: any): NearbyDriver | null => {
    if (d.latitude == null || d.longitude == null) return null;
    const sTypes: string[] = Array.isArray(d.service_types) ? d.service_types : [];
    const supportsCurrentService = sTypes.length === 0 || sTypes.includes(serviceType);
    return {
      id: d.id,
      name: d.profiles?.full_name || "Motorista",
      profilePhoto: d.profiles?.avatar_url || null,
      rating: Number(d.profiles?.rating ?? 5),
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
      vehicleType: d.current_vehicle_type || "motorcycle",
      rotation: Number(d.heading || 0),
      status: "scanning" as const,
      isUnavailable: !supportsCurrentService,
    };
  };

  const updateFeedFromDrivers = (list: NearbyDriver[]) => {
    const label = type === "motorcycle" ? "motoboy" : type === "car" ? "carro" : type === "van" ? "van" : "frete";
    const plural = type === "motorcycle" ? "motoboys" : type === "car" ? "carros" : type === "van" ? "vans" : "fretes";
    const activeDrivers = list.filter((d) => !d.isUnavailable);
    const unavailableDrivers = list.filter((d) => d.isUnavailable);

    if (list.length === 0) {
      if (secondsElapsed < 10) setFeedMessage("Escaneando assinaturas de GPS...");
      else setFeedMessage(`Buscando ${plural} num raio de ${searchState.radius}km`);
    } else if (activeDrivers.length === 0 && unavailableDrivers.length > 0) {
      const count = unavailableDrivers.length;
      setFeedMessage(`${count} ${count === 1 ? label : plural} online, porém indisponível no momento`);
    } else {
      const count = activeDrivers.length;
      setFeedMessage(`${count} ${count === 1 ? label : plural} operando no perímetro`);
    }
  };

  useEffect(() => {
    if (!centerLat || !centerLng) return;

    let mounted = true;
    const label = type === "motorcycle" ? "motoboy" : type === "car" ? "carro" : type === "van" ? "van" : "frete";
    const plural = type === "motorcycle" ? "motoboys" : type === "car" ? "carros" : type === "van" ? "vans" : "fretes";

    const fetchDrivers = async () => {
      try {
        const radiusMeters = searchState.radius * 1000;
        const response = await rideService.getNearbyDrivers(centerLat, centerLng, radiusMeters);
        if (!mounted) return;
        const mapped = (Array.isArray(response) ? response : []).map(mapToNearbyDriver).filter(Boolean) as NearbyDriver[];
        setDrivers(mapped);
        updateFeedFromDrivers(mapped);
      } catch (error) {
        console.error("[useRealtimeDelivery] Failed tracking:", error);
      }
    };

    // Initial fetch
    fetchDrivers();

    // Supabase Realtime: subscribe to driver_locations changes (INSERT and UPDATE)
    const channel = supabase
      .channel(`nearby-drivers-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        () => {
          // Re-fetch on any driver location change
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [centerLat, centerLng, type, searchState.radius]);

  return { drivers, feedMessage, searchState };
}
