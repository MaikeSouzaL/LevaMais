"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserCheck,
  UserX,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  Camera,
  Shield,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatCPF, formatPhone, formatDate } from "@/lib/formatters";
import { verificationService } from "@/services/verificationService";

// Tipos
interface PendingDriver {
  _id: string;
  // Dados Pessoais
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: string;
  phone: string;
  email: string;

  // Endereço
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Documentos
  cnh: {
    number: string;
    category: string; // A, B, C, D, E
    expiryDate: string;
    photoUrl: string;
  };

  // Dados do Veículo
  vehicle: {
    type: "moto" | "carro" | "van" | "caminhao";
    brand: string;
    model: string;
    year: number;
    color: string;
    plate: string;
    renavam: string;
    photoUrls: string[]; // Fotos do veículo
  };

  // Documentos do Veículo
  vehicleDocuments: {
    crlv: string; // Foto do documento
    insurance?: string; // Foto do seguro (opcional)
  };

  // Dados Profissionais
  hasCNPJ: boolean;
  cnpj?: string;

  // Fotos
  profilePhotoUrl: string;
  documentPhotoUrl: string; // Selfie segurando documento

  // Informações da conta
  bankAccount?: {
    bank: string;
    agency: string;
    account: string;
    accountType: "corrente" | "poupanca";
    pixKey?: string;
  };

  // Status
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;

  // Observações
  notes?: string;
}

