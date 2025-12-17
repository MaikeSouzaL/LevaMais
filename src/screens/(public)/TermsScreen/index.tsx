import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import theme from "../../../theme";

type TabType = "terms" | "privacy";

export default function TermsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { onAccept } = (route.params as { onAccept?: () => void }) || {};

  const [activeTab, setActiveTab] = useState<TabType>("terms");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  function handleAccept() {
    if (acceptedTerms && acceptedPrivacy) {
      if (onAccept) {
        onAccept();
      }
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-700">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Termos e Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 py-4 border-b border-gray-700">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl items-center mr-2 ${
            activeTab === "terms"
              ? "bg-brand-light"
              : "bg-surface-secondary"
          }`}
          onPress={() => setActiveTab("terms")}
        >
          <Text
            className={`font-bold ${
              activeTab === "terms"
                ? "text-brand-dark"
                : "text-gray-400"
            }`}
          >
            Termos de Uso
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-xl items-center ml-2 ${
            activeTab === "privacy"
              ? "bg-brand-light"
              : "bg-surface-secondary"
          }`}
          onPress={() => setActiveTab("privacy")}
        >
          <Text
            className={`font-bold ${
              activeTab === "privacy"
                ? "text-brand-dark"
                : "text-gray-400"
            }`}
          >
            Privacidade
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ 
          paddingBottom: onAccept ? 200 : 40 
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-6">
          {activeTab === "terms" ? (
            <View>
              <Text className="text-white text-2xl font-bold mb-4">
                Termos de Uso - Leva+
              </Text>
              <Text className="text-gray-300 text-sm mb-4 leading-6">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </Text>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  1. Aceitação dos Termos
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Ao acessar e usar o aplicativo Leva+, você concorda em cumprir
                  e estar vinculado a estes Termos de Uso. Se você não
                  concordar com alguma parte destes termos, não deve usar nosso
                  serviço.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  2. Descrição do Serviço
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  O Leva+ é uma plataforma que conecta clientes a entregadores
                  para realização de entregas e serviços de transporte. Nosso
                  aplicativo facilita a comunicação entre usuários e prestadores
                  de serviços de entrega.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  3. Cadastro e Conta de Usuário
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Para usar nossos serviços, você deve criar uma conta fornecendo
                  informações precisas e atualizadas. Você é responsável por
                  manter a confidencialidade de suas credenciais de login e por
                  todas as atividades que ocorram em sua conta.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  4. Uso Aceitável
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Você concorda em usar o Leva+ apenas para fins legais e de
                  acordo com estes Termos. Você não deve usar nosso serviço
                  para atividades ilegais, fraudulentas ou que violem direitos
                  de terceiros.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  5. Pagamentos
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Os pagamentos pelos serviços são processados através dos
                  métodos de pagamento disponíveis na plataforma. Você concorda
                  em pagar todos os valores devidos pelos serviços utilizados.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  6. Responsabilidades
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  O Leva+ atua como intermediário entre clientes e entregadores.
                  Não somos responsáveis por danos, perdas ou problemas
                  decorrentes dos serviços prestados pelos entregadores.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  7. Modificações dos Termos
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Reservamos o direito de modificar estes Termos a qualquer
                  momento. Alterações significativas serão comunicadas através
                  do aplicativo. O uso continuado após as modificações
                  constitui aceitação dos novos termos.
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-white text-2xl font-bold mb-4">
                Política de Privacidade - Leva+
              </Text>
              <Text className="text-gray-300 text-sm mb-4 leading-6">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </Text>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  1. Informações que Coletamos
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Coletamos informações que você nos fornece diretamente, como
                  nome, email, telefone, endereço, dados de localização e
                  informações de pagamento. Também coletamos dados de uso do
                  aplicativo e informações do dispositivo.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  2. Como Usamos suas Informações
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Utilizamos suas informações para fornecer, manter e melhorar
                  nossos serviços, processar transações, comunicar com você,
                  personalizar sua experiência e garantir a segurança da
                  plataforma.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  3. Compartilhamento de Informações
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Compartilhamos informações com entregadores para facilitar os
                  serviços solicitados. Não vendemos suas informações pessoais.
                  Podemos compartilhar dados com prestadores de serviços
                  confiáveis que nos ajudam a operar a plataforma.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  4. Segurança dos Dados
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Implementamos medidas de segurança técnicas e organizacionais
                  para proteger suas informações contra acesso não autorizado,
                  alteração, divulgação ou destruição.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  5. Seus Direitos (LGPD)
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  De acordo com a LGPD, você tem direito a acessar, corrigir,
                  excluir, portar e revogar consentimento sobre seus dados
                  pessoais. Para exercer esses direitos, entre em contato
                  conosco.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  6. Cookies e Tecnologias Similares
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Utilizamos tecnologias como cookies para melhorar sua
                  experiência, analisar o uso do aplicativo e personalizar
                  conteúdo. Você pode gerenciar essas preferências nas
                  configurações do dispositivo.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  7. Alterações nesta Política
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Podemos atualizar esta Política de Privacidade
                  periodicamente. Notificaremos sobre mudanças significativas
                  através do aplicativo ou por email.
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-white text-lg font-bold mb-3">
                  8. Contato
                </Text>
                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  Para questões sobre privacidade ou exercer seus direitos,
                  entre em contato conosco através do email de suporte
                  disponível no aplicativo.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer com checkboxes e botão */}
      {onAccept && (
        <SafeAreaView
          edges={["bottom"]}
          className="border-t border-gray-700"
          style={{ backgroundColor: theme.COLORS.BRAND_DARK }}
        >
          <View className="px-6 py-4">
            <View className="mb-4">
            <TouchableOpacity
              className="flex-row items-center mb-3"
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            >
              <View
                className={`w-5 h-5 rounded items-center justify-center mr-3 ${
                  acceptedTerms
                    ? "bg-brand-light"
                    : "border-2 border-gray-500"
                }`}
              >
                {acceptedTerms && (
                  <Feather name="check" size={16} color={theme.COLORS.WHITE} />
                )}
              </View>
              <Text className="text-gray-300 text-sm flex-1">
                Li e aceito os{" "}
                <Text
                  className="text-brand-light font-bold"
                  onPress={() => setActiveTab("terms")}
                >
                  Termos de Uso
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
            >
              <View
                className={`w-5 h-5 rounded items-center justify-center mr-3 ${
                  acceptedPrivacy
                    ? "bg-brand-light"
                    : "border-2 border-gray-500"
                }`}
              >
                {acceptedPrivacy && (
                  <Feather name="check" size={16} color={theme.COLORS.WHITE} />
                )}
              </View>
              <Text className="text-gray-300 text-sm flex-1">
                Li e aceito a{" "}
                <Text
                  className="text-brand-light font-bold"
                  onPress={() => setActiveTab("privacy")}
                >
                  Política de Privacidade
                </Text>
              </Text>
            </TouchableOpacity>
            </View>

            <TouchableOpacity
              className={`h-14 rounded-2xl items-center justify-center ${
                acceptedTerms && acceptedPrivacy
                  ? "bg-brand-light"
                  : "bg-gray-600"
              }`}
              onPress={handleAccept}
              disabled={!acceptedTerms || !acceptedPrivacy}
            >
              <Text
                className={`font-bold text-lg ${
                  acceptedTerms && acceptedPrivacy
                    ? "text-brand-dark"
                    : "text-gray-400"
                }`}
              >
                Aceitar e Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

