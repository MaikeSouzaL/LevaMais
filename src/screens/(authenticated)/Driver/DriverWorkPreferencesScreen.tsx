import React, { useCallback, useMemo, useState } from "react";
import { Switch, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useFocusEffect } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import ActionButton from "../../../components/ui/ActionButton";
import driverLocationService from "../../../services/driverLocation.service";
import driverService from "../../../services/driver.service";
import userService from "../../../services/user.service";

type DriverWorkPreferences = {
  ride: boolean;
  delivery: boolean;
  autoAccept: boolean;
  searchRadiusKm: number;
  vehicleType?: string;
  acceptsCardMachine: boolean;
};

const DYNAMIC_RADIUS_LIMITS: Record<string, { label: string; max: number; step: number; defaultVal: number; desc: string }> = {
  motorcycle: { label: "Moto", max: 25, step: 1, defaultVal: 8, desc: "Alcance ultra rápido e focado na vizinhança." },
  car: { label: "Carro", max: 50, step: 1, defaultVal: 15, desc: "Cobre toda a região metropolitana de forma flexível." },
  van: { label: "Van", max: 150, step: 5, defaultVal: 40, desc: "Excelente cobertura regional, cobrindo cidades próximas." },
  truck: { label: "Frete / Caminhão", max: 300, step: 5, defaultVal: 100, desc: "Máxima cobertura de longo alcance para viagens interestaduais." },
};

