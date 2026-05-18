"use client";

import { useEffect, useState } from "react";
import {
  Settings,
  Save,
  DollarSign,
  Timer,
  Trophy,
  LifeBuoy,
  FileCheck,
  Cpu,
  MapPin,
  HelpCircle
} from "lucide-react";
import { platformConfigService, PlatformConfig } from "@/services/platformConfigService";
import { useToast } from "@/components/ui/Toast";

type TabType = "financial" | "search" | "goals" | "support" | "policies" | "operation";

export default function GeneralSettingsPage() {
  const [config, setConfig] = useState<Required<Omit<PlatformConfig, "_id">>>({
    appFeePercentage: 15,
    isDevelopmentMode: true,
    defaultSearchRadius: 5000,
    queueRedispatchInterval: 60,
    rideSearchTimeoutSeconds: 60,
    splitRules: { representativeShare: 50 },
    driverGoals: { dailyGoalRides: 10, dailyBonusAmount: 20 },
    supportChannels: { phone: "0800123456", email: "suporte@levamais.app", whatsapp: "5500000000000", helpCenterUrl: "" },
    policyVersions: { termsVersion: "2026-05-14", privacyPolicyVersion: "2026-05-14", consentVersion: "2026-05-14" }
  });
  
  const [activeTab, setActiveTab] = useState<TabType>("financial");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadConfig();
    window.addEventListener("platform-config-updated", loadConfig);
    return () => {
      window.removeEventListener("platform-config-updated", loadConfig);
    };
  }, []);

  const loadConfig = async () => {
    try {
      const data = await platformConfigService.get();
      setConfig({
        appFeePercentage: data.appFeePercentage ?? 15,
        isDevelopmentMode: data.isDevelopmentMode !== undefined ? data.isDevelopmentMode : true,
        defaultSearchRadius: data.defaultSearchRadius ?? 5000,
        queueRedispatchInterval: data.queueRedispatchInterval ?? 60,
        rideSearchTimeoutSeconds: data.rideSearchTimeoutSeconds ?? 60,
        splitRules: {
          representativeShare: data.splitRules?.representativeShare ?? 50
        },
        driverGoals: {
          dailyGoalRides: data.driverGoals?.dailyGoalRides ?? 10,
          dailyBonusAmount: data.driverGoals?.dailyBonusAmount ?? 20
        },
        supportChannels: {
          phone: data.supportChannels?.phone ?? "0800123456",
          email: data.supportChannels?.email ?? "suporte@levamais.app",
          whatsapp: data.supportChannels?.whatsapp ?? "5500000000000",
          helpCenterUrl: data.supportChannels?.helpCenterUrl ?? ""
        },
        policyVersions: {
          termsVersion: data.policyVersions?.termsVersion ?? "2026-05-14",
          privacyPolicyVersion: data.policyVersions?.privacyPolicyVersion ?? "2026-05-14",
          consentVersion: data.policyVersions?.consentVersion ?? "2026-05-14"
        }
      });
    } catch {
      showToast("Erro ao carregar configurações", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await platformConfigService.update(config);
      showToast("Configurações salvas e ativadas com sucesso!", "success");
      window.dispatchEvent(new Event("platform-config-updated"));
    } catch {
      showToast("Erro ao salvar no banco", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "financial" as TabType, label: "Financeiro & Split", icon: DollarSign },
    { id: "search" as TabType, label: "Pesquisa & Fila", icon: Timer },
    { id: "goals" as TabType, label: "Metas dos Motoristas", icon: Trophy },
    { id: "support" as TabType, label: "Canais de Suporte", icon: LifeBuoy },
    { id: "policies" as TabType, label: "Políticas Legais", icon: FileCheck },
    { id: "operation" as TabType, label: "Modo de Operação", icon: Cpu }
  ];

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Carregando painel de controle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {ToastContainer}

      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3">
            <Settings className="w-9 h-9 text-emerald-600 animate-spin-slow" />
            Painel de Configuração Global
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie todas as variáveis estáticas, parâmetros de corrida, regras financeiras e canais do app Leva+.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          {saving ? "Salvando..." : (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-emerald-600 shadow-sm border border-gray-200/50"
                  : "text-gray-600 hover:bg-white/40 hover:text-gray-950"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-500" : "text-gray-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Sections Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/70 overflow-hidden">
        
        {/* TAB 1: FINANCIALS */}
        {activeTab === "financial" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Regras Financeiras & Splits</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Taxa da Plataforma (App Fee %)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Porcentagem padrão retida sobre o valor de cada corrida.</p>
                  <div className="relative w-full max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      value={config.appFeePercentage}
                      onChange={(e) => setConfig({ ...config, appFeePercentage: Math.max(0, Math.min(100, Number(e.target.value))) })}
                    />
                    <span className="absolute right-3 top-3.5 text-gray-500 font-bold text-sm">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Comissão do Representante (Split %)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Porcentagem da taxa que é repassada para o representante da cidade.</p>
                  <div className="relative w-full max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      value={config.splitRules.representativeShare}
                      onChange={(e) => setConfig({
                        ...config,
                        splitRules: { representativeShare: Math.max(0, Math.min(100, Number(e.target.value))) }
                      })}
                    />
                    <span className="absolute right-3 top-3.5 text-gray-500 font-bold text-sm">%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 flex gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold mb-0.5">Exemplo Prático de Repasse</h4>
                  Se a taxa for 15% e o split do representante for 50%:
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>Corrida total: R$ 100,00</li>
                    <li>Retenção total: R$ 15,00 (15%)</li>
                    <li>Comissão do Representante: R$ 7,50 (50% do retido)</li>
                    <li>Líquido Plataforma: R$ 7,50</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH & TIMERS */}
        {activeTab === "search" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Parâmetros de Pesquisa & Tempo</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Raio Padrão de Busca (Metros)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Raio geográfico inicial máximo para buscar motoristas próximos.</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="500"
                      className="w-full pl-3 pr-12 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={config.defaultSearchRadius}
                      onChange={(e) => setConfig({ ...config, defaultSearchRadius: Math.max(100, Number(e.target.value)) })}
                    />
                    <span className="absolute right-3 top-3.5 text-gray-500 font-bold text-xs">metros</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Fila de Redisparo (Segundos)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Frequência em segundos para redisparar e procurar novos motoristas.</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={config.queueRedispatchInterval}
                      onChange={(e) => setConfig({ ...config, queueRedispatchInterval: Math.max(5, Number(e.target.value)) })}
                    />
                    <span className="absolute right-3 top-3.5 text-gray-500 font-bold text-xs">seg</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Tempo Limite de Busca (Segundos)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Tempo máximo de busca antes da corrida expirar por timeout.</p>
                  <div className="relative">
                    <input
                      type="number"
                      min="30"
                      className="w-full pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={config.rideSearchTimeoutSeconds}
                      onChange={(e) => setConfig({ ...config, rideSearchTimeoutSeconds: Math.max(10, Number(e.target.value)) })}
                    />
                    <span className="absolute right-3 top-3.5 text-gray-500 font-bold text-xs">seg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DRIVER GOALS */}
        {activeTab === "goals" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Metas e Campanhas Diárias</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Meta de Corridas Diárias (Rides)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Meta de corridas para liberar o bônus diário nas telas do motorista.</p>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.driverGoals.dailyGoalRides}
                    onChange={(e) => setConfig({
                      ...config,
                      driverGoals: { ...config.driverGoals, dailyGoalRides: Math.max(1, Number(e.target.value)) }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Valor do Bônus Diário (R$)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Prêmio financeiro em carteira adicionado ao completar a meta.</p>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-gray-500 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      min="0"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={config.driverGoals.dailyBonusAmount}
                      onChange={(e) => setConfig({
                        ...config,
                        driverGoals: { ...config.driverGoals, dailyBonusAmount: Math.max(0, Number(e.target.value)) }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SUPPORT CHANNELS */}
        {activeTab === "support" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Canais de Suporte & Atendimento</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Telefone de Atendimento (Phone)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.supportChannels.phone}
                    onChange={(e) => setConfig({
                      ...config,
                      supportChannels: { ...config.supportChannels, phone: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    E-mail do Suporte (Support Email)
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.supportChannels.email}
                    onChange={(e) => setConfig({
                      ...config,
                      supportChannels: { ...config.supportChannels, email: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    WhatsApp Comercial (com DDI e DDD)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.supportChannels.whatsapp}
                    onChange={(e) => setConfig({
                      ...config,
                      supportChannels: { ...config.supportChannels, whatsapp: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    URL do Centro de Ajuda (Help Center URL)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.supportChannels.helpCenterUrl}
                    onChange={(e) => setConfig({
                      ...config,
                      supportChannels: { ...config.supportChannels, helpCenterUrl: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: POLICIES */}
        {activeTab === "policies" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Versões de Termos & Políticas Legais</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Versão dos Termos de Uso
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.policyVersions.termsVersion}
                    onChange={(e) => setConfig({
                      ...config,
                      policyVersions: { ...config.policyVersions, termsVersion: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Versão da Política de Privacidade
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.policyVersions.privacyPolicyVersion}
                    onChange={(e) => setConfig({
                      ...config,
                      policyVersions: { ...config.policyVersions, privacyPolicyVersion: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    Versão do Consentimento de Dados
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.policyVersions.consentVersion}
                    onChange={(e) => setConfig({
                      ...config,
                      policyVersions: { ...config.policyVersions, consentVersion: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: OPERATION */}
        {activeTab === "operation" && (
          <div>
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-gray-900 text-base">Modo de Operação do Sistema</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200/50 rounded-2xl">
                <div>
                  <label className="block text-sm font-bold text-gray-850">
                    🛠️ Modo de Desenvolvimento
                  </label>
                  <p className="text-xs text-amber-800 max-w-xl mt-1">
                    Ao ativar este modo, as consultas de validação (APIs externas) de CPF, CNPJ e Placa de Veículo são desabilitadas no backend.
                    Isso permite cadastrar qualquer dado fictício de testes de maneira imediata.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, isDevelopmentMode: !config.isDevelopmentMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    config.isDevelopmentMode ? "bg-amber-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.isDevelopmentMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
