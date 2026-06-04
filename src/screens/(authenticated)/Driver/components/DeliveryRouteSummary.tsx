import React from "react";
import { View, Text } from "react-native";
import { Banknote, CreditCard, QrCode, Wallet } from "lucide-react-native";

type DeliveryRouteSummaryProps = {
  pickupAddress?: string;
  dropoffAddress?: string;
  paymentLabel?: string;
  highlightStep?: "to_pickup" | "at_pickup" | "to_dropoff" | "completed";
};

export function DeliveryRouteSummary({
  pickupAddress = "R. Josias da Silva, 295",
  dropoffAddress = "Av. Maceió, 1132",
  paymentLabel = "DINHEIRO",
  highlightStep = "to_pickup",
}: DeliveryRouteSummaryProps) {
  // Normalize and translate payment label
  const rawPayment = String(paymentLabel || "DINHEIRO").toLowerCase();

  let translatedPayment = "Dinheiro";
  let PaymentIcon = Banknote;
  let paymentColor = "#16a34a"; // readable green for light bg

  if (rawPayment.includes("wallet") || rawPayment.includes("levapay")) {
    translatedPayment = "LevaPay";
    PaymentIcon = Wallet;
    paymentColor = "#b45309";
  } else if (rawPayment.includes("cash") || rawPayment.includes("dinheiro")) {
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

  const pickupActive = highlightStep === "to_pickup" || highlightStep === "at_pickup";
  const pickupDone = highlightStep === "to_dropoff" || highlightStep === "completed";
  const dropoffActive = highlightStep === "to_dropoff";
  const dropoffDone = highlightStep === "completed";

  const pickupDotColor = pickupDone ? "#16a34a" : pickupActive ? "#02de95" : "#cbd5e1";
  const pickupRingColor = pickupActive ? "rgba(2, 222, 149, 0.25)" : "transparent";
  const dropoffDotColor = dropoffDone ? "#16a34a" : dropoffActive ? "#ea580c" : "#cbd5e1";
  const dropoffRingColor = dropoffActive ? "rgba(234, 88, 12, 0.25)" : "transparent";
  const lineColor = pickupDone ? "#16a34a" : "#e2e8f0";

  return (
    <View className="bg-white border border-slate-100 rounded-[24px] p-4 mb-3.5 shadow-sm">
      {/* Route Timeline */}
      <View className="flex-row gap-3">
        <View className="items-center pt-1.5">
          <View
            className="w-2.5 h-2.5 rounded-full border border-white"
            style={{
              backgroundColor: pickupDotColor,
              shadowColor: pickupRingColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 6,
            }}
          />
          <View
            className="w-[1.5px] h-6 my-1 rounded-full"
            style={{ backgroundColor: lineColor }}
          />
          <View
            className="w-2.5 h-2.5 rounded-full border border-white"
            style={{
              backgroundColor: dropoffDotColor,
              shadowColor: dropoffRingColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 6,
            }}
          />
        </View>
        <View className="flex-1 gap-2">
          <View>
            <Text
              className="text-[8px] font-black uppercase tracking-wider"
              style={{ color: pickupActive ? "#02de95" : "#94a3b8" }}
            >
              Coleta {pickupActive && "• Em andamento"}
              {pickupDone && "• Concluído"}
            </Text>
            <Text
              className="text-[11px] font-black mt-0.5 leading-tight"
              numberOfLines={1}
              style={{ color: pickupActive ? "#0f172a" : "#475569" }}
            >
              {pickupAddress}
            </Text>
          </View>
          <View>
            <Text
              className="text-[8px] font-black uppercase tracking-wider"
              style={{ color: dropoffActive ? "#ea580c" : "#94a3b8" }}
            >
              Entrega {dropoffActive && "• Em andamento"}
              {dropoffDone && "• Concluído"}
            </Text>
            <Text
              className="text-[11px] font-black mt-0.5 leading-tight"
              numberOfLines={1}
              style={{ color: dropoffActive ? "#0f172a" : "#475569" }}
            >
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
