"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Landmark,
  Search,
  Filter,
  Check,
  X as CloseIcon,
  RefreshCw,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { withdrawalsService, Withdrawal } from "@/services/withdrawalsService";
import { ridesService } from "@/services/ridesService";
import { useToast } from "@/components/ui/Toast";

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modais
  const [actionWithdrawal, setActionWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [transactionIdInput, setTransactionIdInput] = useState("");
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [withdrawalsData, ridesData] = await Promise.all([
        withdrawalsService.getAll(),
        ridesService.getAll()
      ]);
      setWithdrawals(withdrawalsData);
      setRides(ridesData);
    } catch {
      showToast("Erro ao carregar dados financeiros e de saques", "error");
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
    showToast("Dados de saques e reconciliação atualizados", "success");
  };

  // Reconciliação Financeira
  const financials = useMemo(() => {
    const totalPlatformFees = rides
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.pricing?.platformFee || 0), 0);

    const paidWithdrawals = withdrawals
      .filter((w) => w.status === "paid")
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    const pendingWithdrawals = withdrawals
      .filter((w) => w.status === "pending")
      .reduce((sum, w) => sum + (w.amount || 0), 0);

    // Saldo em custódia (Taxas arrecadadas menos o que já foi retirado pelos motoristas e o que está pendente)
    const systemBalance = totalPlatformFees;

    return {
      totalPlatformFees,
      paidWithdrawals,
      pendingWithdrawals,
      systemBalance
    };
  }, [rides, withdrawals]);

  // Filtragem
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      const driverName = w.userId?.name || "";
      const driverEmail = w.userId?.email || "";
      const pixKey = w.pixKey || "";

      const matchesSearch =
        driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driverEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pixKey.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || w.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [withdrawals, searchQuery, statusFilter]);

  const openApproveModal = (withdrawal: Withdrawal) => {
    setActionWithdrawal(withdrawal);
    setActionType("approve");
    setTransactionIdInput("");
  };

  const openRejectModal = (withdrawal: Withdrawal) => {
    setActionWithdrawal(withdrawal);
    setActionType("reject");
    setRejectionReasonInput("");
  };

  const closeModals = () => {
    setActionWithdrawal(null);
    setActionType(null);
    setTransactionIdInput("");
    setRejectionReasonInput("");
  };

  const handleApprove = async () => {
    if (!actionWithdrawal) return;
    setSubmittingAction(true);
    try {
      await withdrawalsService.approve(actionWithdrawal._id, transactionIdInput.trim());
      showToast("Saque aprovado com sucesso!", "success");
      
      // Emit update event to Sidebar / UI
      window.dispatchEvent(new Event("verification-updated"));
      
      loadData();
      closeModals();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erro ao aprovar saque", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!actionWithdrawal) return;
    if (!rejectionReasonInput.trim()) {
      showToast("Por favor, insira o motivo da rejeição", "error");
      return;
    }
    setSubmittingAction(true);
    try {
      await withdrawalsService.reject(actionWithdrawal._id, rejectionReasonInput.trim());
      showToast("Saque rejeitado e saldo estornado com sucesso", "success");
      
      // Emit update event
      window.dispatchEvent(new Event("verification-updated"));
      
      loadData();
      closeModals();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Erro ao rejeitar saque", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-semibold">Carregando painel de saques e payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {ToastContainer}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3.5">
            <Landmark className="w-9 h-9 text-emerald-600 animate-pulse" />
            Saques & Reconciliação Financeira
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerenciamento e aprovação de saques dos motoristas e balanço de faturamento da plataforma.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {/* Finance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total em Comissões (Receita)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-slate-400">R$</span>
            <span className="text-2xl font-extrabold text-slate-900">{financials.totalPlatformFees.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-gray-500 font-semibold">Taxas retidas nas corridas</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Saques Pagos (Payouts)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-emerald-500">R$</span>
            <span className="text-2xl font-extrabold text-emerald-600">{financials.paidWithdrawals.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-emerald-600/80 font-semibold">Transferidos com sucesso</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Saques Pendentes (Em Fila)</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-amber-500">R$</span>
            <span className="text-2xl font-extrabold text-amber-600">{financials.pendingWithdrawals.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-amber-600/80 font-semibold">Aguardando liquidação</p>
        </div>

        <div className="bg-emerald-500 border border-emerald-600 rounded-2xl p-5 shadow-sm space-y-2 text-white">
          <p className="text-[10px] font-extrabold text-emerald-100 uppercase tracking-widest">Faturamento Líquido da Plataforma</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-emerald-200">R$</span>
            <span className="text-2xl font-extrabold">{financials.systemBalance.toFixed(2)}</span>
          </div>
          <p className="text-[10px] text-emerald-100 font-semibold">Saldo retido no gateway</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por motorista, e-mail ou chave Pix..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-xs font-semibold"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <div className="flex border border-gray-200 rounded-xl overflow-hidden text-xs font-bold bg-gray-50">
            {[
              { label: "Todos", value: "all" },
              { label: "Pendentes", value: "pending" },
              { label: "Pagos", value: "paid" },
              { label: "Rejeitados", value: "rejected" }
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-4 py-2.5 transition-colors border-r last:border-0 ${
                  statusFilter === btn.value
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Motorista</th>
                <th className="px-6 py-4 text-left">Dados Bancários / Pix</th>
                <th className="px-6 py-4 text-left">Valor solicitado</th>
                <th className="px-6 py-4 text-left">Data de Solicitação</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Ações / Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="text-gray-400 space-y-2.5">
                      <Landmark className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="font-extrabold text-gray-600 text-sm">Nenhuma solicitação de saque encontrada</p>
                      <p className="text-xs">Não existem saques sob este filtro de busca.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => {
                  const statusStyles = {
                    pending: "bg-amber-50 text-amber-700 border-amber-100",
                    paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    rejected: "bg-rose-50 text-rose-700 border-rose-100"
                  };

                  const statusLabels = {
                    pending: "Pendente",
                    paid: "Pago",
                    rejected: "Rejeitado"
                  };

                  const pixKeyTypes = {
                    cpf: "CPF",
                    email: "E-mail",
                    phone: "Celular",
                    random: "Aleatória"
                  };

                  return (
                    <tr key={withdrawal._id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Driver info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                            {withdrawal.userId?.name?.charAt(0).toUpperCase() || "M"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 truncate max-w-[160px]">{withdrawal.userId?.name || "Motorista Desconhecido"}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[160px]">{withdrawal.userId?.email || "N/A"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Pix details */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900">
                            Chave: <span className="text-emerald-600 select-all">{withdrawal.pixKey}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold">
                            Tipo: {pixKeyTypes[withdrawal.pixKeyType as keyof typeof pixKeyTypes] || withdrawal.pixKeyType} 
                            {withdrawal.userId?.bankAccount?.bank ? ` • ${withdrawal.userId.bankAccount.bank}` : ""}
                          </p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        R$ {withdrawal.amount.toFixed(2)}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-gray-500 text-[10px] font-bold">
                        {format(new Date(withdrawal.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${statusStyles[withdrawal.status]}`}>
                          {statusLabels[withdrawal.status]}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4">
                        {withdrawal.status === "pending" ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openApproveModal(withdrawal)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 font-bold text-[10px] shadow-sm transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Liquidar
                            </button>
                            <button
                              onClick={() => openRejectModal(withdrawal)}
                              className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-lg flex items-center gap-1 font-bold text-[10px] transition-all"
                            >
                              <CloseIcon className="w-3.5 h-3.5" />
                              Recusar
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            {withdrawal.status === "paid" ? (
                              <div className="text-emerald-600 flex flex-col items-center gap-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Comprovante:</span>
                                <span className="text-[10px] font-mono select-all bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 truncate max-w-[130px]" title={withdrawal.transactionId}>
                                  {withdrawal.transactionId || "N/A"}
                                </span>
                              </div>
                            ) : (
                              <div className="text-rose-600 flex flex-col items-center gap-0.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Motivo:</span>
                                <span className="text-[10px] font-bold truncate max-w-[130px]" title={withdrawal.rejectionReason}>
                                  {withdrawal.rejectionReason || "Não detalhado"}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Approve / Liquidation */}
      {actionWithdrawal && actionType === "approve" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                Confirmar Liquidação Bancária
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Motorista:</span>
                  <span className="text-gray-950 font-bold">{actionWithdrawal.userId?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Chave Pix:</span>
                  <span className="text-emerald-600 font-bold select-all">{actionWithdrawal.pixKey}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-2.5">
                  <span className="text-gray-500">Valor a Transferir:</span>
                  <span className="text-sm font-extrabold text-gray-950">R$ {actionWithdrawal.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Comprovante de Transferência PIX (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: E12345678901234567890..."
                  value={transactionIdInput}
                  onChange={(e) => setTransactionIdInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
                <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 pt-0.5">
                  <Info className="w-3 h-3" />
                  Efetue a transferência Pix PJ no banco antes de confirmar. O motorista será notificado.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={closeModals}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleApprove}
                disabled={submittingAction}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingAction ? "Processando..." : "Confirmar Payout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reject */}
      {actionWithdrawal && actionType === "reject" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                Recusar Solicitação de Saque
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="bg-slate-50 rounded-xl p-4 border border-gray-100 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Motorista:</span>
                  <span className="text-gray-950 font-bold">{actionWithdrawal.userId?.name}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-2.5">
                  <span className="text-gray-500">Valor Retido:</span>
                  <span className="text-sm font-extrabold text-gray-950">R$ {actionWithdrawal.amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Motivo da Recusa (Obrigatório)</label>
                <textarea
                  placeholder="Ex: Chave PIX informada é inválida ou inexistente..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-xs"
                />
                <p className="text-[9px] text-rose-500/80 font-bold pt-0.5">
                  ⚠️ Ao recusar, o valor solicitado será estornado na mesma hora ao saldo do aplicativo do motorista.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={closeModals}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleReject}
                disabled={submittingAction}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {submittingAction ? "Processando..." : "Confirmar Recusa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
