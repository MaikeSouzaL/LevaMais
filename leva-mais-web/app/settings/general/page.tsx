"use client";

import { useEffect, useState } from "react";
import { Settings, Save, DollarSign } from "lucide-react";
import { platformConfigService } from "@/services/platformConfigService";
import { useToast } from "@/components/ui/Toast";

export default function GeneralSettingsPage() {
  const [config, setConfig] = useState({ appFeePercentage: 20 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await platformConfigService.get();
      setConfig({ appFeePercentage: data.appFeePercentage });
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
      showToast("Configurações salvas!", "success");
    } catch {
      showToast("Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {ToastContainer}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="w-8 h-8 text-gray-700" />
          Configurações Gerais
        </h1>
        <p className="text-gray-600 mt-1">
          Defina as taxas globais da plataforma aplicadas a todas as corridas.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="font-semibold text-gray-900">Financeiro Global</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Taxa da Plataforma (App Fee)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative w-32">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={config.appFeePercentage}
                  onChange={(e) => setConfig({ ...config, appFeePercentage: Number(e.target.value) })}
                />
                <span className="absolute right-3 top-2 text-gray-500 font-medium">%</span>
              </div>
              <p className="text-sm text-gray-500 max-w-md">
                Porcentagem retida de cada corrida. Ex: Se a corrida for R$ 20,00 e a taxa for 20%, o motorista recebe R$ 16,00.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
            <strong>Nota sobre Representantes:</strong> <br/>
            Se uma cidade tiver um representante cadastrado, esta taxa retida será dividida (split) entre a Plataforma e o Representante (padrão 50/50).
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? "Salvando..." : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
