import React, { useCallback, useMemo, useState } from "react";
import { Switch, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import ActionButton from "../../../components/ui/ActionButton";
import driverLocationService from "../../../services/driverLocation.service";

const STORAGE_KEY = "driver-work-preferences-v1";

type DriverWorkPreferences = {
  ride: boolean;
  delivery: boolean;
  autoAccept: boolean;
};

const INITIAL_STATE: DriverWorkPreferences = {
  ride: true,
  delivery: true,
  autoAccept: false,
};

export default function DriverWorkPreferencesScreen() {
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<DriverWorkPreferences>(INITIAL_STATE);

  const hasAnyService = useMemo(() => prefs.ride || prefs.delivery, [prefs]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        try {
          const [stored, me] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            driverLocationService.getMe().catch(() => null),
          ]);

          if (!mounted) return;

          const parsed = stored ? JSON.parse(stored) : {};
          const serviceTypes = Array.isArray(me?.serviceTypes) ? me.serviceTypes : [];

          setPrefs({
            ride:
              typeof parsed.ride === "boolean"
                ? parsed.ride
                : serviceTypes.includes("ride") || INITIAL_STATE.ride,
            delivery:
              typeof parsed.delivery === "boolean"
                ? parsed.delivery
                : serviceTypes.includes("delivery") || INITIAL_STATE.delivery,
            autoAccept:
              typeof parsed.autoAccept === "boolean"
                ? parsed.autoAccept
                : INITIAL_STATE.autoAccept,
          });
        } catch {
          if (!mounted) return;
          setPrefs(INITIAL_STATE);
        }
      })();

      return () => {
        mounted = false;
      };
    }, []),
  );

  const save = async () => {
    if (!hasAnyService) {
      Toast.show({
        type: "error",
        text1: "Ative pelo menos 1 servico",
        text2: "Corridas ou entregas precisam ficar ativas.",
      });
      return;
    }

    setLoading(true);
    try {
      const serviceTypes: Array<"ride" | "delivery"> = [];
      if (prefs.ride) serviceTypes.push("ride");
      if (prefs.delivery) serviceTypes.push("delivery");

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)),
        driverLocationService.setStatus({
          status: "offline",
          serviceTypes,
        }),
      ]);

      Toast.show({
        type: "success",
        text1: "Preferencias salvas",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao salvar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DriverScreen title="Preferencias de trabalho" scroll>
      <SectionCard>
        <SettingRow
          title="Aceitar corridas"
          subtitle="Viagens de passageiros"
          value={prefs.ride}
          onChange={(value) => setPrefs((prev) => ({ ...prev, ride: value }))}
        />
        <View style={{ height: 10 }} />
        <SettingRow
          title="Aceitar entregas"
          subtitle="Pedidos de comercios e clientes"
          value={prefs.delivery}
          onChange={(value) => setPrefs((prev) => ({ ...prev, delivery: value }))}
        />
        <View style={{ height: 10 }} />
        <SettingRow
          title="Aceite automatico"
          subtitle="Receber corridas sem confirmar manualmente (modo beta)"
          value={prefs.autoAccept}
          onChange={(value) => setPrefs((prev) => ({ ...prev, autoAccept: value }))}
        />
      </SectionCard>

      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.7)", lineHeight: 20 }}>
          As preferencias de servico sao aplicadas quando voce ficar online.
          Mantemos ao menos um tipo de servico ativo para continuar recebendo chamadas.
        </Text>
      </SectionCard>

      <ActionButton
        title={loading ? "Salvando..." : "Salvar preferencias"}
        variant="primary"
        onPress={save}
        disabled={loading}
      />
    </DriverScreen>
  );
}

function SettingRow(props: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{props.title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.62)", marginTop: 4 }}>
          {props.subtitle}
        </Text>
      </View>
      <Switch
        value={props.value}
        onValueChange={props.onChange}
        trackColor={{ false: "#1f2b27", true: "rgba(2,222,149,0.35)" }}
        thumbColor={props.value ? "#02de95" : "#9ca5a3"}
      />
    </View>
  );
}
