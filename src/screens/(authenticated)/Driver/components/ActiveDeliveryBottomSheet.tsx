import React from "react";
import { View, Text } from "react-native";
import { MotiView } from "moti";
import { DeliveryQuickStats } from "./DeliveryQuickStats";
import { DeliveryRouteSummary } from "./DeliveryRouteSummary";
import { DriverActionButtons } from "./DriverActionButtons";
import { ArrivedButton } from "./ArrivedButton";

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
  
  const isGoingToPickup = canArrive || status === "accepted" || status === "driver_arriving" || status === "driver_assigned";
  const isAtPickup = canStart || status === "arrived";
  const isGoingToDropoff = canComplete || status === "in_progress";

  let headerBadge = "ENTREGA ATIVA";
  let headerTitle = pickupAddress;
  if (isGoingToPickup) {
    headerBadge = "INDO PARA A COLETA";
    headerTitle = pickupAddress;
  } else if (isAtPickup) {
    headerBadge = "AGUARDANDO RETIRADA";
    headerTitle = pickupAddress;
  } else if (isGoingToDropoff) {
    headerBadge = "A CAMINHO DA ENTREGA";
    headerTitle = dropoffAddress;
  }

  const getAddressSubtitle = (address: string) => {
    if (!address) return "Pimenta Bueno - RO";
    const parts = address.split(",");
    if (parts.length > 2) {
      return `${parts[1]?.trim() || ""} - ${parts[2]?.trim() || ""}`;
    }
    return address;
  };
  
  const headerSubtitle = getAddressSubtitle(headerTitle);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="bg-[#11253E] rounded-t-[36px] p-5 pb-6 border-t border-white/[0.06] w-full"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.35,
        shadowRadius: 15,
        elevation: 10,
      }}
    >
      {/* Small drag handle indicator */}
      <View className="align-self-center items-center mb-4">
        <View className="w-10 h-1.5 rounded-full bg-white/10" />
      </View>

      {/* Header Info */}
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-3">
          <View className="bg-[#02de95]/10 border border-[#02de95]/20 self-start px-2.5 py-0.5 rounded-lg mb-1.5">
            <Text className="text-[#02de95] text-[9px] font-black uppercase tracking-wider">
              {headerBadge}
            </Text>
          </View>
          <Text className="text-white text-lg font-black leading-tight" numberOfLines={1}>
            {headerTitle}
          </Text>
          <Text className="text-white/50 text-xs font-semibold mt-0.5">
            {headerSubtitle}
          </Text>
        </View>

        {duration && (
          <View className="w-12 h-12 rounded-full bg-[#091A2F]/80 border border-[#02de95]/30 items-center justify-center flex-shrink-0">
            <Text className="text-white/50 text-[7px] font-black uppercase tracking-wider">ETA</Text>
            <Text className="text-[#02de95] text-xs font-black -mt-0.5">
              {duration.replace("mins", "min").replace("minutos", "min")}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Stats Grid */}
      <DeliveryQuickStats
        distance={distance}
        duration={duration}
        earnings={earnings}
      />

      {/* Route Timeline & Payment */}
      <DeliveryRouteSummary
        pickupAddress={pickupAddress}
        dropoffAddress={dropoffAddress}
        paymentLabel={paymentLabel}
      />

      {/* Actions Row */}
      <DriverActionButtons
        recipientPhone={recipientPhone}
        onChat={onChat}
        unreadCount={unreadCount}
        onReportProblem={onReportProblem}
      />

      {/* Primary Action Button */}
      {isGoingToPickup && (
        <ArrivedButton
          label="CHEGUEI"
          loading={actionLoading}
          onPress={onPrimaryActionPress}
        />
      )}

      {isAtPickup && (
        <ArrivedButton
          label="INICIAR CORRIDA"
          loading={actionLoading}
          onPress={onPrimaryActionPress}
        />
      )}

      {isGoingToDropoff && (
        canArriveDropoff ? (
          <ArrivedButton
            label="CHEGUEI NO DESTINO"
            loading={actionLoading}
            onPress={onArriveDropoff || onPrimaryActionPress}
          />
        ) : (
          <ArrivedButton
            label="FINALIZAR ENTREGA"
            loading={actionLoading}
            onPress={onPrimaryActionPress}
          />
        )
      )}
    </MotiView>
  );
}
