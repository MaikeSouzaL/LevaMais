import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Bell, Wallet } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { formatBRL } from "@/utils/mappers";

interface DriverStatusHeaderProps {
  driverBalance: number;
  pendingRequests: number;
  scheduledCount: number;
  waitingQueueCount: number;
  pendingNegotiationsCount: number;
  onPressNotifications: () => void;
  online: boolean;
}

export function DriverStatusHeader({
  driverBalance,
  pendingRequests,
  scheduledCount,
  waitingQueueCount,
  pendingNegotiationsCount,
  onPressNotifications,
  online
}: DriverStatusHeaderProps) {
  
  const totalAlerts = pendingRequests + scheduledCount + waitingQueueCount + pendingNegotiationsCount;
  const isLowBalance = driverBalance <= 0;

  return (
    <View className="flex-row items-center justify-between gap-4">
      
      {/* 💰 Glass Wallet Balance Capsule */}
      <MotiView 
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        className="flex-1 h-[58px] rounded-2xl overflow-hidden border shadow-2xl shadow-black"
        style={{ borderColor: isLowBalance ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)" }}
      >
        <View className="flex-1 flex-row items-center px-4 bg-[#091A2F]">
           <View style={{ backgroundColor: isLowBalance ? "rgba(239,68,68,0.15)" : "rgba(2,222,149,0.15)" }} className="p-2 rounded-xl mr-3">
              <Wallet size={16} color={isLowBalance ? "#ef4444" : "#02de95"} />
           </View>
           <View>
             <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Saldo</Text>
             <Text style={{ color: isLowBalance ? "#ef4444" : "#02de95", fontWeight: "900", fontSize: 20, lineHeight: 24 }}>
               {formatBRL(driverBalance)}
             </Text>
           </View>
           {isLowBalance && (
             <View style={{ marginLeft: "auto", backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
               <Text style={{ color: "#ef4444", fontSize: 9, fontWeight: "900" }}>RECARREGUE</Text>
             </View>
           )}
        </View>
      </MotiView>

      {/* 🔔 Alerts & Active Status Stack */}
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onPressNotifications}
          activeOpacity={0.8}
          style={{
            height: 58,
            width: 58,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: totalAlerts > 0 ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.1)",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#091A2F",
            position: "relative",
          }}
        >
          <Bell size={22} color={totalAlerts > 0 ? "#FBBF24" : "rgba(255,255,255,0.8)"} />
          
          {totalAlerts > 0 && (
            <MotiView
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                position: "absolute",
                top: -6,
                right: -6,
                backgroundColor: "#ef4444",
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 4,
                borderWidth: 2,
                borderColor: "#091A2F",
                zIndex: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>
                {totalAlerts}
              </Text>
            </MotiView>
          )}
        </TouchableOpacity>
      </View>

    </View>
  );
}
