"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Car,
  Bike,
  Truck,
  Search,
  Filter,
  RefreshCcw,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  User,
  Clock,
  LucideIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  driversService,
  Driver,
  DriverLocation,
} from "@/services/driversService";
import { useToast } from "@/components/ui/Toast";
import { Drawer } from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";

const VEHICLE_ICONS = {
  motorcycle: Bike,
  car: Car,
  van: Truck,
  truck: Truck,
};

const VEHICLE_LABELS = {
  motorcycle: "Moto",
  car: "Carro",
  van: "Van",
  truck: "Caminhão",
};

const STATUS_LABELS = {
  offline: "Offline",
  available: "Disponível",
  busy: "Ocupado",
  on_ride: "Em corrida",
};

const STATUS_COLORS = {
  offline: "bg-slate-100 text-slate-600",
  available: "bg-emerald-100 text-emerald-700",
  busy: "bg-amber-100 text-amber-700",
  on_ride: "bg-blue-100 text-blue-700",
};

export default function DriversPage() {
  const { showToast, ToastContainer } = useToast();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [driversData, locationsData] = await Promise.all([
        driversService.getAll(),
        driversService.getLocations(),
      ]);
      setDrivers(driversData);
      setLocations(locationsData);
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error);
      showToast(
        "Erro ao carregar motoristas. Verifique se o backend está rodando.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get driver location status
  const getDriverStatus = useCallback(
    (driverId: string) => {
      const location = locations.find((loc) => loc.driverId === driverId);
      return location?.status || "offline";
    },
    [locations]
  );

  // Filtered Data
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const matchesSearch =
        driver.name.toLowerCase().includes(search.toLowerCase()) ||
        driver.email.toLowerCase().includes(search.toLowerCase()) ||
        driver.phone?.toLowerCase().includes(search.toLowerCase()) ||
        driver.vehicleInfo?.plate?.toLowerCase().includes(search.toLowerCase());

      const matchesVehicle =
        vehicleFilter === "all" || driver.vehicleType === vehicleFilter;

      const driverStatus = getDriverStatus(driver._id);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && driver.isActive) ||
        (statusFilter === "inactive" && !driver.isActive) ||
        driverStatus === statusFilter;

      return matchesSearch && matchesVehicle && matchesStatus;
    });
  }, [drivers, search, vehicleFilter, statusFilter, getDriverStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter((d) => d.isActive).length;
    const online = locations.filter(
      (l) => l.status === "available" || l.status === "on_ride"
    ).length;
    const onRide = locations.filter((l) => l.status === "on_ride").length;

    const byVehicle = {
      motorcycle: drivers.filter((d) => d.vehicleType === "motorcycle").length,
      car: drivers.filter((d) => d.vehicleType === "car").length,
      van: drivers.filter((d) => d.vehicleType === "van").length,
      truck: drivers.filter((d) => d.vehicleType === "truck").length,
    };

    return { total, active, online, onRide, byVehicle };
  }, [drivers, locations]);

  const handleViewDriver = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDrawerOpen(true);
  };

  const handleRefresh = () => {
    loadData();
    showToast("Dados atualizados!", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <RefreshCcw className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
          <p className="text-slate-600">Carregando motoristas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Motoristas
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie todos os motoristas cadastrados na plataforma
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 text-slate-700 shadow-sm"
        >
          <RefreshCcw size={18} />
          <span className="font-medium">Atualizar</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total de Motoristas"
          value={stats.total}
          icon={User}
          color="emerald"
        />
        <StatsCard
          label="Motoristas Ativos"
          value={stats.active}
          icon={CheckCircle2}
          color="blue"
        />
        <StatsCard
          label="Online Agora"
          value={stats.online}
          icon={MapPin}
          color="green"
        />
        <StatsCard
          label="Em Corrida"
          value={stats.onRide}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Vehicle Type Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(stats.byVehicle).map(([type, count]) => (
          <div
            key={type}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              {React.createElement(
                VEHICLE_ICONS[type as keyof typeof VEHICLE_ICONS],
                { className: "w-8 h-8 text-emerald-600" }
              )}
              <div>
                <p className="text-2xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-500">
                  {VEHICLE_LABELS[type as keyof typeof VEHICLE_LABELS]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Vehicle Filter */}
          <select
            value={vehicleFilter}
            onChange={(e) => setVehicleFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            <option value="all">Todos os veículos</option>
            <option value="motorcycle">Moto</option>
            <option value="car">Carro</option>
            <option value="van">Van</option>
            <option value="truck">Caminhão</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            <option value="all">Todos os status</option>
            <option value="active">Conta Ativa</option>
            <option value="inactive">Conta Inativa</option>
            <option value="available">Disponível</option>
            <option value="on_ride">Em Corrida</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Filter size={16} />
          <span>
            Mostrando <strong>{filteredDrivers.length}</strong> de{" "}
            <strong>{stats.total}</strong> motoristas
          </span>
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Motorista
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Veículo
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-slate-400 space-y-2">
                      <User className="w-12 h-12 mx-auto opacity-50" />
                      <p className="font-medium">Nenhum motorista encontrado</p>
                      <p className="text-sm">
                        Tente ajustar os filtros ou a busca
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <DriverRow
                    key={driver._id}
                    driver={driver}
                    status={getDriverStatus(driver._id)}
                    onView={() => handleViewDriver(driver)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer for Driver Details */}
      {selectedDriver && (
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Detalhes do Motorista"
        >
          <DriverDetails
            driver={selectedDriver}
            status={getDriverStatus(selectedDriver._id)}
            location={locations.find((l) => l.driverId === selectedDriver._id)}
          />
        </Drawer>
      )}

      {ToastContainer}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  const colorClasses = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            colorClasses[color as keyof typeof colorClasses]
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Driver Row Component
function DriverRow({
  driver,
  status,
  onView,
}: {
  driver: Driver;
  status: string;
  onView: () => void;
}) {
  const VehicleIcon =
    VEHICLE_ICONS[driver.vehicleType as keyof typeof VEHICLE_ICONS] || Car;

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
            {driver.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">{driver.name}</p>
            <p className="text-sm text-slate-500">{driver.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <VehicleIcon className="w-5 h-5 text-slate-600" />
          <div>
            <p className="font-medium text-slate-900">
              {driver.vehicleInfo?.model || "N/A"}
            </p>
            <p className="text-sm text-slate-500">
              {driver.vehicleInfo?.plate || "Sem placa"}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={14} />
            <span>{driver.phone || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} />
            <span>{driver.city || "N/A"}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
                "bg-slate-100 text-slate-600"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
            {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
          </span>
          <div>
            {driver.isActive ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle2 size={14} />
                Conta Ativa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <XCircle size={14} />
                Conta Inativa
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar size={14} />
          <span>
            {format(new Date(driver.createdAt), "dd/MM/yyyy", {
              locale: ptBR,
            })}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={onView}
            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600 hover:text-emerald-700"
            title="Ver detalhes"
          >
            <Eye size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Driver Details Component
function DriverDetails({
  driver,
  status,
  location,
}: {
  driver: Driver;
  status: string;
  location?: DriverLocation;
}) {
  const VehicleIcon =
    VEHICLE_ICONS[driver.vehicleType as keyof typeof VEHICLE_ICONS] || Car;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-6 border-b border-slate-200">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl mx-auto mb-4">
          {driver.name.charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{driver.name}</h2>
        <p className="text-slate-500">{driver.email}</p>
        <div className="flex items-center justify-center gap-3 mt-4">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
              STATUS_COLORS[status as keyof typeof STATUS_COLORS]
            )}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
          </span>
          {driver.isActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              <CheckCircle2 size={16} />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
              <XCircle size={16} />
              Inativo
            </span>
          )}
        </div>
      </div>

      {/* Information Sections */}
      <div className="space-y-4">
        {/* Personal Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
            Informações Pessoais
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <InfoRow icon={Mail} label="Email" value={driver.email} />
            <InfoRow
              icon={Phone}
              label="Telefone"
              value={driver.phone || "N/A"}
            />
            <InfoRow
              icon={MapPin}
              label="Cidade"
              value={driver.city || "N/A"}
            />
            {driver.cpf && (
              <InfoRow icon={User} label="CPF" value={driver.cpf} />
            )}
          </div>
        </div>

        {/* Vehicle Info */}
        {driver.vehicleInfo && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
              Informações do Veículo
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <VehicleIcon className="w-8 h-8 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {driver.vehicleInfo.model}
                  </p>
                  <p className="text-sm text-slate-500">
                    {
                      VEHICLE_LABELS[
                        driver.vehicleType as keyof typeof VEHICLE_LABELS
                      ]
                    }
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Placa</p>
                  <p className="font-semibold text-slate-900">
                    {driver.vehicleInfo.plate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Cor</p>
                  <p className="font-semibold text-slate-900">
                    {driver.vehicleInfo.color}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Ano</p>
                  <p className="font-semibold text-slate-900">
                    {driver.vehicleInfo.year}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Info */}
        {location && (
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
              Localização Atual
            </h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Latitude</p>
                  <p className="font-mono text-sm text-slate-900">
                    {location.location.coordinates[1].toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Longitude</p>
                  <p className="font-mono text-sm text-slate-900">
                    {location.location.coordinates[0].toFixed(6)}
                  </p>
                </div>
              </div>
              {location.speed !== undefined && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Velocidade</p>
                  <p className="font-semibold text-slate-900">
                    {location.speed} km/h
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Última Atualização
                </p>
                <p className="text-sm text-slate-900">
                  {format(
                    new Date(location.lastUpdated),
                    "dd/MM/yyyy 'às' HH:mm",
                    {
                      locale: ptBR,
                    }
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Account Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">
            Informações da Conta
          </h3>
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <InfoRow
              icon={Calendar}
              label="Cadastro"
              value={format(
                new Date(driver.createdAt),
                "dd/MM/yyyy 'às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            />
            <InfoRow
              icon={Calendar}
              label="Última Atualização"
              value={format(
                new Date(driver.updatedAt),
                "dd/MM/yyyy 'às' HH:mm",
                {
                  locale: ptBR,
                }
              )}
            />
            <InfoRow
              icon={CheckCircle2}
              label="Termos Aceitos"
              value={driver.acceptedTerms ? "Sim" : "Não"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-slate-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}
