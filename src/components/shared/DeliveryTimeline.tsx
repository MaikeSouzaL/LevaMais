import React from "react";
import { View, Text } from "react-native";
import { getDeliveryTimeline } from "@/utils/deliveryTimeline";
import { Navigation, MapPin, Package, Check, Clock, CircleDollarSign } from "lucide-react-native";

interface DeliveryTimelineProps {
  status: string;
  arrivedAtDropoff?: boolean;
  rideId?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  durationText?: string;
  distanceText?: string;
  price?: number;
}

export default function DeliveryTimeline({ 
  status, 
  arrivedAtDropoff, 
  rideId,
  pickupAddress,
  dropoffAddress,
  durationText,
  distanceText,
  price
}: DeliveryTimelineProps) {
  const steps = getDeliveryTimeline(status, arrivedAtDropoff);

  // Map the 6 backend steps to 5 horizontal checkpoints:
  const checkpoints = [
    {
      key: "to_pickup",
      label: "A caminho da coleta",
      icon: Navigation,
      done: steps[0].done,
      active: steps[0].active,
    },
    {
      key: "arrived_pickup",
      label: "Entregador chegou na coleta",
      icon: MapPin,
      done: steps[1].done,
      active: steps[1].active,
    },
    {
      key: "in_transit",
      label: "Pacote em trânsito",
      icon: Package,
      done: steps[2].done || steps[3].done,
      active: steps[2].active || steps[3].active,
    },
    {
      key: "arrived_dropoff",
      label: "Entregador chegou no destino",
      icon: MapPin,
      done: steps[4].done,
      active: steps[4].active,
    },
    {
      key: "completed",
      label: "Entrega concluída",
      icon: Check,
      done: steps[5].done,
      active: steps[5].active,
    },
  ];

  // Find currently active step
  const activeCheckpoint = checkpoints.find(c => c.active) || checkpoints.find(c => !c.done) || checkpoints[checkpoints.length - 1];

  return (
    <View className="p-4 rounded-2xl bg-[#11253E] border border-white/[0.05]">
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-white text-base font-bold">Status da Entrega</Text>
        {rideId && (
          <View className="flex-row items-center gap-1 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
            <Package size={11} color="#02de95" />
            <Text className="text-white text-[10px] font-bold">Pedido #{rideId.slice(-6).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Stepper Row */}
      <View className="flex-row items-center justify-between px-2 mb-5">
        {checkpoints.map((cp, index) => {
          const Icon = cp.icon;
          const isDone = cp.done;
          const isActive = cp.active;
          
          return (
            <React.Fragment key={cp.key}>
              {/* Checkpoint Dot */}
              <View className="items-center z-10">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                    isDone
                      ? "bg-[#02de95] border-[#02de95]"
                      : isActive
                      ? "bg-[#11253E] border-[#02de95] shadow-lg shadow-[#02de95]/40"
                      : "bg-[#1E2D3D] border-white/10"
                  }`}
                >
                  <Icon
                    size={cp.key === "to_pickup" ? 15 : 18}
                    color={isDone ? "#091A2F" : isActive ? "#02de95" : "rgba(255,255,255,0.2)"}
                    strokeWidth={isActive ? 3 : 2}
                  />
                </View>
              </View>

              {/* Connector Line */}
              {index < checkpoints.length - 1 && (
                <View
                  className={`flex-1 h-[2px] mx-[-2px] ${
                    checkpoints[index + 1].done
                      ? "bg-[#02de95]"
                      : cp.done && checkpoints[index + 1].active
                      ? "bg-[#02de95]/50"
                      : "bg-white/[0.08]"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Tempo, Distância e Preço da Rota */}
      {(durationText || distanceText || price !== undefined) && (
        <View className="flex-row items-center justify-center gap-4 mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl py-2 px-3 self-center">
          {durationText && (
            <View className="flex-row items-center gap-1.5">
              <Clock size={12} color="#02de95" />
              <Text className="text-white/80 text-[11px] font-bold">{durationText}</Text>
            </View>
          )}
          {durationText && (distanceText || price !== undefined) && <View className="w-[1px] h-3 bg-white/10" />}
          {distanceText && (
            <View className="flex-row items-center gap-1.5">
              <Navigation size={11} color="#02de95" />
              <Text className="text-white/80 text-[11px] font-bold">{distanceText}</Text>
            </View>
          )}
          {distanceText && price !== undefined && <View className="w-[1px] h-3 bg-white/10" />}
          {price !== undefined && (
            <View className="flex-row items-center gap-1.5">
              <CircleDollarSign size={12} color="#02de95" />
              <Text className="text-white/80 text-[11px] font-bold">
                R$ {price.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Coleta e Entrega */}
      {(pickupAddress || dropoffAddress) && (
        <View className="mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3">
          {pickupAddress && (
            <View className="flex-row items-start mb-3">
              <View className="items-center mr-2.5 mt-1">
                <View className="w-2 h-2 rounded-full bg-[#02de95]" />
                <View className="w-[1px] h-5 bg-white/10 my-1" />
              </View>
              <View className="flex-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Coleta</Text>
                <Text className="text-white/80 text-[11px] font-medium mt-0.5" numberOfLines={1}>
                  {pickupAddress}
                </Text>
              </View>
            </View>
          )}

          {dropoffAddress && (
            <View className="flex-row items-start">
              <View className="items-center mr-2.5 mt-1">
                <View className="w-2 h-2 rounded-full bg-amber-500" />
              </View>
              <View className="flex-1">
                <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Entrega</Text>
                <Text className="text-white/80 text-[11px] font-medium mt-0.5" numberOfLines={1}>
                  {dropoffAddress}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Active Step Status Text */}
      <View className="items-center bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Status Atual</Text>
        <Text className="text-[#02de95] text-[15px] font-black mt-1 text-center">
          {activeCheckpoint.label}
        </Text>
        <Text className="text-white/50 text-[11px] font-medium mt-0.5">
          {activeCheckpoint.key === "completed" ? "Serviço finalizado" : "Acompanhe em tempo real"}
        </Text>
      </View>
    </View>
  );
}
