import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Phone, MessageSquare, AlertTriangle } from "lucide-react-native";
import { MotiView } from "moti";

export type DriverStatusCardProps = {
  statusLabel: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  showRouteDetails?: boolean;
  canArrive: boolean;
  canStart: boolean;
  canComplete: boolean;
  actionLoading: null | "cancel" | "driver_arriving" | "arrived" | "in_progress" | "completed" | "arrived_at_dropoff";
  onArrive: () => void;
  onStart: () => void;
  onComplete: () => void;
  onChat?: () => void;
  unreadCount?: number;
  clientName?: string;
  clientRating?: number;
  distance?: string;
  duration?: string;
  pricing?: { total?: number; driverValue?: number };
  details?: {
    itemType?: string;
    cargoSize?: string;
    priority?: number;
    approximateWeightKg?: number;
    isFragile?: boolean;
    pickupComplement?: string;
    dropoffComplement?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientInstructions?: string;
    pickupPin?: string;
    deliveryPin?: string;
    specialInstructions?: string;
    insurance?: string;
  };
  payment?: { method?: { type?: string } | string };
  isDelivery?: boolean;
  arrivedAtDropoff?: boolean;
  canArriveDropoff?: boolean;
  onArriveDropoff?: () => void;
  status?: string;
};

export function DriverStatusCard({
  statusLabel,
  pickupAddress,
  dropoffAddress,
  showRouteDetails = true,
  canArrive,
  canStart,
  canComplete,
  actionLoading,
  onArrive,
  onStart,
  onComplete,
  onChat,
  unreadCount = 0,
  clientName,
  clientRating,
  distance,
  duration,
  pricing,
  details,
  payment,
  isDelivery = false,
  arrivedAtDropoff = false,
  canArriveDropoff = false,
  onArriveDropoff,
  status,
}: DriverStatusCardProps) {
  const busy = actionLoading != null;
  
  const isGoingToPickup = canArrive || status === "accepted" || status === "driver_arriving";
  const isAtPickup = canStart || status === "arrived";
  const isGoingToDropoff = canComplete || status === "in_progress";

  let headerBadge = "Entrega ativa";
  let headerTitle = pickupAddress || "Endereço de Coleta";
  if (isGoingToPickup) {
    headerBadge = "Indo para a coleta";
    headerTitle = pickupAddress || "R. Josias da Silva, 295";
  } else if (isAtPickup) {
    headerBadge = "No local da coleta";
    headerTitle = pickupAddress || "Aguardando Coleta";
  } else if (isGoingToDropoff) {
    headerBadge = "A caminho da entrega";
    headerTitle = dropoffAddress || "Av. Maceió, 1132";
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

  const rawPaymentType = typeof payment?.method === "object" ? payment?.method?.type : payment?.method;
  const paymentLabel =
    rawPaymentType === "pix" ? "PIX" : rawPaymentType === "card" || rawPaymentType === "credit_card" ? "Cartão" : "Dinheiro";
  
  const driverEarning = pricing?.driverValue || pricing?.total || 0;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="bg-[#091A2F] rounded-3xl p-5 border border-white/[0.06] w-full"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 }}
    >
      {/* ── 1. Cabeçalho do modal ── */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-1 mr-3">
          <View className="bg-[#02de95]/10 border border-[#02de95]/20 self-start px-2.5 py-0.5 rounded-lg mb-1.5">
            <Text className="text-[#02de95] text-[9px] font-black uppercase tracking-wider">
              {headerBadge}
            </Text>
          </View>
          <Text className="text-white text-base font-black leading-tight" numberOfLines={1}>
            {headerTitle}
          </Text>
          <Text className="text-white/50 text-[11px] font-medium mt-0.5">
            {headerSubtitle}
          </Text>
        </View>

        {duration && (
          <View className="w-12 h-12 rounded-full bg-[#02de95]/10 border border-[#02de95]/30 items-center justify-center flex-shrink-0">
            <Text className="text-[#02de95] text-[8px] font-black uppercase tracking-wider">ETA</Text>
            <Text className="text-white text-xs font-black -mt-0.5">
              {duration.replace("mins", "min").replace("minutos", "min")}
            </Text>
          </View>
        )}
      </View>

      {/* ── 2. Linha de indicadores ── */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-[#11253E] border border-white/[0.04] rounded-2xl px-3 py-3 items-center">
          <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">Distância</Text>
          <Text className="text-white text-sm font-black">{distance || "9,2 km"}</Text>
        </View>
        <View className="flex-1 bg-[#11253E] border border-white/[0.04] rounded-2xl px-3 py-3 items-center">
          <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">Tempo</Text>
          <Text className="text-white text-sm font-black">{duration || "15 min"}</Text>
        </View>
        <View className="flex-1 bg-emerald-500/[0.06] border border-emerald-500/15 rounded-2xl px-3 py-3 items-center">
          <Text className="text-emerald-400/60 text-[9px] font-black uppercase tracking-wider mb-0.5">Ganho</Text>
          <Text className="text-[#02de95] text-sm font-black">
            R$ {Number(driverEarning || 11.00).toFixed(2).replace(".", ",")}
          </Text>
        </View>
      </View>

      {/* ── 3. Pagamento ── */}
      <View className="bg-[#11253E] border border-white/[0.04] rounded-2xl p-3.5 mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-white/40 text-[8px] font-black uppercase tracking-wider mb-0.5">Pagamento</Text>
          <Text className="text-[#02de95] text-sm font-black uppercase tracking-wide">
            {paymentLabel === "Dinheiro" ? "DINHEIRO" : paymentLabel.toUpperCase()}
          </Text>
        </View>
        <View className="bg-[#02de95]/10 px-3 py-1 rounded-xl border border-[#02de95]/20">
          <Text className="text-[#02de95] text-[9px] font-bold uppercase tracking-wide">Direto ao Motorista</Text>
        </View>
      </View>

      {/* ── 4. Rota ── */}
      {showRouteDetails && (
        <View className="bg-[#11253E] border border-white/[0.04] rounded-2xl p-4 mb-4">
          <Text className="text-white/40 text-[8px] font-black uppercase tracking-wider mb-3">Trajeto da Entrega</Text>
          <View className="flex-row gap-3">
            <View className="items-center pt-1.5">
              <View className="w-3 h-3 rounded-full bg-[#02de95] border-2 border-[#11253E]" />
              <View className="w-[1.5px] h-8 bg-white/[0.08] my-1 rounded-full" />
              <View className="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-[#11253E]" />
            </View>
            <View className="flex-1 gap-3.5">
              <View>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-wider">Coleta</Text>
                <Text className="text-white text-xs font-semibold mt-0.5" numberOfLines={1}>
                  {pickupAddress || "R. Josias da Silva, 295 - Pimenta Bueno, RO"}
                </Text>
              </View>
              <View>
                <Text className="text-white/40 text-[8px] font-black uppercase tracking-wider">Entrega</Text>
                <Text className="text-white text-xs font-semibold mt-0.5" numberOfLines={1}>
                  {dropoffAddress || "Av. Maceió, 1132 - Pimenta Bueno, RO"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* ── 5. Remetente & 6. Carga ── */}
      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 bg-[#11253E] border border-white/[0.04] rounded-2xl p-3.5">
          <Text className="text-white/40 text-[8px] font-black uppercase tracking-wider mb-0.5">Remetente</Text>
          <Text className="text-white text-xs font-extrabold" numberOfLines={1}>
            {clientName || "Maike de Souza Leite"}
          </Text>
        </View>

        <View className="flex-1 bg-[#11253E] border border-white/[0.04] rounded-2xl p-3.5">
          <Text className="text-white/40 text-[8px] font-black uppercase tracking-wider mb-0.5">Tipo de Carga</Text>
          <Text className="text-white text-xs font-extrabold" numberOfLines={1}>
            {details?.itemType || "Standard"}
          </Text>
        </View>
      </View>

      {/* ── 7. PIN (Somente a etapa atual) ── */}
      {isGoingToPickup || isAtPickup ? (
        details?.pickupPin ? (
          <View className="bg-[#11253E] border border-[#02de95]/20 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[#02de95] text-[8px] font-black uppercase tracking-wider mb-0.5">PIN de Coleta</Text>
              <Text className="text-white/50 text-[10px]">Solicite ao remetente antes de iniciar</Text>
            </View>
            <View className="bg-[#02de95]/10 px-4 py-2 rounded-xl border border-[#02de95]/30">
              <Text className="text-[#02de95] text-lg font-black tracking-wider">{details.pickupPin}</Text>
            </View>
          </View>
        ) : null
      ) : (
        details?.deliveryPin ? (
          <View className="bg-[#11253E] border border-[#f59e0b]/20 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-[#f59e0b] text-[8px] font-black uppercase tracking-wider mb-0.5">PIN de Entrega</Text>
              <Text className="text-white/50 text-[10px]">Solicite ao destinatário para finalizar</Text>
            </View>
            <View className="bg-[#f59e0b]/10 px-4 py-2 rounded-xl border border-[#f59e0b]/30">
              <Text className="text-[#f59e0b] text-lg font-black tracking-wider">{details.deliveryPin}</Text>
            </View>
          </View>
        ) : null
      )}

      {/* ── 8. Ações secundárias ── */}
      <View className="flex-row gap-2 mb-4">
        {/* Ligar */}
        <TouchableOpacity
          onPress={() => {
            const phone = details?.recipientPhone || "";
            if (phone) {
              Linking.openURL(`tel:${phone}`);
            }
          }}
          activeOpacity={0.8}
          className="flex-1 h-11 rounded-2xl bg-[#1E2D3D] border border-white/[0.04] flex-row items-center justify-center gap-1.5"
        >
          <Phone size={14} color="rgba(255, 255, 255, 0.7)" />
          <Text className="text-white/80 text-[11px] font-bold">Ligar</Text>
        </TouchableOpacity>

        {/* Chat */}
        {onChat && (
          <TouchableOpacity
            onPress={onChat}
            activeOpacity={0.8}
            className="flex-1 h-11 rounded-2xl bg-[#1E2D3D] border border-white/[0.04] flex-row items-center justify-center gap-1.5 relative"
          >
            <MessageSquare size={14} color="#02de95" fill="rgba(2, 222, 149, 0.1)" />
            <Text className="text-[#02de95] text-[11px] font-extrabold">Chat</Text>
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-red-500 items-center justify-center px-1 border border-[#091A2F]">
                <Text className="text-white text-[8px] font-black">{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Problema */}
        <TouchableOpacity
          onPress={() => {
            // Se houver uma forma de reportar ou cancelar
          }}
          activeOpacity={0.8}
          className="flex-1 h-11 rounded-2xl bg-[#1E2D3D] border border-white/[0.04] flex-row items-center justify-center gap-1.5"
        >
          <AlertTriangle size={14} color="#ef4444" />
          <Text className="text-red-500/90 text-[11px] font-extrabold">Problema</Text>
        </TouchableOpacity>
      </View>

      {/* ── 9. Botão principal ── */}
      <View className="mt-1">
        {canArrive && (
          <TouchableOpacity onPress={onArrive} disabled={busy} activeOpacity={0.85}
            className="w-full h-14 bg-[#02de95] rounded-2xl items-center justify-center"
            style={{ shadowColor: "#02de95", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
            <Text className="text-[#091A2F] text-sm font-black uppercase tracking-wider">
              {actionLoading === "arrived" ? "Marcando chegada..." : "CHEGUEI NA COLETA"}
            </Text>
          </TouchableOpacity>
        )}

        {canStart && (
          <TouchableOpacity onPress={onStart} disabled={busy} activeOpacity={0.85}
            className="w-full h-14 bg-[#02de95] rounded-2xl items-center justify-center"
            style={{ shadowColor: "#02de95", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
            <Text className="text-[#091A2F] text-sm font-black uppercase tracking-wider">
              {actionLoading === "in_progress" ? "Iniciando..." : "INICIAR CORRIDA"}
            </Text>
          </TouchableOpacity>
        )}

        {isDelivery && canArriveDropoff ? (
          <TouchableOpacity onPress={onArriveDropoff} disabled={busy} activeOpacity={0.85}
            className="w-full h-14 bg-emerald-500/10 border-[1.5px] border-[#02de95] rounded-2xl items-center justify-center">
            <Text className="text-[#02de95] text-sm font-black uppercase tracking-wider">
              {actionLoading === "arrived_at_dropoff" ? "Marcando chegada..." : "CHEGUEI NO DESTINO"}
            </Text>
          </TouchableOpacity>
        ) : canComplete ? (
          <TouchableOpacity onPress={onComplete} disabled={busy} activeOpacity={0.85}
            className="w-full h-14 bg-[#02de95] rounded-2xl items-center justify-center"
            style={{ shadowColor: "#02de95", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}>
            <Text className="text-[#091A2F] text-sm font-black uppercase tracking-wider">
              {actionLoading === "completed" ? "Finalizando..." : "FINALIZAR ENTREGA"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </MotiView>
  );
}
