"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeOff, PackagePlus, RefreshCcw, Save } from "lucide-react";
import { money, statusLabel } from "@/lib/formatters";
import { apiMessage } from "@/services/apiClient";
import {
  createProduct,
  disableProduct,
  getPartnerMe,
  listProducts,
  updateProduct,
} from "@/services/partnerPortalService";
import type { Store, StoreProduct, ProductModifierGroup } from "@/types";

function parseModifierGroups(value: string): ProductModifierGroup[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, minText, maxText, optionsText = ""] = line.split("|");
      return {
        name: name.trim(),
        min: Number(minText || 0),
        max: Number(maxText || 1),
        options: optionsText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((item) => {
            const [optionName, priceText] = item.split(":");
            return {
              name: optionName.trim(),
              priceDelta: Number(priceText || 0),
              available: true,
            };
          }),
      };
    });
}

export default function CatalogPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [storeId, setStoreId] = useState("");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState(0);
  const [unit, setUnit] = useState("unit");
  const [available, setAvailable] = useState(true);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [modifierText, setModifierText] = useState("");

  const selectedStore = useMemo(
    () => stores.find((item) => item._id === storeId) || stores[0],
    [stores, storeId],
  );

  async function loadStores() {
    setLoading(true);
    setError("");
    try {
      const me = await getPartnerMe();
      setStores(me.stores);
      if (me.stores[0]) setStoreId(me.stores[0]._id);
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel carregar lojas"));
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts(id: string) {
    if (!id) return;
    setError("");
    try {
      setProducts(await listProducts(id));
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel carregar catalogo"));
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const me = await getPartnerMe();
        if (cancelled) return;
        setStores(me.stores);
        if (me.stores[0]) setStoreId(me.stores[0]._id);
      } catch (err) {
        if (!cancelled) setError(apiMessage(err, "Nao foi possivel carregar lojas"));
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
        const loaded = await listProducts(selectedStore._id);
        if (!cancelled) setProducts(loaded);
      } catch (err) {
        if (!cancelled) setError(apiMessage(err, "Nao foi possivel carregar catalogo"));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedStore?._id]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStore) return;
    setMessage("");
    setError("");
    try {
      await createProduct(selectedStore._id, {
        name,
        description,
        basePrice,
        unit: unit as StoreProduct["unit"],
        available,
        requiresConfirmation,
        modifierGroups: parseModifierGroups(modifierText),
      });
      setName("");
      setDescription("");
      setBasePrice(0);
      setModifierText("");
      await loadProducts(selectedStore._id);
      setMessage("Produto criado");
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel criar produto"));
    }
  }

  async function toggleProduct(product: StoreProduct) {
    if (!selectedStore) return;
    setError("");
    try {
      await updateProduct(product._id, { available: !product.available });
      await loadProducts(selectedStore._id);
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel atualizar produto"));
    }
  }

  async function hideProduct(product: StoreProduct) {
    if (!selectedStore) return;
    setError("");
    try {
      await disableProduct(product._id);
      await loadProducts(selectedStore._id);
      setMessage("Produto desativado");
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel desativar produto"));
    }
  }

  if (loading) return <p className="text-sm text-[#677084]">Carregando catalogo...</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Catalogo</h1>
          <p className="text-sm text-[#677084]">Produtos, servicos, adicionais e disponibilidade</p>
        </div>
        <button
          type="button"
          onClick={loadStores}
          className="inline-flex items-center gap-2 rounded-md border border-[#d7dce5] bg-white px-3 py-2 text-sm hover:bg-[#f1f4f8]"
          title="Atualizar"
        >
          <RefreshCcw size={16} />
          Atualizar
        </button>
      </div>

      {error ? <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#991b1b]">{error}</div> : null}
      {message ? <div className="rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm text-[#166534]">{message}</div> : null}

      {!stores.length ? (
        <div className="rounded-md border border-[#dfe4ec] bg-white p-4 text-sm text-[#677084]">
          Nenhuma loja vinculada. Cadastre e aprove pelo dashboard admin.
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <form onSubmit={submit} className="rounded-md border border-[#dfe4ec] bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <PackagePlus size={18} />
              <h2 className="text-sm font-semibold">Novo item</h2>
            </div>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Loja</span>
                <select className="field" value={selectedStore?._id || ""} onChange={(event) => setStoreId(event.target.value)}>
                  {stores.map((store) => (
                    <option key={store._id} value={store._id}>{store.name}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Nome</span>
                <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Descricao</span>
                <textarea className="field min-h-20" value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 block text-[#435066]">Preco</span>
                  <input className="field" type="number" min={0} step="0.01" value={basePrice} onChange={(event) => setBasePrice(Number(event.target.value))} required />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-[#435066]">Unidade</span>
                  <select className="field" value={unit} onChange={(event) => setUnit(event.target.value)}>
                    <option value="unit">Unidade</option>
                    <option value="kg">Kg</option>
                    <option value="g">G</option>
                    <option value="l">L</option>
                    <option value="ml">Ml</option>
                    <option value="service">Servico</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-[#435066]">Adicionais</span>
                <textarea className="field min-h-24 font-mono text-xs" value={modifierText} onChange={(event) => setModifierText(event.target.value)} placeholder="Tamanho|1|1|Pequeno:0,Grande:8" />
              </label>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} />
                  Disponivel
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={requiresConfirmation} onChange={(event) => setRequiresConfirmation(event.target.checked)} />
                  Confirmar item
                </label>
              </div>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white">
                <Save size={16} />
                Salvar item
              </button>
            </div>
          </form>

          <section className="rounded-md border border-[#dfe4ec] bg-white">
            <div className="border-b border-[#e6eaf0] px-4 py-3">
              <h2 className="text-sm font-semibold">{selectedStore?.name}</h2>
              <p className="text-xs text-[#677084]">{statusLabel(selectedStore?.status)}</p>
            </div>
            <div className="divide-y divide-[#eef1f5]">
              {products.length === 0 ? (
                <p className="p-4 text-sm text-[#677084]">Nenhum item cadastrado.</p>
              ) : products.map((product) => (
                <div key={product._id} className="grid gap-3 p-4 md:grid-cols-[1fr_120px_150px] md:items-center">
                  <div>
                    <p className="text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-sm text-[#677084]">{product.description || "Sem descricao"}</p>
                    <p className="mt-2 text-xs text-[#677084]">
                      {(product.modifierGroups || []).length} grupos de adicionais
                    </p>
                  </div>
                  <div className="text-sm font-semibold">{money(product.basePrice)}</div>
                  <div className="flex gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className="inline-flex items-center gap-2 rounded-md border border-[#d7dce5] px-3 py-2 text-sm hover:bg-[#f1f4f8]"
                    >
                      {product.available ? "Pausar" : "Ativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => hideProduct(product)}
                      className="inline-flex items-center gap-2 rounded-md border border-[#fecaca] px-3 py-2 text-sm text-[#991b1b] hover:bg-[#fff1f2]"
                      title="Desativar"
                    >
                      <EyeOff size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
