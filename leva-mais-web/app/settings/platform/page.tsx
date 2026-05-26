"use client";

import { useEffect, useState } from "react";
import { Settings, Save, RefreshCw } from "lucide-react";
import {
  platformConfigService,
  PlatformConfig,
} from "@/services/platformConfigService";

type ConfigForm = Required<
  Pick<
    PlatformConfig,
    | "isDevelopmentMode"
    | "appFeePercentage"
    | "rideSearchTimeoutSeconds"
    | "driverDailyGoalRides"
    | "driverDailyBonusAmount"
    | "appTimeZone"
    | "suggestedMinPricePercent"
  >
> & {
  supportChannels: Required<NonNullable<PlatformConfig["supportChannels"]>>;
  policyVersions: Required<NonNullable<PlatformConfig["policyVersions"]>>;
  vehiclePricing: Required<NonNullable<PlatformConfig["vehiclePricing"]>>;
  logisticsMultipliers: Required<NonNullable<PlatformConfig["logisticsMultipliers"]>>;
};

const DEFAULT_FORM: ConfigForm = {
  isDevelopmentMode: true,
  appFeePercentage: 15,
  rideSearchTimeoutSeconds: 60,
  driverDailyGoalRides: 10,
  driverDailyBonusAmount: 20,
  appTimeZone: "America/Sao_Paulo",
  suggestedMinPricePercent: 0.8,
  vehiclePricing: {
    motorcycle: { minimumKm: 3, minimumFee: 7, pricePerKm: 0.99 },
    car: { minimumKm: 3, minimumFee: 8, pricePerKm: 2.5 },
    van: { minimumKm: 5, minimumFee: 20, pricePerKm: 4 },
    truck: { minimumKm: 5, minimumFee: 35, pricePerKm: 6 },
  },
  logisticsMultipliers: {
    priorityEconomic: 1.0,
    priorityFast: 1.3,
    priorityUrgent: 1.8,
    cargoSizeSmall: 1.0,
    cargoSizeMedium: 1.15,
    cargoSizeLarge: 1.4,
    fragileSurcharge: 1.1,
    helperSurcharge: 1.15,
    weightUpTo5kg: 1.0,
    weightUpTo15kg: 1.1,
    weightUpTo30kg: 1.25,
    weightUpTo50kg: 1.5,
    weightAbove50kg: 1.8,
  },
  supportChannels: {
    phone: "0800123456",
    email: "suporte@levamais.app",
    whatsapp: "5500000000000",
    helpCenterUrl: "",
  },
  policyVersions: {
    termsVersion: "2026-05-14",
    privacyPolicyVersion: "2026-05-14",
    consentVersion: "2026-05-14",
  },
};

