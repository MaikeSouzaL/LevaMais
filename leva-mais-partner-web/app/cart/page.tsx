"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { validateMarketplaceCart, CartValidationResult } from "@/services/marketplaceService";
import { apiMessage } from "@/services/apiClient";

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

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<LocalCart | null>(null);
  const [validationResult, setValidationResult] = useState<CartValidationResult | null>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [validating, setValidating] = useState<boolean>(false);

  // Carregar carrinho inicial do localStorage
  useEffect(() => {
    function loadCart() {
      try {
        const cartData = localStorage.getItem("leva_mais_cart");
        if (cartData) {
          const parsed = JSON.parse(cartData);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
            Promise.resolve().then(() => {
              setCart(parsed);
            });
            return;
          }
        }
        Promise.resolve().then(() => {
          setCart(null);
          setValidationResult(null);
          setValidationError("");
        });
      } catch {
        Promise.resolve().then(() => {
          setCart(null);
          setValidationResult(null);
          setValidationError("");
        });
      }
    }

    loadCart();
    window.addEventListener("storage", loadCart);
    window.addEventListener("cart-updated", loadCart);

    return () => {
      window.removeEventListener("storage", loadCart);
      window.removeEventListener("cart-updated", loadCart);
    };
  }, []);

  // Executar validação no backend sempre que o carrinho for alterado
  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      return;
    }

    let isSubscribed = true;

    async function performValidation() {
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
          setValidationResult(result);
        }
      } catch (error) {
        if (isSubscribed) {
          setValidationResult(null);
          setValidationError(apiMessage(error, "Erro ao validar o carrinho com a loja."));
        }
      } finally {
        if (isSubscribed) {
          setValidating(false);
        }
      }
    }

    performValidation();

    return () => {
      isSubscribed = false;
    };
  }, [cart]);

  // Salvar alterações e despachar evento
  function saveCart(updatedCart: LocalCart | null) {
    if (updatedCart && updatedCart.items.length > 0) {
      localStorage.setItem("leva_mais_cart", JSON.stringify(updatedCart));
      setCart({ ...updatedCart });
    } else {
      localStorage.removeItem("leva_mais_cart");
      setCart(null);
    }
    window.dispatchEvent(new Event("cart-updated"));
  }

  // Alterar quantidade de item no carrinho
  function handleUpdateQty(productId: string, idx: number, delta: number) {
    if (!cart) return;
    const updatedItems = [...cart.items];
    const item = updatedItems[idx];
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(idx);
      return;
    }

    const itemTotal = item.basePrice + item.modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);

    updatedItems[idx] = {
      ...item,
      quantity: newQty,
      lineTotal: itemTotal * newQty,
    };

    saveCart({
      ...cart,
      items: updatedItems,
    });
  }

  // Remover item do carrinho
  function handleRemoveItem(idx: number) {
    if (!cart) return;
    const updatedItems = cart.items.filter((_, i) => i !== idx);
    saveCart({
      ...cart,
      items: updatedItems,
    });
  }

  // Limpar carrinho inteiro
  function handleClearCart() {
    saveCart(null);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Marketplace</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <h1 className="text-3xl font-black text-slate-800 mb-8">Seu Carrinho</h1>

        {!cart ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
            <ShoppingBag className="w-20 h-20 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Seu carrinho está vazio</h3>
            <p className="text-slate-400 mt-2">Navegue pelas lojas do Leva+ e adicione itens para comprar.</p>
            <Link
              href="/"
              className="inline-block mt-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Ir para o Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-150 rounded-3xl shadow-sm p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Comprando de</span>
                    <h2 className="text-lg font-black text-slate-800">{cart.storeName}</h2>
                  </div>
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Limpar tudo
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {cart.items.map((item, idx) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 justify-between">
                      <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>

                        {/* Modificadores detalhados */}
                        {item.modifiers.length > 0 && (
                          <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                            {item.modifiers.map((mod, modIdx) => (
                              <div key={modIdx}>
                                • {mod.groupName}: <span className="font-semibold">{mod.optionName}</span>{" "}
                                {mod.priceDelta > 0 && `(+ R$ ${mod.priceDelta.toFixed(2)})`}
                              </div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-xs text-slate-400 italic mt-2 bg-slate-50 border border-slate-100 p-2 rounded-lg">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>

                      {/* Controle de quantidade e preço */}
                      <div className="flex flex-col items-end gap-3 flex-shrink-0">
                        <span className="font-extrabold text-slate-800 text-sm">
                          R$ {item.lineTotal.toFixed(2)}
                        </span>

                        <div className="flex items-center border border-slate-200 rounded-xl bg-white text-slate-600 scale-90">
                          <button
                            onClick={() => handleUpdateQty(item.productId, idx, -1)}
                            className="p-2 hover:bg-slate-50"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 font-bold text-slate-800 text-sm">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQty(item.productId, idx, 1)}
                            className="p-2 hover:bg-slate-50"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sumário e Validação */}
            <div className="lg:col-span-1 space-y-6">
              {/* Alerta de Erro de Validação */}
              {validationError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-3xl flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-rose-950">Atenção</p>
                    <p className="text-xs text-rose-700 mt-1 leading-relaxed">{validationError}</p>
                  </div>
                </div>
              )}

              {/* Status de Validação */}
              {!validationError && !validating && validationResult && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-3xl flex items-center gap-3 shadow-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-xs text-emerald-950">Pedido Válido</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Itens e preços confirmados com o estabelecimento.
                    </p>
                  </div>
                </div>
              )}

              {/* Box de Resumo Financeiro */}
              <div className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm space-y-6">
                <h3 className="font-extrabold text-slate-800 text-lg">Resumo do Pedido</h3>

                <div className="space-y-3 text-sm font-semibold text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-slate-800">
                      R${" "}
                      {validationResult
                        ? validationResult.pricing.subtotal.toFixed(2)
                        : cart.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span className="text-slate-800">
                      {validationResult && validationResult.pricing && typeof validationResult.pricing.deliveryFee === "number" && validationResult.pricing.deliveryFee > 0
                        ? `R$ ${validationResult.pricing.deliveryFee.toFixed(2)}`
                        : "A calcular"}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-extrabold">
                    <span className="text-slate-800">Total</span>
                    <span className="text-emerald-600">
                      R${" "}
                      {validationResult
                        ? validationResult.pricing.total.toFixed(2)
                        : cart.items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  disabled={!!validationError || validating}
                  onClick={() => router.push("/checkout")}
                  className={`w-full py-4 rounded-2xl font-black text-center shadow-lg transition-all text-base ${
                    !!validationError || validating
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-95"
                  }`}
                >
                  {validating ? "Validando..." : "Continuar para Checkout"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
