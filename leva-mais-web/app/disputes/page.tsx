"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/Toast";
import {
  disputeAdminService,
  type DisputeItem,
  type DisputeSeverity,
  type DisputeStatus,
} from "@/services/disputeAdminService";

const statusMeta: Record<DisputeStatus, { label: string; className: string }> = {
  open: { label: "Aberta", className: "bg-amber-50 text-amber-700 border-amber-200" },
  in_review: { label: "Em análise", className: "bg-blue-50 text-blue-700 border-blue-200" },
  resolved: { label: "Resolvida", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejeitada", className: "bg-rose-50 text-rose-700 border-rose-200" },
  cancelled: { label: "Cancelada", className: "bg-slate-50 text-slate-700 border-slate-200" },
};

const severityMeta: Record<DisputeSeverity, { label: string; className: string }> = {
  low: { label: "Baixa", className: "bg-slate-50 text-slate-700 border-slate-200" },
  medium: { label: "Média", className: "bg-amber-50 text-amber-700 border-amber-200" },
  high: { label: "Alta", className: "bg-orange-50 text-orange-700 border-orange-200" },
  critical: { label: "Crítica", className: "bg-red-50 text-red-700 border-red-200" },
};

const categoryLabels: Record<string, string> = {
  payment: "Pagamento",
  safety: "Segurança",
  delivery_problem: "Problema na entrega",
  cancellation_fee: "Taxa de cancelamento",
  route: "Rota",
  behavior: "Comportamento",
  other: "Outro",
};

function getRideId(dispute: DisputeItem) {
  if (!dispute.rideId) return "";
  return typeof dispute.rideId === "string" ? dispute.rideId : dispute.rideId._id;
}

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
}

export default function DisputesPage() {
  const [items, setItems] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("open");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<DisputeItem | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [amountAdjusted, setAmountAdjusted] = useState("0");
  const [processing, setProcessing] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await disputeAdminService.list(statusFilter);
      setItems(data);
    } catch {
      showToast("Erro ao carregar disputas", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selected) return;
    setResolutionSummary(selected.resolution?.summary || "");
    setAmountAdjusted(String(selected.resolution?.amountAdjusted || 0));
  }, [selected]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      return (
        getRideId(item).toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    });
  }, [items, searchTerm]);

  const stats = useMemo(() => {
    return {
      open: items.filter((item) => item.status === "open").length,
      review: items.filter((item) => item.status === "in_review").length,
      critical: items.filter((item) => item.severity === "critical").length,
      resolved: items.filter((item) => item.status === "resolved").length,
    };
  }, [items]);

  const refresh = () => {
    setRefreshing(true);
    loadData();
  };

  const updateSelected = async (payload: Parameters<typeof disputeAdminService.update>[1]) => {
    if (!selected) return;
    setProcessing(true);
    try {
      const updated = await disputeAdminService.update(selected._id, payload);
      showToast("Disputa atualizada com sucesso", "success");
      setSelected(updated);
      await loadData();
    } catch {
      showToast("Erro ao atualizar disputa", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-bold">Carregando central de disputas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {ToastContainer}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3.5">
            <ShieldAlert className="w-9 h-9 text-emerald-600" />
            Disputas e Segurança
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Trate reclamações de pagamento, segurança, entrega, rota e comportamento vinculadas a corridas ou entregas.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SummaryCard label="Abertas" value={stats.open} icon={<Clock className="w-5 h-5" />} tone="amber" />
        <SummaryCard label="Em análise" value={stats.review} icon={<AlertTriangle className="w-5 h-5" />} tone="blue" />
        <SummaryCard label="Críticas" value={stats.critical} icon={<ShieldAlert className="w-5 h-5" />} tone="red" />
        <SummaryCard label="Resolvidas" value={stats.resolved} icon={<CheckCircle2 className="w-5 h-5" />} tone="emerald" />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por ID da corrida, categoria ou descrição..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold text-gray-700"
          >
            <option value="open">Abertas</option>
            <option value="in_review">Em análise</option>
            <option value="resolved">Resolvidas</option>
            <option value="rejected">Rejeitadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="all">Todos os Status</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/70 border-b border-gray-200">
                <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Disputa</th>
                  <th className="px-6 py-4 text-left">Categoria</th>
                  <th className="px-6 py-4 text-left">Severidade</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Criada em</th>
                  <th className="px-6 py-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      Nenhuma disputa encontrada neste filtro.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-gray-900">#{item._id.slice(-6).toUpperCase()}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">Corrida {getRideId(item).slice(-8) || "-"}</p>
                      </td>
                      <td className="px-6 py-4">{categoryLabels[item.category] || item.category}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${severityMeta[item.severity]?.className || severityMeta.medium.className}`}>
                          {severityMeta[item.severity]?.label || item.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusMeta[item.status]?.className || statusMeta.open.className}`}>
                          {statusMeta[item.status]?.label || item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setSelected(item)}
                          className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-bold"
                        >
                          Analisar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-fit">
          {selected ? (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Disputa selecionada</p>
                <h2 className="text-lg font-black text-gray-950 mt-1">#{selected._id.slice(-6).toUpperCase()}</h2>
                <p className="text-xs text-gray-500 font-semibold mt-1">{categoryLabels[selected.category] || selected.category}</p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-gray-200 p-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Descrição</p>
                <p className="text-sm text-gray-800 leading-relaxed">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={selected.status}
                  onChange={(event) => updateSelected({ status: event.target.value as DisputeStatus })}
                  disabled={processing}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="open">Aberta</option>
                  <option value="in_review">Em análise</option>
                  <option value="resolved">Resolvida</option>
                  <option value="rejected">Rejeitada</option>
                  <option value="cancelled">Cancelada</option>
                </select>

                <select
                  value={selected.severity}
                  onChange={(event) => updateSelected({ severity: event.target.value as DisputeSeverity })}
                  disabled={processing}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>

              <div className="space-y-3">
                <textarea
                  value={resolutionSummary}
                  onChange={(event) => setResolutionSummary(event.target.value)}
                  placeholder="Resumo da decisão administrativa..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
                <input
                  type="number"
                  step="0.01"
                  value={amountAdjusted}
                  onChange={(event) => setAmountAdjusted(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ajuste financeiro"
                />
                <button
                  onClick={() => updateSelected({
                    status: "resolved",
                    resolutionSummary,
                    amountAdjusted: Number(amountAdjusted || 0),
                  })}
                  disabled={processing || resolutionSummary.trim().length < 5}
                  className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Resolver disputa
                </button>
                <button
                  onClick={() => updateSelected({ status: "rejected", resolutionSummary: resolutionSummary || "Disputa rejeitada pela análise administrativa." })}
                  disabled={processing}
                  className="w-full px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-black disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar solicitação
                </button>
              </div>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-center text-gray-400 gap-3">
              <ShieldAlert className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-bold">Selecione uma disputa para analisar</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "amber" | "blue" | "red" | "emerald";
}) {
  const classes = {
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    blue: "bg-blue-50 border-blue-200 text-blue-900",
    red: "bg-red-50 border-red-200 text-red-900",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };
  const iconClasses = {
    amber: "bg-amber-500 text-white",
    blue: "bg-blue-600 text-white",
    red: "bg-red-600 text-white",
    emerald: "bg-emerald-600 text-white",
  };

  return (
    <div className={`p-4 border rounded-2xl flex items-center justify-between shadow-sm ${classes[tone]}`}>
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-2xl font-black mt-1">{value}</p>
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${iconClasses[tone]}`}>
        {icon}
      </div>
    </div>
  );
}
