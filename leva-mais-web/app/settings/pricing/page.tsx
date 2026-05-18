"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Settings,
  Save,
  Tag
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { pricingService, PricingConfig } from "@/services/pricingService";

export default function PricingSettingsPage() {
  const [globalConfig, setGlobalConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const configData = await pricingService.getConfig();
      setGlobalConfig(configData);
    } catch {
      showToast("Erro ao carregar dados de precificação", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save global operational baselines
  const handleSaveBaselines = async () => {
    if (!globalConfig) return;
    setSaving(true);
    try {
      await pricingService.updateConfig(globalConfig);
      showToast("Tarifas e baselines globais salvos com sucesso!", "success");
      loadData();
    } catch {
      showToast("Erro ao atualizar tarifas globais", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBaselineField = (
    index: number,
    field: "pricePerKm" | "minimumKm" | "minimumFee" | "enabled",
    value: number | boolean
  ) => {
    if (!globalConfig) return;
    const pricingCopy = [...globalConfig.vehiclePricing];
    pricingCopy[index] = {
      ...pricingCopy[index],
      [field]: value
    };
    setGlobalConfig({
      ...globalConfig,
      vehiclePricing: pricingCopy
    });
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      motorcycle: "Moto",
      car: "Carro",
      van: "Van",
      truck: "Caminhão"
    };
    return labels[cat] || cat;
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-bold">Carregando painel de tarifas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {ToastContainer}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3">
            <DollarSign className="w-9 h-9 text-emerald-600 animate-pulse" />
            Tarifas Globais & Baselines
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os valores padrões aplicados por categoria de veículo e os multiplicadores de urgência globais para o Leva+.
          </p>
        </div>

        <button
          onClick={handleSaveBaselines}
          disabled={saving}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all hover:shadow-md shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Card: Vehicle Categories Baselines */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900 text-base">Tarifação Padrão por Categoria</h2>
          </div>

          <div className="p-6 divide-y divide-gray-100 space-y-6">
            {globalConfig?.vehiclePricing.map((vp, index) => (
              <div key={vp.vehicleType} className="pt-6 first:pt-0 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <div>
                  <h3 className="font-extrabold text-gray-950 text-sm capitalize">{getCategoryLabel(vp.vehicleType)}</h3>
                  <p className="text-[10px] text-gray-400 font-bold mt-0.5">Parâmetros operacionais da categoria.</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Valor por KM Rodado (R$)</label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-3 text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                      value={vp.pricePerKm}
                      onChange={(e) => handleUpdateBaselineField(index, "pricePerKm", Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">KM Mínimo Contratado (Threshold)</label>
                  <div className="relative max-w-xs">
                    <input
                      type="number"
                      min="0"
                      className="w-full pl-4 pr-12 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                      value={vp.minimumKm}
                      onChange={(e) => handleUpdateBaselineField(index, "minimumKm", Number(e.target.value))}
                    />
                    <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-[10px]">km</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Taxa Mínima da Corrida (R$)</label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-3 text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                      value={vp.minimumFee ?? 0}
                      onChange={(e) => handleUpdateBaselineField(index, "minimumFee", Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card: Urgent Priority Multipliers */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-900 text-base">Multiplicadores de Prioridade (Urgência)</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Econômico (Multiplicador)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                value={globalConfig?.platformSettings?.priorityMultiplierEconomic ?? 1.0}
                onChange={(e) => {
                  if (!globalConfig) return;
                  setGlobalConfig({
                    ...globalConfig,
                    platformSettings: {
                      ...globalConfig.platformSettings,
                      priorityMultiplierEconomic: Number(e.target.value)
                    }
                  });
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Rápido (Multiplicador)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                value={globalConfig?.platformSettings?.priorityMultiplierFast ?? 1.3}
                onChange={(e) => {
                  if (!globalConfig) return;
                  setGlobalConfig({
                    ...globalConfig,
                    platformSettings: {
                      ...globalConfig.platformSettings,
                      priorityMultiplierFast: Number(e.target.value)
                    }
                  });
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Urgente (Multiplicador)</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="5"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-semibold"
                value={globalConfig?.platformSettings?.priorityMultiplierUrgent ?? 1.8}
                onChange={(e) => {
                  if (!globalConfig) return;
                  setGlobalConfig({
                    ...globalConfig,
                    platformSettings: {
                      ...globalConfig.platformSettings,
                      priorityMultiplierUrgent: Number(e.target.value)
                    }
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
