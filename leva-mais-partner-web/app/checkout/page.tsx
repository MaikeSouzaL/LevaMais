"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  CreditCard,
  Wallet,
  MapPin,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  createMarketplaceOrder,
  validateMarketplaceCart,
  CartValidationResult,
} from "@/services/marketplaceService";
import { getClientWallet, ClientWallet } from "@/services/authService";
import { apiClient, apiMessage } from "@/services/apiClient";

interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  modifiers: Array<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }>;
  notes: string;
  lineTotal: number;
}

interface LocalCart {
  storeId: string;
  storeName: string;
  items: CartItem[];
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<LocalCart | null>(null);
  const [wallet, setWallet] = useState<ClientWallet | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<"platform" | "pickup">("platform");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card" | "pix">("wallet");
  
  // Address state with defaults
  const [addressLine, setAddressLine] = useState("Av. Paulista, 1000 - Bela Vista, São Paulo - SP");
  const [latitude, setLatitude] = useState(-23.56168);
  const [longitude, setLongitude] = useState(-46.65613);

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Cart Validation and calculations
  const [validation, setValidation] = useState<CartValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load cart and wallet balance on mount
  useEffect(() => {
    try {
      const cartData = localStorage.getItem("leva_mais_cart");
      if (cartData) {
        const parsed = JSON.parse(cartData);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          setCart(parsed);
        } else {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }

    async function loadWallet() {
      try {
        const data = await getClientWallet();
        setWallet(data);
      } catch (err) {
        console.error("Erro ao carregar saldo da carteira:", err);
      }
    }
    loadWallet();
  }, [router]);

  // Re-run validation whenever deliveryMode or cart changes
  useEffect(() => {
    if (!cart) return;

    let isSubscribed = true;

    async function validate() {
      setValidating(true);
      setValidationError("");
      try {
        const payloadItems = cart!.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          modifiers: item.modifiers.map((mod) => ({
            groupName: mod.groupName,
            optionName: mod.optionName,
          })),
          notes: item.notes,
        }));

        const result = await validateMarketplaceCart(cart!.storeId, payloadItems);
        if (isSubscribed) {
          setValidation(result);
        }
      } catch (err) {
        if (isSubscribed) {
          setValidationError(apiMessage(err, "Erro ao validar carrinho com a loja."));
        }
      } finally {
        if (isSubscribed) {
          setValidating(false);
        }
      }
    }

    validate();

