import { useState, useEffect, useMemo } from "react";
import rideService from "@/services/ride.service";

export interface NearbyDriver {
  id: string;
  latitude: number;
  longitude: number;
  vehicleType: string;
  rotation?: number;
  status?: "scanning" | "analyzing" | "idle";
}

export function useRealtimeDelivery(
  centerLat?: number, 
  centerLng?: number, 
  type: string = "motorcycle",
  secondsElapsed: number = 0
) {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [feedMessage, setFeedMessage] = useState("Iniciando mapeamento urbano...");
  
  // 🧠 Progressive Search Scaler (Keep high-end logic)
  const searchState = useMemo(() => {
    if (secondsElapsed < 20) return { stage: "nearby" as const, radius: 2.5, label: "Busca Local" };
    if (secondsElapsed < 60) return { stage: "expanded" as const, radius: 6.0, label: "Raio Expandido" };
    return { stage: "regional" as const, radius: 12.0, label: "Busca Regional" };
  }, [secondsElapsed]);

  // 📡 Production Grade Polling Loop: Fetches REAL coordinates from DB
  useEffect(() => {
    if (!centerLat || !centerLng) return;

    // Helper to pluralize display tags
    const label = type === "motorcycle" ? "motoboy" : type === "car" ? "carro" : type === "van" ? "van" : "caminhão";
    const plural = type === "motorcycle" ? "motoboys" : type === "car" ? "carros" : type === "van" ? "vans" : "caminhões";

    const fetchRealNearbyDrivers = async () => {
      try {
        // Convert KM state into Meters required by the API backend
        const radiusMeters = searchState.radius * 1000;
        
        const response = await rideService.getNearbyDrivers(
          centerLat, 
          centerLng, 
          radiusMeters
        );

        // Sanitize API response into local render schema 🔒
        if (Array.isArray(response)) {
          // Optionally filter by requested vehicle type if API doesn't filter already, 
          // but usually API returns all online within bounds. 
          const mappedDrivers: NearbyDriver[] = response.map((d: any) => ({
            id: d._id || d.id,
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            vehicleType: d.vehicleType || d.type || type,
            rotation: d.rotation,
            status: "scanning" as const
          }));

          setDrivers(mappedDrivers);

          // Update telemetry feedback realistically
          if (mappedDrivers.length === 0) {
             if (secondsElapsed < 10) setFeedMessage("Escaneando assinaturas de GPS...");
             else setFeedMessage(`Buscando ${plural} num raio de ${searchState.radius}km`);
          } else {
             const count = mappedDrivers.length;
             setFeedMessage(`${count} ${count === 1 ? label : plural} operando no perímetro`);
          }
        }
      } catch (error) {
        console.error("[useRealtimeDelivery] Failed tracking:", error);
      }
    };

    // Initial Immediate Fetch ⚡
    fetchRealNearbyDrivers();

    // Recursive 4-second tracking loop
    const tracker = setInterval(fetchRealNearbyDrivers, 4000);

    return () => clearInterval(tracker);

  }, [centerLat, centerLng, type, searchState.radius]); 
  // Recalculates instantly if coordinates, type, or expanded radius tier changes!

  return { drivers, feedMessage, searchState };
}
