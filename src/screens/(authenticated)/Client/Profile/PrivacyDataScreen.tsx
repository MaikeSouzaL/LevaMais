import React from "react";
import {
  Alert,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import { colors } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import {
  deleteOwnAccount,
  exportPrivacyData,
  PrivacyExportPayload,
  recordPrivacyConsent,
  revokePrivacyConsent,
} from "@/services/auth.service";
import configService from "@/services/config.service";
import { useAuthStore } from "@/context/authStore";
import { ClientStackParamList } from "../types/navigation";

export default function PrivacyDataScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "PrivacyData">
  >();
  const logout = useAuthStore((state) => state.logout);
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<PrivacyExportPayload | null>(null);
  const [policyVersions, setPolicyVersions] = React.useState<{
    consentVersion: string;
    termsVersion: string;
    privacyPolicyVersion: string;
  } | null>(null);

  const loadSummary = React.useCallback(async () => {
    try {
      const data = await exportPrivacyData();
      setSummary(data);
    } catch (error) {
      console.error("Error exporting privacy data:", error);
      setSummary(null);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [data, versions] = await Promise.all([
          exportPrivacyData(),
          configService.getPolicyVersions().catch(() => null),
        ]);
        if (!mounted) return;
        setSummary(data);
        setPolicyVersions(versions);
      } catch (error) {
        console.error("Error exporting privacy data:", error);
        if (!mounted) return;
        setSummary(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const exportData = async () => {
    setLoading(true);
    try {
      const payload = await exportPrivacyData();
      await Share.share({
        message: `Meus dados - Leva Mais\n${JSON.stringify(payload, null, 2)}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao exportar dados",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshConsent = () => {
    Alert.alert(
      "Atualizar consentimento",
      "Deseja registrar novamente o aceite da política e dos termos atuais?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Registrar",
          onPress: async () => {
            setLoading(true);
            try {
              await recordPrivacyConsent({
                acceptedTerms: true,
                acceptedPrivacy: true,
                consentVersion:
                  policyVersions?.consentVersion ||
                  (consentVersion !== "-" ? consentVersion : undefined),
                termsVersion:
                  policyVersions?.termsVersion ||
                  (termsVersion !== "-" ? termsVersion : undefined),
                privacyPolicyVersion:
                  policyVersions?.privacyPolicyVersion ||
                  (privacyPolicyVersion !== "-" ? privacyPolicyVersion : undefined),
              });
              await loadSummary();
              Toast.show({
                type: "success",
                text1: "Consentimento atualizado",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Falha ao atualizar",
                text2: error?.message || "Tente novamente",
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRevokeConsent = () => {
    Alert.alert(
      "Revogar consentimento",
      "Ao revogar o consentimento, sua conta será desativada e você precisará aceitar novamente os termos para voltar a usar o serviço.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Revogar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await revokePrivacyConsent();
              logout();
              Toast.show({
                type: "success",
                text1: "Consentimento revogado",
                text2: "Sua conta foi desativada com segurança.",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Não foi possível revogar",
                text2: error?.message || "Tente novamente",
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const consentVersion = summary?.privacy?.consentVersion || "-";
  const termsVersion =
    summary?.privacy?.termsVersion || summary?.privacy?.consentVersion || "-";
  const privacyPolicyVersion =
    summary?.privacy?.privacyPolicyVersion ||
    summary?.privacy?.consentVersion ||
    "-";

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir conta",
      "Essa ação desativa a conta e anonimiza seus dados pessoais. Ela não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteOwnAccount("Solicitação feita pelo app");
              logout();
              Toast.show({
                type: "success",
                text1: "Conta excluída",
              });
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Não foi possível excluir",
                text2: error?.message || "Tente novamente",
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Privacidade e dados" subtitle="Controle da sua conta" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="bg-[#0d2838] border border-gray-700 rounded-lg p-4 gap-2">
          <Icon name="verified-user" size={28} color={colors.primary[500]} />
          <Text className="text-white font-bold text-base">Seus dados</Text>
          <Text className="text-gray-400 text-sm leading-5">
            Você pode exportar seus dados, revisar seu consentimento e controlar o ciclo de vida da sua conta.
          </Text>
          {summary && (
            <Text className="text-[#02de95] text-xs font-semibold">
              Corridas: {summary.rides.total} | Cartões: {summary.paymentMethods.length} | Versão do consentimento: {consentVersion}
            </Text>
          )}
        </View>

        {summary && (
          <View className="bg-[#0d2838] border border-gray-700 rounded-lg p-4 gap-2">
            <Text className="text-white font-bold text-base">Resumo LGPD</Text>
            <Text className="text-gray-300 text-sm">
              Versao dos Termos: {termsVersion}
            </Text>
            <Text className="text-gray-300 text-sm">
              Versao da Politica de Privacidade: {privacyPolicyVersion}
            </Text>
            <Text className="text-gray-300 text-sm">
              Termos aceitos: {summary.privacy.acceptedTerms ? "Sim" : "Não"}
            </Text>
            <Text className="text-gray-300 text-sm">
              Último aceite: {summary.privacy.acceptedTermsAt ? new Date(summary.privacy.acceptedTermsAt).toLocaleString("pt-BR") : "Não registrado"}
            </Text>
            <Text className="text-gray-300 text-sm">
              Privacidade aceita em: {summary.privacy.acceptedPrivacyAt ? new Date(summary.privacy.acceptedPrivacyAt).toLocaleString("pt-BR") : "Não registrado"}
            </Text>
            <Text className="text-gray-300 text-sm">
              Revogação: {summary.privacy.consentRevokedAt ? new Date(summary.privacy.consentRevokedAt).toLocaleString("pt-BR") : "Ativa"}
            </Text>
            <Text className="text-gray-300 text-sm">
              Exclusão da conta: {summary.privacy.accountDeletionStatus}
            </Text>
          </View>
        )}

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-3" onPress={exportData} disabled={loading}>
          <Icon name="download" size={20} color={colors.primary[500]} />
          <Text className="text-white font-semibold text-base">{loading ? "Processando..." : "Exportar meus dados"}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-3" onPress={handleRefreshConsent} disabled={loading}>
          <Icon name="task-alt" size={20} color={colors.primary[500]} />
          <Text className="text-white font-semibold text-base">Atualizar aceite atual</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-amber-600 rounded-lg p-3" onPress={handleRevokeConsent} disabled={loading}>
          <Icon name="privacy-tip" size={20} color="#fbbf24" />
          <Text className="text-white font-semibold text-base">Revogar consentimento</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#2A1010] border border-red-700 rounded-lg p-3" onPress={handleDeleteAccount} disabled={loading}>
          <Icon name="delete-forever" size={20} color="#f87171" />
          <Text className="text-white font-semibold text-base">Excluir minha conta</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center gap-3 bg-[#0d2838] border border-gray-700 rounded-lg p-3" onPress={() => navigation.navigate("Settings")}>
          <Icon name="settings" size={20} color={colors.primary[500]} />
          <Text className="text-white font-semibold text-base">Gerenciar preferências de privacidade</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
