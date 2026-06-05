"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Clock,
  ChevronRight,
  Package,
  Calendar,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { listMarketplaceOrders, StoreOrder } from "@/services/marketplaceService";
import { apiMessage } from "@/services/apiClient";

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await listMarketplaceOrders();
        // Sort orders by newest first
        const sorted = (data || []).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
        setError("");
      } catch (err) {
        setError(apiMessage(err, "Erro ao carregar a lista de pedidos."));
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  // Status Portuguese helper maps
  const statusConfig = {
    pending_payment: { label: "Aguardando Pagamento", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    placed: { label: "Pedido Criado", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    accepted: { label: "Confirmado pela Loja", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20" },
    preparing: { label: "Em Preparação", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
    ready_for_pickup: { label: "Pronto para Retirada", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
    dispatched: { label: "Saiu para Entrega", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    delivered: { label: "Entregue", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    cancelled: { label: "Cancelado", color: "text-rose-400 bg-rose-400/10 border-rose-400/20" },
    refunded: { label: "Reembolsado", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Marketplace</span>
          </Link>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Seus Pedidos</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-black text-white">Seus Pedidos</h1>
          <p className="text-slate-400 text-sm mt-1">Acompanhe e gerencie seu histórico de compras no Leva+.</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900 border border-slate-800 rounded-3xl h-36 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-3xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-rose-300">Falha ao carregar pedidos</p>
              <p className="text-sm text-rose-400/80 mt-1">{error}</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <ShoppingBag className="w-20 h-20 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300">Nenhum pedido realizado ainda</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
              Navegue pelas lojas disponíveis, adicione produtos ao carrinho e faça suas primeiras compras.
            </p>
            <Link
              href="/"
              className="inline-block mt-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
            >
              Ir para o Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status] || {
                label: order.status,
                color: "text-slate-400 bg-slate-400/10 border-slate-400/20",
              };
              const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <div
                  key={order._id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all shadow-xl hover:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Info Column */}
                  <div className="space-y-3 flex-grow">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-black text-emerald-400 tracking-wider uppercase">
                        Pedido {order.orderNumber}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <h2 className="text-lg font-black text-white">
                      {typeof order.storeId === "object" ? order.storeId.name : "Estabelecimento"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Column */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Pago</span>
                      <span className="text-lg font-black text-emerald-400">
                        R$ {order.pricing.total.toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/orders/${order._id}`}
                      className="bg-slate-800 hover:bg-slate-750 text-white font-bold p-3 rounded-2xl flex items-center justify-center transition-colors border border-slate-750"
                    >
                      <ChevronRight className="w-5 h-5 text-emerald-400" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
