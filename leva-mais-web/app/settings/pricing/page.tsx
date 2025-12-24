"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Save,
  RotateCcw,
  Clock,
  TrendingUp,
  Settings,
  Bike,
  Car,
  TruckIcon,
  Package,
  AlertCircle,
  Check,
  X,
  Infinity,
} from "lucide-react";
import {
  pricingService,
  PricingConfig,
  VehiclePricing,
  PeakHour,
  CancellationFee,
  PlatformSettings,
} from "@/services/pricingService";
import { useToast } from "@/components/ui/Toast";
import { parseCurrency } from "@/lib/formatters";

const VEHICLE_ICONS = {
  motorcycle: Bike,
  car: Car,
  van: Package,
  truck: TruckIcon,
};

const VEHICLE_LABELS = {
  motorcycle: "Moto",
  car: "Carro",
  van: "Van",
  truck: "Caminhão",
};

const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "vehicles" | "peak" | "cancellation" | "platform"
  >("vehicles");

  const { showToast, ToastContainer } = useToast();

  // Carregar configuração
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await pricingService.getConfig();
      setConfig(data);
    } catch (error) {
      showToast("Erro ao carregar configuração", "error");
      console.error(error);
      // Usar configuração padrão em caso de erro
      setConfig(pricingService.getDefaultConfig());
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Salvar configuração
  const handleSave = async () => {
    if (!config) return;

    // Validar configuração
    const validation = pricingService.validateConfig(config);
    if (!validation.valid) {
      showToast(
        `Erros na configuração: ${validation.errors.join(", ")}`,
        "error"
      );
      return;
    }

    try {
      setSaving(true);
      await pricingService.updateConfig(config);
      showToast("Configuração salva com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao salvar configuração", "error");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Resetar para padrão
  const handleReset = () => {
    if (
      !confirm(
        "Tem certeza que deseja restaurar as configurações padrão? Todas as alterações serão perdidas."
      )
    )
      return;

    setConfig(pricingService.getDefaultConfig());
    showToast("Configuração resetada para o padrão", "success");
  };

  // Atualizar preço de veículo
  const updateVehiclePricing = (
    index: number,
    field: keyof VehiclePricing,
    value: number | boolean
  ) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.vehiclePricing[index] = {
      ...newConfig.vehiclePricing[index],
      [field]: value,
    };
    setConfig(newConfig);
  };

  // Atualizar horário de pico
  const updatePeakHour = (
    index: number,
    field: keyof PeakHour,
    value: string | number | number[] | boolean
  ) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.peakHours[index] = {
      ...newConfig.peakHours[index],
      [field]: value,
    };
    setConfig(newConfig);
  };

  // Adicionar horário de pico
  const addPeakHour = () => {
    if (!config) return;

    const newPeakHour: PeakHour = {
      id: `peak_${Date.now()}`,
      name: "Novo Horário",
      dayOfWeek: [1, 2, 3, 4, 5],
      startTime: "00:00",
      endTime: "23:59",
      multiplier: 1.2,
      enabled: true,
    };

    setConfig({
      ...config,
      peakHours: [...config.peakHours, newPeakHour],
    });
  };

  // Remover horário de pico
  const removePeakHour = (index: number) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.peakHours.splice(index, 1);
    setConfig(newConfig);
  };

  // Atualizar taxa de cancelamento
  const updateCancellationFee = (
    index: number,
    field: keyof CancellationFee,
    value: number | boolean
  ) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.cancellationFees[index] = {
      ...newConfig.cancellationFees[index],
      [field]: value,
    };
    setConfig(newConfig);
  };

  // Atualizar configurações da plataforma
  const updatePlatformSettings = (
    field: keyof PlatformSettings,
    value: number
  ) => {
    if (!config) return;

    const newConfig = { ...config };
    newConfig.platformSettings = {
      ...newConfig.platformSettings,
      [field]: value,
    };
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar configurações</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {ToastContainer}

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Preços & Regras
          </h1>
          <p className="text-gray-600">
            Configure os preços, horários de pico e regras da plataforma
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrão
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <TabButton
              active={activeTab === "vehicles"}
              onClick={() => setActiveTab("vehicles")}
              icon={DollarSign}
              label="Preços por Veículo"
            />
            <TabButton
              active={activeTab === "peak"}
              onClick={() => setActiveTab("peak")}
              icon={TrendingUp}
              label="Horários de Pico"
            />
            <TabButton
              active={activeTab === "cancellation"}
              onClick={() => setActiveTab("cancellation")}
              icon={X}
              label="Taxas de Cancelamento"
            />
            <TabButton
              active={activeTab === "platform"}
              onClick={() => setActiveTab("platform")}
              icon={Settings}
              label="Configurações Gerais"
            />
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "vehicles" && (
            <VehiclePricingTab
              vehiclePricing={config.vehiclePricing}
              onUpdate={updateVehiclePricing}
            />
          )}

          {activeTab === "peak" && (
            <PeakHoursTab
              peakHours={config.peakHours}
              onUpdate={updatePeakHour}
              onAdd={addPeakHour}
              onRemove={removePeakHour}
            />
          )}

          {activeTab === "cancellation" && (
            <CancellationTab
              cancellationFees={config.cancellationFees}
              onUpdate={updateCancellationFee}
            />
          )}

          {activeTab === "platform" && (
            <PlatformSettingsTab
              settings={config.platformSettings}
              onUpdate={updatePlatformSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de Tab Button
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
        active
          ? "border-green-600 text-green-600"
          : "border-transparent text-gray-600 hover:text-gray-900"
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

// Tab de Preços por Veículo
interface VehiclePricingTabProps {
  vehiclePricing: VehiclePricing[];
  onUpdate: (
    index: number,
    field: keyof VehiclePricing,
    value: number | boolean
  ) => void;
}

function VehiclePricingTab({
  vehiclePricing,
  onUpdate,
}: VehiclePricingTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900 mb-1">
            Como funciona o cálculo de preços
          </h3>
          <p className="text-sm text-blue-700">
            Regra: Se Distância ≤ KM Mínimo, cobra a Taxa Mínima (valor). Se
            Distância &gt; KM Mínimo, cobra Taxa Mínima + (Distância &minus; KM
            Mínimo) &times; Preço/km. Depois, aplicam-se eventuais Taxas
            Adicionais (pico/noturna).
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {vehiclePricing.map((vp, index) => {
          const Icon = VEHICLE_ICONS[vp.vehicleType];
          const label = VEHICLE_LABELS[vp.vehicleType];

          return (
            <div
              key={vp.vehicleType}
              className="bg-gray-50 rounded-lg p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <p className="text-sm text-gray-500">
                      Configure os valores para {label.toLowerCase()}
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vp.enabled}
                    onChange={(e) =>
                      onUpdate(index, "enabled", e.target.checked)
                    }
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {vp.enabled ? "Ativo" : "Inativo"}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <PriceInput
                  label="Preço por KM"
                  value={vp.pricePerKm}
                  onChange={(value) => onUpdate(index, "pricePerKm", value)}
                  prefix="R$"
                  suffix="/km"
                  hint="Valor por quilômetro"
                />

                <PriceInput
                  label="KM Mínimo"
                  value={vp.minimumKm}
                  onChange={(value) => onUpdate(index, "minimumKm", value)}
                  prefix={undefined}
                  suffix="km"
                  hint="Km mínimo cobrado"
                />

                <PriceInput
                  label="Taxa Mínima (Valor)"
                  value={vp.minimumFee || 0}
                  onChange={(value) => onUpdate(index, "minimumFee", value)}
                  prefix="R$"
                  hint="Valor mínimo da corrida"
                />
              </div>

              {/* Exemplo de cálculo com distância dinâmica */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-gray-500 font-medium">
                    Exemplo:
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    defaultValue={10}
                    onChange={(e) => {
                      const exKm = Number(e.target.value);
                      const minKm = vp.minimumKm || 0;
                      const exceedKm = Math.max(exKm - minKm, 0);
                      const distancePrice = exceedKm * vp.pricePerKm;
                      const subtotal = (vp.minimumFee || 0) + distancePrice;
                      const el =
                        e.currentTarget.parentElement?.parentElement?.querySelector(
                          "[data-example-result]"
                        ) as HTMLElement | null;
                      if (el) el.textContent = `R$ ${subtotal.toFixed(2)}`;
                      const details =
                        e.currentTarget.parentElement?.parentElement?.querySelector(
                          "[data-example-details]"
                        ) as HTMLElement | null;
                      if (details)
                        details.textContent = `Distância: ${exKm.toFixed(
                          2
                        )} km • KM Mínimo: ${minKm.toFixed(
                          2
                        )} km • Excedente: ${exceedKm.toFixed(2)} km`;
                    }}
                    className="w-24 px-2 py-1 text-sm border rounded-md"
                  />
                  <span className="text-xs text-gray-500">km</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p data-example-details>
                    Distância: 10.00 km • KM Mínimo:{" "}
                    {(vp.minimumKm || 0).toFixed(2)} km • Excedente:{" "}
                    {Math.max(10 - (vp.minimumKm || 0), 0).toFixed(2)} km
                  </p>
                  <p>
                    Taxa Mínima: R$ {(vp.minimumFee || 0).toFixed(2)} • Preço
                    por KM: R$ {vp.pricePerKm.toFixed(2)}
                  </p>
                  <p className="font-medium text-gray-900">
                    Total (sem taxas adicionais):{" "}
                    <span data-example-result>
                      R${" "}
                      {(
                        (vp.minimumFee || 0) +
                        Math.max(10 - (vp.minimumKm || 0), 0) * vp.pricePerKm
                      ).toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Tab de Horários de Pico
interface PeakHoursTabProps {
  peakHours: PeakHour[];
  onUpdate: (
    index: number,
    field: keyof PeakHour,
    value: string | number | number[] | boolean
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function PeakHoursTab({
  peakHours,
  onUpdate,
  onAdd,
  onRemove,
}: PeakHoursTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Horários de Pico
          </h2>
          <p className="text-sm text-gray-600">
            Configure multiplicadores de preço para horários específicos
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Adicionar Horário
        </button>
      </div>

      <div className="grid gap-4">
        {peakHours.map((ph, index) => (
          <div
            key={ph.id}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <input
                type="text"
                value={ph.name}
                onChange={(e) => onUpdate(index, "name", e.target.value)}
                className="text-lg font-semibold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none px-2 py-1"
              />

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ph.enabled}
                    onChange={(e) =>
                      onUpdate(index, "enabled", e.target.checked)
                    }
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>

                <button
                  onClick={() => onRemove(index)}
                  className="text-red-600 hover:text-red-700 p-2"
                  title="Remover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dias da semana */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da Semana
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day, dayIndex) => (
                    <label
                      key={dayIndex}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={ph.dayOfWeek.includes(dayIndex)}
                        onChange={(e) => {
                          const newDays = e.target.checked
                            ? [...ph.dayOfWeek, dayIndex]
                            : ph.dayOfWeek.filter((d) => d !== dayIndex);
                          onUpdate(index, "dayOfWeek", newDays.sort());
                        }}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Horários */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Início
                </label>
                <input
                  type="time"
                  value={ph.startTime}
                  onChange={(e) => onUpdate(index, "startTime", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />

                <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                  Horário de Término
                </label>
                <input
                  type="time"
                  value={ph.endTime}
                  onChange={(e) => onUpdate(index, "endTime", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Multiplicador */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Multiplicador de Preço
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={ph.multiplier}
                  onChange={(e) =>
                    onUpdate(index, "multiplier", parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {ph.multiplier === 1
                    ? "Sem acréscimo"
                    : `+${((ph.multiplier - 1) * 100).toFixed(0)}% no preço`}
                </p>

                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">
                    Exemplo: R$ 20,00 vira
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {(20 * ph.multiplier).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {peakHours.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nenhum horário de pico configurado</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Tab de Taxas de Cancelamento
interface CancellationTabProps {
  cancellationFees: CancellationFee[];
  onUpdate: (
    index: number,
    field: keyof CancellationFee,
    value: number | boolean
  ) => void;
}

function CancellationTab({ cancellationFees, onUpdate }: CancellationTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Taxas de Cancelamento
        </h2>
        <p className="text-sm text-gray-600">
          Configure as penalidades por cancelamento de corridas
        </p>
      </div>

      <div className="grid gap-6">
        {cancellationFees.map((cf, index) => (
          <div
            key={cf.type}
            className="bg-gray-50 rounded-lg p-6 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Cancelamento por{" "}
                  {cf.type === "client" ? "Cliente" : "Motorista"}
                </h3>
                <p className="text-sm text-gray-500">
                  Taxa cobrada quando o{" "}
                  {cf.type === "client" ? "cliente" : "motorista"} cancela
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cf.enabled}
                  onChange={(e) => onUpdate(index, "enabled", e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {cf.enabled ? "Ativo" : "Inativo"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo Limite (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cf.timeLimit}
                  onChange={(e) =>
                    onUpdate(index, "timeLimit", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Taxa aplicada após aceitar a corrida
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Percentual da Corrida (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cf.feePercentage}
                  onChange={(e) =>
                    onUpdate(index, "feePercentage", parseInt(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  % do valor estimado da corrida
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa Mínima (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cf.minimumFee}
                  onChange={(e) =>
                    onUpdate(index, "minimumFee", parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor mínimo cobrado
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Exemplo:</strong> Corrida de R$ 30,00 cancelada após{" "}
                {cf.timeLimit} minutos = Taxa de R${" "}
                {Math.max((30 * cf.feePercentage) / 100, cf.minimumFee).toFixed(
                  2
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Tab de Configurações da Plataforma
interface PlatformSettingsTabProps {
  settings: PlatformSettings;
  onUpdate: (field: keyof PlatformSettings, value: number) => void;
}

function PlatformSettingsTab({ settings, onUpdate }: PlatformSettingsTabProps) {
  const [unlimitedDrivers, setUnlimitedDrivers] = useState(
    settings.maxDriversToNotify >= 100
  );
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(
    settings.autoAcceptRadius > 0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Configurações Gerais da Plataforma
        </h2>
        <p className="text-sm text-gray-600">
          Ajustes globais que afetam todo o sistema de matching
        </p>
      </div>

      <div className="grid gap-6">
        {/* Taxa da Plataforma */}
        <SettingCard
          title="Taxa da Plataforma"
          description="Percentual cobrado pela plataforma sobre cada corrida"
          icon={DollarSign}
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={settings.platformFeePercentage}
              onChange={(e) =>
                onUpdate("platformFeePercentage", parseFloat(e.target.value))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={settings.platformFeePercentage}
                onChange={(e) =>
                  onUpdate("platformFeePercentage", parseFloat(e.target.value))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
              />
              <span className="text-gray-700 font-medium">%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Exemplo: Corrida de R$ 100,00 = R${" "}
            {((settings.platformFeePercentage / 100) * 100).toFixed(2)} para a
            plataforma
          </p>
        </SettingCard>

        {/* Raio de Busca */}
        <SettingCard
          title="Raio de Busca de Motoristas"
          description="Distância máxima para procurar motoristas disponíveis"
          icon={TrendingUp}
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="1"
              max="50"
              value={settings.searchRadius}
              onChange={(e) =>
                onUpdate("searchRadius", parseInt(e.target.value))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="50"
                value={settings.searchRadius}
                onChange={(e) =>
                  onUpdate("searchRadius", parseInt(e.target.value))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
              />
              <span className="text-gray-700 font-medium">km</span>
            </div>
          </div>
        </SettingCard>

        {/* Tempo de Espera */}
        <SettingCard
          title="Tempo de Espera por Motorista"
          description="Segundos que cada motorista tem para aceitar a corrida"
          icon={Clock}
        >
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={settings.driverTimeoutSeconds}
              onChange={(e) =>
                onUpdate("driverTimeoutSeconds", parseInt(e.target.value))
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="120"
                step="5"
                value={settings.driverTimeoutSeconds}
                onChange={(e) =>
                  onUpdate("driverTimeoutSeconds", parseInt(e.target.value))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
              />
              <span className="text-gray-700 font-medium">seg</span>
            </div>
          </div>
        </SettingCard>

        {/* Máximo de Motoristas */}
        <SettingCard
          title="Máximo de Motoristas Notificados"
          description="Quantos motoristas recebem a notificação simultaneamente"
          icon={Settings}
        >
          <div className="space-y-4">
            {/* Toggle Ilimitado */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={unlimitedDrivers}
                onChange={(e) => {
                  const isUnlimited = e.target.checked;
                  setUnlimitedDrivers(isUnlimited);
                  if (isUnlimited) {
                    onUpdate("maxDriversToNotify", 999); // Valor alto para representar "ilimitado"
                  } else {
                    onUpdate("maxDriversToNotify", 5); // Volta para padrão
                  }
                }}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex items-center gap-2">
                <Infinity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  Notificar todos motoristas (ilimitado)
                </span>
              </div>
            </label>

            {/* Slider (apenas se não for ilimitado) */}
            {!unlimitedDrivers && (
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.maxDriversToNotify}
                  onChange={(e) =>
                    onUpdate("maxDriversToNotify", parseInt(e.target.value))
                  }
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxDriversToNotify}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (value >= 1 && value <= 100) {
                        onUpdate("maxDriversToNotify", value);
                      }
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                  />
                  <span className="text-gray-700 font-medium">
                    motorista{settings.maxDriversToNotify > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {/* Info */}
            <p className="text-xs text-gray-500">
              {unlimitedDrivers
                ? "⚠️ Todos os motoristas disponíveis no raio serão notificados. Pode causar sobrecarga em cidades grandes."
                : `${settings.maxDriversToNotify} motorista${
                    settings.maxDriversToNotify > 1 ? "s" : ""
                  } serão notificados por vez.`}
            </p>
          </div>
        </SettingCard>

        {/* Raio de Auto-aceitar */}
        <SettingCard
          title="Raio de Auto-aceitação"
          description="Permite que motoristas aceitem corridas automaticamente"
          icon={Check}
        >
          <div className="space-y-4">
            {/* Toggle Habilitar */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoAcceptEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setAutoAcceptEnabled(enabled);
                  if (!enabled) {
                    onUpdate("autoAcceptRadius", 0);
                  } else {
                    onUpdate("autoAcceptRadius", 2); // Padrão: 2km
                  }
                }}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">
                  Habilitar auto-aceitação de corridas
                </span>
              </div>
            </label>

            {/* Configurações (apenas se habilitado) */}
            {autoAcceptEnabled && (
              <>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={settings.autoAcceptRadius}
                    onChange={(e) =>
                      onUpdate("autoAcceptRadius", parseFloat(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={settings.autoAcceptRadius}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value >= 0.5 && value <= 10) {
                          onUpdate("autoAcceptRadius", value);
                        }
                      }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-gray-700 font-medium">km</span>
                  </div>
                </div>

                {/* Aviso importante */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-medium mb-1">Importante:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Motorista precisa ativar no app para usar</li>
                        <li>
                          Corridas dentro de {settings.autoAcceptRadius}km serão
                          aceitas automaticamente
                        </li>
                        <li>Motorista será notificado mesmo com auto-aceite</li>
                        <li>Pode recusar depois (com penalidade reduzida)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Info quando desabilitado */}
            {!autoAcceptEnabled && (
              <p className="text-xs text-gray-500">
                Quando habilitado, motoristas poderão optar por aceitar
                automaticamente corridas próximas.
              </p>
            )}
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

// Componente de Input de Preço (com formatação BRL)
interface PriceInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}

function PriceInput({
  label,
  value,
  onChange,
  prefix = "R$",
  suffix,
  hint,
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    const safeValue =
      typeof value === "number" && !Number.isNaN(value) ? value : 0;
    return safeValue.toFixed(2).replace(".", ",");
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Remove tudo exceto números e vírgula
    inputValue = inputValue.replace(/[^\d,]/g, "");

    // Permite apenas uma vírgula
    const parts = inputValue.split(",");
    if (parts.length > 2) {
      inputValue = parts[0] + "," + parts.slice(1).join("");
    }

    // Limita casas decimais a 2
    if (parts.length === 2 && parts[1].length > 2) {
      inputValue = parts[0] + "," + parts[1].substring(0, 2);
    }

    setDisplayValue(inputValue);

    // Converte para número
    const numValue = parseCurrency(inputValue);
    onChange(numValue);
  };

  const handleBlur = () => {
    // Formata ao perder o foco
    const safeValue =
      typeof value === "number" && !Number.isNaN(value) ? value : 0;
    const formatted = safeValue.toFixed(2).replace(".", ",");
    setDisplayValue(formatted);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
            {prefix}
          </span>
        )}
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="0,00"
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
            prefix ? "pl-12" : ""
          } ${suffix ? "pr-16" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// Componente de Card de Configuração
interface SettingCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function SettingCard({
  title,
  description,
  icon: Icon,
  children,
}: SettingCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
