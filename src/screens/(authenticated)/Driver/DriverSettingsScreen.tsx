import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";

import SectionCard from "../../../components/ui/SectionCard";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { DriverScreen } from "./components/DriverScreen";
import { useAuthStore } from "@/context/authStore";

export default function DriverSettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [enableMapAnimation, setEnableMapAnimation] = useState(true);
  const [gpsQuality, setGpsQuality] = useState<"low" | "balanced" | "high">("high");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await userService.getProfile();
        if (!mounted) return;
        setNotificationsEnabled(u.notificationsEnabled !== false);
        setEnableMapAnimation(u.enableMapAnimation !== false);
        setGpsQuality(u.gpsQuality || "high");
      } catch (error) {
        console.error("Error loading profile settings:", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const canSave = useMemo(() => !loading, [loading]);

  async function save() {
    setLoading(true);
    try {
      await userService.updateProfile({ 
        notificationsEnabled,
        enableMapAnimation,
        gpsQuality
      });
      useAuthStore.getState().updateUserData({ enableMapAnimation });
      Toast.show({ type: "success", text1: "Configurações salvas" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao salvar",
        text2: e?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  const gpsOptions = [
    { id: "low", label: "Bateria", sub: "Baixo", color: "#eab308" },
    { id: "balanced", label: "Equilibrado", sub: "Médio", color: "#06b6d4" },
    { id: "high", label: "Precisão", sub: "Máxima", color: "#22c55e" },
  ] as const;

  return (
    <DriverScreen title="Configurações" hideHeader={true}>
      <SectionCard>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              Notificações
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              Receber solicitações e avisos.
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: "#1f2b27", true: "rgba(2,222,149,0.35)" }}
            thumbColor={notificationsEnabled ? "#02de95" : "#9ca5a3"}
          />
        </View>
      </SectionCard>
      <SectionCard>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              Animação no Mapa
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              Habilitar exibição dinâmica e animação da rota no mapa.
            </Text>
          </View>
          <Switch
            value={enableMapAnimation}
            onValueChange={setEnableMapAnimation}
            trackColor={{ false: "#1f2b27", true: "rgba(2,222,149,0.35)" }}
            thumbColor={enableMapAnimation ? "#02de95" : "#9ca5a3"}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            Qualidade do Sinal GPS
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
            Controle a taxa de atualização para economizar a carga da bateria.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
          {gpsOptions.map((opt) => {
            const isSelected = gpsQuality === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                activeOpacity={0.7}
                onPress={() => setGpsQuality(opt.id)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 4,
                  backgroundColor: isSelected ? "rgba(2,222,149,0.15)" : "#121816",
                  borderColor: isSelected ? "#02de95" : "#1f2b27",
                  borderWidth: 1.5,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#02de95" : "#fff",
                    fontWeight: "800",
                    fontSize: 13,
                    textAlign: "center",
                  }}
                >
                  {opt.label}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                    gap: 4,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: opt.color,
                    }}
                  />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: "600",
                      fontSize: 11,
                    }}
                  >
                    {opt.sub}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </SectionCard>

      <ActionButton
        title={loading ? "Salvando..." : "Salvar"}
        variant="primary"
        onPress={save}
        disabled={!canSave}
      />
    </DriverScreen>
  );
}
