import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { DriverScreen } from "./components/DriverScreen"; // Adjust path if needed
import rideService, { Ride } from "../../../services/ride.service"; // Adjust path
import { PROVIDER_GOOGLE } from "react-native-maps";

const { width } = Dimensions.get("window");

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverRideDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId, ride } = route.params as { rideId?: string; ride?: Ride }; // Aceita ID ou Objeto

  const [details, setDetails] = useState<Ride | null>(ride || null);
  const [loading, setLoading] = useState(!ride);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!details && rideId) {
      loadDetails();
    }
  }, [rideId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await rideService.getById(rideId!);
      setDetails(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (details && mapRef.current) {
      // Fit to coordinates
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: details.pickup.latitude, longitude: details.pickup.longitude },
            { latitude: details.dropoff.latitude, longitude: details.dropoff.longitude },
          ],
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }, 500);
    }
  }, [details]);

  if (loading) {
    return (
      <DriverScreen title="Detalhes da Corrida">
        <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 50 }} />
      </DriverScreen>
    );
  }

  if (!details) {
    return (
      <DriverScreen title="Detalhes da Corrida">
        <Text style={{ color: "white", textAlign: "center", marginTop: 20 }}>Corrida não encontrada.</Text>
      </DriverScreen>
    );
  }

  const isCompleted = details.status === "completed";
  
  // Use saved values or fallback to default 20% rule
  const total = details.pricing?.total || 0;
  const driverEarnings = details.pricing?.driverValue ?? (total * 0.8);
  const platformFee = details.pricing?.platformFee ?? (total * 0.2);

  return (
    <DriverScreen title="Detalhes da Corrida" scroll={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Map Section */}
        <View style={{ height: 250, borderRadius: 16, overflow: "hidden", margin: 16, marginBottom: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: details.pickup.latitude,
              longitude: details.pickup.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            liteMode={false} // Full interactivity
          >
            <Marker coordinate={details.pickup} title="Retirada">
               <View style={{ backgroundColor: "#02de95", padding: 6, borderRadius: 20, borderWidth: 2, borderColor: "#fff" }}>
                  <FontAwesome5 name="map-marker-alt" size={14} color="#0f231c" />
               </View>
            </Marker>
            <Marker coordinate={details.dropoff} title="Entrega">
               <View style={{ backgroundColor: "#ef4444", padding: 6, borderRadius: 20, borderWidth: 2, borderColor: "#fff" }}>
                  <FontAwesome5 name="flag-checkered" size={14} color="#fff" />
               </View>
            </Marker>
            <Polyline
                coordinates={[
                    { latitude: details.pickup.latitude, longitude: details.pickup.longitude },
                    { latitude: details.dropoff.latitude, longitude: details.dropoff.longitude }
                ]} // MVP: Straight line. In production, use directions API polyline
                strokeWidth={4}
                strokeColor="#02de95"
            />
          </MapView>
        </View>

        {/* Status Header */}
        <View style={{ alignItems: "center", marginVertical: 16 }}>
             <Text style={{ color: isCompleted ? "#02de95" : "#ef4444", fontSize: 18, fontWeight: "800", textTransform: "uppercase" }}>
                 {isCompleted ? "Corrida Finalizada" : "Cancelada"}
             </Text>
             <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
                 {new Date(details.createdAt).toLocaleString("pt-BR")}
             </Text>
        </View>

        {/* Values Card */}
        <View style={{ marginHorizontal: 16, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                 <Text style={{ color: "rgba(255,255,255,0.6)" }}>Valor Total</Text>
                 <Text style={{ color: "#fff", fontWeight: "700" }}>{formatBRL(total)}</Text>
             </View>
             <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                 <Text style={{ color: "rgba(255,255,255,0.6)" }}>Taxa do App</Text>
                 <Text style={{ color: "#ef4444", fontWeight: "700" }}>- {formatBRL(platformFee)}</Text>
             </View>
             <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginVertical: 12 }} />
             <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                 <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 16 }}>Seu Ganho</Text>
                 <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 24 }}>{formatBRL(driverEarnings)}</Text>
             </View>
        </View>

        {/* Route Info */}
        <View style={{ margin: 16, gap: 20 }}>
            {/* Pickup */}
            <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ alignItems: "center" }}>
                    <View style={{ width: 2, height: 10, backgroundColor: "rgba(255,255,255,0.2)" }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#02de95" }} />
                    <View style={{ width: 2, flex: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
                </View>
                <View style={{ flex: 1, paddingBottom: 20 }}>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Retirada</Text>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 4 }}>
                        {details.pickup.address}
                    </Text>
                </View>
            </View>

            {/* Dropoff */}
            <View style={{ flexDirection: "row", gap: 16 }}>
                <View style={{ alignItems: "center" }}>
                    <View style={{ width: 2, height: 10, backgroundColor: "rgba(255,255,255,0.2)" }} />
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#ef4444" }} />
                    <View style={{ width: 2, height: 10, backgroundColor: "rgba(255,255,255,0)" }} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Entrega</Text>
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 4 }}>
                        {details.dropoff.address}
                    </Text>
                </View>
            </View>
        </View>

        {/* Extra Details */}
        <View style={{ margin: 16, flexDirection: "row", gap: 12 }}>
             <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, alignItems: "center" }}>
                 <MaterialIcons name="local-taxi" size={24} color="#fff" />
                 <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 }}>Serviço</Text>
                 <Text style={{ color: "#fff", fontWeight: "700", marginTop: 2 }}>
                     {details.serviceType === "delivery" ? "Entrega" : "Corrida"}
                 </Text>
             </View>
             <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, alignItems: "center" }}>
                 <MaterialIcons name="timer" size={24} color="#fff" />
                 <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 4 }}>Duração</Text>
                 <Text style={{ color: "#fff", fontWeight: "700", marginTop: 2 }}>
                     {details.duration?.text || "--"}
                 </Text>
             </View>
             <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12, alignItems: "center" }}>
                 <FontAwesome5 name="road" size={20} color="#fff" />
                 <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8 }}>Distância</Text>
                 <Text style={{ color: "#fff", fontWeight: "700", marginTop: 2 }}>
                     {details.distance?.text || "--"}
                 </Text>
             </View>
        </View>

      </ScrollView>
    </DriverScreen>
  );
}
