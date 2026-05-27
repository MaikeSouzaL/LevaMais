import React from "react";
import { View, Text } from "react-native";
import { getDeliveryTimeline } from "@/utils/deliveryTimeline";

interface DeliveryTimelineProps {
  status: string;
}

export default function DeliveryTimeline({ status }: DeliveryTimelineProps) {
  const steps = getDeliveryTimeline(status);

  return (
    <View className="space-y-3">
      {steps.map((step, index) => (
        <View key={step.key} className="flex-row items-start">
          <View className="flex-col items-center mr-3">
            <View
              className={`w-6 h-6 rounded-full items-center justify-center ${
                step.done
                  ? "bg-[#02de95]"
                  : step.active
                  ? "bg-[#60a5fa]"
                  : "bg-[rgba(255,255,255,0.1)]"
              }`}
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  step.done
                    ? "bg-white"
                    : step.active
                    ? "bg-white"
                    : "bg-[rgba(255,255,255,0.3)]"
                }`}
              />
            </View>
            {index < steps.length - 1 && (
              <View
                className={`w-0.5 h-8 ${
                  step.done
                    ? "bg-[#02de95]"
                    : step.active
                    ? "bg-[#60a5fa]"
                    : "bg-[rgba(255,255,255,0.1)]"
                }`}
              />
            )}
          </View>
          <View className="flex-1 pt-1">
            <Text
              className={`text-sm font-bold ${
                step.done
                  ? "text-[#02de95]"
                  : step.active
                  ? "text-[#60a5fa]"
                  : "text-[rgba(255,255,255,0.5)]"
              }`}
            >
              {step.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
