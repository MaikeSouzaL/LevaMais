import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Banknote, QrCode, CreditCard } from "lucide-react-native";

export type PaymentMethodType = "cash" | "pix" | "card";

interface PaymentMethodSelectorProps {
  value: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

const METHODS: { id: PaymentMethodType; label: string; icon: any; color: string }[] = [
  { id: "cash", label: "Dinheiro", icon: Banknote, color: "#02de95" },
  { id: "pix", label: "Pix", icon: QrCode, color: "#32BCAD" },
  { id: "card", label: "Cartão", icon: CreditCard, color: "#3b82f6" },
];

export const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  return (
    <View className="px-6 mb-6">
      <Text className="text-white/50 font-bold text-[11px] uppercase tracking-[1px] mb-3">
        Forma de Pagamento
      </Text>

      <View className="flex-row gap-3">
        {METHODS.map((item) => {
          const isActive = value === item.id;
          const Icon = item.icon;

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => onChange(item.id)}
              className="flex-1"
            >
              <MotiView
                animate={{
                  backgroundColor: isActive ? `${item.color}20` : "rgba(255,255,255,0.03)",
                  borderColor: isActive ? item.color : "rgba(255,255,255,0.05)",
                  scale: isActive ? 1.02 : 1,
                }}
                transition={{ type: "timing", duration: 200 }}
                className={`h-20 rounded-2xl border items-center justify-center`}
              >
                {isActive && (
                  <MotiView 
                    from={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    className="absolute top-2 right-2 w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }} 
                  />
                )}
                
                <Icon size={24} color={isActive ? item.color : "#fff"} style={{ opacity: isActive ? 1 : 0.5 }} />
                <Text 
                  className={`mt-2 font-semibold text-[12px] ${isActive ? "text-white" : "text-white/50"}`}
                >
                  {item.label}
                </Text>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
