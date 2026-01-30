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

import type { DriverStats } from "../../../../services/ride.service";

type Props = {
  online: boolean;
  services: DriverServicePrefs;
  isTogglingOnline?: boolean;
  onToggleOnline: () => void;
  onToggleService: (key: keyof DriverServicePrefs) => void;
  snapPoints?: Array<string | number>;
  vehicleType?: string; // Para validar se pode fazer corridas
  stats?: DriverStats; // [NEW] Optional stats prop
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
  stats = { earnings: 0, rides: 0, goal: 10, bonus: 0 }, // [NEW] Default stats
}: Props) {
  const [showFilters, setShowFilters] = React.useState(false);

  // Só carros e motos podem fazer corridas (passageiros)
  const canDoRides = vehicleType === "car" || vehicleType === "motorcycle";
  // Todos os veículos podem fazer entregas
  const canDoDeliveries = true;

  // Calculate progress
  const progressPercent = Math.min((stats.rides / stats.goal) * 100, 100);

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
      <View>
      <View>
          <View style={{ marginBottom: 20, marginTop: 4 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", letterSpacing: 0.5 }}>
                  GANHOS DE HOJE
                </Text>
                <Text style={{ color: "#02de95", fontSize: 36, fontWeight: "900", letterSpacing: -1 }}>
                  R$ {stats.earnings.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              {/* Mini chart visual or badge */}
              <View style={{ backgroundColor: "rgba(2,222,149,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}>
                 <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 12 }}>
                   {stats.bonus > 0 ? `+ R$ ${stats.bonus} BÔNUS` : `Meta: R$ 20 BÔNUS`}
                 </Text>
              </View>
            </View>

            {/* Daily Goal Progress */}
            <View style={{ marginTop: 16, backgroundColor: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12 }}>
               <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Meta Diária ({stats.goal} corridas)</Text>
                  <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>{stats.rides}/{stats.goal}</Text>
               </View>
               <View style={{ height: 6, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: "#02de95" }} />
               </View>
               <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 6 }}>
                  {stats.rides >= stats.goal 
                    ? "Parabéns! Você atingiu a meta diária."
                    : `Faça mais ${stats.goal - stats.rides} corridas para ganhar o bônus extra.`}
               </Text>
            </View>

            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 20 }} />
          </View>
      </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <TouchableOpacity
            style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: showFilters ? "#02de95" : "rgba(255,255,255,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 4
            }}
            onPress={() => setShowFilters(!showFilters)}
        >
            <MaterialIcons name="tune" size={24} color={showFilters ? "#000" : "#fff"} />
        </TouchableOpacity>

        <View style={{ flex: 1, minWidth: 160 }}>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>
            {online 
              ? (services.ride && services.delivery 
                  ? "Procurando tudo..."
                  : services.ride 
                    ? "Só corridas..."
                    : "Só entregas...")
              : "Você está offline"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4, fontSize: 13 }}>
            {online
              ? "Aguardando solicitações..."
              : "Toque para ficar online"}
          </Text>
        </View>

        <ModernSwitch 
          value={online} 
          onTrack={onToggleOnline} 
          isLoading={isTogglingOnline} 
        />
      </View>

      {/* FILTERS SECTION (Collapsible) */}
      {showFilters && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Preferências de Trabalho
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
             <TouchableOpacity
                onPress={() => canDoRides && onToggleService("ride")}
                disabled={!canDoRides}
                activeOpacity={0.7}
                style={{
                    backgroundColor: services.ride ? "#02de95" : "transparent",
                    borderWidth: 1,
                    borderColor: services.ride ? "#02de95" : "rgba(255,255,255,0.2)",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 99,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8
                }}
             >
                <MaterialIcons name="directions-car" size={20} color={services.ride ? "#000" : "#fff"} />
                <Text style={{ color: services.ride ? "#000" : "#fff", fontWeight: "700" }}>Corridas</Text>
             </TouchableOpacity>

             <TouchableOpacity
                onPress={() => onToggleService("delivery")}
                activeOpacity={0.7}
                style={{
                    backgroundColor: services.delivery ? "#02de95" : "transparent",
                    borderWidth: 1,
                    borderColor: services.delivery ? "#02de95" : "rgba(255,255,255,0.2)",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 99,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8
                }}
             >
                <MaterialIcons name="local-shipping" size={20} color={services.delivery ? "#000" : "#fff"} />
                <Text style={{ color: services.delivery ? "#000" : "#fff", fontWeight: "700" }}>Entregas</Text>
             </TouchableOpacity>
          </View>
        </View>
      )}

    </AppBottomSheet>
  );
}
