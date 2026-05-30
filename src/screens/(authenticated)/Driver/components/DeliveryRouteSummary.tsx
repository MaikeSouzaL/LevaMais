import React from "react";
import { View, Text } from "react-native";
import { Banknote, CreditCard, QrCode } from "lucide-react-native";

type DeliveryRouteSummaryProps = {
  pickupAddress?: string;
  dropoffAddress?: string;
  paymentLabel?: string;
};

export function DeliveryRouteSummary({
  pickupAddress = "R. Josias da Silva, 295",
  dropoffAddress = "Av. Maceió, 1132",
  paymentLabel = "DINHEIRO",
}: DeliveryRouteSummaryProps) {
  // Normalize and translate payment label
  const rawPayment = String(paymentLabel || "DINHEIRO").toLowerCase();
  
  let translatedPayment = "Dinheiro";
  let PaymentIcon = Banknote;
  let paymentColor = "#16a34a"; // readable green for light bg

  if (rawPayment.includes("cash") || rawPayment.includes("dinheiro")) {
    translatedPayment = "Dinheiro";
    PaymentIcon = Banknote;
    paymentColor = "#16a34a";
  } else if (rawPayment.includes("pix")) {
    translatedPayment = "PIX";
    PaymentIcon = QrCode;
    paymentColor = "#0d9488";
  } else {
    translatedPayment = "Cartão";
    PaymentIcon = CreditCard;
    paymentColor = "#2563eb";
  }

  return (
    <View className="bg-white border border-slate-100 rounded-[24px] p-4 mb-3.5 shadow-sm">
      {/* Route Timeline */}
      <View className="flex-row gap-3">
        <View className="items-center pt-1.5">
          <View className="w-2.5 h-2.5 rounded-full bg-[#16a34a] border border-white" />
          <View className="w-[1.5px] h-6 bg-slate-150 my-1 rounded-full" />
          <View className="w-2.5 h-2.5 rounded-full bg-[#ea580c] border border-white" />
        </View>
        <View className="flex-1 gap-2">
          <View>
            <Text className="text-slate-400 text-[8px] font-black uppercase tracking-wider">
              Coleta
            </Text>
            <Text className="text-slate-800 text-[11px] font-black mt-0.5 leading-tight" numberOfLines={1}>
              {pickupAddress}
            </Text>
          </View>
          <View>
            <Text className="text-slate-400 text-[8px] font-black uppercase tracking-wider">
              Entrega
            </Text>
            <Text className="text-slate-800 text-[11px] font-black mt-0.5 leading-tight" numberOfLines={1}>
              {dropoffAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View className="h-[1px] bg-slate-100 my-3" />

      {/* Payment Information */}
      <View className="flex-row items-center gap-2">
        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
          Pagamento:
        </Text>
        <View className="flex-row items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
          <PaymentIcon size={12} color={paymentColor} />
          <Text className="text-[10px] font-black uppercase tracking-wide" style={{ color: paymentColor }}>
            {translatedPayment}
          </Text>
        </View>
      </View>
    </View>
  );
}
