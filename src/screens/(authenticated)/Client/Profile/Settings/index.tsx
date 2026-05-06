import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../../Shared/components";
import { useClientCityStore } from "@/context/clientCityStore";
import { useNavigation } from "@react-navigation/native";
import userService from "@/services/user.service";

const SETTINGS_STORAGE_KEY = "client-settings-v1";

type LocalSettings = {
  notifications: boolean;
  darkMode: boolean;
  shareLocationInBackground: boolean;
};

const initialState: LocalSettings = {
  notifications: true,
  darkMode: true,
  shareLocationInBackground: true,
};

const INTERVAL_OPTIONS = [
  { label: "Padrão", value: null, desc: "Usar tempo padrão do sistema (Admin)" },
  { label: "30s", value: 30, desc: "Alertar a cada 30 segundos" },
  { label: "60s", value: 60, desc: "Alertar a cada 1 minuto" },
  { label: "90s", value: 90, desc: "Alertar a cada 1.5 minutos" },
  { label: "120s", value: 120, desc: "Alertar a cada 2 minutos" },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const currentCity = useClientCityStore((s) => s.city);
  const [settings, setSettings] = useState<LocalSettings>(initialState);
  const [selectedInterval, setSelectedInterval] = useState<number | null>(null);
  const [savingInterval, setSavingInterval] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Carrega configurações locais
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (mounted && raw) {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }

        // Carrega perfil do backend para obter o tempo da fila de espera
        const profile = await userService.getProfile();
        if (mounted) {
          setSelectedInterval(profile.queueRedispatchInterval ?? null);
        }
      } catch (err) {
        console.error("Erro ao carregar configurações:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const patchSettings = async (patch: Partial<LocalSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      Toast.show({
        type: "error",
        text1: "Não foi possível salvar",
        text2: "Tente novamente em instantes.",
      });
    }
  };

  const handleSelectInterval = async (val: number | null) => {
    setSelectedInterval(val);
    setSavingInterval(true);
    try {
      await userService.updateProfile({ queueRedispatchInterval: val });
      Toast.show({
        type: "success",
        text1: "Frequência atualizada com sucesso!",
        text2: val === null ? "Configuração definida para o padrão do sistema." : `Alertas definidos a cada ${val} segundos.`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao salvar preferência",
        text2: err?.message || "Tente novamente",
      });
    } finally {
      setSavingInterval(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Configurações" subtitle="Preferências do app e privacidade" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>PREFERÊNCIAS DO APP</Text>

        <SettingRow
          label="Notificações"
          subtitle="Alertas sobre busca, motorista e corrida"
          value={settings.notifications}
          onToggle={(value) => patchSettings({ notifications: value })}
        />

        <SettingRow
          label="Modo escuro"
          subtitle="Mantém o app com tema escuro"
          value={settings.darkMode}
          onToggle={(value) => patchSettings({ darkMode: value })}
        />

        <SettingRow
          label="Localização em segundo plano"
          subtitle="Melhora precisão da corrida durante o trajeto"
          value={settings.shareLocationInBackground}
          onToggle={(value) => patchSettings({ shareLocationInBackground: value })}
        />

        {/* Fila de Espera - Intervalo Personalizado */}
        <Text style={styles.sectionTitle}>FILA DE ESPERA (URGENTE)</Text>
        <View style={styles.intervalCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.intervalTitle}>Frequência de reenvio</Text>
              <Text style={styles.intervalSubtitle}>De quanto em quanto tempo os motoristas serão notificados sobre seu pedido em espera</Text>
            </View>
            {savingInterval && <ActivityIndicator size="small" color={colors.primary[500]} />}
          </View>

          <View style={styles.optionsRow}>
            {INTERVAL_OPTIONS.map((opt) => {
              const isActive = selectedInterval === opt.value;
              return (
                <TouchableOpacity
                  key={String(opt.value)}
                  style={[
                    styles.optButton,
                    isActive && styles.optButtonActive,
                  ]}
                  onPress={() => handleSelectInterval(opt.value)}
                  disabled={savingInterval}
                >
                  <Text style={[styles.optButtonText, isActive && styles.optButtonTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.intervalDesc}>
            {INTERVAL_OPTIONS.find((o) => o.value === selectedInterval)?.desc || ""}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>LOCALIZAÇÃO</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => (navigation as any).navigate("ClientCity")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Cidade</Text>
              <Text style={styles.actionSubtitle}>
                {currentCity ? `${currentCity.name} - ${currentCity.state}` : "Selecionar cidade"}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>CONTA</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() =>
            Toast.show({
              type: "info",
              text1: "Recurso em breve",
              text2: "A edição de conta será disponibilizada na próxima etapa.",
            })
          }
        >
          <Text style={styles.actionTitle}>Editar dados da conta</Text>
          <Text style={styles.actionSubtitle}>Nome, telefone e informações pessoais</Text>
        </TouchableOpacity>

        <View style={styles.versionCard}>
          <Text style={styles.versionLabel}>Versão do app</Text>
          <Text style={styles.versionValue}>1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  subtitle,
  value,
  onToggle,
}: {
  label: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <View style={styles.setting}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  settingLabel: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  settingSubtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  
  intervalCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  intervalTitle: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  intervalSubtitle: { color: colors.text.secondary, fontSize: fontSize.xs, marginTop: 4, lineHeight: 16 },
  optionsRow: { flexDirection: "row", gap: 6, marginVertical: spacing.md, flexWrap: "wrap" },
  optButton: {
    flex: 1,
    minWidth: 60,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  optButtonActive: {
    backgroundColor: "rgba(2,222,149,0.16)",
    borderColor: "rgba(2,222,149,0.4)",
  },
  optButtonText: { color: colors.text.secondary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  optButtonTextActive: { color: "#02de95" },
  intervalDesc: { color: colors.primary[500], fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  actionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  actionTitle: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  actionSubtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  versionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
  },
  versionLabel: { color: colors.text.secondary, fontSize: fontSize.base },
  versionValue: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
