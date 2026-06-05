"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Save } from "lucide-react";
import { apiMessage } from "@/services/apiClient";
import { getPartnerMe, getStore, updateAvailability, updateStore } from "@/services/partnerPortalService";
import { statusLabel, weekdayLabel } from "@/lib/formatters";
import type { Partner, Readiness, Store, StoreHour } from "@/types";

function hoursToText(hours: StoreHour[] = []) {
  return hours.map((hour) => `${hour.weekday} ${hour.open} ${hour.close}`).join("\n");
}

function textToHours(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [weekday, open, close] = line.split(/\s+/);
      return { weekday: Number(weekday), open, close };
    });
}

export default function DashboardPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(25);
  const [minOrderValue, setMinOrderValue] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState("platform");
  const [override, setOverride] = useState("auto");
  const [tags, setTags] = useState("");
  const [hoursText, setHoursText] = useState("");

  const selectedStore = useMemo(
    () => stores.find((item) => item._id === storeId) || stores[0],
    [stores, storeId],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const me = await getPartnerMe();
      setPartner(me.partner);
      setStores(me.stores);
      const firstStore = me.stores[0];
      if (firstStore) setStoreId(firstStore._id);
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel carregar o portal"));
    } finally {
      setLoading(false);
    }
  }

  async function loadStore(id: string) {
    if (!id) return;
    try {
      const result = await getStore(id);
      setStore(result.store);
      setReadiness(result.readiness);
      setDescription(result.store.description || "");
      setPrepTimeMinutes(result.store.prepTimeMinutes || 25);
      setMinOrderValue(result.store.minOrderValue || 0);
      setDeliveryMode(result.store.deliveryMode || "platform");
      setOverride(result.store.isOpenManualOverride || "auto");
      setTags((result.store.tags || []).join(", "));
      setHoursText(hoursToText(result.store.hours || []));
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel carregar a loja"));
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const me = await getPartnerMe();
        if (cancelled) return;
        setPartner(me.partner);
        setStores(me.stores);
        const firstStore = me.stores[0];
        if (firstStore) setStoreId(firstStore._id);
      } catch (err) {
        if (!cancelled) setError(apiMessage(err, "Nao foi possivel carregar o portal"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedStore?._id) return;
    let cancelled = false;
    async function run() {
      try {
        const result = await getStore(selectedStore._id);
        if (cancelled) return;
        setStore(result.store);
        setReadiness(result.readiness);
        setDescription(result.store.description || "");
        setPrepTimeMinutes(result.store.prepTimeMinutes || 25);
        setMinOrderValue(result.store.minOrderValue || 0);
        setDeliveryMode(result.store.deliveryMode || "platform");
        setOverride(result.store.isOpenManualOverride || "auto");
        setTags((result.store.tags || []).join(", "));
        setHoursText(hoursToText(result.store.hours || []));
      } catch (err) {
        if (!cancelled) setError(apiMessage(err, "Nao foi possivel carregar a loja"));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedStore?._id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!store) return;
    setMessage("");
    setError("");
    try {
      await updateStore(store._id, {
        description,
        prepTimeMinutes,
        minOrderValue,
        deliveryMode,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        hours: textToHours(hoursText),
      });
      await updateAvailability(store._id, override);
      await loadStore(store._id);
      setMessage("Loja atualizada");
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel salvar a loja"));
    }
  }

  if (loading) {
    return <p className="text-sm text-[#677084]">Carregando portal...</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Operacao da loja</h1>
          <p className="text-sm text-[#677084]">{partner?.tradeName || "Parceiro"}</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-md border border-[#d7dce5] bg-white px-3 py-2 text-sm hover:bg-[#f1f4f8]"
          title="Atualizar"
        >
          <RefreshCcw size={16} />
          Atualizar
        </button>
      </div>

      {error ? <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#991b1b]">{error}</div> : null}
      {message ? <div className="rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm text-[#166534]">{message}</div> : null}

      <section className="grid gap-3 md:grid-cols-4">
        {[
          ["Parceiro", statusLabel(partner?.status)],
          ["KYC", statusLabel(partner?.kyc?.status)],
          ["Loja", statusLabel(store?.status)],
          ["Venda", readiness?.canSell ? "Liberada" : "Bloqueada"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-[#dfe4ec] bg-white p-4">
            <p className="text-xs text-[#677084]">{label}</p>
            <p className="mt-1 text-sm font-semibold">{value}</p>
          </div>
        ))}
      </section>

      {!stores.length ? (
        <div className="rounded-md border border-[#dfe4ec] bg-white p-4 text-sm text-[#677084]">
          Nenhuma loja vinculada. Cadastre e aprove pelo dashboard admin.
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-md border border-[#dfe4ec] bg-white p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-[#435066]">Loja</span>
              <select className="field" value={selectedStore?._id || ""} onChange={(event) => setStoreId(event.target.value)}>
                {stores.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </label>
            {readiness?.reason ? <p className="mt-3 text-sm text-[#b45309]">{readiness.reason}</p> : null}
          </aside>

          <section className="rounded-md border border-[#dfe4ec] bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block text-[#435066]">Descricao</span>
                <textarea className="field min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Preparo em minutos</span>
                <input className="field" type="number" min={0} value={prepTimeMinutes} onChange={(event) => setPrepTimeMinutes(Number(event.target.value))} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Pedido minimo</span>
                <input className="field" type="number" min={0} step="0.01" value={minOrderValue} onChange={(event) => setMinOrderValue(Number(event.target.value))} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Modo de entrega</span>
                <select className="field" value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value)}>
                  <option value="platform">Entrega Leva Mais</option>
                  <option value="pickup">Retirada</option>
                  <option value="both">Entrega e retirada</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Disponibilidade</span>
                <select className="field" value={override} onChange={(event) => setOverride(event.target.value)}>
                  <option value="auto">Automatica por horario</option>
                  <option value="force_open">Aberta manualmente</option>
                  <option value="force_closed">Fechada manualmente</option>
                </select>
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block text-[#435066]">Tags</span>
                <input className="field" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="pizza, almoco, farmacia" />
              </label>
              <label className="block text-sm md:col-span-2">
                <span className="mb-1 block text-[#435066]">Horarios</span>
                <textarea className="field min-h-36 font-mono text-xs" value={hoursText} onChange={(event) => setHoursText(event.target.value)} placeholder="1 08:00 18:00" />
              </label>
            </div>
            <div className="mt-3 text-xs text-[#677084]">
              {store?.hours?.map((hour) => `${weekdayLabel(hour.weekday)} ${hour.open}-${hour.close}`).join(" | ")}
            </div>
            <div className="mt-5 flex justify-end">
              <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white">
                <Save size={16} />
                Salvar operacao
              </button>
            </div>
          </section>
        </form>
      )}
    </div>
  );
}
