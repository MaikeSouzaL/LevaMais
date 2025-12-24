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
  Eye,
  Power,
  UserPlus,
  Award,
  X,
} from "lucide-react";
import { citiesService, City, CityFilters } from "@/services/citiesService";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/formatters";

export default function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRepModal, setShowRepModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Carregar cidades
  const loadCities = useCallback(async () => {
    try {
      setLoading(true);
      const filters: CityFilters = {};

      if (searchTerm) filters.search = searchTerm;
      if (filterRegion) filters.region = filterRegion;
      if (filterStatus !== "all") {
        filters.isActive = filterStatus === "active";
      }

      const data = await citiesService.getAll(filters);
      setCities(data);
    } catch (error) {
      showToast("Erro ao carregar cidades", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRegion, filterStatus, showToast]);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  // Calcular estatísticas
  const stats = {
    total: cities.length,
    active: cities.filter((c) => c.isActive).length,
    withRep: cities.filter((c) => c.representative).length,
    totalRevenue: cities.reduce(
      (sum, c) => sum + (c.stats?.monthlyRevenue || 0),
      0
    ),
  };

  // Filtrar cidades
  const filteredCities = cities.filter((city) => {
    const matchSearch =
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.state.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRegion = !filterRegion || city.region === filterRegion;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && city.isActive) ||
      (filterStatus === "inactive" && !city.isActive);

    return matchSearch && matchRegion && matchStatus;
  });

  // Toggle ativo/inativo
  const handleToggleActive = async (city: City) => {
    try {
      await citiesService.toggleActive(city._id!, !city.isActive);
      showToast(
        `Cidade ${city.isActive ? "desativada" : "ativada"} com sucesso!`,
        "success"
      );
      loadCities();
    } catch {
      showToast("Erro ao alterar status da cidade", "error");
    }
  };

  // Deletar cidade
  const handleDelete = async (city: City) => {
    if (!confirm(`Tem certeza que deseja deletar ${city.name}?`)) return;

    try {
      await citiesService.delete(city._id!);
      showToast("Cidade deletada com sucesso!", "success");
      loadCities();
      setShowDrawer(false);
    } catch {
      showToast("Erro ao deletar cidade", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando cidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {ToastContainer}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapPin className="w-8 h-8 text-green-600" />
              Cidades & Representantes
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie cidades, representantes e revenue sharing (50/50)
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
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
          value={stats.total}
          icon={MapPin}
          color="blue"
        />
        <StatsCard
          title="Cidades Ativas"
          value={stats.active}
          icon={Power}
          color="green"
        />
        <StatsCard
          title="Com Representante"
          value={stats.withRep}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Receita Mensal"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          color="yellow"
          isAmount
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cidade ou estado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Region Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
            >
              <option value="">Todas as Regiões</option>
              {citiesService.getRegions().map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Apenas Ativas</option>
            <option value="inactive">Apenas Inativas</option>
          </select>
        </div>
      </div>

      {/* Cities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCities.map((city) => (
          <CityCard
            key={city._id}
            city={city}
            onView={() => {
              setSelectedCity(city);
              setShowDrawer(true);
            }}
            onToggleActive={() => handleToggleActive(city)}
            onEdit={() => {
              setSelectedCity(city);
              setShowCreateModal(true);
            }}
            onDelete={() => handleDelete(city)}
            onManageRep={() => {
              setSelectedCity(city);
              setShowRepModal(true);
            }}
            onManageRevenue={() => {
              setSelectedCity(city);
              setShowRevenueModal(true);
            }}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredCities.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhuma cidade encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterRegion || filterStatus !== "all"
              ? "Tente ajustar os filtros"
              : "Comece adicionando uma nova cidade"}
          </p>
          {!searchTerm && !filterRegion && filterStatus === "all" && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Adicionar Primeira Cidade
            </button>
          )}
        </div>
      )}

      {/* Drawer de Detalhes */}
      {showDrawer && selectedCity && (
        <CityDrawer
          city={selectedCity}
          onClose={() => {
            setShowDrawer(false);
            setSelectedCity(null);
          }}
          onRefresh={loadCities}
        />
      )}

      {/* Modal de Criar/Editar */}
      {showCreateModal && (
        <CreateCityModal
          city={selectedCity}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedCity(null);
          }}
          onSuccess={() => {
            loadCities();
            setShowCreateModal(false);
            setSelectedCity(null);
          }}
        />
      )}

      {/* Modal de Representante */}
      {showRepModal && selectedCity && (
        <RepresentativeModal
          city={selectedCity}
          onClose={() => {
            setShowRepModal(false);
            setSelectedCity(null);
          }}
          onSuccess={() => {
            loadCities();
            setShowRepModal(false);
            setSelectedCity(null);
          }}
        />
      )}

      {/* Modal de Revenue Sharing */}
      {showRevenueModal && selectedCity && (
        <RevenueSharingModal
          city={selectedCity}
          onClose={() => {
            setShowRevenueModal(false);
            setSelectedCity(null);
          }}
          onSuccess={() => {
            loadCities();
            setShowRevenueModal(false);
            setSelectedCity(null);
          }}
        />
      )}
    </div>
  );
}

// Componente de Card de Estatística
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "yellow";
  isAmount?: boolean;
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color,
  isAmount,
}: StatsCardProps) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    yellow: "bg-yellow-100 text-yellow-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">
        {isAmount
          ? value
          : typeof value === "number"
          ? value.toLocaleString()
          : value}
      </h3>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