export default function DriverVerificationPage() {
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [selectedDriver, setSelectedDriver] = useState<PendingDriver | null>(
    null
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Carregar motoristas pendentes
  const loadPendingDrivers = useCallback(async () => {
    try {
      setLoading(true);
      // Chamada real à API via serviço
      const apiDrivers = await verificationService.getPendingDrivers({
        status: filterStatus === "all" ? undefined : filterStatus,
        search: searchTerm || undefined,
      });
      // Mapear para o tipo local esperado pela UI
      const mapped = (Array.isArray(apiDrivers) ? apiDrivers : []).map(
        (d: any) => ({
          _id: d.id || d._id || "",
          fullName: d.fullName || "",
          cpf: d.cpf || "",
          rg: d.rg || "",
          birthDate: d.birthDate || "",
          phone: d.phone || "",
          email: d.email || "",
          address: d.address || {
            street: "",
            number: "",
            complement: "",
            neighborhood: "",
            city: d.cityName || "",
            state: "",
            zipCode: "",
          },
          cnh: d.cnh || {
            number: "",
            category: "",
            expiryDate: "",
            photoUrl: d.photos?.cnh || "",
          },
          vehicle: d.vehicle || {
            type: d.vehicle?.type || "carro",
            brand: d.vehicle?.brand || d.vehicle?.brand || "",
            model: d.vehicle?.model || "",
            year: d.vehicle?.year || 0,
            color: d.vehicle?.color || "",
            plate: d.vehicle?.plate || "",
            renavam: d.vehicle?.renavam || "",
            photoUrls: d.photos?.vehicle || [],
          },
          vehicleDocuments: d.vehicleDocuments || {
            crlv: d.documents?.crlv?.url || "",
            insurance: "",
          },
          hasCNPJ: d.hasCnpj ?? false,
          cnpj: d.cnpj || "",
          profilePhotoUrl: d.profilePhotoUrl || d.photos?.profile || "",
          documentPhotoUrl: d.documentPhotoUrl || "",
          bankAccount: d.bankAccount || {
            bank: "",
            agency: "",
            account: "",
            accountType: "corrente",
            pixKey: "",
          },
          status: d.status || "pending",
          submittedAt: d.registrationDate || d.reviewedAt || "",
        })
      );
      setPendingDrivers(mapped);
    } catch (error) {
      showToast("Erro ao carregar motoristas pendentes", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showToast, filterStatus, searchTerm]);

  useEffect(() => {
    loadPendingDrivers();
  }, [loadPendingDrivers]);

  // Filtrar motoristas
  const filteredDrivers = pendingDrivers.filter((driver) => {
    const matchSearch =
      driver.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.cpf.includes(searchTerm) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      filterStatus === "all" || driver.status === filterStatus;

    return matchSearch && matchStatus;
  });

  // Estatísticas
  const stats = {
    pending: pendingDrivers.filter((d) => d.status === "pending").length,
    approved: pendingDrivers.filter((d) => d.status === "approved").length,
    rejected: pendingDrivers.filter((d) => d.status === "rejected").length,
  };

  // Aprovar motorista
  const handleApprove = async (driverId: string) => {
    setProcessing(true);
    try {
      // TODO: Chamar API real
      // await fetch(`/api/drivers/${driverId}/approve`, { method: 'POST' });
      console.log(`Aprovando motorista ${driverId}`);

      showToast("Motorista aprovado com sucesso!", "success");
      setShowDetailModal(false);
      loadPendingDrivers();
    } catch (err) {
      console.error("Erro ao aprovar motorista:", err);
      showToast("Erro ao aprovar motorista", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Reprovar motorista
  const handleReject = async (driverId: string, reason: string) => {
    if (!reason || reason.trim() === "") {
      showToast("Por favor, informe o motivo da rejeição", "error");
      return;
    }

    setProcessing(true);
    try {
      // TODO: Chamar API real
      // await fetch(`/api/drivers/${driverId}/reject`, {
      //   method: 'POST',
      //   body: JSON.stringify({ reason, notes: rejectionNotes })
      // });
      console.log(`Reprovando motorista ${driverId} - Motivo: ${reason}`);
      console.log(`Observações: ${rejectionNotes}`);

      showToast("Motorista reprovado", "success");
      setShowDetailModal(false);
      setShowRejectModal(false);
      setRejectionReason("");
      setRejectionNotes("");
      loadPendingDrivers();
    } catch (err) {
      console.error("Erro ao reprovar motorista:", err);
      showToast("Erro ao reprovar motorista", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Abrir modal de rejeição
  const openRejectModal = () => {
    setShowRejectModal(true);
  };

  // Fechar modal de rejeição
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectionNotes("");
  };

  // Visualizar detalhes
  const handleViewDetails = (driver: PendingDriver) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
  };

  // Ícone do veículo
  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "moto":
        return "🏍️";
      case "carro":
        return "🚗";
      case "van":
        return "🚐";
      case "caminhao":
        return "🚚";
      default:
        return "🚗";
    }
  };

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Pendente
          </span>
        );
      case "approved":
        return (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Aprovado
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1">
            <XCircle className="w-4 h-4" />
            Reprovado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {ToastContainer}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Verificação de Motoristas
            </h1>
            <p className="text-slate-600">
              Analise e aprove motoristas para trabalhar na plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Aguardando Análise</p>
              <p className="text-3xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Aprovados</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Reprovados</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.rejected}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Aguardando Análise</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Reprovados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Motoristas */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando motoristas...</p>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
          <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-900 mb-2">
            Nenhum motorista encontrado
          </p>
          <p className="text-slate-600">
            Não há motoristas pendentes de verificação no momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredDrivers.map((driver) => (
            <div
              key={driver._id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Foto do Motorista */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200">
                      {driver.profilePhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={driver.profilePhotoUrl}
                          alt={driver.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Camera className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações Principais */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                          {driver.fullName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            CPF: {formatCPF(driver.cpf)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {formatPhone(driver.phone)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {driver.email}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(driver.status)}
                    </div>

                    {/* Detalhes do Veículo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                        <span className="text-2xl">
                          {getVehicleIcon(driver.vehicle.type)}
                        </span>
                        <div>
                          <p className="text-xs text-slate-600">Veículo</p>
                          <p className="font-semibold text-slate-900">
                            {driver.vehicle.brand} {driver.vehicle.model}
                          </p>
                          <p className="text-sm text-slate-600">
                            {driver.vehicle.plate} • {driver.vehicle.year}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                        <Shield className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="text-xs text-slate-600">CNH</p>
                          <p className="font-semibold text-slate-900">
                            Categoria {driver.cnh.category}
                          </p>
                          <p className="text-sm text-slate-600">
                            Válida até {formatDate(driver.cnh.expiryDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                        <Calendar className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-600">Cadastro</p>
                          <p className="font-semibold text-slate-900">
                            {formatDate(driver.submittedAt)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {driver.hasCNPJ ? "Com CNPJ" : "Sem CNPJ"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleViewDetails(driver)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Detalhes Completos
                      </button>

                      {driver.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(driver._id)}
                            disabled={processing}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" />
                            Aprovar Motorista
                          </button>

                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              openRejectModal();
                            }}
                            disabled={processing}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                          >
                            <UserX className="w-4 h-4" />
                            Reprovar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedDriver && (
        <DriverDetailModal
          driver={selectedDriver}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onApprove={() => handleApprove(selectedDriver._id)}
          onReject={(reason) => handleReject(selectedDriver._id, reason)}
          processing={processing}
        />
      )}

      {/* Modal de Motivo de Rejeição */}
      {showRejectModal && selectedDriver && (
        <RejectReasonModal
          driverName={selectedDriver.fullName}
          isOpen={showRejectModal}
          onClose={closeRejectModal}
          onConfirm={() => handleReject(selectedDriver._id, rejectionReason)}
          reason={rejectionReason}
          setReason={setRejectionReason}
          notes={rejectionNotes}
          setNotes={setRejectionNotes}
          processing={processing}
        />
      )}

      {ToastContainer}
    </div>
  );
}

// Modal de Motivo de Rejeição
interface RejectReasonModalProps {
  driverName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reason: string;
  setReason: (reason: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  processing: boolean;
}

function RejectReasonModal({
  driverName,
  isOpen,
  onClose,
  onConfirm,
  reason,
  setReason,
  notes,
  setNotes,
  processing,
}: RejectReasonModalProps) {
  if (!isOpen) return null;

  const commonReasons = [
    "Documentação incompleta",
    "Documentos ilegíveis",
    "CNH vencida",
    "CRLV irregular",
    "Veículo não atende requisitos",
    "Dados inconsistentes",
    "Antecedentes criminais",
    "Idade mínima não atendida",
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-500 px-6 py-4 text-white rounded-t-xl">
          <h3 className="font-semibold text-xl flex items-center gap-2">
            <XCircle className="w-6 h-6" />
            Reprovar Motorista
          </h3>
          <p className="text-red-100 text-sm mt-1">
            Informe o motivo da reprovação de {driverName}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Motivos Comuns */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Selecione um motivo comum:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {commonReasons.map((commonReason) => (
                <button
                  key={commonReason}
                  onClick={() => setReason(commonReason)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 transition-all ${
                    reason === commonReason
                      ? "border-red-500 bg-red-50 text-red-700 font-medium"
                      : "border-slate-200 hover:border-red-300 text-slate-600"
                  }`}
                >
                  {commonReason}
                </button>
              ))}
            </div>
          </div>

          {/* Motivo Personalizado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ou digite um motivo personalizado:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Foto do veículo de má qualidade"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Observações Adicionais */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observações adicionais (opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione informações extras que possam ajudar o motorista a corrigir o problema..."
              rows={4}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Atenção</p>
              <p>
                O motorista será notificado sobre a reprovação e poderá reenviar
                os documentos corrigidos.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-xl flex justify-end gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-white border border-slate-300 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={processing || !reason.trim()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <UserX className="w-4 h-4" />
                Confirmar Reprovação
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de Detalhes do Motorista
interface DriverDetailModalProps {
  driver: PendingDriver;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  processing: boolean;
}

function DriverDetailModal({
  driver,
  isOpen,
  onClose,
  onApprove,
  onReject,
  processing,
}: DriverDetailModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
          <h3 className="font-semibold text-xl">
            Detalhes Completos do Motorista
          </h3>
          <p className="text-emerald-100 text-sm">
            Verifique todas as informações antes de aprovar
          </p>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Dados Pessoais */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Dados Pessoais
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4">
              <div>
                <p className="text-sm text-slate-600">Nome Completo</p>
                <p className="font-semibold text-slate-900">
                  {driver.fullName}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">CPF</p>
                <p className="font-semibold text-slate-900">
                  {formatCPF(driver.cpf)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">RG</p>
                <p className="font-semibold text-slate-900">{driver.rg}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Data de Nascimento</p>
                <p className="font-semibold text-slate-900">
                  {formatDate(driver.birthDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Telefone</p>
                <p className="font-semibold text-slate-900">
                  {formatPhone(driver.phone)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-semibold text-slate-900">{driver.email}</p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Endereço
            </h4>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="font-semibold text-slate-900">
                {driver.address.street}, {driver.address.number}
                {driver.address.complement && ` - ${driver.address.complement}`}
              </p>
              <p className="text-slate-700">
                {driver.address.neighborhood} - {driver.address.city}/
                {driver.address.state}
              </p>
              <p className="text-slate-600">CEP: {driver.address.zipCode}</p>
            </div>
          </div>

          {/* CNH */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Carteira Nacional de Habilitação
            </h4>
            <div className="grid grid-cols-3 gap-4 bg-slate-50 rounded-lg p-4 mb-4">
              <div>
                <p className="text-sm text-slate-600">Número</p>
                <p className="font-semibold text-slate-900">
                  {driver.cnh.number}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Categoria</p>
                <p className="font-semibold text-slate-900">
                  {driver.cnh.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Validade</p>
                <p className="font-semibold text-slate-900">
                  {formatDate(driver.cnh.expiryDate)}
                </p>
              </div>
            </div>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Foto da CNH</p>
              <div className="w-full h-48 bg-slate-200 rounded-lg flex items-center justify-center">
                <Camera className="w-12 h-12 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Veículo */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-600" />
              Dados do Veículo
            </h4>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4 mb-4">
              <div>
                <p className="text-sm text-slate-600">Tipo</p>
                <p className="font-semibold text-slate-900 capitalize">
                  {driver.vehicle.type}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Marca/Modelo</p>
                <p className="font-semibold text-slate-900">
                  {driver.vehicle.brand} {driver.vehicle.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Ano</p>
                <p className="font-semibold text-slate-900">
                  {driver.vehicle.year}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Cor</p>
                <p className="font-semibold text-slate-900">
                  {driver.vehicle.color}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Placa</p>
                <p className="font-semibold text-slate-900">
                  {driver.vehicle.plate}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">RENAVAM</p>
                <p className="font-semibold text-slate-900">
                  {driver.vehicle.renavam}
                </p>
              </div>
            </div>
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">Fotos do Veículo</p>
              <div className="grid grid-cols-3 gap-4">
                {driver.vehicle.photoUrls.map((url, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center"
                  >
                    <Camera className="w-8 h-8 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CNPJ */}
          {driver.hasCNPJ && (
            <div className="mb-6">
              <h4 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Dados Profissionais
              </h4>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600">CNPJ</p>
                <p className="font-semibold text-slate-900">{driver.cnpj}</p>
              </div>
            </div>
          )}

          {/* Fotos de Verificação */}
          <div className="mb-6">
            <h4 className="font-semibold text-lg text-slate-900 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" />
              Fotos de Verificação
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-100 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-2">Foto do Rosto</p>
                <div className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-400" />
                </div>
              </div>
              <div className="bg-slate-100 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-2">
                  Selfie com Documento
                </p>
                <div className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center">
                  <Camera className="w-12 h-12 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Reprovação */}
          {showRejectForm && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo da Reprovação *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                placeholder="Descreva o motivo da reprovação..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>

          <div className="flex gap-3">
            {driver.status === "pending" && (
              <>
                {showRejectForm ? (
                  <>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => onReject(rejectionReason)}
                      disabled={!rejectionReason.trim() || processing}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      Confirmar Reprovação
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setShowRejectForm(true)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                    >
                      <UserX className="w-4 h-4" />
                      Reprovar Motorista
                    </button>
                    <button
                      onClick={onApprove}
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Aprovar Motorista
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
