import React from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import { MotiView } from "moti";
import { Bike, Car, Truck } from "lucide-react-native";
import { NearbyDriver } from "@/hooks/useRealtimeDelivery";

interface NearbyDriversLayerProps {
  drivers: NearbyDriver[];
}

export function NearbyDriversLayer({ drivers }: NearbyDriversLayerProps) {
  // Replacing physical asset requires with Vector Icons to prevent bundling crashes 🛠️
  const renderVehicleIcon = (type: string) => {
    const iconSize = 18;
    const iconColor = "#02de95";
    switch (type) {
      case "motorcycle": return <Bike size={iconSize} color={iconColor} />;
      case "car": return <Car size={iconSize} color={iconColor} />;
      case "van": return <Truck size={iconSize} color={iconColor} />;
      case "truck": return <Truck size={iconSize} color={iconColor} />;
      default: return <Bike size={iconSize} color={iconColor} />;
    }
  };

  return (
    <>
      {drivers.map((driver) => (
        <Marker
          key={driver.id}
          coordinate={{
            latitude: driver.latitude,
            longitude: driver.longitude
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
        >
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="items-center justify-center"
          >
            {/* Dynamic scanner halo under the vehicle */}
            <MotiView
              from={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{
                loop: true,
                type: "timing",
                duration: 1500,
              }}
              className="absolute w-10 h-10 rounded-full bg-[#02de95]/30 border border-[#02de95]/50"
            />
            
            {/* Vehicle Wrapper Card */}
            <View 
              className="bg-[#091A2F] p-2 rounded-full border border-[#02de95]/60 shadow-xl items-center justify-center"
              style={{
                shadowColor: "#02de95",
                shadowRadius: 8,
                elevation: 6
              }}
            >
              {/* Icon Holder fallback safely */}
              <MotiView
                animate={{ rotate: driver.status === "analyzing" ? ["0deg", "15deg", "-15deg", "0deg"] : "0deg" }}
                transition={{ loop: true, duration: 800, delay: 2000 }}
              >
                <View className="w-9 h-9 bg-[#02de95]/10 rounded-full items-center justify-center border border-[#02de95]/20">
                   {renderVehicleIcon(driver.vehicleType)}
                </View>
              </MotiView>
            </View>
          </MotiView>
        </Marker>
      ))}
    </>
  );
}
