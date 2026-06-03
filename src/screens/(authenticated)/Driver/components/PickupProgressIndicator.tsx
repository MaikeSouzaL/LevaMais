import React from "react";
import { View, Text } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { Check, MapPin, Package, Truck } from "lucide-react-native";

type PickupProgressStep = "to_pickup" | "at_pickup" | "to_dropoff" | "completed";

type PickupProgressIndicatorProps = {
  currentStep: PickupProgressStep;
  isDelivery?: boolean;
};

const STEP_ORDER: PickupProgressStep[] = [
  "to_pickup",
  "at_pickup",
  "to_dropoff",
  "completed",
];

const STEP_ICON: Record<
  PickupProgressStep,
  React.ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  to_pickup: Truck,
  at_pickup: MapPin,
  to_dropoff: Package,
  completed: Check,
};

function stepLabel(step: PickupProgressStep, isDelivery: boolean): string {
  if (isDelivery) {
    return {
      to_pickup: "Indo para coleta",
      at_pickup: "Aguardando retirada",
      to_dropoff: "A caminho da entrega",
      completed: "Finalizado",
    }[step];
  }
  return {
    to_pickup: "Indo ao embarque",
    at_pickup: "No embarque",
    to_dropoff: "A caminho do destino",
    completed: "Finalizado",
  }[step];
}

export function PickupProgressIndicator({
  currentStep,
  isDelivery = false,
}: PickupProgressIndicatorProps) {
  const activeIndex = Math.max(0, STEP_ORDER.indexOf(currentStep));
  const visibleSteps: PickupProgressStep[] = isDelivery
    ? ["to_pickup", "at_pickup", "to_dropoff"]
    : ["to_pickup", "at_pickup", "to_dropoff", "completed"];

  return (
    <View className="bg-[#0F1F33] border border-white/[0.04] rounded-2xl p-3.5">
      <View className="flex-row items-center justify-between">
        {visibleSteps.map((step, idx) => {
          const Icon = STEP_ICON[step];
          const stepIndex = STEP_ORDER.indexOf(step);
          const isActive = stepIndex === activeIndex;
          const isDone = stepIndex < activeIndex;
          const accent = isActive ? "#02de95" : isDone ? "#22c55e" : "rgba(255,255,255,0.25)";
          const textColor = isActive ? "#02de95" : isDone ? "#22c55e" : "rgba(255,255,255,0.5)";

          return (
            <React.Fragment key={step}>
              <View className="items-center flex-1">
                <AnimatePresence>
                  <MotiView
                    key={`icon-${step}-${isActive ? "active" : isDone ? "done" : "idle"}`}
                    from={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: "spring", damping: 16, stiffness: 220 }}
                    className="w-9 h-9 rounded-full items-center justify-center mb-1.5"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(2, 222, 149, 0.15)"
                        : isDone
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(255, 255, 255, 0.04)",
                      borderWidth: 1.5,
                      borderColor: accent,
                    }}
                  >
                    {isDone ? (
                      <Check size={14} color={accent} strokeWidth={3} />
                    ) : (
                      <Icon size={14} color={accent} />
                    )}
                  </MotiView>
                </AnimatePresence>
                <Text
                  className="text-[9px] font-black text-center uppercase tracking-wider"
                  numberOfLines={2}
                  style={{ color: textColor }}
                >
                  {stepLabel(step, isDelivery)}
                </Text>
              </View>

              {idx < visibleSteps.length - 1 && (
                <View className="flex-row items-center" style={{ marginBottom: 14 }}>
                  <MotiView
                    from={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    animate={{
                      backgroundColor:
                        stepIndex < activeIndex
                          ? "#22c55e"
                          : "rgba(255, 255, 255, 0.1)",
                    }}
                    transition={{ type: "timing", duration: 400 }}
                    className="h-[2px] rounded-full"
                    style={{ width: 24 }}
                  />
                </View>
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}