function toForm(config: PlatformConfig | null | undefined): ConfigForm {
  return {
    isDevelopmentMode: Boolean(config?.isDevelopmentMode ?? true),
    appFeePercentage: Number(config?.appFeePercentage ?? 15),
    rideSearchTimeoutSeconds: Number(config?.rideSearchTimeoutSeconds ?? 60),
    driverDailyGoalRides: Number(config?.driverDailyGoalRides ?? 10),
    driverDailyBonusAmount: Number(config?.driverDailyBonusAmount ?? 20),
    appTimeZone: String(config?.appTimeZone ?? "America/Sao_Paulo"),
    suggestedMinPricePercent: Number(config?.suggestedMinPricePercent ?? 0.8),
    vehiclePricing: {
      motorcycle: {
        minimumKm: Number(config?.vehiclePricing?.motorcycle?.minimumKm ?? 3),
        minimumFee: Number(config?.vehiclePricing?.motorcycle?.minimumFee ?? 7),
        pricePerKm: Number(config?.vehiclePricing?.motorcycle?.pricePerKm ?? 0.99),
      },
      car: {
        minimumKm: Number(config?.vehiclePricing?.car?.minimumKm ?? 3),
        minimumFee: Number(config?.vehiclePricing?.car?.minimumFee ?? 8),
        pricePerKm: Number(config?.vehiclePricing?.car?.pricePerKm ?? 2.5),
      },
      van: {
        minimumKm: Number(config?.vehiclePricing?.van?.minimumKm ?? 5),
        minimumFee: Number(config?.vehiclePricing?.van?.minimumFee ?? 20),
        pricePerKm: Number(config?.vehiclePricing?.van?.pricePerKm ?? 4),
      },
      truck: {
        minimumKm: Number(config?.vehiclePricing?.truck?.minimumKm ?? 5),
        minimumFee: Number(config?.vehiclePricing?.truck?.minimumFee ?? 35),
        pricePerKm: Number(config?.vehiclePricing?.truck?.pricePerKm ?? 6),
      },
    },
    logisticsMultipliers: {
      priorityEconomic: Number(config?.logisticsMultipliers?.priorityEconomic ?? 1.0),
      priorityFast: Number(config?.logisticsMultipliers?.priorityFast ?? 1.3),
      priorityUrgent: Number(config?.logisticsMultipliers?.priorityUrgent ?? 1.8),
      cargoSizeSmall: Number(config?.logisticsMultipliers?.cargoSizeSmall ?? 1.0),
      cargoSizeMedium: Number(config?.logisticsMultipliers?.cargoSizeMedium ?? 1.15),
      cargoSizeLarge: Number(config?.logisticsMultipliers?.cargoSizeLarge ?? 1.4),
      fragileSurcharge: Number(config?.logisticsMultipliers?.fragileSurcharge ?? 1.1),
      helperSurcharge: Number(config?.logisticsMultipliers?.helperSurcharge ?? 1.15),
      weightUpTo5kg: Number(config?.logisticsMultipliers?.weightUpTo5kg ?? 1.0),
      weightUpTo15kg: Number(config?.logisticsMultipliers?.weightUpTo15kg ?? 1.1),
      weightUpTo30kg: Number(config?.logisticsMultipliers?.weightUpTo30kg ?? 1.25),
      weightUpTo50kg: Number(config?.logisticsMultipliers?.weightUpTo50kg ?? 1.5),
      weightAbove50kg: Number(config?.logisticsMultipliers?.weightAbove50kg ?? 1.8),
    },
    supportChannels: {
      phone: String(config?.supportChannels?.phone ?? DEFAULT_FORM.supportChannels.phone),
      email: String(config?.supportChannels?.email ?? DEFAULT_FORM.supportChannels.email),
      whatsapp: String(config?.supportChannels?.whatsapp ?? DEFAULT_FORM.supportChannels.whatsapp),
      helpCenterUrl: String(config?.supportChannels?.helpCenterUrl ?? ""),
    },
    policyVersions: {
      termsVersion: String(
        config?.policyVersions?.termsVersion ?? DEFAULT_FORM.policyVersions.termsVersion,
      ),
      privacyPolicyVersion: String(
        config?.policyVersions?.privacyPolicyVersion ??
          DEFAULT_FORM.policyVersions.privacyPolicyVersion,
      ),
      consentVersion: String(
        config?.policyVersions?.consentVersion ?? DEFAULT_FORM.policyVersions.consentVersion,
      ),
    },
  };
}

