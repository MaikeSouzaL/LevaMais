import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Bell, Wallet } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { formatBRL } from "@/utils/mappers";

interface DriverStatusHeaderProps {
  todayEarnings: number;
  pendingRequests: number;
  scheduledCount: number;
  waitingQueueCount: number;
  pendingNegotiationsCount: number;
  onPressNotifications: () => void;
  online: boolean;
}

export function DriverStatusHeader({
  todayEarnings,
  pendingRequests,
  scheduledCount,
  waitingQueueCount,
  pendingNegotiationsCount,
  onPressNotifications,
  online
}: DriverStatusHeaderProps) {
  
  const totalAlerts = pendingRequests + scheduledCount + waitingQueueCount + pendingNegotiationsCount;

  return (
    <View className="flex-row items-center justify-between gap-4">
      
      {/* 💰 Glass Earning Capsule */}
      <MotiView 
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        className="flex-1 h-[58px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black"
      >
        <View className="flex-1 flex-row items-center px-4 bg-[#091A2F]">
           <View className="bg-[#02de95]/20 p-2 rounded-xl mr-3">
              <Wallet size={16} color="#02de95" />
           </View>
           <View>
             
             <Text className="text-[#02de95] font-black text-xl leading-none">
               {formatBRL(todayEarnings)}
             </Text>
           </View>
        </View>
      </MotiView>

      {/* 🔔 Alerts & Active Status Stack */}
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={onPressNotifications}
          activeOpacity={0.8}
          className={`h-[58px] w-[58px] rounded-2xl border items-center justify-center ${
            totalAlerts > 0 ? "border-amber-500/50" : "border-white/10"
          }`}
        >
          <View className="w-full h-full items-center justify-center bg-[#091A2F] rounded-2xl">
            <Bell size={20} color={totalAlerts > 0 ? "#FBBF24" : "rgba(255,255,255,0.8)"} />
            
            {totalAlerts > 0 && (
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 h-5 min-w-[20px] rounded-full items-center justify-center px-1 border-2 border-[#091A2F]"
              >
                <Text className="text-white text-[10px] font-black">
                  {totalAlerts}
                </Text>
              </MotiView>
            )}
          </View>
        </TouchableOpacity>
      </View>

    </View>
  );
}
