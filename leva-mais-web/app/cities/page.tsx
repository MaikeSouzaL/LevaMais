"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  DollarSign,
  Power,
  X,
  Save,
  Truck,
  Bike,
  Car,
  ChevronDown,
} from "lucide-react";
import { citiesService, City, CityFilters } from "@/services/citiesService";
import { purposesService } from "@/services/purposesService";
import { pricingRulesService, PricingRule } from "@/services/pricingRulesService";
import { PurposeItem } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/formatters";
import { representativesService, Representative } from "@/services/representativesService";

// Tipos auxiliares para a UI
type Tab = "details" | "pricing" | "rep" | "revenue";
type VehicleTab = "motorcycle" | "car" | "van" | "truck";

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Estado de seleção
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("details");

  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Carregar cidades
  const loadCities = useCallback(async () => {
    try {
      setLoading(true);
      const filters: CityFilters = {};
      if (searchTerm) filters.search = searchTerm;
      if (filterRegion) filters.region = filterRegion;
      if (filterStatus !== "all") filters.isActive = filterStatus === "active";

      const data = await citiesService.getAll(filters);
      setCities(data);
    } catch (error) {
      showToast("Erro ao carregar cidades", "error");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRegion, filterStatus, showToast]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // Handler para abrir detalhes
  const handleOpenCity = (city: City, tab: Tab = "details") => {
    setSelectedCity(city);
    setActiveTab(tab);
    setShowDrawer(true);
  };

  // Handler delete
  const handleDelete = async (city: City) => {
    if (!confirm(`Tem certeza que deseja deletar ${city.name}?`)) return;
    try {
      await citiesService.delete(city._id!);
      showToast("Cidade deletada com sucesso!", "success");
      loadCities();
    } catch {
      showToast("Erro ao deletar cidade", "error");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {ToastContainer}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-emerald-600" />
              Áreas de Atuação
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie cidades, preços por região e representantes.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nova Cidade
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total de Cidades"
          value={cities.length}
          icon={MapPin}
          color="blue"
        />
        <StatsCard
          title="Ativas"
          value={cities.filter((c) => c.isActive).length}
          icon={Power}
          color="green"
        />
        <StatsCard
          title="Com Representante"
          value={cities.filter((c) => c.representativeId).length}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Receita Mensal (Est.)"
          value={formatCurrency(cities.reduce((sum, c) => sum + (c.stats?.monthlyRevenue || 0), 0))}
          icon={DollarSign}
          color="yellow"
          isAmount
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="">Todas as Regiões</option>
              {citiesService.getRegions().map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativas</option>
            <option value="inactive">Apenas Inativas</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
         <div className="flex justify-center py-20">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cities.map((city) => (
            <CityCard
              key={city._id}
              city={city}
              onOpen={(tab) => handleOpenCity(city, tab)}
              onDelete={() => handleDelete(city)}
            />
          ))}
        </div>
      )}

      {/* Drawer Principal */}
      {showDrawer && selectedCity && (
        <CityManagementDrawer
          city={selectedCity}
          initialTab={activeTab}
          onClose={() => {
            setShowDrawer(false);
            setSelectedCity(null);
          }}
          onUpdate={() => {
            loadCities(); // Recarrega lista se houver mudança
          }}
        />
      )}

      {/* Modal Criar */}
      {showCreateModal && (
        <CreateCityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadCities();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Componentes Menores
// ----------------------------------------------------------------------------

function StatsCard({ title, value, icon: Icon, color, isAmount }: any) {
  const bgColors: any = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    yellow: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${bgColors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function CityCard({ city, onOpen, onDelete }: { city: City, onOpen: (t: Tab) => void, onDelete: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              {city.name}
              <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {city.state}
              </span>
            </h3>
            <p className="text-sm text-gray-500 mt-1">{city.region}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${city.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-gray-400" />
            <span>{city.stats?.totalDrivers || 0} Mot.</span>
          </div>
          <div className="flex items-center gap-1.5">
             <DollarSign className="w-4 h-4 text-gray-400" />
             <span>Revenue: {city.revenueSharing?.representativePercentage || 50}%</span> 
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => onOpen("pricing")}
            className="col-span-2 py-2 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Configurar Preços
          </button>
          <button 
            onClick={() => onOpen("details")}
            className="py-2 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Detalhes
          </button>
          <button 
            onClick={onDelete}
            className="py-2 px-4 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex justify-center"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// DRAWER PRINCIPAL DE GERENCIAMENTO
// ----------------------------------------------------------------------------

function CityManagementDrawer({ 
  city, 
  initialTab, 
  onClose, 
  onUpdate 
}: { 
  city: City; 
  initialTab: Tab; 
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              {city.name} - {city.state}
            </h2>
            <p className="text-sm text-gray-500">Gerenciamento completo da área</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <TabButton active={activeTab === "pricing"} onClick={() => setActiveTab("pricing")} icon={DollarSign}>
            Preços & Serviços
          </TabButton>
          <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")} icon={Edit}>
            Dados Cadastrais
          </TabButton>
          <TabButton active={activeTab === "rep"} onClick={() => setActiveTab("rep")} icon={Users}>
            Representante
          </TabButton>
          <TabButton active={activeTab === "revenue"} onClick={() => setActiveTab("revenue")} icon={DollarSign}>
            Revenue Share
          </TabButton>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {activeTab === "pricing" && <PricingConfigTab city={city} />}
          {activeTab === "details" && <CityDetailsTab city={city} onUpdate={onUpdate} />}
          {activeTab === "rep" && <RepresentativeTab city={city} onUpdate={onUpdate} />}
          {activeTab === "revenue" && <RevenueShareTab city={city} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ children, active, onClick, icon: Icon }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-emerald-500 text-emerald-700 bg-emerald-50/30"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {children}
    </button>
  );
}

// ----------------------------------------------------------------------------
// TAB: CONFIGURAÇÃO DE PREÇOS (O CORAÇÃO DO SISTEMA)
// ----------------------------------------------------------------------------

function PricingConfigTab({ city }: { city: City }) {
  const [vehicleTab, setVehicleTab] = useState<VehicleTab>("motorcycle");
  const [purposes, setPurposes] = useState<PurposeItem[]>([]);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pData, rData] = await Promise.all([
        purposesService.getAll(),
        pricingRulesService.list({ cityId: city._id }),
      ]);
      setPurposes(pData);
      setRules(rData);
    } catch (err) {
      showToast("Erro ao carregar configurações", "error");
    } finally {
      setLoading(false);
    }
  }, [city._id, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtra regras para o veículo atual
  const currentRules = rules.filter(r => r.vehicleCategory === vehicleTab);
  
  // Regra base (sem purposeId)
  const baseRule = currentRules.find(r => !r.purposeId);
  
  // Lista de Purposes disponíveis para esse veículo
  const availablePurposes = purposes.filter(p => p.vehicleType === vehicleTab);

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando configurações...</div>;

  return (
    <div className="space-y-6">
      {/* Vehicle Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm w-fit">
        <VehicleTabBtn id="motorcycle" label="Moto" active={vehicleTab} onClick={setVehicleTab} icon={Bike} />
        <VehicleTabBtn id="car" label="Carro" active={vehicleTab} onClick={setVehicleTab} icon={Car} />
        <VehicleTabBtn id="van" label="Van" active={vehicleTab} onClick={setVehicleTab} icon={Truck} />
        <VehicleTabBtn id="truck" label="Caminhão" active={vehicleTab} onClick={setVehicleTab} icon={Truck} />
      </div>

      {/* Base Price Config */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-emerald-50/50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-900">Preço Base - {getVehicleLabel(vehicleTab)}</h3>
            <p className="text-sm text-gray-500">Valor padrão aplicado se não houver regra específica</p>
          </div>
          <div className="px-3 py-1 bg-white border rounded text-xs text-gray-500 shadow-sm">
             {baseRule ? "Configurado ✅" : "Pendente ⚠️"}
          </div>
        </div>
        <div className="p-6">
          <PricingForm 
            rule={baseRule} 
            cityId={city._id!} 
            vehicleCategory={vehicleTab} 
            purposeId={null}
            onSave={loadData}
          />
        </div>
      </div>

      {/* Services List */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Serviços Específicos</h3>
        <div className="space-y-3">
          {availablePurposes.map(purpose => {
            const rule = currentRules.find(r => 
               typeof r.purposeId === 'string' 
                 ? r.purposeId === purpose._id 
                 : r.purposeId?._id === purpose._id
            );

            return (
              <ServicePriceRow 
                key={purpose._id} 
                purpose={purpose} 
                rule={rule} 
                cityId={city._id!}
                vehicleCategory={vehicleTab}
                onUpdate={loadData}
              />
            );
          })}
          
          {availablePurposes.length === 0 && (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
              Nenhum serviço cadastrado para {getVehicleLabel(vehicleTab)}.
              <br/>
              <span className="text-xs">Vá em Configurações Globais {'>'} Serviços para adicionar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VehicleTabBtn({ id, label, active, onClick, icon: Icon }: any) {
  const isActive = active === id;
  return (
    <button
      onClick={() => onClick(id)}
      className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${
        isActive ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function getVehicleLabel(v: string) {
  const map: any = { motorcycle: "Moto", car: "Carro", van: "Van", truck: "Caminhão" };
  return map[v] || v;
}

// Formulário de Preço (Componente Reutilizável)
function PricingForm({ rule, cityId, vehicleCategory, purposeId, onSave }: any) {
  const [data, setData] = useState({
    minimumFee: rule?.pricing?.minimumFee || 0,
    minimumKm: rule?.pricing?.minimumKm || 0,
    pricePerKm: rule?.pricing?.pricePerKm || 0,
    active: rule?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Atualiza form quando rule mudar (ex: troca de aba)
  useEffect(() => {
    setData({
        minimumFee: rule?.pricing?.minimumFee || 0,
        minimumKm: rule?.pricing?.minimumKm || 0,
        pricePerKm: rule?.pricing?.pricePerKm || 0,
        active: rule?.active ?? true,
    });
  }, [rule]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: `${cityId}-${vehicleCategory}${purposeId ? `-${purposeId}` : '-base'}`,
        cityId,
        vehicleCategory,
        purposeId,
        pricing: {
            minimumFee: Number(data.minimumFee),
            minimumKm: Number(data.minimumKm),
            pricePerKm: Number(data.pricePerKm),
        },
        active: data.active
      };

      if (rule?._id) {
        await pricingRulesService.update(rule._id, payload);
      } else {
        await pricingRulesService.create(payload as any);
      }
      showToast("Preço salvo!", "success");
      onSave();
    } catch (e) {
      showToast("Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Taxa Mínima (R$)</label>
        <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">R$</span>
            <input 
                type="number" 
                value={data.minimumFee} 
                onChange={e => setData({...data, minimumFee: e.target.value as any})}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">KM Mínimo (Incluso)</label>
        <div className="relative">
            <input 
                type="number" 
                value={data.minimumKm} 
                onChange={e => setData({...data, minimumKm: e.target.value as any})}
                className="w-full pl-3 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
            <span className="absolute right-3 top-2 text-gray-400 text-sm">Km</span>
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Preço por KM (Extra)</label>
        <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400 text-sm">R$</span>
            <input 
                type="number" 
                value={data.pricePerKm} 
                onChange={e => setData({...data, pricePerKm: e.target.value as any})}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" 
            />
        </div>
      </div>
      <div className="flex gap-2">
         {/* Active Toggle */}
         <button 
           onClick={() => setData({...data, active: !data.active})}
           className={`p-2 rounded-lg border transition-colors ${data.active ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
           title={data.active ? "Ativo" : "Inativo"}
         >
            <Power className="w-5 h-5" />
         </button>
         
         <button 
           onClick={handleSave}
           disabled={saving}
           className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
         >
           {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
           Salvar
         </button>
      </div>
    </div>
  );
}

function ServicePriceRow({ purpose, rule, cityId, vehicleCategory, onUpdate }: any) {
  const [expanded, setExpanded] = useState(false);
  const isActiveRule = rule?.active ?? false;
  const isConfigured = !!rule;

  return (
    <div className={`bg-white rounded-xl border transition-all ${expanded ? 'border-emerald-200 shadow-md ring-1 ring-emerald-500/20' : 'border-gray-200 shadow-sm'}`}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
           <div>
             <h4 className="font-bold text-gray-900">{purpose.title}</h4>
             <p className="text-xs text-gray-500">
               {isConfigured 
                 ? (isActiveRule ? "Preço personalizado ativo" : "Regra personalizada inativa (Usa base)")
                 : "Usando preço base"}
             </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          {isConfigured && (
             <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-100">
               R$ {rule.pricing.pricePerKm}/km
             </span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
          <div className="pt-4">
             <p className="text-xs text-gray-500 mb-4">
               Defina valores específicos para <strong>{purpose.title}</strong> nesta cidade. 
               Se inativo ou não configurado, o sistema usará o Preço Base do veículo.
             </p>
             <PricingForm 
                rule={rule} 
                cityId={cityId} 
                vehicleCategory={vehicleCategory} 
                purposeId={purpose._id}
                onSave={onUpdate}
             />
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// TAB: DETALHES CADASTRAIS (Form reutilizado do Modal original)
// ----------------------------------------------------------------------------

function CityDetailsTab({ city, onUpdate }: { city: City, onUpdate: () => void }) {
  // Simplificação: Reusar a lógica do CreateCityModal, mas inline
  // Para brevidade, vou colocar apenas o básico aqui, idealmente extrair componente de form
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
       <h3 className="font-bold text-lg mb-4">Dados da Cidade</h3>
       <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <label className="text-gray-500">Nome</label>
            <p className="font-medium text-gray-900">{city.name}</p>
          </div>
          <div>
            <label className="text-gray-500">Estado</label>
            <p className="font-medium text-gray-900">{city.state}</p>
          </div>
          <div>
            <label className="text-gray-500">Região</label>
            <p className="font-medium text-gray-900">{city.region}</p>
          </div>
          <div>
            <label className="text-gray-500">Timezone</label>
            <p className="font-medium text-gray-900">{city.timezone}</p>
          </div>
       </div>
       <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button className="text-emerald-600 font-medium hover:underline text-sm">Editar Dados</button>
       </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// TAB: REPRESENTANTE (Vincular Representante à Cidade)
// ----------------------------------------------------------------------------

function RepresentativeTab({ city, onUpdate }: { city: City, onUpdate: () => void }) {
  const [reps, setReps] = useState<Representative[]>([]);
  const [selectedRep, setSelectedRep] = useState(city.representativeId || "");
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadReps();
  }, []);

  const loadReps = async () => {
    try {
      const data = await representativesService.getAll();
      setReps(data);
    } catch {
      showToast("Erro ao carregar lista de representantes", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await citiesService.update(city._id!, { representativeId: selectedRep || null });
      showToast("Representante vinculado!", "success");
      onUpdate();
    } catch {
      showToast("Erro ao vincular", "error");
    }
  };

  if (loading) return <div className="p-10 text-center">Carregando...</div>;

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-6">
      <div>
        <h3 className="font-bold text-lg mb-2">Representante Local</h3>
        <p className="text-gray-500 text-sm mb-4">
          Selecione quem gerencia esta cidade. O representante receberá parte dos lucros conforme configurado.
        </p>
        
        <select 
          className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          value={selectedRep}
          onChange={e => setSelectedRep(e.target.value)}
        >
          <option value="">-- Sem Representante --</option>
          {reps.map(r => (
            <option key={r._id} value={r._id}>
              {r.name} ({r.cpfCnpj})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
          Salvar Vinculação
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// TAB: REVENUE SHARE (Configurar Split)
// ----------------------------------------------------------------------------

function RevenueShareTab({ city, onUpdate }: { city: City, onUpdate: () => void }) {
  // Padrão 50 se não existir
  const [repShare, setRepShare] = useState(city.revenueSharing?.representativePercentage ?? 50);
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      const platformShare = 100 - repShare;
      await citiesService.update(city._id!, { 
        revenueSharing: { 
          representativePercentage: repShare, 
          platformPercentage: platformShare,
          paymentDay: city.revenueSharing?.paymentDay || 5 // Mantém o dia atual ou define 5 como padrão
        } 
      });
      showToast("Divisão de lucros salva!", "success");
      onUpdate();
    } catch {
      showToast("Erro ao salvar", "error");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="font-bold text-lg mb-6">Divisão de Lucros (Split)</h3>
      
      <div className="flex items-center justify-between mb-8 px-10">
        <div className="text-center">
          <div className="text-3xl font-bold text-emerald-600">{100 - repShare}%</div>
          <div className="text-sm font-medium text-gray-500">Plataforma</div>
        </div>
        <div className="text-gray-300 font-light text-4xl">/</div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{repShare}%</div>
          <div className="text-sm font-medium text-gray-500">Representante</div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Porcentagem do Representante: {repShare}%
        </label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          step="5"
          value={repShare}
          onChange={e => setRepShare(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
        />
        <p className="text-xs text-gray-500 mt-2">
          Esta porcentagem é aplicada sobre a <strong>Taxa da Plataforma</strong> (App Fee) de cada corrida nesta cidade.
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
          Salvar Regra
        </button>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// CREATE MODAL
// ----------------------------------------------------------------------------

function CreateCityModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    region: "",
    timezone: "America/Sao_Paulo",
    isActive: true,
  });
  const { showToast } = useToast();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
        await citiesService.create({
            ...formData,
            region: formData.region as any,
            revenueSharing: { representativePercentage: 50, platformPercentage: 50, paymentDay: 5 }
        });
        showToast("Cidade criada!", "success");
        onSuccess();
    } catch {
        showToast("Erro ao criar", "error");
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Cidade">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
           <label className="block text-sm font-medium mb-1">Nome</label>
           <input className="w-full border rounded p-2" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium mb-1">Estado</label>
             <input className="w-full border rounded p-2" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} required maxLength={2} />
           </div>
           <div>
             <label className="block text-sm font-medium mb-1">Região</label>
             <select className="w-full border rounded p-2" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} required>
                <option value="">Selecione</option>
                {citiesService.getRegions().map(r => <option key={r} value={r}>{r}</option>)}
             </select>
           </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
           <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
           <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Salvar</button>
        </div>
      </form>
    </Modal>
  );
}