// Componente de Card de Cidade
interface CityCardProps {
  city: City;
  onView: () => void;
  onToggleActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageRep: () => void;
  onManageRevenue: () => void;
}

function CityCard({
  city,
  onView,
  onToggleActive,
  onEdit,
  onDelete,
  onManageRep,
  onManageRevenue,
}: CityCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${city.isActive ? "bg-green-50" : "bg-gray-50"}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              {city.name}
            </h3>
            <p className="text-sm text-gray-600">
              {city.state} • {city.region}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              city.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {city.isActive ? "Ativa" : "Inativa"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Representante */}
        <div className="mb-4">
          {city.representative ? (
            <div className="flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-gray-900">
                {city.representative.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <UserPlus className="w-4 h-4" />
              <span>Sem representante</span>
            </div>
          )}
        </div>

        {/* Revenue Sharing */}
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Representante:</span>
            <span className="font-bold text-yellow-700">
              {city.revenueSharing.representativePercentage}%
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Plataforma:</span>
            <span className="font-bold text-green-700">
              {city.revenueSharing.platformPercentage}%
            </span>
          </div>
        </div>

        {/* Stats */}
        {city.stats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">
                {city.stats.totalDrivers}
              </div>
              <div className="text-xs text-gray-600">Motoristas</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-900">
                {city.stats.totalClients}
              </div>
              <div className="text-xs text-gray-600">Clientes</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onView}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Ver
          </button>
          <button
            onClick={onManageRep}
            className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Users className="w-4 h-4" />
            Rep
          </button>
          <button
            onClick={onManageRevenue}
            className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100 text-sm font-medium flex items-center justify-center gap-1"
          >
            <DollarSign className="w-4 h-4" />
            50/50
          </button>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onToggleActive}
            className="flex-1 px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Power className="w-4 h-4" />
            {city.isActive ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Componentes de Modal (placeholders - implementar completamente depois)

interface DrawerProps {
  city: City;
  onClose: () => void;
  onRefresh: () => void;
}

function CityDrawer({ city, onClose }: DrawerProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Detalhes da Cidade</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>
        <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
          {JSON.stringify(city, null, 2)}
        </pre>
      </div>
    </div>
  );
}

interface ModalProps {
  city: City | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateCityModal({ city, onClose, onSuccess }: ModalProps) {
  const [formData, setFormData] = useState<{
    name: string;
    state: string;
    region: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul" | "";
    timezone: string;
    ibgeCode: string;
    isActive: boolean;
  }>({
    name: city?.name || "",
    state: city?.state || "",
    region: city?.region || "",
    timezone: city?.timezone || "America/Sao_Paulo",
    ibgeCode: city?.ibgeCode || "",
    isActive: city?.isActive ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  // Estados brasileiros
  const brazilianStates = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpa erro do campo ao digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome da cidade é obrigatório";
    } else if (formData.name.length < 2) {
      newErrors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.state) {
      newErrors.state = "Estado é obrigatório";
    }

    if (!formData.region) {
      newErrors.region = "Região é obrigatória";
    }

    if (formData.ibgeCode && !/^\d{7}$/.test(formData.ibgeCode)) {
      newErrors.ibgeCode = "Código IBGE deve ter 7 dígitos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Por favor, corrija os erros no formulário", "error");
      return;
    }

    setSaving(true);
    try {
      if (city?._id) {
        // Atualizar cidade existente
        await citiesService.update(city._id, {
          ...formData,
          region: formData.region as
            | "Norte"
            | "Nordeste"
            | "Centro-Oeste"
            | "Sudeste"
            | "Sul",
        });
        showToast("Cidade atualizada com sucesso!", "success");
      } else {
        // Criar nova cidade com revenue sharing padrão
        await citiesService.create({
          ...formData,
          region: formData.region as
            | "Norte"
            | "Nordeste"
            | "Centro-Oeste"
            | "Sudeste"
            | "Sul",
          revenueSharing: {
            representativePercentage: 50,
            platformPercentage: 50,
            paymentDay: 5,
          },
        });
        showToast("Cidade cadastrada com sucesso!", "success");
      }
      onSuccess();
      onClose();
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      showToast(
        err.response?.data?.message || "Erro ao salvar cidade",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={city ? "Editar Cidade" : "Nova Cidade"}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {city ? "Atualizar Cidade" : "Cadastrar Cidade"}
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Nome da Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Cidade *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Ex: São Paulo"
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Estado e Região */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado (UF) *
            </label>
            <select
              value={formData.state}
              onChange={(e) => handleChange("state", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.state ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            >
              <option value="">Selecione...</option>
              {brazilianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Região *
            </label>
            <select
              value={formData.region}
              onChange={(e) => handleChange("region", e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.region ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            >
              <option value="">Selecione...</option>
              {citiesService.getRegions().map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {errors.region && (
              <p className="mt-1 text-sm text-red-600">{errors.region}</p>
            )}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuso Horário
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            {citiesService.getTimezones().map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Fuso horário utilizado para cálculos de horários de pico
          </p>
        </div>

        {/* Código IBGE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código IBGE
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            value={formData.ibgeCode}
            onChange={(e) =>
              handleChange(
                "ibgeCode",
                e.target.value.replace(/\D/g, "").slice(0, 7)
              )
            }
            placeholder="Ex: 3550308"
            maxLength={7}
            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.ibgeCode ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.ibgeCode && (
            <p className="mt-1 text-sm text-red-600">{errors.ibgeCode}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Código de 7 dígitos do IBGE para integração com sistemas externos
          </p>
        </div>

        {/* Status Ativo/Inativo */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <label
                htmlFor="isActive"
                className="font-medium text-gray-900 cursor-pointer"
              >
                Cidade Ativa
              </label>
              <p className="text-sm text-gray-600 mt-1">
                Cidades ativas podem receber novas corridas e cadastros de
                motoristas/clientes. Desative temporariamente caso a cidade
                esteja em manutenção.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Sobre o cadastro de cidades
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Após cadastrar, você poderá atribuir um representante</li>
                <li>
                  • Configure o modelo de receita 50/50 com o representante
                </li>
                <li>• Motoristas e clientes serão associados às cidades</li>
                <li>
                  • Cada cidade pode ter configurações de preço personalizadas
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface RepModalProps {
  city: City;
  onClose: () => void;
  onSuccess: () => void;
}

function RepresentativeModal({ onClose }: RepModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Gerenciar Representante"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
        >
          Fechar
        </button>
      }
    >
      <p className="text-slate-600">Formulário em desenvolvimento...</p>
    </Modal>
  );
}

function RevenueSharingModal({ onClose }: RepModalProps) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Revenue Sharing (50/50)"
      footer={
        <button
          onClick={onClose}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
        >
          Fechar
        </button>
      }
    >
      <p className="text-slate-600">Configuração em desenvolvimento...</p>
    </Modal>
  );
}
