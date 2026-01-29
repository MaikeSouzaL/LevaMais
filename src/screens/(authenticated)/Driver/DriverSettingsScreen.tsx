import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Switch } from "react-native";
import Toast from "react-native-toast-message";

import SectionCard from "../../../components/ui/SectionCard";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { DriverScreen } from "./components/DriverScreen";

export default function DriverSettingsScreen() {
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const u = await userService.getProfile();
        if (!mounted) return;
        setNotificationsEnabled(u.notificationsEnabled !== false);
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const canSave = useMemo(() => !loading, [loading]);

  async function save() {
    setLoading(true);
    try {
      await userService.updateProfile({ notificationsEnabled });
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

  return (
    <DriverScreen title="Configurações">
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

      <ActionButton
        title={loading ? "Salvando..." : "Salvar"}
        variant="primary"
        onPress={save}
        disabled={!canSave}
      />
    </DriverScreen>
  );
}
