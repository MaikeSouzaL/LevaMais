"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  FileText,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Check,
  X,
  ShieldAlert,
  DollarSign
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { verificationAdminService } from "@/services/verificationAdminService";

interface CarrierItem {
  _id: string;
  driverUserId?: { _id: string; name?: string; email?: string; phone?: string } | string;
  brandName: string;
  slug: string;
  bio?: string;
  logo?: string;
  document?: string;
  contact?: { email?: string; phone?: string; whatsapp?: string };
  serviceAreas?: Array<{ cityId?: string; label?: string }>;
  pricing?: { basePrice: number; pricePerKg: number };
  status: "active" | "paused" | "under_review" | "blocked";
  statusReason?: string;
  kyc?: {
    status: "none" | "pending" | "approved" | "rejected" | "suspended";
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  createdAt?: string;
}

export default function CarriersVerificationPage() {
  const [carriers, setCarriers] = useState<CarrierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kycFilter, setKycFilter] = useState("pending");
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await verificationAdminService.listCarriers();
      setCarriers(data);
    } catch {
      showToast("Erro ao carregar a lista de transportadoras", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    showToast("Lista de transportadoras atualizada", "success");
  };

  const filteredCarriers = useMemo(() => {
    return carriers.filter((c) => {
      const nameMatch = c.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.document || "").includes(searchTerm) ||
        (typeof c.driverUserId === "object" && c.driverUserId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

      const statusMatch = statusFilter === "all" || c.status === statusFilter;
      const kycMatch = kycFilter === "all" || (c.kyc?.status || "none") === kycFilter;

      return nameMatch && statusMatch && kycMatch;
    });
  }, [carriers, searchTerm, statusFilter, kycFilter]);

  const handleReviewKyc = async (action: "approve" | "reject" | "suspend" | "reset", reason?: string) => {
    if (!selectedCarrier) return;
    setProcessing(true);
    try {
      const updated = await verificationAdminService.reviewCarrierKyc(selectedCarrier._id, action, reason);
      if (updated) {
        showToast(
          `KYC da transportadora ${selectedCarrier.brandName} atualizado para ${action === "approve" ? "aprovado" : "rejeitado"}!`,
          "success"
        );
        setSelectedCarrier(updated);
        loadData();
        setIsDrawerOpen(false);
        setShowRejectModal(false);
        setRejectionReason("");
        setCustomReason("");
      }
    } catch {
      showToast("Erro ao processar revisão de KYC", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStatus = async (status: "active" | "paused" | "under_review" | "blocked", reason?: string) => {
    if (!selectedCarrier) return;
    setProcessing(true);
    try {
      const updated = await verificationAdminService.updateCarrierStatus(selectedCarrier._id, status, reason);
      if (updated) {
        showToast(`Status da transportadora ${selectedCarrier.brandName} alterado para ${status}!`, "success");
        setSelectedCarrier(updated);
        loadData();
      }
    } catch {
      showToast("Erro ao atualizar status da transportadora", "error");
    } finally {
      setProcessing(false);
    }
  };

  const getKycBadge = (status?: string) => {
    const map = {
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
      suspended: "bg-red-50 text-red-700 border-red-200",
      none: "bg-slate-50 text-slate-700 border-slate-200",
    };
    const labels = {
      approved: "Aprovado",
      pending: "Pendente",
      rejected: "Rejeitado",
      suspended: "Suspenso",
      none: "Não Enviado",
    };
    const key = (status || "none") as keyof typeof map;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${map[key] || map.none}`}>
        {labels[key] || labels.none}
      </span>
    );
  };

  const getStatusBadge = (status?: string) => {
    const map = {
      active: "bg-emerald-100 text-emerald-800",
      paused: "bg-amber-100 text-amber-800",
      under_review: "bg-blue-100 text-blue-800",
      blocked: "bg-red-100 text-red-800",
    };
    const labels = {
      active: "Ativo",
      paused: "Pausado",
      under_review: "Em Análise",
      blocked: "Bloqueado",
    };
    const key = (status || "under_review") as keyof typeof map;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${map[key] || map.under_review}`}>
        {labels[key] || labels.under_review}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {ToastContainer}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3">
            <Truck className="w-9 h-9 text-emerald-600 animate-pulse" />
            Auditoria de Transportadoras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o cadastro, revise as documentações de KYC e regule o status das transportadoras registradas.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, slug, documento ou motorista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm"
          />
        </div>

        <div className="flex gap-4">
          <div>
            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold text-gray-700 text-sm"
            >
              <option value="all">Todos os KYC</option>
              <option value="pending">KYC Pendente</option>
              <option value="approved">KYC Aprovado</option>
              <option value="rejected">KYC Rejeitado</option>
              <option value="suspended">KYC Suspenso</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold text-gray-700 text-sm"
            >
              <option value="all">Todos os Status</option>
              <option value="under_review">Em Análise</option>
              <option value="active">Ativo</option>
              <option value="paused">Pausado</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && !refreshing ? (
          <div className="p-12 text-center text-gray-500 font-bold">Carregando transportadoras...</div>
        ) : filteredCarriers.length === 0 ? (
          <div className="p-12 text-center text-gray-500 font-bold">Nenhuma transportadora encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/70 border-b border-gray-200">
                <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Transportadora</th>
                  <th className="px-6 py-4 text-left">Documento / Contato</th>
                  <th className="px-6 py-4 text-left">Cidades Atendidas</th>
                  <th className="px-6 py-4 text-left">Preços</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">KYC</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                {filteredCarriers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                          {c.brandName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 truncate max-w-[150px]">{c.brandName}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[150px]">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-950 font-bold">{c.document || "N/A"}</p>
                      <p className="text-[10px] text-gray-400 font-bold mt-0.5">{c.contact?.email || ""}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate">
                      {c.serviceAreas && c.serviceAreas.length > 0
                        ? c.serviceAreas.map((a) => a.label).join(", ")
                        : "Nenhuma cadastrada"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-950">Base: R$ {(c.pricing?.basePrice || 0).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Kg: R$ {(c.pricing?.pricePerKg || 0).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                    <td className="px-6 py-4">{getKycBadge(c.kyc?.status)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedCarrier(c);
                          setIsDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 rounded-lg transition-colors font-bold text-xs"
                      >
                        Analisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Details */}
      {isDrawerOpen && selectedCarrier && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDrawerOpen(false)} />

          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <Truck className="w-7 h-7 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{selectedCarrier.brandName}</h2>
                  <p className="text-xs text-gray-400 font-bold mt-0.5">ID: {selectedCarrier._id}</p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                Informações Básicas
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 font-bold">Documento / CNPJ</p>
                  <p className="text-gray-950 font-extrabold mt-0.5">{selectedCarrier.document || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">Slug Compartilhável</p>
                  <p className="text-gray-950 font-extrabold mt-0.5">/{selectedCarrier.slug}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">Telefone</p>
                  <p className="text-gray-950 font-extrabold mt-0.5">{selectedCarrier.contact?.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">WhatsApp</p>
                  <p className="text-gray-950 font-extrabold mt-0.5">{selectedCarrier.contact?.whatsapp || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 font-bold">Bio / Descrição</p>
                  <p className="text-gray-950 mt-0.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedCarrier.bio || "Nenhuma descrição fornecida."}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing & Areas */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                Serviços & Precificação
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-400 font-bold">Preço de Partida (Base)</p>
                  <p className="text-gray-950 font-extrabold mt-0.5">R$ {(selectedCarrier.pricing?.basePrice || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">Taxa por Kg Adicional</p>
                  <p className="text-gray-950 font-extrabold mt-0.5">R$ {(selectedCarrier.pricing?.pricePerKg || 0).toFixed(2)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 font-bold">Cidades de Coleta / Entrega</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedCarrier.serviceAreas && selectedCarrier.serviceAreas.length > 0 ? (
                      selectedCarrier.serviceAreas.map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-[10px] font-bold">
                          {a.label}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 font-medium">Nenhuma cidade configurada.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KYC & Review Status */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                Validação de KYC
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <p className="text-gray-400 font-bold">KYC Status</p>
                  <div className="mt-1">{getKycBadge(selectedCarrier.kyc?.status)}</div>
                </div>
                <div>
                  <p className="text-gray-400 font-bold">Status da Conta</p>
                  <div className="mt-1">{getStatusBadge(selectedCarrier.status)}</div>
                </div>
              </div>
              {selectedCarrier.kyc?.rejectionReason && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-950 text-xs">
                  <p className="font-extrabold flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    Motivo da Rejeição:
                  </p>
                  <p className="mt-1 font-bold">{selectedCarrier.kyc.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Operations Actions */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ações Administrativas</h3>

              {/* KYC Decisions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  disabled={processing || selectedCarrier.kyc?.status === "approved"}
                  onClick={() => handleReviewKyc("approve")}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar KYC
                </button>
                <button
                  disabled={processing || selectedCarrier.kyc?.status === "rejected"}
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Rejeitar KYC
                </button>
              </div>

              {/* Status manual override */}
              <div className="flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs">
                <div>
                  <p className="font-bold text-slate-800">Status Manual</p>
                  <p className="text-slate-400 text-[10px]">Alterar status de execução no app</p>
                </div>
                <div className="flex gap-2">
                  {(["active", "paused", "blocked"] as const).map((st) => (
                    <button
                      key={st}
                      disabled={processing || selectedCarrier.status === st}
                      onClick={() => handleUpdateStatus(st)}
                      className={`px-2.5 py-1.5 rounded-lg border font-bold text-[10px] capitalize transition-colors ${
                        selectedCarrier.status === st
                          ? "bg-slate-700 text-white border-transparent"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {st === "active" ? "Ativo" : st === "paused" ? "Pausar" : "Bloquear"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
              <AlertCircle className="text-rose-600 w-5 h-5" />
              Motivo da Rejeição do KYC
            </h3>

            <div className="space-y-3">
              <p className="text-xs text-gray-400 font-bold uppercase">Motivos Comuns</p>
              {[
                "CNPJ inativo ou inexistente",
                "Documentos societários inválidos",
                "Dados de contato inconsistentes",
                "Área de atuação sem cobertura viária válida"
              ].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectionReason(reason)}
                  className={`w-full text-left p-2.5 border rounded-xl text-xs font-bold transition-all ${
                    rejectionReason === reason
                      ? "border-rose-600 bg-rose-50 text-rose-950"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-bold uppercase">Ou descreva em detalhes</p>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Insira um motivo de rejeição detalhado..."
                className="w-full border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-rose-500 h-24"
              />
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button
                disabled={processing}
                onClick={() => handleReviewKyc("reject", customReason.trim() || rejectionReason)}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
              >
                Confirmar Rejeição
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setCustomReason("");
                }}
                className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
