"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  ShoppingBag,
  Store as StoreIcon,
  Star,
  Clock,
  LogIn,
  Utensils,
  Activity,
  ShoppingCart,
  Compass,
  ClipboardList,
} from "lucide-react";
import {
  getMarketplaceCategories,
  getMarketplaceStores,
  CategoryItem,
} from "@/services/marketplaceService";
import type { Store } from "@/types";
import { apiClient, getToken } from "@/services/apiClient";

interface CityItem {
  _id: string;
  name: string;
  state: string;
  isActive: boolean;
}

export default function Home() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasToken, setHasToken] = useState<boolean>(false);

  // Carregar dados iniciais
  useEffect(() => {
    setHasToken(!!getToken());
    async function loadInitialData() {
      try {
        // Obter categorias e cidades
        const [catsRes, citiesRes] = await Promise.all([
          getMarketplaceCategories(),
          apiClient.get<{ data?: CityItem[] } | CityItem[]>("/cities"),
        ]);

        const cats = Array.isArray(catsRes) ? catsRes : [];
        setCategories(cats);

        const citiesData = (citiesRes.data as { data?: CityItem[] }).data || (citiesRes.data as CityItem[]) || [];
        const activeCities = citiesData.filter((c) => c.isActive);
        setCities(activeCities);

        // Definir a primeira cidade ativa como padrão
        if (activeCities.length > 0) {
          const defaultCity = activeCities[0]._id;
          setSelectedCityId(defaultCity);
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais do marketplace:", error);
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Monitorar carrinho local
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
    // Custom event dispatching helper in case storage event doesn't fire on same tab
    window.addEventListener("cart-updated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cart-updated", updateCartCount);
    };
  }, []);

  // Recarregar lojas quando mudar cidade, categoria ou busca
  useEffect(() => {
    if (!selectedCityId) return;

    let delayDebounce: NodeJS.Timeout;

    async function fetchStores() {
      try {
        const filters: { cityId?: string; categoryId?: string; q?: string } = {
          cityId: selectedCityId,
        };
        if (selectedCategoryId) {
          filters.categoryId = selectedCategoryId;
        }
        if (searchQuery.trim()) {
          filters.q = searchQuery.trim();
        }

        const data = await getMarketplaceStores(filters);
        setStores(data);
      } catch (error) {
        console.error("Erro ao buscar lojas do marketplace:", error);
      }
    }

    // Debounce na busca de texto para evitar chamadas excessivas
    if (searchQuery.trim()) {
      delayDebounce = setTimeout(fetchStores, 300);
    } else {
      fetchStores();
    }

    return () => clearTimeout(delayDebounce);
  }, [selectedCityId, selectedCategoryId, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
              <ShoppingBag className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                Leva<span className="text-emerald-400 font-black">+</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium tracking-widest uppercase">
                Marketplace
              </span>
            </div>
          </Link>

          {/* Selecionar Cidade */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-sm">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(e.target.value)}
              className="bg-transparent text-slate-200 outline-none border-none pr-6 cursor-pointer font-medium"
            >
              {cities.length === 0 ? (
                <option value="" disabled className="bg-slate-800">
                  Carregando cidades...
                </option>
              ) : (
                cities.map((city) => (
                  <option key={city._id} value={city._id} className="bg-slate-800 text-white">
                    {city.name} - {city.state}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Ações Cabeçalho */}
          <div className="flex items-center gap-4">
            {/* Meus Pedidos */}
            {hasToken && (
              <Link
                href="/orders"
                className="flex items-center gap-1.5 p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-all duration-200 text-sm font-bold"
                title="Meus Pedidos"
              >
                <ClipboardList className="w-5 h-5 text-emerald-400" />
                <span className="hidden md:inline">Meus Pedidos</span>
              </Link>
            )}

            {/* Carrinho */}
            <Link
              href="/cart"
              className="relative p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-full transition-all duration-200"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse border-2 border-slate-900">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Portal Parceiro Link */}
            <Link
              href="/login"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-all duration-200 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Área do Parceiro</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
            O que você deseja pedir hoje?
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Os melhores estabelecimentos da sua cidade entregues na sua casa com a agilidade Leva+
          </p>

          {/* Barra de Busca Premium */}
          <div className="max-w-2xl mx-auto flex items-center bg-white rounded-2xl p-2 shadow-2xl border border-slate-100 text-slate-800 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all duration-300">
            <Search className="w-6 h-6 text-slate-400 ml-3" />
            <input
              type="text"
              placeholder="Buscar estabelecimentos, restaurantes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 py-2 outline-none border-none text-base placeholder-slate-400 font-medium"
            />
          </div>
        </div>
      </section>

      {/* Seletor Mobile de Cidade */}
      <div className="sm:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-500 flex items-center gap-1">
          <MapPin className="w-4 h-4 text-emerald-500" /> Cidade ativa:
        </span>
        <select
          value={selectedCityId}
          onChange={(e) => setSelectedCityId(e.target.value)}
          className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-sm text-slate-800 font-semibold outline-none"
        >
          {cities.map((city) => (
            <option key={city._id} value={city._id}>
              {city.name} - {city.state}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Categorias */}
        <div className="mb-8">
          <h2 className="text-xl font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-500" /> Navegue por Categorias
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none">
            <button
              onClick={() => setSelectedCategoryId("")}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
                selectedCategoryId === ""
                  ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-md"
                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>Ver Todos</span>
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setSelectedCategoryId(category._id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm border-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  selectedCategoryId === category._id
                    ? "bg-emerald-500 border-emerald-500 text-slate-950 shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Listagem de Lojas */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" /> Estabelecimentos
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-3xl p-4 animate-pulse space-y-4"
                >
                  <div className="w-full h-40 bg-slate-200 rounded-2xl" />
                  <div className="h-6 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <StoreIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-700">Nenhum estabelecimento encontrado</h3>
              <p className="text-slate-400 mt-1">
                Tente alterar a categoria ou buscar outro termo de pesquisa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => {
                const isOpen = store.isOpenManualOverride === "force_open" || 
                  (store.isOpenManualOverride === "auto" && store.readiness?.openNow);

                return (
                  <Link
                    key={store._id}
                    href={`/stores/${store.slug}`}
                    className="group bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    {/* Imagem de Capa */}
                    <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                      {store.cover ? (
                        <img
                          src={store.cover}
                          alt={store.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                          <StoreIcon className="w-12 h-12" />
                        </div>
                      )}

                      {/* Status Aberto/Fechado */}
                      <span
                        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-black shadow-md border ${
                          isOpen
                            ? "bg-emerald-500 text-slate-950 border-emerald-400"
                            : "bg-slate-800 text-slate-300 border-slate-700"
                        }`}
                      >
                        {isOpen ? "ABERTO" : "FECHADO"}
                      </span>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-5 flex items-start gap-4">
                      {/* Logo */}
                      <div className="w-14 h-14 rounded-2xl border border-slate-150 bg-white overflow-hidden flex-shrink-0 shadow-sm">
                        {store.logo ? (
                          <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <StoreIcon className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-grow min-w-0">
                        <h3 className="font-extrabold text-lg text-slate-800 truncate group-hover:text-emerald-600 transition-colors">
                          {store.name}
                        </h3>
                        <p className="text-slate-400 text-xs truncate mt-1">
                          {store.categoryId?.name || "Geral"} • {store.tags?.slice(0, 2).join(", ") || "Loja"}
                        </p>

                        {/* Badges Rápidas */}
                        <div className="flex items-center gap-3 mt-4 text-xs font-bold text-slate-500">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            <span>{store.rating?.average?.toFixed(1) || "5.0"}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{store.prepTimeMinutes} min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
