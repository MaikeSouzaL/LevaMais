"use client";

import { useEffect, useMemo, useState } from "react";
import { DollarSign, Save, RefreshCw, Trash2, MapPin, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import {
  pricingRulesService,
  PricingRule,
  PricingModel,
  ServiceType,
  VehicleCategory,
  VEHICLE_CATEGORIES,
  VEHICLE_LABELS,
  emptyModel,
  cityKey,
} from "@/services/pricingRulesService";
import { FieldNumber } from "@/components/settings/FormFields";

const GLOBAL_KEY = "__global__";
const NEW_KEY = "__new__";

type VehicleForm = {
  id?: string;
  active: boolean;
  pricing: PricingModel;
};

type FormState = Record<VehicleCategory, VehicleForm>;

function buildForms(
  rules: PricingRule[],
  serviceType: ServiceType,
  city: string | null,
): FormState {
  const target = cityKey(city);
  const state = {} as FormState;
  for (const vehicle of VEHICLE_CATEGORIES) {
    const match = rules.find(
      (r) =>
        r.serviceType === serviceType &&
        r.vehicleCategory === vehicle &&
        cityKey(r.city) === target,
    );
    state[vehicle] = match
      ? { id: match.id, active: match.active, pricing: { ...match.pricing } }
      : { active: false, pricing: emptyModel() };
  }
  return state;
}

/** Preview do total com a fórmula usada pelo app (difere entre entrega e corrida). */
function previewTotal(
  p: PricingModel,
  distanceKm: number,
  serviceType: ServiceType,
  stops = 0,
): number {
  const billableKm = Math.max(0, distanceKm - p.includedKm);
  if (serviceType === "delivery") {
    // Entrega: mínimo + km extra + paradas (sem taxa base / sem minuto)
    return Number((p.minFare + billableKm * p.pricePerKm + stops * p.perStopFee).toFixed(2));
  }
  // Corrida: máx(mínimo, taxa base + km extra + paradas)
  const subtotal = p.baseFare + billableKm * p.pricePerKm + stops * p.perStopFee;
  return Number(Math.max(p.minFare, subtotal).toFixed(2));
}

export default function PricingRulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [activeCities, setActiveCities] = useState<{ city: string; clients: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const [serviceType, setServiceType] = useState<ServiceType>("delivery");
  const [citySel, setCitySel] = useState<string>(GLOBAL_KEY); // GLOBAL_KEY | NEW_KEY | cidade
  const [newCity, setNewCity] = useState("");
  const [forms, setForms] = useState<FormState>(() => buildForms([], "delivery", null));
  const [previewKm, setPreviewKm] = useState(10);

  const currentCity: string | null = useMemo(() => {
    if (citySel === GLOBAL_KEY) return null;
    if (citySel === NEW_KEY) return newCity.trim() || null;
    return citySel;
  }, [citySel, newCity]);

  // Cidades que já têm regra para o serviço selecionado (para sinalizar lacunas).
  const configuredKeys = useMemo(() => {
    const s = new Set<string>();
    for (const r of rules) if (r.serviceType === serviceType && r.city) s.add(cityKey(r.city));
    return s;
  }, [rules, serviceType]);

  // Opções do select: une cidades com regra + cidades onde há clientes cadastrados.
  const cityOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cities) map.set(cityKey(c), c);
    for (const a of activeCities) {
      if (a.city && a.city !== "(sem cidade)") map.set(cityKey(a.city), a.city.trim());
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [cities, activeCities]);

  const load = async () => {
    setLoading(true);
    setStatus("");
    try {
      const list = await pricingRulesService.list();
      setRules(list);
      setCities(
        Array.from(
          new Map(
            list.filter((r) => r.city).map((r) => [cityKey(r.city), r.city!.trim()]),
          ).values(),
        ).sort((a, b) => a.localeCompare(b)),
      );
    } catch {
      setStatus("Erro ao carregar regras de preço. Verifique se você é admin.");
    } finally {
      setLoading(false);
    }

    try {
      setActiveCities(await pricingRulesService.activeCities());
    } catch {
      setActiveCities([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Reconstroi os formulários quando muda serviço/cidade/regras.
  // Não depende de `newCity` para não resetar os campos a cada tecla digitada.
  useEffect(() => {
    const city =
      citySel === GLOBAL_KEY ? null : citySel === NEW_KEY ? newCity.trim() || null : citySel;
    setForms(buildForms(rules, serviceType, city));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, citySel, rules]);

  const setField = (
    vehicle: VehicleCategory,
    key: keyof PricingModel,
    value: number,
  ) => {
    setForms((prev) => ({
      ...prev,
      [vehicle]: { ...prev[vehicle], pricing: { ...prev[vehicle].pricing, [key]: value } },
    }));
  };

  const setActive = (vehicle: VehicleCategory, active: boolean) => {
    setForms((prev) => ({ ...prev, [vehicle]: { ...prev[vehicle], active } }));
  };

  const handleSave = async () => {
    if (citySel === NEW_KEY && !newCity.trim()) {
      setStatus("Informe o nome da nova cidade.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      for (const vehicle of VEHICLE_CATEGORIES) {
        const f = forms[vehicle];
        const hasValues = Object.values(f.pricing).some((v) => Number(v) > 0);
        // Só persiste veículos relevantes: ativos, já existentes, ou com algum valor.
        if (!f.active && !f.id && !hasValues) continue;
        // Entrega não usa taxa base nem preço por minuto — grava zerado.
        const pricing =
          serviceType === "delivery"
            ? { ...f.pricing, baseFare: 0, pricePerMinute: 0 }
            : f.pricing;
        await pricingRulesService.upsertRule({
          serviceType,
          vehicleCategory: vehicle,
          city: currentCity,
          pricing,
          active: f.active,
        });
      }
      setStatus("Tabela de preços salva com sucesso.");
      if (citySel === NEW_KEY && newCity.trim()) {
        const saved = newCity.trim();
        await load();
        setCitySel(saved);
      } else {
        await load();
      }
    } catch (e: any) {
      setStatus("Erro ao salvar: " + (e?.message || "tente novamente."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicle: VehicleCategory) => {
    const f = forms[vehicle];
    if (!f.id) {
      // Sem registro no banco — apenas limpa o formulário local
      setForms((prev) => ({ ...prev, [vehicle]: { active: false, pricing: emptyModel() } }));
      return;
    }
    if (!confirm(`Remover a regra de ${VEHICLE_LABELS[vehicle]} desta cidade?`)) return;
    try {
      await pricingRulesService.remove(f.id);
      await load();
    } catch (e: any) {
      setStatus("Erro ao remover: " + (e?.message || "tente novamente."));
    }
  };

  const cityTitle =
    citySel === GLOBAL_KEY
      ? "Global (padrão)"
      : citySel === NEW_KEY
        ? newCity.trim() || "Nova cidade"
        : citySel;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tabela de Preços por Cidade</h1>
              <p className="text-slate-600 text-sm">
                Defina o preço de corrida e entrega por veículo em cada cidade. O app usa a
                regra da cidade do cliente; sem regra da cidade, usa a regra global.
              </p>
            </div>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            disabled={loading}
          >
            <RefreshCw size={16} />
            Recarregar
          </button>
        </div>
      </div>

      {/* Cidades onde o app está ativo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Building2 size={18} className="text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Cidades onde o app está ativo</h2>
          <span className="text-xs text-slate-400">
            (clientes cadastrados · {serviceType === "delivery" ? "entrega" : "corrida"})
          </span>
        </div>
        {activeCities.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum cliente cadastrado ainda, ou você não tem permissão de admin.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeCities.map((c) => {
              const isReal = c.city !== "(sem cidade)";
              const configured = isReal && configuredKeys.has(cityKey(c.city));
              return (
                <button
                  key={c.city}
                  disabled={!isReal}
                  onClick={() => isReal && setCitySel(c.city)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                    !isReal
                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-default"
                      : configured
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                  title={
                    !isReal
                      ? "Clientes sem cidade definida"
                      : configured
                        ? "Preços configurados — clique para editar"
                        : "Sem tabela de preço — clique para configurar"
                  }
                >
                  {isReal &&
                    (configured ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-600" />
                    ))}
                  <span className="font-semibold">{c.city}</span>
                  <span className="text-xs opacity-70">{c.clients}</span>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[11px] text-slate-400">
          Verde = já tem tabela de preço para {serviceType === "delivery" ? "entrega" : "corrida"}.
          Âmbar = falta configurar. Clique para editar a cidade.
        </p>
      </div>

      {/* Seletores */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Serviço */}
          <div className="rounded-xl border border-slate-200 p-4">
            <span className="text-sm text-slate-700 block mb-2">Tipo de serviço</span>
            <div className="flex gap-2">
              {(["delivery", "ride"] as ServiceType[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setServiceType(st)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    serviceType === st
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {st === "delivery" ? "Entrega" : "Corrida"}
                </button>
              ))}
            </div>
          </div>

          {/* Cidade */}
          <div className="rounded-xl border border-slate-200 p-4">
            <span className="text-sm text-slate-700 block mb-2">Cidade</span>
            <select
              value={citySel}
              onChange={(e) => setCitySel(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
            >
              <option value={GLOBAL_KEY}>🌐 Global (padrão)</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                  {configuredKeys.has(cityKey(c)) ? "" : " · sem preço"}
                </option>
              ))}
              <option value={NEW_KEY}>＋ Nova cidade…</option>
            </select>
          </div>

          {/* Nome da nova cidade */}
          <div className="rounded-xl border border-slate-200 p-4">
            <span className="text-sm text-slate-700 block mb-2">Nome da cidade</span>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <MapPin size={16} className="text-slate-400" />
              <input
                value={citySel === NEW_KEY ? newCity : citySel === GLOBAL_KEY ? "" : citySel}
                onChange={(e) => {
                  setCitySel(NEW_KEY);
                  setNewCity(e.target.value);
                }}
                placeholder="Ex.: Pimenta Bueno"
                disabled={citySel === GLOBAL_KEY}
                className="flex-1 outline-none text-sm disabled:bg-transparent disabled:text-slate-400"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Deve bater com a cidade no perfil do cliente.
            </p>
          </div>
        </div>

        {/* Preview de distância */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-slate-600">Pré-visualizar total para</span>
          <input
            type="number"
            value={previewKm}
            onChange={(e) => setPreviewKm(Number(e.target.value))}
            className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <span className="text-sm text-slate-600">km (0 paradas)</span>
        </div>
      </div>

      {/* Cards por veículo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {serviceType === "delivery" ? "Entrega" : "Corrida"} · {cityTitle}
          </h2>
        </div>

        {loading ? (
          <div className="text-slate-500">Carregando regras…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VEHICLE_CATEGORIES.map((vehicle) => {
              const f = forms[vehicle];
              const total = previewTotal(f.pricing, previewKm, serviceType);
              return (
                <div
                  key={vehicle}
                  className={`rounded-xl border p-4 space-y-3 ${
                    f.active ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">{VEHICLE_LABELS[vehicle]}</h3>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={f.active}
                          onChange={(e) => setActive(vehicle, e.target.checked)}
                        />
                        Ativo
                      </label>
                      <button
                        onClick={() => handleDelete(vehicle)}
                        title="Remover regra"
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FieldNumber
                      label="Preço mínimo (R$)"
                      value={f.pricing.minFare}
                      onChange={(v) => setField(vehicle, "minFare", v)}
                    />
                    <FieldNumber
                      label="Km inclusos"
                      value={f.pricing.includedKm}
                      onChange={(v) => setField(vehicle, "includedKm", v)}
                    />
                    <FieldNumber
                      label="Preço por km extra (R$)"
                      value={f.pricing.pricePerKm}
                      onChange={(v) => setField(vehicle, "pricePerKm", v)}
                    />
                    <FieldNumber
                      label="Taxa por parada (R$)"
                      value={f.pricing.perStopFee}
                      onChange={(v) => setField(vehicle, "perStopFee", v)}
                    />
                    {/* Taxa base e Preço por minuto são exclusivos de corrida. */}
                    {serviceType === "ride" && (
                      <>
                        <FieldNumber
                          label="Taxa base (R$)"
                          value={f.pricing.baseFare}
                          onChange={(v) => setField(vehicle, "baseFare", v)}
                        />
                        <FieldNumber
                          label="Preço por minuto (R$)"
                          value={f.pricing.pricePerMinute}
                          onChange={(v) => setField(vehicle, "pricePerMinute", v)}
                        />
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-500">
                      {previewKm} km →{" "}
                      <span className="text-slate-400">
                        {serviceType === "delivery"
                          ? `${f.pricing.minFare} + ${Math.max(0, previewKm - f.pricing.includedKm)}×${f.pricing.pricePerKm}`
                          : `máx(${f.pricing.minFare}; ${f.pricing.baseFare} + ${Math.max(0, previewKm - f.pricing.includedKm)}×${f.pricing.pricePerKm})`}
                      </span>
                    </span>
                    <span className="font-bold text-emerald-600">
                      R$ {total.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{status}</span>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Salvando…" : "Salvar tabela de preços"}
        </button>
      </div>
    </div>
  );
}
