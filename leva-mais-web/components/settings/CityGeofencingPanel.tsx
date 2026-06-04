"use client";

import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { citiesService, City, CityPayload } from "@/services/citiesService";

const EMPTY_FORM = {
  name: "",
  state: "",
  stateCode: "",
  latitude: "",
  longitude: "",
  radiusKm: "50",
  defaultVehicleType: "car" as CityPayload["defaultVehicleType"],
  isActive: true,
};

function toForm(city: City) {
  return {
    name: city.name || "",
    state: city.state || "",
    stateCode: city.stateCode || "",
    latitude: String(city.center?.latitude ?? ""),
    longitude: String(city.center?.longitude ?? ""),
    radiusKm: String(city.radiusKm ?? 50),
    defaultVehicleType: city.defaultVehicleType || "car",
    isActive: city.isActive !== false,
  };
}

function toPayload(form: typeof EMPTY_FORM): CityPayload {
  return {
    name: form.name.trim(),
    state: form.state.trim(),
    stateCode: form.stateCode.trim().toUpperCase(),
    isActive: form.isActive,
    center: {
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    },
    radiusKm: Number(form.radiusKm),
    defaultVehicleType: form.defaultVehicleType,
  };
}

export function CityGeofencingPanel() {
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const loadCities = async () => {
    setLoading(true);
    setStatus("");
    try {
      setCities(await citiesService.list(true));
    } catch {
      setStatus("Erro ao carregar cidades.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const saveCity = async () => {
    setSaving(true);
    setStatus("");
    try {
      const payload = toPayload(form);
      if (editingId) {
        await citiesService.update(editingId, payload);
        setStatus("Cidade atualizada.");
      } else {
        await citiesService.create(payload);
        setStatus("Cidade criada.");
      }
      resetForm();
      await loadCities();
    } catch (error: any) {
      setStatus(error?.response?.data?.message || "Erro ao salvar cidade.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateCity = async (id: string) => {
    setStatus("");
    try {
      await citiesService.deactivate(id);
      await loadCities();
      setStatus("Cidade desativada.");
    } catch {
      setStatus("Erro ao desativar cidade.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Cidades atendidas</h2>
          <p className="text-sm text-slate-500">
            O geofencing usa o centro e o raio das cidades ativas para aceitar ou bloquear pedidos.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCities}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          disabled={loading}
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Cidade" value={form.name} onChange={(name) => setForm((prev) => ({ ...prev, name }))} />
          <Field label="Estado" value={form.state} onChange={(state) => setForm((prev) => ({ ...prev, state }))} />
          <Field label="UF" value={form.stateCode} onChange={(stateCode) => setForm((prev) => ({ ...prev, stateCode }))} />
          <Field label="Latitude" type="number" value={form.latitude} onChange={(latitude) => setForm((prev) => ({ ...prev, latitude }))} />
          <Field label="Longitude" type="number" value={form.longitude} onChange={(longitude) => setForm((prev) => ({ ...prev, longitude }))} />
          <Field label="Raio (km)" type="number" value={form.radiusKm} onChange={(radiusKm) => setForm((prev) => ({ ...prev, radiusKm }))} />
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Cidade ativa
          </label>
          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar edição
              </button>
            )}
            <button
              type="button"
              onClick={saveCity}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              <Plus size={14} />
              {editingId ? "Salvar cidade" : "Adicionar cidade"}
            </button>
          </div>
        </div>
      </div>

      {status && <p className="text-sm font-semibold text-slate-600">{status}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cities.map((city) => (
          <div key={city._id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">{city.name}</h3>
                <p className="text-xs text-slate-500">
                  {[city.state, city.stateCode].filter(Boolean).join(" - ") || "Sem estado"}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${city.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {city.isActive ? "ATIVA" : "INATIVA"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
              <MapPin size={14} />
              <span>
                {city.center?.latitude ?? "-"}, {city.center?.longitude ?? "-"} · {city.radiusKm ?? 50} km
              </span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingId(city._id);
                  setForm(toForm(city));
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil size={13} />
                Editar
              </button>
              {city.isActive && (
                <button
                  type="button"
                  onClick={() => deactivateCity(city._id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 size={13} />
                  Desativar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label>
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
    </label>
  );
}
