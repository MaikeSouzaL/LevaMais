import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { MotiView } from "moti";
import { Truck, MapPin, Package, Check } from "lucide-react-native";

type ActiveDeliveryHeaderProps = {
  driverName?: string;
  driverPhoto?: string;
  onCancelPress?: () => void;
  canCancel?: boolean;
  isDelivery?: boolean;
  status?: string;
};

function getPhaseMeta(status: string | undefined, isDelivery: boolean) {
  const s = String(status || "").toLowerCase();
  if (s === "driver_arriving" || s === "accepted" || s === "driver_assigned") {
    return {
      title: isDelivery ? "Indo para a coleta" : "Indo buscar passageiro",
      icon: Truck,
      accent: "#02de95",
      bg: "rgba(2, 222, 149, 0.12)",
      border: "rgba(2, 222, 149, 0.35)",
    };
  }
  if (s === "arrived") {
    return {
      title: isDelivery ? "Aguardando retirada" : "Aguardando embarque",
      icon: MapPin,
      accent: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.35)",
    };
  }
  if (s === "in_progress") {
    return {
      title: isDelivery ? "A caminho da entrega" : "A caminho do destino",
      icon: Package,
      accent: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.12)",
      border: "rgba(59, 130, 246, 0.35)",
    };
  }
  if (s === "completed") {
    return {
      title: "Finalizada",
      icon: Check,
      accent: "#22c55e",
      bg: "rgba(34, 197, 94, 0.12)",
      border: "rgba(34, 197, 94, 0.35)",
    };
  }
  if (s === "payment_pending") {
    return {
      title: "Aguardando pagamento",
      icon: Package,
      accent: "#a855f7",
      bg: "rgba(168, 85, 247, 0.12)",
      border: "rgba(168, 85, 247, 0.35)",
    };
  }
  return {
    title: isDelivery ? "Entrega Ativa" : "Corrida Ativa",
    icon: isDelivery ? Package : Truck,
    accent: "#02de95",
    bg: "rgba(2, 222, 149, 0.08)",
    border: "rgba(255, 255, 255, 0.06)",
  };
}

export function ActiveDeliveryHeader({
  driverPhoto,
  onCancelPress,
  canCancel = true,
  isDelivery = false,
  status,
}: ActiveDeliveryHeaderProps) {
  const meta = getPhaseMeta(status, isDelivery);
  const Icon = meta.icon;

  return (
    <View className="h-16 px-4 flex-row items-center justify-between bg-[#091A2F] border-b border-white/[0.05]">
      <View className="flex-row items-center gap-3 flex-1">
        {driverPhoto ? (
          <Image
            source={{ uri: driverPhoto }}
            className="w-10 h-10 rounded-full border border-white/10"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-[#11253E] border border-white/10 items-center justify-center">
            <Text className="text-white text-xs font-black">M</Text>
          </View>
        )}
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <MotiView
              from={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 16 }}
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: meta.bg, borderWidth: 1, borderColor: meta.border }}
            >
              <Icon size={12} color={meta.accent} />
            </MotiView>
            <Text className="text-white font-extrabold text-sm tracking-wide" numberOfLines={1}>
              {meta.title}
            </Text>
          </View>
          <Text className="text-white/40 text-[10px] font-semibold mt-0.5" numberOfLines={1}>
            {isDelivery ? "Entrega em andamento" : "Corrida em andamento"}
          </Text>
        </View>
      </View>

      {canCancel && onCancelPress && (
        <TouchableOpacity onPress={onCancelPress} activeOpacity={0.8}>
          <Text className="text-red-500 font-extrabold text-sm uppercase tracking-wide">
            Cancelar
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
