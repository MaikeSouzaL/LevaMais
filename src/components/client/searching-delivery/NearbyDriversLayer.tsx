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
  const renderVehicleIcon = (type: string, isUnavailable?: boolean) => {
    const iconSize = 18;
    const iconColor = isUnavailable ? "#FBBF24" : "#02de95"; // Amarelo se indisponível, Verde se ativo!
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
      {drivers.map((driver) => {
        const activeColor = driver.isUnavailable ? "rgba(251,191,36,0.7)" : "#02de95";
        const ringColor = driver.isUnavailable ? "rgba(251,191,36,0.3)" : "rgba(2,222,149,0.3)";

        return (
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
              animate={{ scale: 1, opacity: driver.isUnavailable ? 0.9 : 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="items-center justify-center"
            >
              {/* O Anel de Pulsação só aparece se o motorista for compatível! */}
              {!driver.isUnavailable && (
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
              )}
              
              {/* Vehicle Wrapper Card */}
              <View 
                className="bg-[#091A2F] p-2 rounded-full shadow-xl items-center justify-center"
                style={{
                  borderWidth: 1,
                  borderColor: activeColor,
                  shadowColor: activeColor,
                  shadowRadius: driver.isUnavailable ? 2 : 8,
                  elevation: driver.isUnavailable ? 1 : 6
                }}
              >
                {/* Icon Holder fallback safely */}
                <MotiView
                  animate={{ rotate: driver.status === "analyzing" && !driver.isUnavailable ? ["0deg", "15deg", "-15deg", "0deg"] : "0deg" }}
                  transition={{ loop: true, duration: 800, delay: 2000 }}
                >
                  <View 
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: driver.isUnavailable ? "rgba(251,191,36,0.06)" : "rgba(2,222,149,0.1)",
                      borderWidth: 1,
                      borderColor: ringColor
                    }}
                  >
                     {renderVehicleIcon(driver.vehicleType, driver.isUnavailable)}
                  </View>
                </MotiView>
              </View>
            </MotiView>
          </Marker>
        );
      })}
    </>
  );
}
