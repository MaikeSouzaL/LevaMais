import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { DriverActionButtons } from "./DriverActionButtons";
import { ArrivedButton } from "./ArrivedButton";
import { PickupProgressIndicator } from "./PickupProgressIndicator";
import { Check, MapPin, Package, Truck } from "lucide-react-native";

type ActiveDeliveryBottomSheetProps = {
  status: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  distance?: string;
  duration?: string;
  earnings?: number;
  paymentLabel?: string;
  recipientPhone?: string;
  unreadCount?: number;
  onChat?: () => void;
  onReportProblem?: () => void;
  onPrimaryActionPress: () => void;
  actionLoading?: boolean;
  canArrive: boolean;
  canStart: boolean;
  canComplete: boolean;
  isDelivery?: boolean;
  canArriveDropoff?: boolean;
  onArriveDropoff?: () => void;
};

type ProgressStep = "to_pickup" | "at_pickup" | "to_dropoff" | "completed";

function getProgressStep(
  status: string,
  canArrive: boolean,
  canStart: boolean,
  canComplete: boolean,
): ProgressStep {
  if (status === "completed") return "completed";
  if (canComplete) return "to_dropoff";
  if (canStart) return "at_pickup";
  if (canArrive) return "to_pickup";
  if (status === "in_progress") return "to_dropoff";
  if (status === "arrived") return "at_pickup";
  if (
    status === "driver_arriving" ||
    status === "accepted" ||
    status === "driver_assigned"
  ) {
    return "to_pickup";
  }
  return "to_pickup";
}

const STEP_ICON: Record<
  ProgressStep,
  React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  to_pickup: Truck,
  at_pickup: MapPin,
  to_dropoff: Package,
  completed: Check,
};

function getStepLabel(step: ProgressStep, isDelivery: boolean): string {
  if (isDelivery) {
    return {
      to_pickup: "Indo para coleta",
      at_pickup: "Aguardando retirada",
      to_dropoff: "A caminho da entrega",
      completed: "Finalizado",
    }[step];
  }
  // Corrida: terminologia de embarque/desembarque
  return {
    to_pickup: "A caminho do embarque",
    at_pickup: "No ponto de embarque",
    to_dropoff: "A caminho do desembarque",
    completed: "Finalizado",
  }[step];
}

function formatCurrency(value?: number) {
  if (value == null) return "R$ 0,00";
  return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
}

