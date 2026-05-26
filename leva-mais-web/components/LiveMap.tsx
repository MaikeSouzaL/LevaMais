"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { DriverLocation } from "@/services/driverLocationService";

// Corrigir ícones do Leaflet que não carregam corretamente com Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícones personalizados
const availableIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const onRideIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const busyIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const offlineIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const clientIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LiveMapProps {
  locations: DriverLocation[];
  clients?: any[];
}

export default function LiveMap({ locations, clients = [] }: LiveMapProps) {
  let defaultCenter: [number, number] = [-14.2350, -51.9253]; // Brasil
  
  if (locations.length > 0 && locations[0]?.location?.coordinates && locations[0].location.coordinates.length >= 2) {
    defaultCenter = [locations[0].location.coordinates[1], locations[0].location.coordinates[0]];
  } else if (clients.length > 0 && clients[0]?.lastLocation?.coordinates && clients[0].lastLocation.coordinates.length >= 2) {
    defaultCenter = [clients[0].lastLocation.coordinates[1], clients[0].lastLocation.coordinates[0]];
  }

  return (
    <div style={{ height: "100%", width: "100%", minHeight: "450px" }}>
      <MapContainer
        center={defaultCenter}
        zoom={locations.length > 0 ? 12 : 4}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((loc) => {
          let icon = availableIcon;
          if (loc.status === "on_ride") icon = onRideIcon;
          else if (loc.status === "busy") icon = busyIcon;
          else if (loc.status === "offline") icon = offlineIcon;

          if (!loc?.location?.coordinates || loc.location.coordinates.length < 2) return null;
          const lat = loc.location.coordinates[1];
          const lng = loc.location.coordinates[0];
          if (typeof lat !== "number" || typeof lng !== "number") return null;

          return (
            <Marker key={loc._id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="text-center font-sans">
                  <p className="font-bold text-gray-800">{loc.driverId?.name || "Motorista"}</p>
                  <p className="text-xs text-gray-500 capitalize">{loc.vehicleType === "motorcycle" ? "Moto" : loc.vehicleType}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Vel: {loc.speed || 0} km/h</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Renderizar Clientes */}
        {clients.map((client) => {
          if (!client?.lastLocation?.coordinates || client.lastLocation.coordinates.length < 2) return null;
          const lat = client.lastLocation.coordinates[1];
          const lng = client.lastLocation.coordinates[0];
          if (typeof lat !== "number" || typeof lng !== "number") return null;

          return (
            <Marker key={client._id || client.id || Math.random()} position={[lat, lng]} icon={clientIcon}>
              <Popup>
                <div className="text-center font-sans">
                  <p className="font-bold text-gray-800">{client.name || "Cliente"}</p>
                  <p className="text-xs text-red-600 font-semibold mt-1">Cliente (App)</p>
                  {client.lastLocation.updatedAt && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Visto em: {new Date(client.lastLocation.updatedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
