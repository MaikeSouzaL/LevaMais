"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, PauseCircle, RefreshCw, Search, ShieldCheck, Store, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  marketplaceAdminService,
  type CategoryItem,
  type PartnerItem,
  type PartnerStatus,
  type StoreItem,
} from "@/services/marketplaceAdminService";

const partnerStatusLabels: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  under_review: "Em análise",
  blocked: "Bloqueado",
};

const kycLabels: Record<string, string> = {
  none: "Não enviado",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

function ownerLabel(partner: PartnerItem) {
  const owner = partner.ownerUserId;
  if (!owner || typeof owner === "string") return String(owner || "-");
  return owner.name || owner.email || owner._id;
}

function categoryName(store: StoreItem) {
  const category = store.categoryId;
  if (!category || typeof category === "string") return "-";
  return category.name || category.slug || "-";
}

function pctText(value?: number | null) {
  return value === null || value === undefined ? "Herdada" : `${Number(value).toFixed(2)}%`;
}

export default function MarketplacePartnersPage() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processing, setProcessing] = useState<string | null>(null);

  const [partnerForm, setPartnerForm] = useState({
    ownerUserId: "",
    legalName: "",
    tradeName: "",
    document: "",
    email: "",
    phone: "",
    whatsapp: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    slug: "",
    name: "",
    icon: "store",
    defaultCommissionPct: "12",
  });

  const [storeForm, setStoreForm] = useState({
    partnerId: "",
    categoryId: "",
    name: "",
    commissionPct: "",
    city: "",
    state: "",
    latitude: "",
    longitude: "",
  });

  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [partnerData, categoryData, storeData] = await Promise.all([
        marketplaceAdminService.listPartners(statusFilter),
        marketplaceAdminService.listCategories(),
        marketplaceAdminService.listStores(),
      ]);
      setPartners(partnerData);
      setCategories(categoryData.filter((category) => category.kind === "store"));
      setStores(storeData);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao carregar marketplace", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPartners = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return partners;
    return partners.filter((partner) =>
      [partner.tradeName, partner.legalName, partner.document, ownerLabel(partner)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [partners, query]);

  const stats = useMemo(() => ({
    partners: partners.length,
    pending: partners.filter((partner) => partner.kyc?.status === "pending").length,
    stores: stores.length,
    activeStores: stores.filter((store) => store.status === "active").length,
  }), [partners, stores]);

  async function submitPartner(event: React.FormEvent) {
    event.preventDefault();
    setProcessing("partner");
    try {
      await marketplaceAdminService.createPartner({
        ownerUserId: partnerForm.ownerUserId.trim(),
        legalName: partnerForm.legalName.trim(),
        tradeName: partnerForm.tradeName.trim(),
        document: partnerForm.document.trim(),
        contact: {
          email: partnerForm.email.trim(),
          phone: partnerForm.phone.trim(),
          whatsapp: partnerForm.whatsapp.trim(),
        },
      });
      setPartnerForm({ ownerUserId: "", legalName: "", tradeName: "", document: "", email: "", phone: "", whatsapp: "" });
      showToast("Parceiro cadastrado para análise", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao cadastrar parceiro", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function submitCategory(event: React.FormEvent) {
    event.preventDefault();
    setProcessing("category");
    try {
      await marketplaceAdminService.createCategory({
        slug: categoryForm.slug.trim(),
        name: categoryForm.name.trim(),
        icon: categoryForm.icon.trim() || "store",
        kind: "store",
        defaultCommissionPct: categoryForm.defaultCommissionPct === "" ? null : Number(categoryForm.defaultCommissionPct),
      });
      setCategoryForm({ slug: "", name: "", icon: "store", defaultCommissionPct: "12" });
      showToast("Categoria criada", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao criar categoria", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function submitStore(event: React.FormEvent) {
    event.preventDefault();
    setProcessing("store");
    try {
      await marketplaceAdminService.createStore({
        partnerId: storeForm.partnerId,
        categoryId: storeForm.categoryId,
        name: storeForm.name.trim(),
        commissionPct: storeForm.commissionPct === "" ? null : Number(storeForm.commissionPct),
        address: { city: storeForm.city.trim(), state: storeForm.state.trim() },
        latitude: storeForm.latitude === "" ? undefined : Number(storeForm.latitude),
        longitude: storeForm.longitude === "" ? undefined : Number(storeForm.longitude),
      });
      setStoreForm({ partnerId: "", categoryId: "", name: "", commissionPct: "", city: "", state: "", latitude: "", longitude: "" });
      showToast("Loja criada em análise", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao criar loja", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function updateKyc(partnerId: string, action: "approve" | "reject" | "suspend" | "reset") {
    setProcessing(`${partnerId}-${action}`);
    try {
      await marketplaceAdminService.updateKyc(partnerId, action, action === "reject" ? "Reprovado pela análise administrativa." : "");
      showToast("KYC atualizado", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao atualizar KYC", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function updatePartnerStatus(partnerId: string, status: PartnerStatus) {
    setProcessing(`${partnerId}-${status}`);
    try {
      await marketplaceAdminService.updateStatus(partnerId, status);
      showToast("Status do parceiro atualizado", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao atualizar parceiro", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function updateStoreStatus(storeId: string, status: "active" | "paused" | "under_review" | "blocked") {
    setProcessing(`${storeId}-${status}`);
    try {
      await marketplaceAdminService.updateStoreStatus(storeId, status);
      showToast("Status da loja atualizado", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao atualizar loja", "error");
    } finally {
      setProcessing(null);
    }
  }

  async function saveStoreCommission(storeId: string, value: string) {
    setProcessing(`${storeId}-commission`);
    try {
      await marketplaceAdminService.setStoreCommission(storeId, value === "" ? null : Number(value));
      showToast("Comissão da loja atualizada", "success");
      await loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || "Erro ao salvar comissão", "error");
    } finally {
      setProcessing(null);
    }
  }

  if (loading && !refreshing) {
    return <div className="p-6 text-center text-gray-500 font-bold">Carregando parceiros...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {ToastContainer}
      <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3">
            <Store className="w-8 h-8 text-emerald-600" />
            Parceiros & Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cadastro, KYC e comissão das lojas parceiras.</p>
        </div>
        <button
          onClick={() => { setRefreshing(true); loadData(); }}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Summary label="Parceiros" value={stats.partners} />
        <Summary label="KYC pendente" value={stats.pending} />
        <Summary label="Lojas" value={stats.stores} />
        <Summary label="Lojas ativas" value={stats.activeStores} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel title="Novo parceiro">
          <form onSubmit={submitPartner} className="space-y-3">
            <Input placeholder="ID do usuário responsável" value={partnerForm.ownerUserId} onChange={(v) => setPartnerForm((s) => ({ ...s, ownerUserId: v }))} required />
            <Input placeholder="Razão social" value={partnerForm.legalName} onChange={(v) => setPartnerForm((s) => ({ ...s, legalName: v }))} required />
            <Input placeholder="Nome fantasia" value={partnerForm.tradeName} onChange={(v) => setPartnerForm((s) => ({ ...s, tradeName: v }))} required />
            <Input placeholder="CNPJ/CPF" value={partnerForm.document} onChange={(v) => setPartnerForm((s) => ({ ...s, document: v }))} />
            <Input placeholder="E-mail" value={partnerForm.email} onChange={(v) => setPartnerForm((s) => ({ ...s, email: v }))} />
            <Input placeholder="Telefone" value={partnerForm.phone} onChange={(v) => setPartnerForm((s) => ({ ...s, phone: v }))} />
            <Input placeholder="WhatsApp" value={partnerForm.whatsapp} onChange={(v) => setPartnerForm((s) => ({ ...s, whatsapp: v }))} />
            <SubmitButton loading={processing === "partner"} label="Cadastrar parceiro" />
          </form>
        </Panel>

        <Panel title="Categoria de loja">
          <form onSubmit={submitCategory} className="space-y-3">
            <Input placeholder="Slug: restaurantes" value={categoryForm.slug} onChange={(v) => setCategoryForm((s) => ({ ...s, slug: v }))} required />
            <Input placeholder="Nome: Restaurantes" value={categoryForm.name} onChange={(v) => setCategoryForm((s) => ({ ...s, name: v }))} required />
            <Input placeholder="Ícone Lucide" value={categoryForm.icon} onChange={(v) => setCategoryForm((s) => ({ ...s, icon: v }))} />
            <Input type="number" placeholder="Comissão padrão %" value={categoryForm.defaultCommissionPct} onChange={(v) => setCategoryForm((s) => ({ ...s, defaultCommissionPct: v }))} />
            <SubmitButton loading={processing === "category"} label="Criar categoria" />
          </form>
        </Panel>

        <Panel title="Nova loja">
          <form onSubmit={submitStore} className="space-y-3">
            <Select value={storeForm.partnerId} onChange={(v) => setStoreForm((s) => ({ ...s, partnerId: v }))} required>
              <option value="">Parceiro</option>
              {partners.map((partner) => <option key={partner._id} value={partner._id}>{partner.tradeName}</option>)}
            </Select>
            <Select value={storeForm.categoryId} onChange={(v) => setStoreForm((s) => ({ ...s, categoryId: v }))} required>
              <option value="">Categoria</option>
              {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </Select>
            <Input placeholder="Nome da loja" value={storeForm.name} onChange={(v) => setStoreForm((s) => ({ ...s, name: v }))} required />
            <Input type="number" placeholder="Comissão override % (vazio = herdar)" value={storeForm.commissionPct} onChange={(v) => setStoreForm((s) => ({ ...s, commissionPct: v }))} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Cidade" value={storeForm.city} onChange={(v) => setStoreForm((s) => ({ ...s, city: v }))} />
              <Input placeholder="UF" value={storeForm.state} onChange={(v) => setStoreForm((s) => ({ ...s, state: v }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Latitude" value={storeForm.latitude} onChange={(v) => setStoreForm((s) => ({ ...s, latitude: v }))} />
              <Input type="number" placeholder="Longitude" value={storeForm.longitude} onChange={(v) => setStoreForm((s) => ({ ...s, longitude: v }))} />
            </div>
            <SubmitButton loading={processing === "store"} label="Criar loja" />
          </form>
        </Panel>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar parceiro..." className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <Select value={statusFilter} onChange={setStatusFilter}>
          <option value="all">Todos</option>
          <option value="under_review">Em análise</option>
          <option value="active">Ativos</option>
          <option value="paused">Pausados</option>
          <option value="blocked">Bloqueados</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <Panel title="Parceiros cadastrados">
          <div className="space-y-3">
            {filteredPartners.map((partner) => (
              <div key={partner._id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-950">{partner.tradeName}</p>
                    <p className="text-xs text-gray-500 font-semibold">{partner.legalName}</p>
                    <p className="text-[11px] text-gray-400 mt-1">Responsável: {ownerLabel(partner)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge>{partnerStatusLabels[partner.status] || partner.status}</Badge>
                    <Badge>{kycLabels[partner.kyc?.status || "none"]}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Action onClick={() => updateKyc(partner._id, "approve")} loading={processing === `${partner._id}-approve`} icon={<ShieldCheck className="w-4 h-4" />}>Aprovar KYC</Action>
                  <Action onClick={() => updateKyc(partner._id, "reject")} loading={processing === `${partner._id}-reject`} icon={<XCircle className="w-4 h-4" />}>Reprovar</Action>
                  <Action onClick={() => updatePartnerStatus(partner._id, "active")} loading={processing === `${partner._id}-active`} icon={<CheckCircle2 className="w-4 h-4" />}>Ativar</Action>
                  <Action onClick={() => updatePartnerStatus(partner._id, "paused")} loading={processing === `${partner._id}-paused`} icon={<PauseCircle className="w-4 h-4" />}>Pausar</Action>
                </div>
              </div>
            ))}
            {filteredPartners.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Nenhum parceiro encontrado.</p>}
          </div>
        </Panel>

        <Panel title="Lojas & comissão">
          <div className="space-y-3">
            {stores.map((store) => (
              <StoreRow
                key={store._id}
                store={store}
                disabled={Boolean(processing)}
                onStatus={updateStoreStatus}
                onCommission={saveStoreCommission}
              />
            ))}
            {stores.length === 0 && <p className="text-sm text-gray-400 text-center py-10">Nenhuma loja cadastrada.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-gray-950 mt-1">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h2 className="text-sm font-black text-gray-950 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Input(props: { value: string; onChange: (value: string) => void; placeholder: string; required?: boolean; type?: string }) {
  return <input type={props.type || "text"} required={props.required} value={props.value} onChange={(e) => props.onChange(e.target.value)} placeholder={props.placeholder} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />;
}

function Select(props: { value: string; onChange: (value: string) => void; children: React.ReactNode; required?: boolean }) {
  return <select required={props.required} value={props.value} onChange={(e) => props.onChange(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500 bg-white">{props.children}</select>;
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return <button disabled={loading} className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black disabled:opacity-50">{loading ? "Salvando..." : label}</button>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full border border-gray-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-gray-700">{children}</span>;
}

function Action({ children, icon, onClick, loading }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; loading: boolean }) {
  return <button onClick={onClick} disabled={loading} className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 disabled:opacity-50">{icon}{children}</button>;
}

function StoreRow({ store, disabled, onStatus, onCommission }: {
  store: StoreItem;
  disabled: boolean;
  onStatus: (id: string, status: "active" | "paused" | "under_review" | "blocked") => void;
  onCommission: (id: string, value: string) => void;
}) {
  const [commission, setCommission] = useState(store.commissionPct === null || store.commissionPct === undefined ? "" : String(store.commissionPct));
  return (
    <div className="border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-black text-gray-950">{store.name}</p>
          <p className="text-xs text-gray-500">{categoryName(store)} • {store.status || "under_review"}</p>
        </div>
        <Badge>{pctText(store.commissionPct)}</Badge>
      </div>
      <div className="flex gap-2">
        <input value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="%" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none" />
        <button disabled={disabled} onClick={() => onCommission(store._id, commission)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-black disabled:opacity-50">Salvar</button>
        <button disabled={disabled} onClick={() => onStatus(store._id, "active")} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-black disabled:opacity-50">Ativar</button>
        <button disabled={disabled} onClick={() => onStatus(store._id, "paused")} className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-black disabled:opacity-50">Pausar</button>
      </div>
    </div>
  );
}
