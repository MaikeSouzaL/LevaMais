"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  getMarketplaceStoreBySlug,
  getMarketplaceStoreProducts,
} from "@/services/marketplaceService";
import type { Store, StoreProduct } from "@/types";

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

export default function StoreDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [cartCount, setCartCount] = useState<number>(0);

  // Estados do Modal do Produto
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [productQty, setProductQty] = useState<number>(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Array<{ groupName: string; optionName: string; priceDelta: number }>
  >([]);
  const [notes, setNotes] = useState<string>("");
  const [modalTotal, setModalTotal] = useState<number>(0);

  // Estado do Modal de Conflito de Carrinho (Loja diferente)
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [pendingItemToAdd, setPendingItemToAdd] = useState<{
    product: StoreProduct;
    qty: number;
    modifiers: any[];
    notes: string;
  } | null>(null);

  // Carregar informações da loja e produtos
  useEffect(() => {
    if (!slug) return;
    async function loadStoreData() {
      try {
        const { store, readiness } = await getMarketplaceStoreBySlug(slug);
        setStore(store);
        setReadiness(readiness);

        const prods = await getMarketplaceStoreProducts(store._id);
        setProducts(prods);
      } catch (error) {
        console.error("Erro ao carregar dados da loja:", error);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [slug]);

  // Atualizar contador do carrinho
  useEffect(() => {
    function updateCartCount() {
      try {
        const cartData = localStorage.getItem("leva_mais_cart");
        if (cartData) {
          const parsed = JSON.parse(cartData);
          if (parsed && Array.isArray(parsed.items)) {
            const count = parsed.items.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0);
            setCartCount(count);
            return;
          }
        }
        setCartCount(0);
      } catch {
        setCartCount(0);
      }
    }

    updateCartCount();
    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cart-updated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, []);

  // Calcular o valor total do produto selecionado no Modal (preço base + adicionais * quantidade)
  useEffect(() => {
    if (!selectedProduct) return;
    const modifiersDelta = selectedModifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);
    setModalTotal((selectedProduct.basePrice + modifiersDelta) * productQty);
  }, [selectedProduct, selectedModifiers, productQty]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-bold text-sm">Carregando cardápio...</span>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-black text-slate-800">Loja não encontrada</h2>
        <p className="text-slate-400 mt-2">O estabelecimento que você busca não existe ou está desativado.</p>
        <Link href="/" className="mt-6 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold">
          Voltar para Home
        </Link>
      </div>
    );
  }

  // Agrupar produtos por Categoria
  const categoriesMap: { [key: string]: { name: string; products: StoreProduct[] } } = {};
  products.forEach((prod) => {
    const categoryId = prod.categoryId?._id || "outros";
    const categoryName = prod.categoryId?.name || "Outros";

    if (!categoriesMap[categoryId]) {
      categoriesMap[categoryId] = {
        name: categoryName,
        products: [],
      };
    }
    categoriesMap[categoryId].products.push(prod);
  });

  const categoriesList = Object.values(categoriesMap);

  const isOpen = store.isOpenManualOverride === "force_open" || 
    (store.isOpenManualOverride === "auto" && readiness?.openNow);

  // Abrir Modal do Produto
  function handleProductClick(product: StoreProduct) {
    if (!isOpen) return; // Não permitir abrir se loja fechada
    setSelectedProduct(product);
    setProductQty(1);
    setSelectedModifiers([]);
    setNotes("");
  }

  // Lidar com seleção de opcionais
  function handleModifierSelect(groupName: string, optionName: string, priceDelta: number, max: number) {
    setSelectedModifiers((prev) => {
      const existingInGroup = prev.filter((mod) => mod.groupName === groupName);

      // Se for seleção única (max === 1)
      if (max === 1) {
        const filtered = prev.filter((mod) => mod.groupName !== groupName);
        // Se já estava selecionado a mesma opção, desmarca
        if (existingInGroup.some((mod) => mod.optionName === optionName)) {
          return filtered;
        }
        return [...filtered, { groupName, optionName, priceDelta }];
      }

      // Se for múltiplo
      const alreadyChecked = prev.some((mod) => mod.groupName === groupName && mod.optionName === optionName);
      if (alreadyChecked) {
        return prev.filter((mod) => !(mod.groupName === groupName && mod.optionName === optionName));
      }

      if (existingInGroup.length >= max) {
        // Atingiu o limite, remove o primeiro inserido do grupo e adiciona o novo
        const filtered = prev.filter((mod) => mod !== existingInGroup[0]);
        return [...filtered, { groupName, optionName, priceDelta }];
      }

      return [...prev, { groupName, optionName, priceDelta }];
    });
  }

  // Adicionar Item ao Carrinho no LocalStorage
  function executeAddToCart(product: StoreProduct, qty: number, modifiers: any[], itemNotes: string) {
    try {
      const cartData = localStorage.getItem("leva_mais_cart");
      let currentCart: LocalCart = { storeId: store!._id, storeName: store!.name, items: [] };

      if (cartData) {
        const parsed = JSON.parse(cartData);
        if (parsed && parsed.storeId === store!._id) {
          currentCart = parsed;
        } else if (parsed && parsed.storeId !== store!._id && parsed.items.length > 0) {
          // Conflito de loja! Abre o modal de conflito
          setPendingItemToAdd({ product, qty, modifiers, notes: itemNotes });
          setConflictModalOpen(true);
          return;
        }
      }

      const itemTotal = product.basePrice + modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);

      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        quantity: qty,
        basePrice: product.basePrice,
        modifiers,
        notes: itemNotes,
        lineTotal: itemTotal * qty,
      };

      currentCart.items.push(newItem);
      localStorage.setItem("leva_mais_cart", JSON.stringify(currentCart));

      // Disparar evento
      window.dispatchEvent(new Event("cart-updated"));
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
    }
  }

  function handleConfirmClearCart() {
    if (!pendingItemToAdd) return;
    try {
      const itemTotal =
        pendingItemToAdd.product.basePrice +
        pendingItemToAdd.modifiers.reduce((sum, mod) => sum + mod.priceDelta, 0);

      const newCart: LocalCart = {
        storeId: store!._id,
        storeName: store!.name,
        items: [
          {
            productId: pendingItemToAdd.product._id,
            name: pendingItemToAdd.product.name,
            quantity: pendingItemToAdd.qty,
            basePrice: pendingItemToAdd.product.basePrice,
            modifiers: pendingItemToAdd.modifiers,
            notes: pendingItemToAdd.notes,
            lineTotal: itemTotal * pendingItemToAdd.qty,
          },
        ],
      };

      localStorage.setItem("leva_mais_cart", JSON.stringify(newCart));
      window.dispatchEvent(new Event("cart-updated"));
      setConflictModalOpen(false);
      setPendingItemToAdd(null);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Erro ao limpar e recomeçar carrinho:", error);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Navegação e Banner */}
      <div className="bg-slate-900 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between relative z-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para Início</span>
          </Link>

          <Link href="/cart" className="relative p-2 hover:bg-slate-800 rounded-full transition-all duration-200">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-slate-900">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Cover Photo */}
        <div className="h-60 w-full relative bg-slate-800">
          {store.cover ? (
            <img src={store.cover} alt={store.name} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Informações da Loja */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 -mt-20 relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          {/* Logo */}
          <div className="w-28 h-28 rounded-3xl border-4 border-slate-900 bg-white overflow-hidden shadow-2xl flex-shrink-0">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                <ShoppingBag className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Nome e detalhes */}
          <div className="flex-grow">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{store.name}</h1>
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-black shadow-md border ${
                  isOpen
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                {isOpen ? "ABERTO" : "FECHADO"}
              </span>
            </div>

            <p className="text-slate-300 text-sm mt-2 flex items-center justify-center sm:justify-start gap-1">
              <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                {store.address?.street}, {store.address?.number} - {store.address?.neighborhood},{" "}
                {store.address?.city}
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 mt-4 text-sm font-semibold text-slate-300">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{store.rating?.average?.toFixed(1) || "5.0"} ({store.rating?.count || 0} avaliações)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{store.prepTimeMinutes} min</span>
              </div>
              {store.minOrderValue > 0 && (
                <div className="text-slate-300">
                  Pedido Mínimo: <span className="text-white font-bold">R$ {store.minOrderValue.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Conteúdo */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filtro Lateral / Menu Categorias */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sticky top-24 shadow-sm">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Categorias</h3>
            <ul className="space-y-1">
              {categoriesList.map((cat, idx) => (
                <li key={idx}>
                  <a
                    href={`#cat-${idx}`}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-all"
                  >
                    {cat.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Listagem de Produtos */}
        <div className="lg:col-span-3 space-y-12">
          {!isOpen && (
            <div className="bg-slate-900 border border-slate-800 text-slate-300 p-4 rounded-3xl flex items-center gap-3 shadow-md">
              <AlertTriangle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-white">Este estabelecimento está fechado no momento.</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Você pode visualizar o cardápio, mas a adição de produtos ao carrinho só é permitida durante o funcionamento.
                </p>
              </div>
            </div>
          )}

          {categoriesList.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <ShoppingBag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Cardápio vazio</h3>
              <p className="text-slate-400 mt-1">Este estabelecimento ainda não cadastrou produtos.</p>
            </div>
          ) : (
            categoriesList.map((cat, idx) => (
              <section key={idx} id={`cat-${idx}`} className="scroll-mt-24">
                <h2 className="text-2xl font-black text-slate-800 border-b border-slate-200 pb-2 mb-6">
                  {cat.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {cat.products.map((product) => (
                    <button
                      key={product._id}
                      disabled={!isOpen}
                      onClick={() => handleProductClick(product)}
                      className={`flex text-left bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm p-4 gap-4 transition-all duration-300 ${
                        isOpen
                          ? "hover:shadow-md hover:border-slate-200 cursor-pointer"
                          : "opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base line-clamp-1">{product.name}</h4>
                          <p className="text-slate-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {product.description || "Nenhuma descrição disponível."}
                          </p>
                        </div>
                        <span className="font-extrabold text-emerald-600 text-base mt-4">
                          R$ {product.basePrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 overflow-hidden flex-shrink-0 border border-slate-100">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ShoppingBag className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>

      {/* Modal Interativo do Produto */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative border border-slate-100 animate-scale-up">
            {/* Fechar botão */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 bg-slate-900/60 hover:bg-slate-900 text-white p-2 rounded-full z-10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Imagem Cabeçalho do Modal */}
            {selectedProduct.image && (
              <div className="h-48 w-full relative bg-slate-100 flex-shrink-0">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">{selectedProduct.name}</h3>
                <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                  {selectedProduct.description || "Nenhuma descrição disponível."}
                </p>
                <div className="mt-3 text-emerald-600 font-extrabold text-lg">
                  R$ {selectedProduct.basePrice.toFixed(2)}
                </div>
              </div>

              {/* Opcionais / Modificadores */}
              {(selectedProduct.modifierGroups || []).map((group, groupIdx) => {
                const selectedCount = selectedModifiers.filter((m) => m.groupName === group.name).length;

                return (
                  <div key={groupIdx} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{group.name}</span>
                        <span className="text-xs text-slate-400">
                          {group.min > 0 ? `Selecione de ${group.min} a ${group.max}` : `Escolha até ${group.max}`}
                        </span>
                      </div>
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                        {selectedCount}/{group.max}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {group.options.map((option, optIdx) => {
                        const isChecked = selectedModifiers.some(
                          (m) => m.groupName === group.name && m.optionName === option.name,
                        );

                        return (
                          <button
                            key={optIdx}
                            onClick={() =>
                              handleModifierSelect(group.name, option.name, option.priceDelta, group.max)
                            }
                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                              isChecked
                                ? "bg-emerald-50 border-emerald-300 text-slate-900"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <div
                                className={`w-4 border-2 flex items-center justify-center ${
                                  group.max === 1 ? "rounded-full" : "rounded"
                                } ${
                                  isChecked ? "bg-emerald-500 border-emerald-500" : "border-slate-300"
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                              </div>
                              <span>{option.name}</span>
                            </div>
                            {option.priceDelta !== 0 && (
                              <span className="text-xs font-bold text-slate-500">
                                {option.priceDelta > 0 ? "+" : ""} R$ {option.priceDelta.toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Observações */}
              <div className="space-y-2">
                <label className="block text-slate-700 font-bold text-sm">Observações</label>
                <textarea
                  placeholder="Ex: sem cebola, sem maionese..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 flex items-center gap-4 bg-slate-50 flex-shrink-0">
              {/* Qty Selector */}
              <div className="flex items-center border border-slate-200 rounded-xl bg-white">
                <button
                  onClick={() => setProductQty((q) => Math.max(1, q - 1))}
                  className="p-3 text-slate-500 hover:text-slate-800"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-3 font-bold text-slate-800 text-base">{productQty}</span>
                <button
                  onClick={() => setProductQty((q) => q + 1)}
                  className="p-3 text-slate-500 hover:text-slate-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add Button */}
              <button
                onClick={() => executeAddToCart(selectedProduct, productQty, selectedModifiers, notes)}
                className="flex-grow bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-6 rounded-xl shadow-lg flex justify-between items-center transition-all cursor-pointer active:scale-95"
              >
                <span>Adicionar</span>
                <span>R$ {modalTotal.toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conflito de Carrinho */}
      {conflictModalOpen && pendingItemToAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg">Substituir carrinho?</h3>
              <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                Você já tem itens de outro estabelecimento no carrinho. Deseja limpar o carrinho atual e adicionar o item da loja{" "}
                <strong>{store.name}</strong>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setConflictModalOpen(false);
                  setPendingItemToAdd(null);
                }}
                className="flex-1 border border-slate-200 hover:bg-slate-50 py-2.5 rounded-xl text-slate-600 font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClearCart}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 py-2.5 rounded-xl font-bold text-sm shadow-md"
              >
                Sim, Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