export default function PlatformSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ConfigForm>(DEFAULT_FORM);
  const [status, setStatus] = useState<string>("");

  const loadConfig = async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = await platformConfigService.get();
      setForm(toForm(data));
    } catch {
      setStatus("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    setStatus("");
    try {
      await platformConfigService.update({
        isDevelopmentMode: form.isDevelopmentMode,
        appFeePercentage: Number(form.appFeePercentage),
        rideSearchTimeoutSeconds: Number(form.rideSearchTimeoutSeconds),
        driverDailyGoalRides: Number(form.driverDailyGoalRides),
        driverDailyBonusAmount: Number(form.driverDailyBonusAmount),
        appTimeZone: form.appTimeZone,
        suggestedMinPricePercent: Number(form.suggestedMinPricePercent),
        vehiclePricing: form.vehiclePricing,
        logisticsMultipliers: form.logisticsMultipliers,
        supportChannels: form.supportChannels,
        policyVersions: form.policyVersions,
      });
      setStatus("Configurações salvas com sucesso.");
      window.dispatchEvent(new Event("platform-config-updated"));
    } catch {
      setStatus("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Configurações da Plataforma</h1>
              <p className="text-slate-600 text-sm">
                Controle central das regras de validação, taxa, despacho e metas do app.
              </p>
            </div>
          </div>
          <button
            onClick={loadConfig}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            <RefreshCw size={16} />
            Recarregar
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        {loading ? (
          <div className="text-slate-500">Carregando configurações...</div>
        ) : (
          <>
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Execução</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                  <span className="text-sm text-slate-700">Modo desenvolvimento (pula validações externas)</span>
                  <input
                    type="checkbox"
                    checked={form.isDevelopmentMode}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, isDevelopmentMode: e.target.checked }))
                    }
                  />
                </label>
                <label className="rounded-xl border border-slate-200 p-4">
                  <span className="text-sm text-slate-700 block mb-2">Timezone da aplicação</span>
                  <input
                    value={form.appTimeZone}
                    onChange={(e) => setForm((prev) => ({ ...prev, appTimeZone: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Operação</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldNumber
                  label="Taxa da plataforma (%)"
                  value={form.appFeePercentage}
                  onChange={(value) => setForm((prev) => ({ ...prev, appFeePercentage: value }))}
                />
                <FieldNumber
                  label="Timeout de busca (segundos)"
                  value={form.rideSearchTimeoutSeconds}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, rideSearchTimeoutSeconds: value }))
                  }
                />
                <FieldNumber
                  label="Meta diária de corridas"
                  value={form.driverDailyGoalRides}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, driverDailyGoalRides: value }))
                  }
                />
                <FieldNumber
                  label="Bônus diário (R$)"
                  value={form.driverDailyBonusAmount}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, driverDailyBonusAmount: value }))
                  }
                />
                <FieldNumber
                  label="Percentual mínimo sugerido"
                  value={form.suggestedMinPricePercent}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, suggestedMinPricePercent: value }))
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Pricing por veículo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["motorcycle", "car", "van", "truck"] as const).map((vehicle) => (
                  <div key={vehicle} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <h3 className="font-semibold text-slate-800 uppercase text-sm">{vehicle}</h3>
                    <FieldNumber
                      label="KM mínimo"
                      value={Number(form.vehiclePricing[vehicle]?.minimumKm || 0)}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          vehiclePricing: {
                            ...prev.vehiclePricing,
                            [vehicle]: { ...prev.vehiclePricing[vehicle], minimumKm: value },
                          },
                        }))
                      }
                    />
                    <FieldNumber
                      label="Taxa mínima (R$)"
                      value={Number(form.vehiclePricing[vehicle]?.minimumFee || 0)}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          vehiclePricing: {
                            ...prev.vehiclePricing,
                            [vehicle]: { ...prev.vehiclePricing[vehicle], minimumFee: value },
                          },
                        }))
                      }
                    />
                    <FieldNumber
                      label="Preço por KM (R$)"
                      value={Number(form.vehiclePricing[vehicle]?.pricePerKm || 0)}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          vehiclePricing: {
                            ...prev.vehiclePricing,
                            [vehicle]: { ...prev.vehiclePricing[vehicle], pricePerKm: value },
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Multiplicadores da logística</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(
                  [
                    "priorityEconomic",
                    "priorityFast",
                    "priorityUrgent",
                    "cargoSizeSmall",
                    "cargoSizeMedium",
                    "cargoSizeLarge",
                    "fragileSurcharge",
                    "helperSurcharge",
                    "weightUpTo5kg",
                    "weightUpTo15kg",
                    "weightUpTo30kg",
                    "weightUpTo50kg",
                    "weightAbove50kg",
                  ] as const
                ).map((key) => (
                  <FieldNumber
                    key={key}
                    label={key}
                    value={Number(form.logisticsMultipliers[key] || 0)}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        logisticsMultipliers: {
                          ...prev.logisticsMultipliers,
                          [key]: value,
                        },
                      }))
                    }
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Suporte</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldText
                  label="Telefone"
                  value={form.supportChannels.phone}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      supportChannels: { ...prev.supportChannels, phone: value },
                    }))
                  }
                />
                <FieldText
                  label="Email"
                  value={form.supportChannels.email}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      supportChannels: { ...prev.supportChannels, email: value },
                    }))
                  }
                />
                <FieldText
                  label="WhatsApp"
                  value={form.supportChannels.whatsapp}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      supportChannels: { ...prev.supportChannels, whatsapp: value },
                    }))
                  }
                />
                <FieldText
                  label="URL Central de Ajuda"
                  value={form.supportChannels.helpCenterUrl}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      supportChannels: { ...prev.supportChannels, helpCenterUrl: value },
                    }))
                  }
                />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Versões de políticas</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FieldText
                  label="Termos"
                  value={form.policyVersions.termsVersion}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      policyVersions: { ...prev.policyVersions, termsVersion: value },
                    }))
                  }
                />
                <FieldText
                  label="Privacidade"
                  value={form.policyVersions.privacyPolicyVersion}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      policyVersions: {
                        ...prev.policyVersions,
                        privacyPolicyVersion: value,
                      },
                    }))
                  }
                />
                <FieldText
                  label="Consentimento"
                  value={form.policyVersions.consentVersion}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      policyVersions: { ...prev.policyVersions, consentVersion: value },
                    }))
                  }
                />
              </div>
            </section>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-slate-600">{status}</span>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Salvando..." : "Salvar Configurações"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FieldNumber({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="rounded-xl border border-slate-200 p-4">
      <span className="text-sm text-slate-700 block mb-2">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-slate-200 px-3 py-2"
      />
    </label>
  );
}

function FieldText({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-xl border border-slate-200 p-4">
      <span className="text-sm text-slate-700 block mb-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2"
      />
    </label>
  );
}
