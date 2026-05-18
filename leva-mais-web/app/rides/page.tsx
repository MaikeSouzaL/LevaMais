"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapPin,
  Car,
  Search,
  Filter,
  DollarSign,
  Calendar,
  X,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  User,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ridesService, Ride } from "@/services/ridesService";
import { useToast } from "@/components/ui/Toast";

const STATUS_LABELS = {
  requesting: "Buscando",
  accepted: "Aceito",
  driver_assigned: "Motorista Atribuído",
  driver_arriving: "Chegando",
  arrived: "No Local",
  in_progress: "Em Rota",
  completed: "Concluído",
  cancelled: "Cancelado",
  scheduled: "Agendado"
};

const STATUS_COLORS = {
  requesting: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-blue-50 text-blue-700 border-blue-200",
  driver_assigned: "bg-indigo-50 text-indigo-700 border-indigo-200",
  driver_arriving: "bg-indigo-100 text-indigo-800 border-indigo-200",
  arrived: "bg-teal-50 text-teal-700 border-teal-200",
  in_progress: "bg-sky-50 text-sky-700 border-sky-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  scheduled: "bg-purple-50 text-purple-700 border-purple-200"
};

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      const data = await ridesService.getAll();
      setRides(data);
    } catch {
      showToast("Erro ao carregar histórico de entregas", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
    showToast("Histórico de corridas atualizado", "success");
  };

  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      const matchesStatus = statusFilter === "all" || ride.status === statusFilter;
      const matchesSearch =
        (ride.clientId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ride.driverId?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ride.pickup?.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ride.dropoff?.address || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [rides, statusFilter, searchQuery]);

  const handleViewDetails = (ride: Ride) => {
    setSelectedRide(ride);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-semibold">Carregando painel de entregas Leva+...</p>
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
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight flex items-center gap-3.5">
            <Car className="w-9 h-9 text-emerald-600 animate-pulse" />
            Central de Corridas & Entregas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Supervisão em tempo real de coletas, entregas, taxas cobradas, fotos de comprovação de entrega e ocorrências.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Sincronizando..." : "Sincronizar"}
        </button>
      </div>

      {/* Filters Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por cliente, motorista, endereço de coleta ou entrega..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Status Selection */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-semibold text-gray-700"
          >
            <option value="all">Todos os Status</option>
            <option value="requesting">Buscando Motorista</option>
            <option value="accepted">Aceitos</option>
            <option value="in_progress">Em Rota</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
            <option value="scheduled">Agendados</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold border-t border-gray-100 pt-3">
          <Filter className="w-3.5 h-3.5" />
          <span>
            Mostrando <strong>{filteredRides.length}</strong> de <strong>{rides.length}</strong> pedidos registrados.
          </span>
        </div>
      </div>

      {/* Rides Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-200">
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Pedido</th>
                <th className="px-6 py-4 text-left">Cliente / Condutor</th>
                <th className="px-6 py-4 text-left">Itinerário</th>
                <th className="px-6 py-4 text-left">Finanças</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {filteredRides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="text-gray-400 space-y-2.5">
                      <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 animate-bounce" />
                      <p className="font-extrabold text-gray-600 text-sm">Nenhuma corrida encontrada</p>
                      <p className="text-xs">Tente ajustar a busca ou os filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRides.map((ride) => (
                  <tr key={ride._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900 truncate max-w-[120px]">{ride._id}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-400 font-bold capitalize">
                          <span>{ride.serviceType === "delivery" ? "Entrega" : "Passageiro"}</span>
                          <span>•</span>
                          <span>{ride.vehicleType === "motorcycle" ? "Moto" : ride.vehicleType}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="text-gray-900 truncate max-w-[130px]" title={ride.clientId?.name}>
                            {ride.clientId?.name || "N/A"}
                          </span>
                        </div>
                        {ride.driverId ? (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                            <span className="font-bold">Mot:</span>
                            <span className="truncate max-w-[120px]" title={ride.driverId.name}>
                              {ride.driverId.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full inline-block">
                            Buscando motorista
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="space-y-1.5 max-w-[260px]">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <p className="truncate text-[10px]">{ride.pickup?.address || "Origem"}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                          <p className="truncate text-[10px]">{ride.dropoff?.address || "Destino"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">R$ {Number(ride.pricing?.total || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-bold">
                          Taxa App: R$ {Number(ride.pricing?.appFee || 0).toFixed(2)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold ${STATUS_COLORS[ride.status]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {STATUS_LABELS[ride.status] || ride.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewDetails(ride)}
                        className="p-2 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors inline-block"
                        title="Ver detalhes e comprovantes"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ride Details & Proofs Drawer */}
      {isDrawerOpen && selectedRide && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
          
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto flex flex-col justify-between">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-950">Ficha Operacional da Corrida</h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">Ref: {selectedRide._id}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 space-y-6">
              
              {/* Status Section */}
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-bold">Status da Operação</p>
                  <p className="text-sm font-black text-gray-950 mt-0.5">{STATUS_LABELS[selectedRide.status] || selectedRide.status}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${STATUS_COLORS[selectedRide.status]}`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {selectedRide.status?.toUpperCase()}
                </span>
              </div>

              {/* Rota / Itinerario */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Itinerário & Trajeto</h4>
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex gap-2.5 items-start">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">A</span>
                    <div>
                      <p className="font-bold text-gray-500 text-[10px]">Origem / Ponto de Coleta</p>
                      <p className="text-gray-900 mt-0.5 font-bold">{selectedRide.pickup?.address}</p>
                    </div>
                  </div>

                  <div className="border-l border-dashed border-gray-300 ml-1.5 h-4 my-1"></div>

                  <div className="flex gap-2.5 items-start">
                    <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">B</span>
                    <div>
                      <p className="font-bold text-gray-500 text-[10px]">Destino / Ponto de Entrega</p>
                      <p className="text-gray-900 mt-0.5 font-bold">{selectedRide.dropoff?.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participantes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-xs">
                  <p className="font-bold text-gray-500 text-[10px] mb-2 uppercase">Cliente</p>
                  <p className="font-black text-gray-900 truncate">{selectedRide.clientId?.name || "N/A"}</p>
                  <p className="text-gray-400 mt-0.5 font-semibold text-[10px]">{selectedRide.clientId?.phone || "Sem telefone"}</p>
                </div>

                <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-xs">
                  <p className="font-bold text-gray-500 text-[10px] mb-2 uppercase">Motorista</p>
                  {selectedRide.driverId ? (
                    <>
                      <p className="font-black text-gray-900 truncate">{selectedRide.driverId.name}</p>
                      <p className="text-gray-400 mt-0.5 font-semibold text-[10px]">{selectedRide.driverId.phone}</p>
                    </>
                  ) : (
                    <p className="font-bold text-amber-600 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded-lg text-center mt-1">Buscando condutor...</p>
                  )}
                </div>
              </div>

              {/* Detalhes Financeiros */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Demonstrativo Financeiro</h4>
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Valor Pago pelo Cliente:</span>
                    <span className="font-bold text-gray-900">R$ {Number(selectedRide.pricing?.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Repasse ao Motorista:</span>
                    <span className="font-bold text-emerald-600">R$ {Number(selectedRide.pricing?.driverValue || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600 border-t border-gray-200 pt-2.5">
                    <span className="font-bold text-gray-900">Taxa Retida pelo App (AppFee):</span>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">R$ {Number(selectedRide.pricing?.appFee || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Comprovação por Foto (Proofs) */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Comprovantes de Entrega & Coleta
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Pickup Proof */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-slate-50 text-center space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Comprovante de Coleta</p>
                    {selectedRide.proofs?.pickupPhoto ? (
                      <div className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white">
                        <img
                          src={selectedRide.proofs.pickupPhoto}
                          alt="Coleta"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[9px] font-bold leading-tight">Coleta pendente ou sem imagem</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Proof */}
                  <div className="border border-gray-200 rounded-xl p-3 bg-slate-50 text-center space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Comprovante de Entrega</p>
                    {selectedRide.proofs?.deliveryPhoto ? (
                      <div className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white">
                        <img
                          src={selectedRide.proofs.deliveryPhoto}
                          alt="Entrega"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[9px] font-bold leading-tight">Entrega pendente ou sem imagem</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Registro Cronologico */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Linha do Tempo</h4>
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-500 font-semibold space-y-1.5">
                  <div className="flex justify-between">
                    <span>Criado em:</span>
                    <span className="text-gray-900">{format(new Date(selectedRide.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Atualizado em:</span>
                    <span className="text-gray-900">{format(new Date(selectedRide.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-150 p-4 z-10 flex gap-3">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
