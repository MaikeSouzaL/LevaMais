import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../../Shared/components";
import { useClientCityStore } from "@/context/clientCityStore";
import { useNavigation } from "@react-navigation/native";

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

export default function SettingsScreen() {
  const navigation = useNavigation();
  const currentCity = useClientCityStore((s) => s.city);
  const [settings, setSettings] = useState<LocalSettings>(initialState);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!mounted || !raw) return;
        const parsed = JSON.parse(raw);
        setSettings((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore corrupted payload
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
        text1: "Nao foi possivel salvar",
        text2: "Tente novamente em instantes.",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Configuracoes" subtitle="Preferencias do app e privacidade" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>PREFERENCIAS</Text>

        <SettingRow
          label="Notificacoes"
          subtitle="Alertas sobre busca, motorista e corrida"
          value={settings.notifications}
          onToggle={(value) => patchSettings({ notifications: value })}
        />

        <SettingRow
          label="Modo escuro"
          subtitle="Mantem o app com tema escuro"
          value={settings.darkMode}
          onToggle={(value) => patchSettings({ darkMode: value })}
        />

        <SettingRow
          label="Localizacao em segundo plano"
          subtitle="Melhora precisao da corrida durante o trajeto"
          value={settings.shareLocationInBackground}
          onToggle={(value) => patchSettings({ shareLocationInBackground: value })}
        />

        <Text style={styles.sectionTitle}>LOCALIZACAO</Text>
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
              text2: "A edicao de conta sera disponibilizada na proxima etapa.",
            })
          }
        >
          <Text style={styles.actionTitle}>Editar dados da conta</Text>
          <Text style={styles.actionSubtitle}>Nome, telefone e informacoes pessoais</Text>
        </TouchableOpacity>

        <View style={styles.versionCard}>
          <Text style={styles.versionLabel}>Versao do app</Text>
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
  contentContainer: { padding: spacing.lg },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginTop: spacing.sm,
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

