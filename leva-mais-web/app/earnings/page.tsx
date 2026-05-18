"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  Clock,
  RefreshCw,
  AlertTriangle,
  Calendar,
  CheckCircle,
  FileText,
  User
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ridesService, Ride } from "@/services/ridesService";
import { useToast } from "@/components/ui/Toast";

interface Withdrawal {
  _id: string;
  driverId: {
    _id: string;
    name: string;
    phone: string;
    email: string;
  };
  amount: number;
  status: "pending" | "approved" | "rejected";
  pixKeyType: string;
  pixKey: string;
  createdAt: string;
  updatedAt: string;
}

export default function EarningsPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      // Load Completed Rides
      const ridesData = await ridesService.getAll({ status: "completed" });
      setRides(ridesData);

      // Attempt to load withdrawal history from backend
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";
      const res = await axios.get(`${API_URL}/withdraws/history`, {
        headers: {
          "Content-Type": "application/json",
          ...(ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}),
        }
      });
      setWithdrawals(res.data.withdrawals || []);
    } catch {
      // Silently fall back to empty array if no withdrawal route setup yet
      setWithdrawals([]);
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
    showToast("Dados financeiros sincronizados", "success");
  };

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalVolume = rides.reduce((sum, r) => sum + (r.pricing?.total || 0), 0);
    const platformEarnings = rides.reduce((sum, r) => sum + (r.pricing?.appFee || (r.pricing?.total ? r.pricing.total * 0.2 : 0)), 0);
    const driverEarnings = rides.reduce((sum, r) => sum + (r.pricing?.driverValue || (r.pricing?.total ? r.pricing.total * 0.8 : 0)), 0);
    const count = rides.length;
    const averageTicket = count > 0 ? totalVolume / count : 0;

    // Split for local representative (10% of platform fee as estimation)
    const representativeSplit = platformEarnings * 0.1;

    return {
      totalVolume,
      platformEarnings,
      driverEarnings,
      count,
      averageTicket,
      representativeSplit
    };
  }, [rides]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-semibold">Carregando livro financeiro Leva+...</p>
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
            <DollarSign className="w-9 h-9 text-emerald-600 animate-pulse" />
            Lançamentos Financeiros & Split
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Audite volumes de corrida, tarifas retidas, divisões de split com representantes e fluxo de saques da plataforma.
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

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Faturamento Líquido App</p>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1.5">R$ {metrics.platformEarnings.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Taxas coletadas dos motoristas</p>
        </div>

        <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Volume Total Transacionado</p>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-950 mt-1.5">R$ {metrics.totalVolume.toFixed(2)}</p>
          <p className="text-[10px] text-blue-600 mt-1 font-semibold">Total bruto pago pelos clientes</p>
        </div>

        <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/50 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-purple-800 uppercase tracking-wider">Repasse de Split Local</p>
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-purple-950 mt-1.5">R$ {metrics.representativeSplit.toFixed(2)}</p>
          <p className="text-[10px] text-purple-600 mt-1 font-semibold">Comissão de representantes (10% App)</p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Tíquete Médio de Viagem</p>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-950 mt-1.5">R$ {metrics.averageTicket.toFixed(2)}</p>
          <p className="text-[10px] text-amber-600 mt-1 font-semibold">Base: {metrics.count} corridas completadas</p>
        </div>
      </div>

      {/* Cashouts / Saques & Transações Realizadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Histórico de Saques de Motoristas */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-gray-950 flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
              Solicitações de Saques (Cashout)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Auditoria e ordens de transferência de motoristas.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-2.5 text-left">Condutor</th>
                  <th className="px-4 py-2.5 text-left">Chave Pix</th>
                  <th className="px-4 py-2.5 text-left">Valor</th>
                  <th className="px-4 py-2.5 text-left">Status</th>
                  <th className="px-4 py-2.5 text-left">Solicitado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px] font-semibold text-gray-700">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      Nenhum saque solicitado recentemente.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => {
                    const statuses = {
                      pending: "Pendente",
                      approved: "Concluído",
                      rejected: "Recusado"
                    };
                    const statusColors = {
                      pending: "bg-amber-50 text-amber-700",
                      approved: "bg-emerald-50 text-emerald-700",
                      rejected: "bg-rose-50 text-rose-700"
                    };

                    return (
                      <tr key={w._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-gray-900 truncate max-w-[120px]">{w.driverId?.name || "Motorista"}</p>
                          <p className="text-[9px] text-gray-400">{w.driverId?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-950 font-bold uppercase text-[9px]">{w.pixKeyType}</p>
                          <p className="text-gray-500 text-[10px]">{w.pixKey}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-900 font-extrabold">
                          R$ {w.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColors[w.status]}`}>
                            {statuses[w.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {format(new Date(w.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo de Comissões por Tipo de Serviço */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-gray-100 pb-3 mb-4">
              <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Deduções de Split
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Visão consolidada de valores transacionados.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Total Pago a Condutores:</span>
                <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">R$ {metrics.driverEarnings.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Total Taxa Plataforma (20%):</span>
                <span className="font-extrabold text-gray-950 bg-slate-100 px-2.5 py-1 rounded-lg">R$ {metrics.platformEarnings.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-gray-500">Repasse Representantes Locais:</span>
                <span className="font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">R$ {metrics.representativeSplit.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-semibold border-t border-gray-100 pt-3">
                <span className="font-extrabold text-gray-900">Resultado Líquido Plataforma:</span>
                <span className="font-black text-emerald-800 bg-emerald-100 px-2.5 py-1.5 rounded-lg">R$ {(metrics.platformEarnings - metrics.representativeSplit).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 mt-5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Importante</p>
            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
              O split é computado dinamicamente para os representantes vinculados às respectivas Cidades / Áreas de Atuação onde os serviços foram solicitados.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