const INITIAL_STATE: DriverWorkPreferences = {
  ride: true,
  delivery: true,
  autoAccept: false,
  searchRadiusKm: 15,
  vehicleType: "motorcycle",
  acceptsCardMachine: false,
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
          const [me, profile] = await Promise.all([
            driverLocationService.getMe().catch(() => null),
            userService.getProfile().catch(() => null),
          ]);

          if (!mounted) return;

          const serviceTypes = Array.isArray(profile?.driverPreferences?.serviceTypes)
            ? profile.driverPreferences?.serviceTypes
            : Array.isArray(me?.serviceTypes)
            ? me.serviceTypes
            : [];
          const vehicleType = profile?.vehicleType || me?.vehicleType || "motorcycle";
          const limitConfig = DYNAMIC_RADIUS_LIMITS[vehicleType] || DYNAMIC_RADIUS_LIMITS.motorcycle;
          const persistedRadius =
            typeof profile?.driverPreferences?.searchRadiusKm === "number"
              ? profile.driverPreferences.searchRadiusKm
              : typeof me?.searchRadiusKm === "number"
              ? me.searchRadiusKm
              : limitConfig.defaultVal;

          setPrefs({
            ride: serviceTypes.includes("ride") || INITIAL_STATE.ride,
            delivery: serviceTypes.includes("delivery") || INITIAL_STATE.delivery,
            autoAccept: Boolean(profile?.driverPreferences?.autoAccept),
            searchRadiusKm: Math.min(persistedRadius, limitConfig.max),
            vehicleType,
            acceptsCardMachine: Boolean((profile?.driverPreferences as any)?.acceptsCardMachine),
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
        text1: "Ative pelo menos 1 serviço",
        text2: "Corridas ou entregas precisam ficar ativas.",
      });
      return;
    }

    setLoading(true);
    try {
      const serviceTypes: Array<"ride" | "delivery"> = [];
      if (prefs.ride) serviceTypes.push("ride");
      if (prefs.delivery) serviceTypes.push("delivery");

      const selectedVehicles = prefs.vehicleType ? [prefs.vehicleType as any] : [];

      await Promise.all([
        driverService.updatePreferences({
          serviceTypes,
          selectedVehicles,
          searchRadiusKm: prefs.searchRadiusKm,
          autoAccept: prefs.autoAccept,
          acceptsCardMachine: prefs.acceptsCardMachine,
        }),
        driverLocationService.setStatus({
          status: "offline",
          serviceTypes,
          searchRadiusKm: prefs.searchRadiusKm,
        }).catch(() => null),
      ]);

      Toast.show({
        type: "success",
        text1: "Preferências salvas no servidor",
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

  const currentVehicle = prefs.vehicleType || "motorcycle";
  const currentLimitConfig = DYNAMIC_RADIUS_LIMITS[currentVehicle] || DYNAMIC_RADIUS_LIMITS.motorcycle;

  return (
    <DriverScreen title="Preferências de trabalho" scroll hideHeader={true}>
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
          subtitle="Pedidos de comércios e clientes"
          value={prefs.delivery}
          onChange={(value) => setPrefs((prev) => ({ ...prev, delivery: value }))}
        />
        <View style={{ height: 10 }} />
        <SettingRow
          title="Aceitar máquina de cartão"
          subtitle="Preciso ter maquininha física para aceitar"
          value={prefs.acceptsCardMachine}
          onChange={(value) => setPrefs((prev) => ({ ...prev, acceptsCardMachine: value }))}
        />
        <View style={{ height: 10 }} />
        <SettingRow
          title="Aceite automático"
          subtitle="Salvar preferência no perfil do motorista"
          value={prefs.autoAccept}
          onChange={(value) => setPrefs((prev) => ({ ...prev, autoAccept: value }))}
        />
      </SectionCard>

      <SectionCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Raio Máximo de Coleta</Text>
          <View style={{ backgroundColor: 'rgba(2,222,149,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(2,222,149,0.25)' }}>
            <Text style={{ color: '#02de95', fontWeight: '900', fontSize: 13 }}>{prefs.searchRadiusKm} KM</Text>
          </View>
        </View>

        <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 17, marginBottom: 15 }}>
          Ajuste a distância em linha reta que você quer percorrer para buscar o cliente. Seu limite máximo é customizado para seu veículo: <Text style={{ color: '#fff', fontWeight: '800' }}>{currentLimitConfig.label}</Text>.
        </Text>

        <CustomRangeSlider
          value={prefs.searchRadiusKm}
          min={1}
          max={currentLimitConfig.max}
          step={currentLimitConfig.step}
          onChange={(val) => setPrefs(prev => ({ ...prev, searchRadiusKm: val }))}
        />

        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 10, marginTop: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
          <Text style={{ color: '#02de95', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 3, letterSpacing: 0.5 }}>Configuração de Cobertura</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: 17 }}>
            {currentLimitConfig.desc} Você ficará visível para chamados a até <Text style={{ fontWeight: 'bold', color: '#fff' }}>{prefs.searchRadiusKm}km</Text> de você.
          </Text>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.7)", lineHeight: 20 }}>
          As preferências operacionais ficam persistidas no perfil do motorista e são refletidas na disponibilidade em tempo real.
        </Text>
      </SectionCard>

      <ActionButton
        title={loading ? "Salvando..." : "Salvar preferências"}
        variant="primary"
        onPress={save}
        disabled={loading}
      />
    </DriverScreen>
  );
}

function CustomRangeSlider(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTouch = (evt: any) => {
    if (trackWidth === 0) return;
    const x = evt.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / trackWidth));
    const rawVal = props.min + pct * (props.max - props.min);
    const steppedVal = Math.round(rawVal / props.step) * props.step;
    const finalVal = Math.max(props.min, Math.min(props.max, steppedVal));
    props.onChange(finalVal);
  };

  const percent = Math.max(0, Math.min(100, ((props.value - props.min) / (props.max - props.min)) * 100));

  return (
    <View style={{ width: '100%', marginTop: 6, marginBottom: 4 }}>
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleTouch}
        onResponderMove={handleTouch}
        style={{ height: 38, justifyContent: 'center' }}
      >
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, position: 'relative' }}>
          <View
            style={{
              height: 6,
              width: `${percent}%`,
              backgroundColor: '#02de95',
              borderRadius: 3,
              position: 'absolute',
              left: 0,
              top: 0
            }}
          />

          <View
            style={{
              position: 'absolute',
              left: `${percent}%`,
              top: -8,
              marginLeft: -11,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: '#ffffff',
              borderWidth: 3.5,
              borderColor: '#02de95',
              shadowColor: '#02de95',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.7,
              shadowRadius: 6,
              elevation: 6
            }}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800' }}>{props.min} km</Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '800' }}>{props.max} km</Text>
      </View>
    </View>
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
