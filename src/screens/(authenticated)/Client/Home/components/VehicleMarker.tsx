import React from "react";
import MapMarker from "@/components/MapMarker";

interface VehicleMarkerProps {
  type: string;
  rotation?: number;
}

const VEHICLE_TYPE_MAP: Record<string, "driver" | "driver"> = {
  motorcycle: "driver",
  car: "driver",
  van: "driver",
  truck: "driver",
};

export function VehicleMarker({ type }: VehicleMarkerProps) {
  const markerType = VEHICLE_TYPE_MAP[type] || "driver";
  return <MapMarker type={markerType} size={46} />;
}
