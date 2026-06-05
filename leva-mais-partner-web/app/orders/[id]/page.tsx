"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Check,
  ShoppingBag,
  Store,
  Wallet,
  Calendar,
} from "lucide-react";
import { getMarketplaceOrderDetail, StoreOrder } from "@/services/marketplaceService";
import { apiMessage } from "@/services/apiClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id: orderId } = use(params);
  
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrder() {
      try {
        const data = await getMarketplaceOrderDetail(orderId);
        if (active) {
          setOrder(data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(apiMessage(err, "Não foi possível carregar os detalhes do pedido."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrder, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShoppingBag className="w-12 h-12 text-emerald-400 animate-bounce" />
          <span className="text-slate-400 font-medium">Carregando detalhes do pedido...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-xl font-black text-white">Pedido não encontrado</h3>
            <p className="text-slate-400 mt-2 text-sm">
              {error || "Não foi possível recuperar as informações deste pedido."}
            </p>
          </div>
          <Link
            href="/"
            className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl transition-colors text-sm"
          >
            Voltar ao Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Helper to map status to Portuguese labels & colors
  const statusConfig: Record<string, { label: string; color: string; step: number }> = {
    pending_payment: { label: "Aguardando Pagamento", color: "text-amber-400 bg-amber-400/10 border-amber-400/20", step: 0 },
    placed: { label: "Pedido Criado", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", step: 1 },
    accepted: { label: "Confirmado pela Loja", color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20", step: 2 },
    preparing: { label: "Em Preparação", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", step: 3 },
    ready_for_pickup: { label: "Pronto para Retirada", color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20", step: 4 },
    dispatched: { label: "Saiu para Entrega", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", step: 4 },
    delivered: { label: "Entregue", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", step: 5 },
    cancelled: { label: "Cancelado", color: "text-rose-400 bg-rose-400/10 border-rose-400/20", step: -1 },
    refunded: { label: "Reembolsado", color: "text-rose-500 bg-rose-500/10 border-rose-500/20", step: -1 },
  };

  const currentStatusInfo = statusConfig[order.status] || { label: order.status, color: "text-slate-400 bg-slate-400/10 border-slate-400/20", step: 0 };

  const steps = [
    { label: "Criado", icon: Package, key: "placed" },
    { label: "Confirmado", icon: CheckCircle2, key: "accepted" },
    { label: "Preparo", icon: Clock, key: "preparing" },
    { label: order.payment.payoutStatus === "pickup" || (order as any).deliveryMode === "pickup" ? "Retirada" : "Entrega", icon: Truck, key: "dispatched" },
    { label: "Concluído", icon: Check, key: "delivered" },
  ];

  const currentStepIndex = currentStatusInfo.step;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/orders"
            className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Meus Pedidos</span>
          </Link>
          <div className="text-xs text-slate-400">
            ID: <span className="font-mono text-slate-300">{order._id}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Status Alert Banner */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-black tracking-wider text-slate-400 uppercase">Pedido {order.orderNumber}</span>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black text-white">Status do Pedido</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${currentStatusInfo.color}`}>
                {currentStatusInfo.label}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Criado em {new Date(order.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold text-slate-300">Atualizações em tempo real ativas</span>
          </div>
        </section>

        {/* Stepper Status Progress */}
        {currentStepIndex >= 0 && (
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <div className="relative flex items-center justify-between">
              
              {/* Progress Line Bar */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{
                    width: `${
                      currentStepIndex === 5
                        ? 100
                        : ((currentStepIndex - 1) / (steps.length - 1)) * 100
                    }%`,
                  }}
                />
              </div>

              {/* Stepper Circles */}
              {steps.map((step, idx) => {
                const isCompleted = idx + 1 < currentStepIndex || currentStepIndex === 5;
                const isActive = idx + 1 === currentStepIndex && currentStepIndex !== 5;
                const Icon = step.icon;

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted
                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                          : isActive
                          ? "bg-slate-950 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 scale-110"
                          : "bg-slate-950 border-slate-800 text-slate-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold whitespace-nowrap hidden sm:inline ${
                        isCompleted || isActive ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}

            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Order Details & Summary */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Store details */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Store className="w-5 h-5 text-emerald-400" />
                <span>Dados do Estabelecimento</span>
              </h3>
              <div className="flex gap-4">
                <div className="flex-grow">
                  <h4 className="font-extrabold text-white text-base">
                    {typeof order.storeId === "object" ? order.storeId.name : "Estabelecimento"}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {typeof order.storeId === "object" ? order.storeId.address : ""}
                  </p>
                </div>
              </div>
            </section>

            {/* Items Summary */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>Itens do Pedido</span>
              </h3>

              <div className="divide-y divide-slate-800">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-4 first:pt-0 last:pb-0 flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-sm">
                        {item.quantity}x {item.name}
                      </p>
                      {item.modifiers.length > 0 && (
                        <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                          {item.modifiers.map((mod, modIdx) => (
                            <span key={modIdx} className="mr-2">
                              • {mod.optionName}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-xs text-slate-400 italic mt-1.5">
                          Obs: {item.notes}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm text-slate-200">
                      R$ {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Timeline */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <Calendar className="w-5 h-5 text-emerald-400" />
                <span>Histórico do Pedido</span>
              </h3>

              <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
                {(order.statusHistory || []).slice().reverse().map((hist, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-emerald-500"></span>
                    <p className="text-sm font-black text-white">{statusConfig[hist.status]?.label || hist.status}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(hist.at).toLocaleString("pt-BR")} por {hist.by === "client" ? "Você" : hist.by === "store" ? "Loja" : "Sistema"}
                    </p>
                    {hist.note && <p className="text-xs text-slate-400 italic mt-1 bg-slate-950/40 p-2 rounded-lg">{hist.note}</p>}
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Pricing Breakdown Sidebar */}
          <div className="space-y-6">
            
            {/* Financial Info */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="text-lg font-black text-white pb-3 border-b border-slate-800">Resumo Financeiro</h3>

              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-200">R$ {order.pricing.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Taxa de Entrega</span>
                  <span className="font-semibold text-slate-200">
                    {order.pricing.deliveryFee > 0 ? `R$ ${order.pricing.deliveryFee.toFixed(2)}` : "Grátis"}
                  </span>
                </div>

                {order.pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Desconto {order.pricing.promotionCode ? `(${order.pricing.promotionCode})` : ""}</span>
                    <span className="font-semibold">- R$ {order.pricing.discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-white border-t border-slate-800 pt-3">
                  <span>Total Pago</span>
                  <span className="text-emerald-400">R$ {order.pricing.total.toFixed(2)}</span>
                </div>
              </div>
            </section>

            {/* Payment & Delivery Details */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider">Informações Gerais</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Wallet className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-bold text-white">Pagamento</p>
                    <p className="text-xs text-slate-400 capitalize">
                      {order.payment.method === "wallet" ? "Saldo LevaPay (Escrow)" : order.payment.method}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-bold text-white">Forma de recebimento</p>
                    <p className="text-xs text-slate-400">
                      {(order as any).deliveryMode === "pickup" ? "Retirada na loja" : "Entrega em domicílio"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>

        </div>
      </main>
    </div>
  );
}
