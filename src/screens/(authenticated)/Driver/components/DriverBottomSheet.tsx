import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  AppBottomSheet,
  type AppBottomSheetRef,
} from "../../../../components/ui/AppBottomSheet";

export type DriverBottomSheetRef = AppBottomSheetRef;

export type DriverServicePrefs = {
  ride: boolean;
  delivery: boolean;
};

type Props = {
  online: boolean;
  services: DriverServicePrefs;
  acceptingRides: boolean;
  isTogglingOnline?: boolean;
  onToggleOnline: () => void;
  onToggleService: (key: keyof DriverServicePrefs) => void;
  onToggleAccepting: () => void;
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? "#02de95" : "rgba(255,255,255,0.10)",
        backgroundColor: active ? "rgba(2,222,149,0.16)" : "rgba(0,0,0,0.15)",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: active ? "#02de95" : "rgba(255,255,255,0.35)",
        }}
      />
      <Text
        style={{
          color: active ? "#fff" : "rgba(255,255,255,0.75)",
          fontWeight: "800",
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
  acceptingRides,
  isTogglingOnline,
  onToggleOnline,
  onToggleService,
  onToggleAccepting,
}: Props) {
  return (
    <AppBottomSheet
      index={0}
      // aumenta a altura mdnima para evitar cortes
      snapPoints={["32%", "52%"]}
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
          // permite quebra em telas estreitas
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>
            {online ? "Você está online" : "Você está offline"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            {online
              ? "Recebendo solicitações conforme suas preferências"
              : "Ative para começar a receber corridas"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onToggleOnline}
          activeOpacity={0.9}
          disabled={!!isTogglingOnline}
          style={{
            backgroundColor: online ? "rgba(239,68,68,0.18)" : "#02de95",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: online ? "rgba(239,68,68,0.35)" : "rgba(0,0,0,0.10)",
            // garante que não seja cortado e ocupe apenas o necessário
            flexShrink: 0,
            alignSelf: "flex-start",
            opacity: isTogglingOnline ? 0.9 : 1,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {isTogglingOnline ? (
              <ActivityIndicator
                size="small"
                color={online ? "#ef4444" : "#0f231c"}
              />
            ) : (
              <MaterialIcons
                name={online ? "toggle-off" : "toggle-on"}
                size={20}
                color={online ? "#ef4444" : "#0f231c"}
              />
            )}
            <Text
              style={{
                color: online ? "#ef4444" : "#0f231c",
                fontWeight: "900",
              }}
            >
              {online ? "Parar" : "Ativar"}
            </Text>
          </View>
        </TouchableOpacity>
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
          marginBottom: 10,
        }}
      >
        O que você quer fazer?
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Chip
          label="Corridas"
          active={services.ride}
          onPress={() => onToggleService("ride")}
        />
        <Chip
          label="Entregas"
          active={services.delivery}
          onPress={() => onToggleService("delivery")}
        />
        <Chip
          label={acceptingRides ? "Aceitando" : "Pausado"}
          active={acceptingRides}
          onPress={onToggleAccepting}
        />
      </View>

      {!services.ride && !services.delivery && (
        <Text style={{ color: "#fbbf24", marginTop: 12, fontWeight: "700" }}>
          Selecione pelo menos 1 tipo de serviço para ficar online.
        </Text>
      )}
    </AppBottomSheet>
  );
}