export function ActiveDeliveryBottomSheet({
  status,
  pickupAddress = "R. Josias da Silva, 295",
  dropoffAddress = "Av. Maceió, 1132",
  distance = "9,2 km",
  duration = "15 min",
  earnings = 11.16,
  paymentLabel = "DINHEIRO",
  recipientPhone,
  unreadCount = 0,
  onChat,
  onReportProblem,
  onPrimaryActionPress,
  actionLoading = false,
  canArrive,
  canStart,
  canComplete,
  isDelivery = false,
  canArriveDropoff = false,
  onArriveDropoff,
}: ActiveDeliveryBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const progressStep = getProgressStep(status, canArrive, canStart, canComplete);

  const isGoingToPickup =
    canArrive ||
    status === "accepted" ||
    status === "driver_arriving" ||
    status === "driver_assigned";
  const isAtPickup = canStart || status === "arrived";
  const isGoingToDropoff = canComplete || status === "in_progress";

  const activeStepLabel = getStepLabel(progressStep, isDelivery);
  const ActiveIcon = STEP_ICON[progressStep];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="bg-[#11253E] rounded-t-[36px] border-t border-white/[0.06] w-full"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
        elevation: 10,
        maxHeight: 400,
        paddingBottom: 16 + insets.bottom,
      }}
    >
      {/* Small drag handle indicator */}
      <View className="items-center mt-2 mb-3">
        <View className="w-10 h-1.5 rounded-full bg-white/10" />
      </View>

      {/* Header: ícone da fase ativa + endereço atual */}
      <View className="px-5 flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{
            backgroundColor: "rgba(2, 222, 149, 0.15)",
            borderWidth: 1,
            borderColor: "rgba(2, 222, 149, 0.45)",
          }}
        >
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={progressStep}
              from={{ opacity: 0, scale: 0.6, rotate: "-15deg" }}
              animate={{ opacity: 1, scale: 1, rotate: "0deg" }}
              exit={{ opacity: 0, scale: 0.6, rotate: "15deg" }}
              transition={{ type: "timing", duration: 280 }}
            >
              <ActiveIcon size={18} color="#02de95" strokeWidth={2.5} />
            </MotiView>
          </AnimatePresence>
        </View>
        <View className="flex-1">
          <Text
            className="text-white text-base font-black leading-tight"
            numberOfLines={1}
          >
            {isGoingToDropoff ? dropoffAddress : pickupAddress}
          </Text>
          <Text className="text-white/45 text-[11px] font-semibold mt-0.5">
            {activeStepLabel}
          </Text>
        </View>
      </View>

      {/* Stats inline (Distância / Tempo / Ganho) */}
      <View className="mx-5 flex-row gap-2 mb-3">
        <View className="flex-1 bg-[#1E2D3D] border border-white/[0.06] rounded-xl py-2.5 items-center">
          <Text className="text-white/45 text-[10px] font-black uppercase tracking-wider mb-0.5">
            Distância
          </Text>
          <Text className="text-white text-[13px] font-black">{distance}</Text>
        </View>
        <View className="flex-1 bg-[#1E2D3D] border border-white/[0.06] rounded-xl py-2.5 items-center">
          <Text className="text-white/45 text-[10px] font-black uppercase tracking-wider mb-0.5">
            Tempo
          </Text>
          <Text className="text-white text-[13px] font-black">{duration}</Text>
        </View>
        <View className="flex-1 bg-[#1E2D3D] border border-[#02de95]/35 rounded-xl py-2.5 items-center">
          <Text className="text-[#02de95]/80 text-[10px] font-black uppercase tracking-wider mb-0.5">
            Ganho
          </Text>
          <Text className="text-[#02de95] text-[13px] font-black">
            {formatCurrency(earnings)}
          </Text>
        </View>
      </View>

      {/* Progress Indicator (animado em tempo real) */}
      <View className="mx-5 mb-3">
        <PickupProgressIndicator
          currentStep={progressStep}
          isDelivery={isDelivery}
        />
      </View>

      {/* Actions Row */}
      <View className="px-5">
        <DriverActionButtons
          recipientPhone={recipientPhone}
          onChat={onChat}
          unreadCount={unreadCount}
          onReportProblem={onReportProblem}
        />
      </View>

      {/* Primary Action Button */}
      {isGoingToPickup && (
        <View className="px-5 mt-3">
          <ArrivedButton
            label="CHEGUEI"
            loading={actionLoading}
            onPress={onPrimaryActionPress}
          />
        </View>
      )}

      {isAtPickup && (
        <View className="px-5 mt-3">
          <ArrivedButton
            label={isDelivery ? "COLETAR ENCOMENDA" : "INICIAR CORRIDA"}
            loading={actionLoading}
            onPress={onPrimaryActionPress}
          />
        </View>
      )}

      {isGoingToDropoff && (
        <View className="px-5 mt-3">
          {canArriveDropoff ? (
            <ArrivedButton
              label="CHEGUEI NO DESTINO"
              loading={actionLoading}
              onPress={onArriveDropoff || onPrimaryActionPress}
            />
          ) : (
            <ArrivedButton
              label={isDelivery ? "FINALIZAR ENTREGA" : "FINALIZAR CORRIDA"}
              loading={actionLoading}
              onPress={onPrimaryActionPress}
            />
          )}
        </View>
      )}
    </MotiView>
  );
}