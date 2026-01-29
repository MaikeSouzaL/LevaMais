import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  AppBottomSheet,
  type AppBottomSheetRef,
} from "../../../../components/ui/AppBottomSheet";
import { ModernSwitch } from "./ModernSwitch";

export type DriverBottomSheetRef = AppBottomSheetRef;

export type DriverServicePrefs = {
  ride: boolean;
  delivery: boolean;
};

type Props = {
  online: boolean;
  services: DriverServicePrefs;
  isTogglingOnline?: boolean;
  onToggleOnline: () => void;
  onToggleService: (key: keyof DriverServicePrefs) => void;
  snapPoints?: Array<string | number>;
  vehicleType?: string; // Para validar se pode fazer corridas
};

function Chip({
  label,
  active,
  onPress,
  icon,
  disabled,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      style={{
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: active ? "#02de95" : "rgba(255,255,255,0.15)",
        backgroundColor: active ? "rgba(2,222,149,0.18)" : "rgba(255,255,255,0.05)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        opacity: disabled ? 0.5 : 1,
        minHeight: 64,
      }}
    >
      {icon && (
        <MaterialIcons
          name={icon}
          size={24}
          color={active ? "#02de95" : "rgba(255,255,255,0.7)"}
        />
      )}
      <Text
        style={{
          color: active ? "#fff" : "rgba(255,255,255,0.8)",
          fontWeight: "900",
          fontSize: 16,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function DriverBottomSheet({
  online,
  services,
  isTogglingOnline,
  onToggleOnline,
  onToggleService,
  snapPoints = ["35%", "60%"],
  vehicleType,
}: Props) {
  // Só carros e motos podem fazer corridas (passageiros)
  const canDoRides = vehicleType === "car" || vehicleType === "motorcycle";
  // Todos os veículos podem fazer entregas
  const canDoDeliveries = true;
  return (
    <AppBottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundColor="#111816"
      handleIndicatorColor="rgba(255,255,255,0.18)"
      contentPaddingBottom={24}
      contentPaddingHorizontal={16}
      contentPaddingTop={8}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>
            {online 
              ? (services.ride && services.delivery 
                  ? "Procurando corridas e entregas..."
                  : services.ride 
                    ? "Procurando corridas..."
                    : "Procurando entregas...")
              : "Você está offline"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {online
              ? "Aguarde, te avisaremos quando surgir uma nova solicitação."
              : "Ative para começar a receber corridas"}
          </Text>
        </View>

        <ModernSwitch 
          value={online} 
          onTrack={onToggleOnline} 
          isLoading={isTogglingOnline} 
        />
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: "rgba(255,255,255,0.06)",
          marginVertical: 14,
        }}
      />

      <Text
        style={{
          color: "rgba(255,255,255,0.8)",
          fontWeight: "900",
          marginBottom: 12,
          fontSize: 15,
        }}
      >
        O que você quer fazer?
      </Text>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Chip
          label="Corridas"
          active={services.ride}
          onPress={() => canDoRides && onToggleService("ride")}
          icon="directions-car"
          disabled={!canDoRides}
        />
        <Chip
          label="Entregas"
          active={services.delivery}
          onPress={() => onToggleService("delivery")}
          icon="local-shipping"
        />
      </View>

      {!canDoRides && (
        <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 10, fontSize: 13 }}>
          💡 Corridas de passageiros disponíveis apenas para carros e motos
        </Text>
      )}

      {!services.ride && !services.delivery && (
        <Text style={{ color: "#fbbf24", marginTop: 12, fontWeight: "700" }}>
          ⚠️ Selecione pelo menos 1 tipo de serviço para ficar online
        </Text>
      )}
    </AppBottomSheet>
  );
}
