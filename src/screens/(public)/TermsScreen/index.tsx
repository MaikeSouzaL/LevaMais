import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { NavigationContext, NavigationRouteContext } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../../theme";
import configService, { PolicyVersions } from "@/services/config.service";
import { useAuthStore } from "@/context/authStore";

type TabType = "terms" | "privacy";

export default function TermsScreen({ onAccept: propsOnAccept }: { onAccept?: () => void }) {
  const navigation = React.useContext(NavigationContext);
  const route = React.useContext(NavigationRouteContext) as any;
  const { onAccept: routeOnAccept } = (route?.params as { onAccept?: () => void }) || {};
  const onAccept = propsOnAccept || routeOnAccept;

  const [activeTab, setActiveTab] = useState<TabType>("terms");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [policyVersions, setPolicyVersions] = useState<PolicyVersions | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const versions = await configService.getPolicyVersions();
        if (!mounted) return;
        setPolicyVersions(versions);
      } catch (error) {
        if (!mounted) return;
        setPolicyVersions(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const termsUpdatedAt = policyVersions?.termsVersion || "2026-05-14";
  const privacyUpdatedAt = policyVersions?.privacyPolicyVersion || "2026-05-14";

  async function handleAccept() {
    if (acceptedTerms) {
      setLoading(true);
      try {
        if (onAccept) {
          await Promise.resolve(onAccept());
        }
        
        if (navigation) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            // Se for a tela inicial (AuthRoutes), avança para a intro
            (navigation as any).navigate("IntroScreen");
          }
        }
      } catch (error) {
        console.error("Erro ao salvar aceite:", error);
      } finally {
        setLoading(false);
      }
    }
  }
  const { userType: storeUserType } = useAuthStore();
  const { userType: routeUserType } = (route?.params as { userType?: string }) || {};
  const userType = storeUserType || routeUserType || "client";

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-700">
        {!onAccept ? (
          <TouchableOpacity
            onPress={() => navigation?.goBack()}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text className="text-white text-lg font-bold">Termos e Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: 40 
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          {/* Section: Terms of Use */}
          <View className="mb-10">
            <Text className="text-brand-light font-bold text-xs tracking-widest uppercase mb-2">
              Parte 1: Contrato de Licença de Uso
            </Text>
            <Text className="text-white text-2xl font-bold mb-2">
              Termos de Uso - Leva+
            </Text>
            <Text className="text-gray-500 text-xs mb-6">
              Última atualização: {termsUpdatedAt} • Perfil: {userType === "driver" ? "Motorista Parceiro" : "Passageiro"}
            </Text>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                1. Aceitação e Elegibilidade
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                {userType === "driver" 
                  ? "Para atuar como Motorista Parceiro, você deve possuir CNH definitiva com EAR, veículo em conformidade com as normas locais e aprovação em nossa análise de segurança."
                  : "Como passageiro, você declara ter pelo menos 18 anos ou estar acompanhado por um responsável. O uso da plataforma implica na aceitação total destes termos."}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                2. Integridade do Sistema e Segurança
              </Text>
              <Text className="text-gray-300 text-sm leading-6 mb-3">
                É estritamente proibido qualquer tentativa de engenharia reversa, acesso não autorizado a bancos de dados ou uso de softwares de terceiros para manipular os serviços da plataforma.
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                A segurança da conta é de responsabilidade exclusiva do usuário. Você concorda em notificar a plataforma imediatamente sobre qualquer uso não autorizado.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                3. {userType === "driver" ? "Relação com a Plataforma" : "Funcionamento do Serviço"}
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                {userType === "driver"
                  ? "O motorista parceiro é um profissional autônomo. Não existe vínculo empregatício, subordinação ou exclusividade entre o motorista e o Leva+."
                  : "Atuamos como intermediadores de tecnologia, facilitando o contato entre você e prestadores de serviço de transporte independentes."}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                4. Taxas e Pagamentos
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                {userType === "driver"
                  ? "As taxas de intermediação da plataforma são retidas no momento da transação. Você é responsável pelas obrigações fiscais decorrentes de sua atividade."
                  : "Os valores das viagens são calculados com base em distância e tempo. O pagamento deve ser realizado através dos métodos cadastrados no app."}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-800 w-full mb-10" />

          {/* Section: Privacy Policy */}
          <View className="mb-10">
            <Text className="text-brand-light font-bold text-xs tracking-widest uppercase mb-2">
              Parte 2: Proteção de Dados (LGPD)
            </Text>
            <Text className="text-white text-2xl font-bold mb-2">
              Política de Privacidade
            </Text>
            <Text className="text-gray-500 text-xs mb-6">
              Em conformidade com a Lei nº 13.709/2018
            </Text>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                1. Coleta e Finalidade
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                Coletamos dados de identificação, geolocalização em tempo real e dados financeiros estritamente para a prestação do serviço e segurança operacional. Todos os dados sensíveis são armazenados com hash e criptografia.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                2. Seus Direitos
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                Você tem o direito de acessar, corrigir, solicitar a exclusão de seus dados ou revogar este consentimento a qualquer momento através das configurações do aplicativo.
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-white text-lg font-bold mb-3">
                3. Retenção de Informações
              </Text>
              <Text className="text-gray-300 text-sm leading-6">
                Mantemos seus dados enquanto sua conta estiver ativa ou conforme exigido por obrigações legais de registro financeiro e operacional.
              </Text>
            </View>
          </View>

          {/* Acceptance Zone */}
          <View className="mt-4 p-6 bg-white/5 rounded-3xl border border-white/10">
            <Text className="text-white font-bold mb-4">Confirmação de Leitura</Text>
            
            <TouchableOpacity
              className="flex-row items-center mb-6"
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View
                className={`w-6 h-6 rounded-lg items-center justify-center mr-4 ${
                  acceptedTerms ? "bg-brand-light" : "border-2 border-gray-600"
                }`}
              >
                {acceptedTerms && (
                  <Feather name="check" size={18} color={theme.COLORS.BRAND_DARK} />
                )}
              </View>
              <Text className="text-gray-300 text-sm flex-1 leading-5">
                Li e concordo integralmente com os <Text className="text-brand-light font-bold">Termos de Uso</Text> e com a <Text className="text-brand-light font-bold">Política de Privacidade</Text>.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`h-14 rounded-2xl items-center justify-center ${
                acceptedTerms && !loading ? "bg-brand-light" : "bg-gray-700"
              }`}
              onPress={handleAccept}
              disabled={!acceptedTerms || loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.COLORS.BRAND_DARK} />
              ) : (
                <Text
                  className={`font-bold text-lg ${
                    acceptedTerms ? "text-brand-dark" : "text-gray-500"
                  }`}
                >
                  Aceitar e Continuar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