    return () => {
      isSubscribed = false;
    };
  }, [cart, deliveryMode]);

  // Apply Coupon
  async function handleApplyCoupon() {
    if (!couponCode.trim() || !cart) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const subtotal = validation ? validation.pricing.subtotal : cart.items.reduce((s, i) => s + i.lineTotal, 0);
      const res = await apiClient.get(`/promotions/validate/${couponCode.trim().toUpperCase()}`, {
        params: {
          amount: subtotal,
          serviceType: "marketplace",
          storeId: cart.storeId,
        },
      });

      const promoData = res.data?.promotion;
      if (promoData) {
        setAppliedCoupon(promoData.code);
        setDiscountAmount(promoData.discountAmount || 0);
      } else {
        throw new Error("Cupom inválido");
      }
    } catch (err) {
      setCouponError(apiMessage(err, "Cupom inválido ou expirado."));
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setApplyingCoupon(false);
    }
  }

  // Remove Coupon
  function handleRemoveCoupon() {
    setCouponCode("");
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponError("");
  }

  // Calculate totals
  const subtotal = validation ? validation.pricing.subtotal : (cart?.items.reduce((s, i) => s + i.lineTotal, 0) || 0);
  const deliveryFee = deliveryMode === "platform" ? (validation?.pricing.deliveryFee || 5.00) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);

  // Submit Order
  async function handleSubmitOrder() {
    if (!cart) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const payloadItems = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        modifiers: item.modifiers.map((mod) => ({
          groupName: mod.groupName,
          optionName: mod.optionName,
        })),
        notes: item.notes,
      }));

      const orderPayload = {
        storeId: cart.storeId,
        items: payloadItems,
        paymentMethod,
        deliveryMode,
        address: deliveryMode === "platform" ? {
          latitude,
          longitude,
          addressLine,
        } : undefined,
        promotionCode: appliedCoupon || undefined,
      };

      const order = await createMarketplaceOrder(orderPayload);
      
      // Clear Cart
      localStorage.removeItem("leva_mais_cart");
      window.dispatchEvent(new Event("cart-updated"));
      
      // Redirect to success / orders page
      router.push(`/orders/${order._id}`);
    } catch (err) {
      setSubmitError(apiMessage(err, "Erro ao finalizar o pedido. Verifique seus dados e saldo."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!cart) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShoppingBag className="w-12 h-12 text-emerald-400" />
          <span className="text-slate-400 font-medium">Carregando checkout...</span>
        </div>
      </div>
    );
  }

  const isWalletInsufficient = paymentMethod === "wallet" && wallet !== null && wallet.balance < total;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            href="/cart"
            className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Carrinho</span>
          </Link>
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300">Checkout Seguro</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Form Side */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Store Title */}
            <div>
              <span className="text-xs text-emerald-400 font-black tracking-wider uppercase">Finalizando Pedido em</span>
              <h1 className="text-3xl font-black tracking-tight text-white mt-1">{cart.storeName}</h1>
            </div>

            {/* Delivery Mode Selection */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <span>Como deseja receber?</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMode("platform")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    deliveryMode === "platform"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <span className="block font-black text-sm text-white">Entrega por Leva+</span>
                  <span className="block text-xs mt-1 text-slate-400">Receba no seu endereço</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryMode("pickup")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    deliveryMode === "pickup"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <span className="block font-black text-sm text-white">Retirada na Loja</span>
                  <span className="block text-xs mt-1 text-slate-400">Sem taxa de entrega</span>
                </button>
              </div>

              {/* Delivery Address fields */}
              {deliveryMode === "platform" && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Endereço de Entrega</label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      placeholder="Rua, Número, Bairro, Cidade - Estado"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Payment Method Section */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Forma de Pagamento</span>
              </h2>

              <div className="space-y-3">
                {/* LevaPay Wallet */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("wallet")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    paymentMethod === "wallet"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="block font-black text-sm text-white">Saldo LevaPay (Escrow)</span>
                      <span className="block text-xs text-slate-400">
                        {wallet ? `Disponível: R$ ${wallet.balance.toFixed(2)}` : "Carregando saldo..."}
                      </span>
                    </div>
                  </div>
                  {wallet !== null && wallet.balance < total && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full">
                      Saldo Insuficiente
                    </span>
                  )}
                </button>

                {/* Pix */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("pix")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    paymentMethod === "pix"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center font-bold text-[9px] text-emerald-400">
                    PX
                  </div>
                  <div>
                    <span className="block font-black text-sm text-white">PIX</span>
                    <span className="block text-xs text-slate-400">Aprovação imediata</span>
                  </div>
                </button>

                {/* Credit Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    paymentMethod === "card"
                      ? "border-emerald-500 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="block font-black text-sm text-white">Cartão de Crédito</span>
                    <span className="block text-xs text-slate-400">Visa, Mastercard, Elo</span>
                  </div>
                </button>
              </div>

              {isWalletInsufficient && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-start gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-rose-300">Saldo LevaPay Insuficiente</p>
                    <p className="text-xs text-rose-400/80 mt-1">
                      O valor total do pedido (R$ {total.toFixed(2)}) é maior do que o seu saldo disponível (R$ {wallet?.balance.toFixed(2)}). Adicione saldo à sua carteira ou selecione outro método de pagamento.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Cart Summary Side */}
          <div className="space-y-6">
            
            {/* Cart Items Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="font-black text-white text-lg border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Resumo da Compra</span>
                <span className="text-xs font-bold text-slate-400">
                  {cart.items.length} {cart.items.length === 1 ? "item" : "itens"}
                </span>
              </h3>

              {/* Items List */}
              <div className="space-y-4 max-h-60 overflow-y-auto divide-y divide-slate-800/50">
                {cart.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start pt-3 first:pt-0">
                    <div className="pr-4">
                      <p className="font-bold text-sm text-slate-200">
                        {item.quantity}x {item.name}
                      </p>
                      {item.modifiers.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.modifiers.map(m => m.optionName).join(", ")}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-sm text-slate-200 whitespace-nowrap">
                      R$ {item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="pt-4 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cupom de Desconto</label>
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="EX: LEVA10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 flex-grow"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 disabled:text-slate-500 font-extrabold px-4 py-2 rounded-xl text-xs transition-colors"
                    >
                      {applyingCoupon ? "..." : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-black text-emerald-400">{appliedCoupon}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-rose-400 hover:text-rose-500 transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-rose-400 mt-2">{couponError}</p>}
              </div>

              {/* Pricing breakdown */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-200">R$ {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm text-slate-400">
                  <span>Taxa de Entrega</span>
                  <span className="font-semibold text-slate-200">
                    {deliveryMode === "platform" ? `R$ ${deliveryFee.toFixed(2)}` : "Grátis"}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Desconto</span>
                    <span className="font-semibold">- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-black text-white border-t border-slate-800 pt-3">
                  <span>Total</span>
                  <span className="text-emerald-400">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Shield */}
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Seu pagamento está seguro com LevaPay. O saldo ficará retido até a entrega ser concluída com sucesso.
                </p>
              </div>

              {submitError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs">
                  {submitError}
                </div>
              )}

              {/* Checkout CTA */}
              <button
                type="button"
                disabled={submitting || validating || !!validationError || isWalletInsufficient}
                onClick={handleSubmitOrder}
                className={`w-full py-4 rounded-2xl font-black text-slate-950 shadow-lg text-center transition-all ${
                  submitting || validating || !!validationError || isWalletInsufficient
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                    : "bg-emerald-500 hover:bg-emerald-400 cursor-pointer active:scale-95 shadow-emerald-500/15"
                }`}
              >
                {submitting ? "Finalizando Pedido..." : validating ? "Validando..." : "Confirmar e Pagar"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
