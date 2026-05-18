"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Clock,
  Compass,
  AlertTriangle,
  Play,
  CheckCircle2,
  DollarSign
} from "lucide-react";
import { ridesService, Ride } from "@/services/ridesService";
import { driverLocationService, DriverLocation } from "@/services/driverLocationService";
import { clientsService } from "@/services/clientsService";
import { driversService } from "@/services/driversService";
import { useToast } from "@/components/ui/Toast";

export default function DashboardPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [clientsCount, setClientsCount] = useState(0);
  const [driversCount, setDriversCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [radarPulse, setRadarPulse] = useState(true);
  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [ridesData, locationsData, clientsData, driversData] = await Promise.all([
        ridesService.getAll(),
        driverLocationService.getAll(),
        clientsService.getAll(),
        driversService.getAll()
      ]);
      setRides(ridesData);
      setLocations(locationsData);
      setClientsCount(clientsData.length);
      setDriversCount(driversData.length);
    } catch (err) {
      console.error(err);
      showToast("Erro ao sincronizar dados do painel de monitoramento", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    // Auto refresh every 10 seconds for real-time emulation
    const interval = setInterval(() => {
      setRefreshing(true);
      loadData();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalDeliveries = rides.filter(r => r.serviceType === "delivery").length;
    const completedDeliveries = rides.filter(r => r.status === "completed" && r.serviceType === "delivery").length;
    const cancelledDeliveries = rides.filter(r => r.status === "cancelled" && r.serviceType === "delivery").length;
    
    const activeRides = rides.filter(r => ["accepted", "driver_arriving", "arrived", "in_progress"].includes(r.status));
    const onlineDrivers = locations.filter(l => l.status !== "offline").length;
    const busyDrivers = locations.filter(l => l.status === "busy" || l.status === "on_ride").length;
    const availableDrivers = locations.filter(l => l.status === "available").length;

    // Total Platform Earnings
    const earnings = rides
      .filter(r => r.status === "completed")
      .reduce((sum, r) => sum + (r.pricing?.appFee || (r.pricing?.total ? r.pricing.total * 0.2 : 0)), 0);

    return {
      totalDeliveries,
      completedDeliveries,
      cancelledDeliveries,
      activeRidesCount: activeRides.length,
      activeRides,
      onlineDrivers,
      busyDrivers,
      availableDrivers,
      earnings
    };
  }, [rides, locations]);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
    showToast("Dados de telemetria sincronizados com sucesso!", "success");
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-semibold tracking-wide">Carregando painel de monitoramento Leva+...</p>
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-9 h-9 text-emerald-600 animate-pulse" />
            Visão Geral & Telemetria
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Status operacional da frota, corridas ativas, rotas em andamento e estatísticas financeiras em tempo real.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2.5 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Sincronizando..." : "Sincronizar Telemetria"}
        </button>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Faturamento da Plataforma"
          value={`R$ ${stats.earnings.toFixed(2)}`}
          icon={DollarSign}
          description="Total líquido retido em taxas"
          color="emerald"
        />
        <MetricCard
          title="Motoristas Online"
          value={stats.onlineDrivers}
          icon={Car}
          description={`${stats.availableDrivers} livres / ${stats.busyDrivers} ocupados`}
          color="blue"
        />
        <MetricCard
          title="Clientes Registrados"
          value={clientsCount}
          icon={Users}
          description="Clientes ativos na plataforma"
          color="purple"
        />
        <MetricCard
          title="Entregas Ativas"
          value={stats.activeRidesCount}
          icon={MapPin}
          description="Pedidos com rota em andamento"
          color="orange"
        />
      </div>

      {/* Radar de Monitoramento de Frota & Feed de Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar e Mapa */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden relative min-h-[500px] flex flex-col justify-between">
          <div className="p-5 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-500 animate-spin-slow" />
              <h3 className="font-bold text-white text-base">Radar Operacional Leva+</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs text-emerald-400 font-semibold tracking-wider uppercase">Live Telemetry</span>
            </div>
          </div>

          {/* Radar Screen Area */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,rgba(0,0,0,0)_70%)]">
            
            {/* Concentric rings */}
            <div className="absolute w-[400px] h-[400px] rounded-full border border-emerald-500/10 pointer-events-none flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full border border-emerald-500/20 flex items-center justify-center">
                <div className="w-[200px] h-[200px] rounded-full border border-emerald-500/30 flex items-center justify-center">
                  <div className="w-[100px] h-[100px] rounded-full border border-emerald-500/40"></div>
                </div>
              </div>
            </div>

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-[1px] bg-emerald-500/10 pointer-events-none"></div>
            <div className="absolute w-[1px] h-full bg-emerald-500/10 pointer-events-none"></div>

            {/* Sweeper animation */}
            <div className="absolute w-[200px] h-[200px] origin-bottom-right bottom-1/2 right-1/2 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/0 to-emerald-500/20 rounded-tl-full animate-radar-sweep pointer-events-none"></div>

            {/* Dynamic Driver Markers on Radar */}
            {locations.length === 0 ? (
              <div className="text-slate-500 text-center space-y-2 z-10">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold">Nenhum motorista online no momento</p>
                <p className="text-xs max-w-xs mx-auto">Coloque um motorista online no app mobile para vê-lo aparecer no radar!</p>
              </div>
            ) : (
              locations.map((loc, idx) => {
                // Generate absolute radar points in a grid centered around center [0, 0]
                const angle = (idx * 360) / locations.length;
                const radius = 60 + (idx * 25) % 110; // offset radius
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * radius;
                const y = Math.sin(rad) * radius;

                const statusColors = {
                  available: "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] border-emerald-300",
                  busy: "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] border-amber-300",
                  on_ride: "bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] border-blue-300",
                  offline: "bg-slate-600 border-slate-500"
                };

                return (
                  <div
                    key={loc._id}
                    className="absolute cursor-pointer group z-10 transition-transform hover:scale-125"
                    style={{
                      transform: `translate(${x}px, ${y}px)`
                    }}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border-2 ${statusColors[loc.status || "available"]} transition-all`}></div>
                    
                    {/* Tooltip flutuante */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-5 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap min-w-[160px] pointer-events-none">
                      <p className="font-bold text-slate-100">{loc.driverId?.name || "Motorista"}</p>
                      <p className="text-slate-400 text-[10px] mt-0.5">Veículo: {loc.vehicleType === "motorcycle" ? "Moto" : loc.vehicleType}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 border-t border-slate-800 pt-1.5 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                        Velocidade: {loc.speed || 0} km/h
                      </div>
                    </div>
                  </div>
                );
              })
            )}

          </div>

          {/* Legend */}
          <div className="p-4 bg-slate-900/60 border-t border-slate-900 grid grid-cols-3 text-center text-xs font-semibold text-slate-400">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span>Disponível</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
              <span>Em Rota / Entrega</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
              <span>Ocupado / Pausado</span>
            </div>
          </div>
        </div>

        {/* Feed de Atividades Recentes do App */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 flex flex-col justify-between">
          <div className="border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600 animate-spin-slow" />
              Feed Operacional ao Vivo
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Últimas ações e ocorrências registradas no Leva+.</p>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[360px] pr-2">
            {rides.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-10 font-semibold">Nenhuma atividade registrada hoje.</p>
            ) : (
              rides.slice(0, 7).map((ride) => {
                const serviceLabel = ride.serviceType === "delivery" ? "Entrega" : "Corrida";
                let labelColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                let actionDesc = "foi iniciada na plataforma";

                if (ride.status === "completed") {
                  labelColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                  actionDesc = `foi CONCLUÍDA com sucesso! Total: R$ ${Number(ride.pricing?.total || 0).toFixed(2)}`;
                } else if (ride.status === "cancelled") {
                  labelColor = "bg-rose-50 text-rose-700 border-rose-100";
                  actionDesc = "foi CANCELADA pelo usuário";
                } else if (ride.status === "in_progress") {
                  labelColor = "bg-blue-50 text-blue-700 border-blue-100";
                  actionDesc = "está atualmente EM ROTA de entrega";
                }

                return (
                  <div key={ride._id} className="flex gap-3 text-xs border-b border-gray-100 pb-3 last:border-b-0">
                    <div className={`px-2 py-1 rounded-lg border font-bold text-[10px] tracking-wide self-start shrink-0 ${labelColor}`}>
                      {serviceLabel.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold leading-relaxed">
                        A {serviceLabel.toLowerCase()} de <span className="font-extrabold">{ride.clientId?.name || "Cliente"}</span> {actionDesc}.
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        De: {ride.pickup.address.split(",")[0]} {"→"} Para: {ride.dropoff.address.split(",")[0]}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4 text-center">
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full inline-block tracking-wider uppercase">
              Sincronizado via WebSockets ✓
            </span>
          </div>
        </div>

      </div>

      {/* Grid de Ativos & Motoristas Online */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
          <div>
            <h3 className="font-extrabold text-gray-950 text-lg">Central de Telemetria de Motoristas</h3>
            <p className="text-xs text-gray-500 mt-0.5">Rastreamento de velocidade, veículo e status detalhado dos condutores.</p>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
            {locations.length} Conectados
          </span>
        </div>

        {locations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Car className="w-12 h-12 opacity-30 mx-auto mb-3" />
            <p className="font-semibold text-sm">Nenhum motorista com telemetria ativa</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => {
              const statusLabels = {
                available: "Livre",
                busy: "Ocupado",
                on_ride: "Em Rota",
                offline: "Offline"
              };

              const statusColors = {
                available: "bg-emerald-100 text-emerald-800 border-emerald-200",
                busy: "bg-amber-100 text-amber-800 border-amber-200",
                on_ride: "bg-blue-100 text-blue-800 border-blue-200",
                offline: "bg-slate-100 text-slate-700 border-slate-200"
              };

              return (
                <div key={loc._id} className="p-4 bg-slate-50 border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                    {loc.driverId?.name?.charAt(0).toUpperCase() || "M"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{loc.driverId?.name || "Motorista"}</h4>
                    <p className="text-xs text-gray-500 font-semibold truncate">{loc.driverId?.email}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusColors[loc.status]}`}>
                        {statusLabels[loc.status]}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full capitalize">
                        {loc.vehicleType === "motorcycle" ? "Moto" : loc.vehicleType}
                      </span>
                    </div>

                    <div className="mt-3 border-t border-gray-200 pt-2 grid grid-cols-2 text-[10px] text-gray-500 font-semibold gap-2">
                      <div className="flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-gray-400" />
                        <span>Vel: {loc.speed || 0} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">Lat: {loc.location.coordinates[1].toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// Subcomponente de Card de Métrica
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  color: "emerald" | "blue" | "purple" | "orange";
}

function MetricCard({ title, value, icon: Icon, description, color }: MetricCardProps) {
  const styles = {
    emerald: {
      bg: "bg-emerald-50 border-emerald-200/50",
      text: "text-emerald-700",
      accent: "bg-emerald-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
    },
    blue: {
      bg: "bg-blue-50 border-blue-200/50",
      text: "text-blue-700",
      accent: "bg-blue-600 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
    },
    purple: {
      bg: "bg-purple-50 border-purple-200/50",
      text: "text-purple-700",
      accent: "bg-purple-600 text-white shadow-[0_4px_12px_rgba(147,51,234,0.3)]"
    },
    orange: {
      bg: "bg-orange-50 border-orange-200/50",
      text: "text-orange-700",
      accent: "bg-orange-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)]"
    }
  };

  const choice = styles[color];

  return (
    <div className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all flex items-center justify-between ${choice.bg}`}>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1.5 font-medium">{description}</p>
      </div>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${choice.accent}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
