"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  RefreshCw,
  Image as ImageIcon,
  Check,
  X,
  CreditCard
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import axios from "axios";

// TypeScript Interfaces
interface PendingDriver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  city?: string;
  userType: "driver";
  driverStatus: "pending" | "approved" | "rejected" | "none";
  isActive: boolean;
  createdAt: string;
  driverDocuments?: {
    cnhFront?: string;
    cnhBack?: string;
    crlvFront?: string;
    crlvBack?: string;
    vehiclePhoto?: string;
    selfie?: string;
    submittedAt?: string;
    rejectionReason?: string;
    cnhFrontStatus?: string;
    cnhBackStatus?: string;
    selfieStatus?: string;
    cpfStatus?: string;
    bankAccountStatus?: string;
    reviewedAt?: string;
    reviewedBy?: string;
  };
  clientVerification?: {
    status?: string;
    cpfStatus?: string;
    selfieStatus?: string;
    documents?: {
      selfie?: string;
      rgFront?: string;
      rgBack?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  vehicleInfo?: {
    plate: string;
    model: string;
    color: string;
    year: number;
  };
  vehicles?: Array<{
    _id: string;
    type: "motorcycle" | "car" | "van" | "truck";
    plate: string;
    model: string;
    color?: string;
    year?: number;
    renavam?: string;
    officialBrand?: string;
    officialChassis?: string;
    officialColor?: string;
    officialModel?: string;
    officialYear?: number;
    isVerifiedByAPI?: boolean;
    plateVerifiedByAPI?: boolean;
    plateVerificationSource?: string;
    vehicleDocumentsStatus?: {
      crlvFront?: string;
      crlvBack?: string;
      vehiclePhoto?: string;
    };
    documents?: {
      crlvFront?: string;
      crlvBack?: string;
      vehiclePhoto?: string;
      submittedAt?: string;
    };
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  activeVehicleId?: string;
  vehicleType?: string;
  bankAccount?: {
    bank: string;
    agency: string;
    account: string;
    accountType: string;
    pixKey?: string;
  };
}

// Utility to rewrite local/external IP URLs from device to local environment domain
const cleanDocUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("file:///")) {
    return url; // Keep local cache URIs, will be handled gracefully by UI
  }
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
  const backendBase = API_URL.replace("/api", "");
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/^https?:\/\/[^\/]+/, backendBase);
  }
  if (url.startsWith("/")) {
    return `${backendBase}${url}`;
  }
  return `${backendBase}/${url}`;
};

interface PendingClient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  city?: string;
  userType: "client";
  isActive: boolean;
  createdAt: string;
  emailVerified?: boolean;
  clientVerification?: {
    status?: "none" | "pending" | "approved" | "rejected";
    cpfStatus?: string;
    selfieStatus?: string;
    documents?: {
      selfie?: string;
      rgFront?: string;
      rgBack?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
}

export default function UnifiedVerificationPage() {
  const [activeTab, setActiveTab] = useState<"drivers" | "clients">("drivers");
  const [drivers, setDrivers] = useState<PendingDriver[]>([]);
  const [clients, setClients] = useState<PendingClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedUser, setSelectedUser] = useState<PendingDriver | PendingClient | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Full-screen image viewer state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState("");

  const openLightbox = (url: string, title: string) => {
    if (url.startsWith("file://")) {
      showToast("Este documento foi enviado como arquivo local e nao esta disponivel no servidor. O motorista precisa reenviar.", "error");
      return;
    }
    setLightboxTitle(title);
    setLightboxImage(cleanDocUrl(url));
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
      
      const [driversRes, clientsRes] = await Promise.all([
        axios.get(`${API_URL}/auth/users?userType=driver`, {
          headers: { "x-admin-key": ADMIN_API_KEY }
        }),
        axios.get(`${API_URL}/auth/users?userType=client`, {
          headers: { "x-admin-key": ADMIN_API_KEY }
        })
      ]);

      setDrivers(driversRes.data.users || []);
      setClients(clientsRes.data.users || []);
    } catch (err) {
      showToast("Erro ao conectar ao banco de cadastros", "error");
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
    showToast("Fila de validação atualizada", "success");
  };

  // Filtered lists
  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.cpf || "").includes(searchTerm) ||
        (d.phone || "").includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        d.driverStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchTerm, statusFilter]);

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cpf || "").includes(searchTerm) ||
        (c.phone || "").includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "pending" && (c.clientVerification?.status === "pending" || !c.clientVerification || c.clientVerification.status === "none")) ||
        (statusFilter === "approved" && c.clientVerification?.status === "approved") ||
        (statusFilter === "active" && c.clientVerification?.status === "approved") ||
        (statusFilter === "rejected" && c.clientVerification?.status === "rejected");

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  // Approve Account Action
  const handleApproveUser = async (user: PendingDriver | PendingClient) => {
    setProcessing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

      const payload: any = {
        isActive: true
      };

      if (user.userType === "driver") {
        payload.driverStatus = "approved";
        payload.driverDocuments = {
          ...(user as PendingDriver).driverDocuments,
          rejectionReason: ""
        };

        const driverUser = user as PendingDriver;
        // Na nova abordagem, cada veiculo mantem seu status individual.
        // Apenas ativa o primeiro veiculo APROVADO se nenhum estiver ativo
        if (driverUser.vehicles && driverUser.vehicles.length > 0) {
          if (!driverUser.activeVehicleId) {
            const approvedVehicle = driverUser.vehicles.find(v => v.status === "approved");
            if (approvedVehicle) {
              payload.activeVehicleId = approvedVehicle._id;
              payload.vehicleType = approvedVehicle.type;
              payload.vehicleInfo = {
                plate: approvedVehicle.plate,
                model: approvedVehicle.model,
                color: approvedVehicle.color || "N?o informada",
                year: approvedVehicle.year || new Date().getFullYear()
              };
            }
          }
        }
      } else if (user.userType === "client") {
        payload.clientVerification = {
          ...((user as PendingClient).clientVerification || {}),
          status: "approved",
          selfieStatus: "approved",
          cpfStatus: "valid"
        };
      }

      await axios.patch(`${API_URL}/auth/users/${user._id}`, payload, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });

      showToast(`Cadastro de ${user.name} aprovado e ativo!`, "success");
      setIsDrawerOpen(false);
      loadData();
    } catch {
      showToast("Erro ao processar aprovação", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Update individual driver compliance aspects (CNH Front, CNH Back, Selfie, CPF, Bank Account)
  const handleDriverVerificationUpdate = async (userId: string, field: string, newStatus: "approved" | "rejected", reason?: string) => {
    setProcessing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

      await axios.patch(`${API_URL}/auth/users/${userId}/driver-verification`, {
        field,
        status: newStatus,
        reason: reason || ""
      }, { headers: { "x-admin-key": ADMIN_API_KEY } });

      const fieldLabel = field
        .replace("Status", "")
        .replace("cnhFront", "CNH Frente")
        .replace("cnhBack", "CNH Verso")
        .replace("selfie", "Selfie")
        .replace("cpf", "CPF")
        .replace("bankAccount", "Dados de Repasse");

      showToast(`${fieldLabel} ${newStatus === "approved" ? "aprovado" : "reprovado"} com sucesso!`, "success");
      
      // Update selectedUser state locally so UI updates instantly in drawer
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(prev => {
          if (!prev) return null;
          const driver = prev as PendingDriver;
          return {
            ...driver,
            driverDocuments: {
              ...(driver.driverDocuments || {}),
              [field]: newStatus,
              rejectionReason: newStatus === "rejected" ? (reason || "") : (driver.driverDocuments?.rejectionReason || "")
            }
          } as any;
        });
      }

      loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Erro ao atualizar status do documento";
      showToast(errMsg, "error");
    } finally {
      setProcessing(false);
    }
  };

  // Update individual client compliance aspects (CPF or Selfie)
  // Approve or reject individual vehicle
  const handleVehicleStatusUpdate = async (userId: string, vehicleId: string, newStatus: "approved" | "rejected", reason?: string) => {
    setProcessing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

      const driverUser = selectedUser as PendingDriver;
      const updatedVehicles = (driverUser.vehicles || []).map(v => {
        if (v._id === vehicleId) {
          return { ...v, status: newStatus, rejectionReason: newStatus === "rejected" ? (reason || "Reprovado pelo admin") : "" };
        }
        return v;
      });

      await axios.patch(`${API_URL}/auth/users/${userId}`, {
        vehicles: updatedVehicles,
      }, { headers: { "x-admin-key": ADMIN_API_KEY } });

      showToast(`Veiculo ${newStatus === "approved" ? "aprovado" : "reprovado"}!`, "success");
      loadData();
    } catch {
      showToast("Erro ao atualizar status do veiculo", "error");
    } finally {
      setProcessing(false);
    }
  };

  // Reject Account Action
  const handleRejectUser = async () => {
    const finalReason = customReason.trim() || rejectionReason;
    if (!finalReason) {
      showToast("Selecione ou insira um motivo de reprovação", "error");
      return;
    }

    if (selectedUser?.userType === "client") {
      setProcessing(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
        const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "";
        await axios.patch(
          `${API_URL}/auth/users/${selectedUser._id}`,
          {
            isActive: false,
            clientVerification: {
              ...(selectedUser.clientVerification || {}),
              status: "rejected",
              selfieStatus: "rejected",
              rejectionReason: finalReason,
            },
          },
          { headers: { "x-admin-key": ADMIN_API_KEY } },
        );
        showToast(`Cadastro de ${selectedUser.name} reprovado.`, "success");
        setShowRejectModal(false);
        setIsDrawerOpen(false);
        setCustomReason("");
        loadData();
      } catch {
        showToast("Erro ao registrar reprovação", "error");
      } finally {
        setProcessing(false);
      }
      return;
    }

    setProcessing(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
      const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

      const payload: any = {};

      if (selectedUser?.userType === "driver") {
        payload.isActive = false;
        payload.driverStatus = "rejected";
        payload.driverDocuments = {
          ...(selectedUser as PendingDriver).driverDocuments,
          rejectionReason: finalReason
        };
      }

      await axios.patch(`${API_URL}/auth/users/${selectedUser?._id}`, payload, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });

      showToast(`Cadastro de ${selectedUser?.name} reprovado.`, "success");
      setShowRejectModal(false);
      setIsDrawerOpen(false);
      setCustomReason("");
      loadData();
    } catch {
      showToast("Erro ao registrar reprovação", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenDetails = (user: PendingDriver | PendingClient) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  const stats = useMemo(() => {
    return {
      pendingDrivers: drivers.filter((d) => d.driverStatus === "pending").length,
      approvedDrivers: drivers.filter((d) => d.driverStatus === "approved").length,
      pendingClients: clients.filter(
        (c) =>
          c.clientVerification?.status === "pending" ||
          c.clientVerification?.status === "none" ||
          !c.clientVerification?.status,
      ).length,
      activeClients: clients.filter(
        (c) => c.isActive === true && c.clientVerification?.status === "approved",
      ).length,
    };
  }, [drivers, clients]);

  const commonReasons = [
    "Foto dos documentos ilegível ou desfocada",
    "CRLV do veículo vencido ou irregular",
    "Selfie com documento não corresponde ao cadastro",
    "CNH de categoria incompatível com veículo",
    "CNH com data de validade expirada",
    "Dados bancários inconsistentes com Pix",
    "CPF / CNPJ inválido ou irregular na Receita"
  ];

  const clientDocumentsReady =
    selectedUser?.userType === "client"
      ? Boolean(selectedUser.clientVerification?.documents?.selfie)
      : false;

  const clientProfileReady =
    selectedUser?.userType === "client"
      ? Boolean(
          selectedUser.name &&
            selectedUser.phone &&
            selectedUser.city &&
            (selectedUser.cpf || (selectedUser as any).cnpj),
        )
      : false;

  const clientApprovalReady = clientDocumentsReady && clientProfileReady;

  if (loading && !refreshing) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-bold">Carregando portal de auditoria Leva+...</p>
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
            <UserCheck className="w-9 h-9 text-emerald-600 animate-pulse" />
            Audit & Validação de Contas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analise documentações, selfies, dados de placa de veículos, CNPJ e aprove motoristas ou libere contas de clientes.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Atualizando..." : "Atualizar Fila"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-yellow-800 uppercase tracking-wider">Motoristas Pendentes</p>
            <p className="text-2xl font-black text-yellow-950 mt-1">{stats.pendingDrivers}</p>
          </div>
          <div className="w-10 h-10 bg-yellow-500 text-white rounded-xl flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Motoristas Ativos</p>
            <p className="text-2xl font-black text-emerald-950 mt-1">{stats.approvedDrivers}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold">
            OK
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-blue-800 uppercase tracking-wider font-bold">Clientes Pendentes</p>
            <p className="text-2xl font-black text-blue-950 mt-1">{stats.pendingClients}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-purple-800 uppercase tracking-wider">Clientes Ativos</p>
            <p className="text-2xl font-black text-purple-950 mt-1">{stats.activeClients}</p>
          </div>
          <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => { setActiveTab("drivers"); setStatusFilter("pending"); }}
          className={`pb-3 font-bold text-sm transition-all border-b-2 px-1 ${activeTab === "drivers" ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Validação de Motoristas ({filteredDrivers.length})
        </button>
        <button
          onClick={() => { setActiveTab("clients"); setStatusFilter("pending"); }}
          className={`pb-3 font-bold text-sm transition-all border-b-2 px-1 ${activeTab === "clients" ? "border-emerald-600 text-emerald-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          Validação de Clientes ({filteredClients.length})
        </button>
      </div>

      {/* Filters Area */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-semibold text-gray-700"
          >
            {activeTab === "drivers" ? (
              <>
                <option value="pending">Aguardando Auditoria</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Reprovados</option>
                <option value="all">Todos os Status</option>
              </>
            ) : (
              <>
                <option value="pending">Aguardando Auditoria</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Reprovados</option>
                <option value="all">Todos os Status</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Main Grid table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-200">
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Usuário</th>
                <th className="px-6 py-4 text-left">CPF / Contato</th>
                {activeTab === "drivers" && <th className="px-6 py-4 text-left">Veículo / Placa</th>}
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Cidade</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {activeTab === "drivers" ? (
                filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Nenhum motorista pendente nesta pesquisa.</td>
                  </tr>
                ) : (
                  filteredDrivers.map((driver) => {
                    const statusColors = {
                      pending: "bg-amber-50 text-amber-700 border-amber-200",
                      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      rejected: "bg-rose-50 text-rose-700 border-rose-200",
                      none: "bg-slate-50 text-slate-700 border-slate-200"
                    };
                    const statusLabels = {
                      pending: "Aguardando",
                      approved: "Aprovado",
                      rejected: "Reprovado",
                      none: "N/A"
                    };

                    return (
                      <tr key={driver._id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                              {driver.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 truncate max-w-[150px]">{driver.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[150px]">{driver.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-gray-900">CPF: {driver.cpf || "Pendente"}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">{driver.phone}</p>
                        </td>

                        <td className="px-6 py-4">
                          {driver.vehicleInfo ? (
                            <div>
                              <p className="text-gray-950 font-bold">{driver.vehicleInfo.model} ({driver.vehicleInfo.plate})</p>
                              <p className="text-[10px] text-gray-400 font-bold capitalize mt-0.5">{driver.vehicleInfo.color} ⬢ {driver.vehicleInfo.year}</p>
                            </div>
                          ) : driver.vehicles && driver.vehicles.length > 0 ? (
                            <div>
                              <p className="text-gray-950 font-bold">{driver.vehicles[0].model} ({driver.vehicles[0].plate})</p>
                              <p className="text-[10px] text-amber-600 font-bold capitalize mt-0.5">{driver.vehicles[0].color} ⬢ {driver.vehicles[0].year} (Pendente)</p>
                            </div>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50 text-[10px] font-bold">Sem Veículo</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusColors[driver.driverStatus]}`}>
                            {statusLabels[driver.driverStatus]}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <p className="text-gray-600 font-bold truncate max-w-[100px]">{driver.city || "Não vinculada"}</p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleOpenDetails(driver)}
                            className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg transition-colors font-bold inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Auditar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhum cliente pendente nesta pesquisa.</td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client._id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 truncate max-w-[150px]">{client.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[150px]">{client.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-gray-900">CPF: {client.cpf || "Não informado"}</p>
                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{client.phone}</p>
                      </td>

                      <td className="px-6 py-4">
                        {client.clientVerification ? (
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                            client.clientVerification.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : client.clientVerification.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : client.clientVerification.status === "pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}>
                            {client.clientVerification.status === "approved"
                              ? "Aprovado"
                              : client.clientVerification.status === "rejected"
                              ? "Reprovado"
                              : client.clientVerification.status === "pending"
                              ? "Pendente"
                              : "Não Iniciado"}
                          </span>
                        ) : (
                          <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                            Sem Cadastro
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-gray-600 font-bold truncate max-w-[100px]">{client.city || "Não vinculada"}</p>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetails(client)}
                            className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 rounded-lg transition-colors font-bold inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-4 h-4" />
                            Auditar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document verification Details Drawer */}
      {isDrawerOpen && selectedUser && (
        <>
          <div className="fixed inset-0 bg-transparent z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />

          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Auditoria de Documentos & Cadastro
                </h2>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">REF: {selectedUser._id}</p>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 flex-1 space-y-6">
              
              {/* Profile Overview */}
              <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-sm">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-950 text-base">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400 font-semibold">{selectedUser.email}</p>
                  <p className="text-[10px] text-emerald-600 mt-1 font-bold bg-emerald-50 border border-emerald-100 inline-block px-2.5 py-0.5 rounded-full capitalize">
                    {selectedUser.userType === "driver" ? "Motorista" : "Cliente"}
                  </p>
                </div>
              </div>

              {/* Informações Cadastrais */}
              {selectedUser.userType === "client" ? (
                <div className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-200/60 pb-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    Dados Cadastrais & Selfie
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 grid grid-cols-2 gap-4 text-xs font-semibold">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Nome Completo</p>
                        <p className="text-gray-950 font-bold">{selectedUser.name}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Telefone Principal</p>
                        <p className="text-gray-950 font-bold">{selectedUser.phone || "N?o informado"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Documento Identificador</p>
                        <p className="text-gray-950 font-mono font-bold">{selectedUser.cpf || (selectedUser as any).cnpj || "N?o informado"}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Cidade / Regi?o</p>
                        <p className="text-gray-950 font-bold">{selectedUser.city || "N?o informada"}</p>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-3.5 bg-white text-center space-y-2">
                      <p className="text-[9px] font-bold text-gray-500 uppercase">Selfie do Usu?rio</p>
                      {selectedUser.clientVerification?.documents?.selfie ? (
                        <div
                          className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer max-w-[180px] mx-auto"
                          onClick={() => openLightbox(selectedUser.clientVerification?.documents?.selfie ?? "", "Selfie do Cliente - " + selectedUser.name)}
                        >
                          <img
                            src={cleanDocUrl(selectedUser.clientVerification.documents.selfie)}
                            alt="Selfie"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3 max-w-[180px] mx-auto">
                          <Camera className="w-7 h-7 opacity-40" />
                          <span className="text-[9px] leading-tight font-bold">Selfie ausente</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Telefone Principal</p>
                      <p className="text-gray-900">{selectedUser.phone}</p>
                    </div>
                    <div className="bg-slate-50 border border-gray-200 rounded-xl p-3.5">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">CPF Registrado</p>
                        {(() => {
                          const status = (selectedUser as PendingDriver).driverDocuments?.cpfStatus || "pending";
                          const badgeColors = {
                            approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            rejected: "bg-rose-50 text-rose-700 border-rose-200",
                            pending: "bg-amber-50 text-amber-700 border-amber-200",
                          };
                          const badgeLabels = {
                            approved: "Aprovado",
                            rejected: "Reprovado",
                            pending: "Pendente",
                          };
                          const statusKey = (status === "approved" || status === "rejected") ? status : "pending";
                          return (
                            <span className={`px-2 py-0.5 rounded-full border text-[8px] font-extrabold tracking-wide uppercase ${badgeColors[statusKey]}`}>
                              {badgeLabels[statusKey]}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-gray-900 font-mono font-bold">{selectedUser.cpf || "Não informado"}</p>
                    </div>
                  </div>
                  
                  {/* Botões individuais de Aprovação do CPF */}
                  <div className="flex items-center justify-end gap-2 bg-slate-50/50 p-2 border border-gray-100 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold mr-auto">Auditoria de CPF:</span>
                    <button
                      onClick={() => handleDriverVerificationUpdate(selectedUser._id, "cpfStatus", "rejected", "CPF inválido ou irregular na Receita")}
                      disabled={processing}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                    >
                      Reprovar CPF
                    </button>
                    <button
                      onClick={() => handleDriverVerificationUpdate(selectedUser._id, "cpfStatus", "approved")}
                      disabled={processing}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                    >
                      Aprovar CPF
                    </button>
                  </div>
                </div>
              )}

              {/* Seção Condutor / CNH / Veículo */}
              {selectedUser.userType === "driver" && (
                <>
                  {/* Dados Bancários & PIX para Repasse */}
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5 w-full">
                        <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Dados de Repasse & Conta Bancária</span>
                        {(() => {
                          const status = (selectedUser as PendingDriver).driverDocuments?.bankAccountStatus || "pending";
                          const badgeColors = {
                            approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            rejected: "bg-rose-50 text-rose-700 border-rose-200",
                            pending: "bg-amber-50 text-amber-700 border-amber-200",
                          };
                          const badgeLabels = {
                            approved: "Aprovada",
                            rejected: "Reprovada",
                            pending: "Pendente",
                          };
                          const statusKey = (status === "approved" || status === "rejected") ? status : "pending";
                          return (
                            <span className={`ml-auto px-2 py-0.5 rounded-full border text-[8px] font-extrabold tracking-wide uppercase ${badgeColors[statusKey]}`}>
                              {badgeLabels[statusKey]}
                            </span>
                          );
                        })()}
                      </h4>
                    </div>

                    {(selectedUser as PendingDriver).bankAccount ? (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-slate-800 space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Instituição Bancária</p>
                            <p className="text-sm font-black text-emerald-400 mt-0.5">{(selectedUser as PendingDriver).bankAccount?.bank}</p>
                          </div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase border border-slate-700 px-2 py-0.5 rounded bg-slate-800/50">PIX ATIVO</span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-xs pt-1.5 border-t border-slate-800/80">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Agência</p>
                            <p className="font-bold text-slate-200 mt-0.5">{(selectedUser as PendingDriver).bankAccount?.agency}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Conta</p>
                            <p className="font-bold text-slate-200 mt-0.5">{(selectedUser as PendingDriver).bankAccount?.account}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Tipo</p>
                            <p className="font-bold text-emerald-400 mt-0.5 capitalize text-[10px]">
                              {(selectedUser as PendingDriver).bankAccount?.accountType === "checking" ? "Corrente" : "Poupança"}
                            </p>
                          </div>
                        </div>

                        {((selectedUser as PendingDriver).bankAccount?.pixKey || selectedUser.cpf) && (
                          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3 text-xs mt-1">
                            <div className="truncate">
                              <p className="text-[8px] text-slate-400 uppercase font-black">Chave PIX Recebimento</p>
                              <p className="font-mono text-emerald-300 font-bold truncate mt-0.5">
                                {(selectedUser as PendingDriver).bankAccount?.pixKey || selectedUser.cpf}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText((selectedUser as PendingDriver).bankAccount?.pixKey || selectedUser.cpf || "");
                                showToast("Chave PIX copiada!", "success");
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[9px] font-bold transition-all border border-slate-700 shrink-0"
                            >
                              Copiar
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-slate-800 space-y-2 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Chave PIX Padrão</p>
                            <p className="text-sm font-black text-emerald-400 mt-0.5">{selectedUser.cpf || "Não cadastrada"}</p>
                          </div>
                          <span className="text-[8px] font-black tracking-widest text-slate-400 uppercase border border-slate-700 px-2 py-0.5 rounded bg-slate-800/30">CPF CHAVE</span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          O motorista não cadastrou dados de conta adicionais. Por padrão, a chave Pix associada ao CPF será utilizada para repasses semanais e saldos.
                        </p>
                      </div>
                    )}

                    {/* Botões individuais de Auditoria da Conta Bancária */}
                    <div className="flex items-center justify-end gap-2 bg-slate-50/50 p-2 border border-gray-100 rounded-xl mt-3">
                      <span className="text-[10px] text-gray-400 font-bold mr-auto">Auditoria de Repasse:</span>
                      <button
                        onClick={() => handleDriverVerificationUpdate(selectedUser._id, "bankAccountStatus", "rejected", "Dados de repasse incorretos ou inconsistentes")}
                        disabled={processing}
                        className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        Reprovar Repasse
                      </button>
                      <button
                        onClick={() => handleDriverVerificationUpdate(selectedUser._id, "bankAccountStatus", "approved")}
                        disabled={processing}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50"
                      >
                        Aprovar Repasse
                      </button>
                    </div>
                  </div>

                  {/* Veículo Cadastrado (Frota de Veículos) */}
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-emerald-600" />
                      Especificações da Frota & Veículos
                    </h4>

                    {((selectedUser as PendingDriver).vehicles && (selectedUser as PendingDriver).vehicles!.length > 0) ? (
                      <div className="space-y-4">
                        {(selectedUser as PendingDriver).vehicles?.map((vehicle, index) => {
                          const statusColors = {
                            pending: "bg-amber-50 text-amber-700 border-amber-200",
                            approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                            rejected: "bg-rose-50 text-rose-700 border-rose-200"
                          };
                          const statusLabels = {
                            pending: "Aguardando Aprovação",
                            approved: "Aprovado",
                            rejected: "Reprovado"
                          };

                          return (
                            <div key={vehicle._id || index} className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                              {/* Header do Veículo */}
                              <div className="px-4 py-3 bg-gray-100/70 border-b border-gray-200 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">
                                    {vehicle.type === "motorcycle" ? "Moto" : vehicle.type === "truck" ? "Truck" : vehicle.type === "van" ? "Van" : "🚗"}
                                  </span>
                                  <div>
                                    <p className="text-xs font-black text-gray-950">{vehicle.model}</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{vehicle.type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold ${statusColors[vehicle.status]}`}>
                                    {statusLabels[vehicle.status]}
                                  </span>
                                  {vehicle.status !== "approved" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleVehicleStatusUpdate(selectedUser._id, vehicle._id, "approved"); }}
                                      disabled={processing}
                                      className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-bold hover:bg-emerald-200 disabled:opacity-50"
                                    >OK Aprovar</button>
                                  )}
                                  {vehicle.status !== "rejected" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleVehicleStatusUpdate(selectedUser._id, vehicle._id, "rejected", "Reprovado manualmente pelo admin"); }}
                                      disabled={processing}
                                      className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-[9px] font-bold hover:bg-red-200 disabled:opacity-50"
                                    >X Reprovar</button>
                                  )}
                                </div>
                              </div>

                              {/* Grid de Detalhes */}
                              <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold border-b border-gray-200/60 bg-white">
                                {/* Placa no Estilo Mercosul */}
                                <div>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Placa de Identificação</p>
                                  <div className="inline-flex flex-col border border-blue-900/40 rounded overflow-hidden shadow-sm max-w-[110px] bg-white">
                                    <div className="bg-blue-600 text-white font-extrabold text-[7px] text-center px-4 py-0.5 leading-none">BRASIL</div>
                                    <div className="px-2 py-0.5 text-center text-gray-900 font-black text-xs tracking-wider uppercase font-mono">{vehicle.plate}</div>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Cor do Veículo</p>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span
                                      className={`w-3.5 h-3.5 rounded-full border border-gray-300 shadow-inner`}
                                      style={{
                                        backgroundColor:
                                          vehicle.color?.toLowerCase() === "preta" || vehicle.color?.toLowerCase() === "preto"
                                            ? "#000"
                                            : vehicle.color?.toLowerCase() === "branco" || vehicle.color?.toLowerCase() === "branca"
                                            ? "#fff"
                                            : vehicle.color?.toLowerCase() === "vermelho" || vehicle.color?.toLowerCase() === "vermelha"
                                            ? "#ef4444"
                                            : vehicle.color?.toLowerCase() === "azul"
                                            ? "#3b82f6"
                                            : vehicle.color?.toLowerCase() === "cinza" || vehicle.color?.toLowerCase() === "prata"
                                            ? "#9ca3af"
                                            : "#cbd5e1"
                                      }}
                                    />
                                    <p className="text-gray-950 capitalize">{vehicle.color || "Não informada"}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Ano Fabricação</p>
                                  <p className="text-gray-950 mt-1">{vehicle.year || "Não informado"}</p>
                                </div>

                                <div className="col-span-2">
                                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Código RENAVAM</p>
                                  <p className="text-gray-950 font-mono font-bold tracking-wider">{vehicle.renavam || "Não informado"}</p>
                                </div>
                              </div>

                              {/* API DETRAN Placa Consult Comparação */}
                              <div className="p-4 bg-slate-50 border-b border-gray-200/60 text-xs">
                                <div className="flex items-center gap-2 mb-3">
                                  {vehicle.plateVerifiedByAPI ? (
                                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                      <Shield className="w-3 h-3 text-emerald-600 shrink-0" />
                                      OK Validado DETRAN via API
                                    </span>
                                  ) : vehicle.plateVerificationSource === "fallback" ? (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                      Atenção: placa aceita por fallback (API indisponível)
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                                      <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />
                                      N?o verificado externamente
                                    </span>
                                  )}
                                </div>

                                {vehicle.isVerifiedByAPI && (vehicle.officialModel || vehicle.officialChassis) ? (
                                  <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2.5">
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-wider">Confronto de Dados (Declarado vs DETRAN)</p>
                                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-gray-700">
                                      <div className="space-y-1">
                                        <p className="text-[8px] text-gray-400 uppercase">Marca/Modelo Oficial</p>
                                        <p className="text-slate-900 bg-slate-100/50 px-2 py-1 rounded border border-slate-200">{vehicle.officialBrand} {vehicle.officialModel}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[8px] text-gray-400 uppercase">Chassi Oficial</p>
                                        <p className="text-slate-900 bg-slate-100/50 px-2 py-1 rounded border border-slate-200 font-mono text-[9px] truncate">{vehicle.officialChassis || "Indisponível"}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[8px] text-gray-400 uppercase">Cor Oficial</p>
                                        <p className="text-slate-900 bg-slate-100/50 px-2 py-1 rounded border border-slate-200 capitalize">{vehicle.officialColor || "Indisponível"}</p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[8px] text-gray-400 uppercase">Ano Oficial</p>
                                        <p className="text-slate-900 bg-slate-100/50 px-2 py-1 rounded border border-slate-200">{vehicle.officialYear || "Indisponível"}</p>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[9px] text-gray-400 leading-tight">
                                    Esta placa foi pré-aprovada via bypass de segurança local. Não foram fornecidos dados extras de chassi ou marca oficial do DETRAN nesta consulta.
                                  </p>
                                )}
                              </div>

                              {/* Documentos específicos do veículo (CRLV & Foto do veículo) */}
                              <div className="p-4 bg-white space-y-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Anexos de Documentação do Veículo</p>
                                <div className="grid grid-cols-3 gap-2.5">
                                  {/* Foto do Veículo */}
                                  <div className="border border-gray-200 rounded-xl p-2 bg-slate-50 text-center space-y-1">
                                    <p className="text-[8px] font-bold text-gray-500 uppercase">Foto do Veículo</p>
                                    {vehicle.documents?.vehiclePhoto ? (
                                      vehicle.documents.vehiclePhoto.startsWith("file://") ? (
                                        <div className="relative rounded-lg aspect-square border border-gray-200 bg-white flex flex-col items-center justify-center p-2 text-center">
                                          <Car className="w-6 h-6 text-emerald-600 opacity-60 mb-1" />
                                          <p className="text-[7px] leading-tight text-gray-400 font-bold truncate w-full">{vehicle.documents.vehiclePhoto.split("/").pop()}</p>
                                          <span className="absolute bottom-1 left-1 right-1 bg-emerald-500 text-white font-extrabold text-[6px] py-0.5 rounded leading-none">Simulado</span>
                                        </div>
                                      ) : (
                                        <div
                                          className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer"
                                          onClick={() => openLightbox(vehicle.documents!.vehiclePhoto!, "Foto do Veiculo - " + vehicle.plate)}
                                        >
                                          <img
                                            src={cleanDocUrl(vehicle.documents.vehiclePhoto)}
                                            alt="Veiculo"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 p-2">
                                        <Car className="w-5 h-5 opacity-40" />
                                        <span className="text-[7px] leading-tight font-bold">Sem foto</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* CRLV Frente */}
                                  <div className="border border-gray-200 rounded-xl p-2 bg-slate-50 text-center space-y-1">
                                    <p className="text-[8px] font-bold text-gray-500 uppercase">CRLV Frente</p>
                                    {vehicle.documents?.crlvFront ? (
                                      vehicle.documents.crlvFront.startsWith("file://") ? (
                                        <div className="relative rounded-lg aspect-square border border-gray-200 bg-white flex flex-col items-center justify-center p-2 text-center">
                                          <FileText className="w-6 h-6 text-emerald-600 opacity-60 mb-1" />
                                          <p className="text-[7px] leading-tight text-gray-400 font-bold truncate w-full">{vehicle.documents.crlvFront.split("/").pop()}</p>
                                          <span className="absolute bottom-1 left-1 right-1 bg-emerald-500 text-white font-extrabold text-[6px] py-0.5 rounded leading-none">Simulado</span>
                                        </div>
                                      ) : (
                                        <div
                                          className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer"
                                          onClick={() => openLightbox(vehicle.documents!.crlvFront!, "CRLV Frente - " + vehicle.plate)}
                                        >
                                          <img
                                            src={cleanDocUrl(vehicle.documents.crlvFront)}
                                            alt="CRLV Frente"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 p-2">
                                        <FileText className="w-5 h-5 opacity-40" />
                                        <span className="text-[7px] leading-tight font-bold">Sem CRLV</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* CRLV Verso */}
                                  <div className="border border-gray-200 rounded-xl p-2 bg-slate-50 text-center space-y-1">
                                    <p className="text-[8px] font-bold text-gray-500 uppercase">CRLV Verso</p>
                                    {vehicle.documents?.crlvBack ? (
                                      vehicle.documents.crlvBack.startsWith("file://") ? (
                                        <div className="relative rounded-lg aspect-square border border-gray-200 bg-white flex flex-col items-center justify-center p-2 text-center">
                                          <FileText className="w-6 h-6 text-emerald-600 opacity-60 mb-1" />
                                          <p className="text-[7px] leading-tight text-gray-400 font-bold truncate w-full">{vehicle.documents.crlvBack.split("/").pop()}</p>
                                          <span className="absolute bottom-1 left-1 right-1 bg-emerald-500 text-white font-extrabold text-[6px] py-0.5 rounded leading-none">Simulado</span>
                                        </div>
                                      ) : (
                                        <div
                                          className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer"
                                          onClick={() => openLightbox(vehicle.documents!.crlvBack!, "CRLV Verso - " + vehicle.plate)}
                                        >
                                          <img
                                            src={cleanDocUrl(vehicle.documents.crlvBack)}
                                            alt="CRLV Verso"
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                            <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                          </div>
                                        </div>
                                      )
                                    ) : (
                                      <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 p-2">
                                        <FileText className="w-5 h-5 opacity-40" />
                                        <span className="text-[7px] leading-tight font-bold">Sem CRLV</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (selectedUser as PendingDriver).vehicleInfo ? (
                      <div className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-4 py-3 bg-gray-100/70 border-b border-gray-200 flex items-center gap-2">
                          <span className="text-base">Carro</span>
                          <div>
                            <p className="text-xs font-black text-gray-950">{(selectedUser as PendingDriver).vehicleInfo?.model}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Veículo (Legado)</p>
                          </div>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-4 text-xs font-semibold bg-white border-b border-gray-200/60">
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Placa de Identificação</p>
                            <div className="inline-flex flex-col border border-blue-900/40 rounded overflow-hidden bg-white shadow-sm">
                              <div className="bg-blue-600 text-white font-extrabold text-[7px] text-center px-4 py-0.5">BRASIL</div>
                              <div className="px-2 py-0.5 text-center text-gray-950 font-black text-xs font-mono">{(selectedUser as PendingDriver).vehicleInfo?.plate}</div>
                            </div>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Cor</p>
                            <p className="text-gray-950 capitalize">{(selectedUser as PendingDriver).vehicleInfo?.color}</p>
                          </div>
                          <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Ano</p>
                            <p className="text-gray-950">{(selectedUser as PendingDriver).vehicleInfo?.year}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5 text-xs text-amber-800 font-bold">
                        Nenhum veículo cadastrado para este motorista.
                      </div>
                    )}
                  </div>

                  {/* Documentos Digitais Enviados (CNH, Selfie) */}
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      Documentos de Identidade & Selfie
                    </h4>

                    <div className="grid grid-cols-3 gap-3">
                      {/* Selfie com CNH */}
                      <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50 text-center flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Selfie CNH</p>
                          {(selectedUser as PendingDriver).driverDocuments?.selfie ? (
                            (selectedUser as PendingDriver).driverDocuments!.selfie!.startsWith("file://") ? (
                              <div className="relative rounded-lg aspect-square border border-gray-200 bg-white flex flex-col items-center justify-center p-2 text-center">
                                <Camera className="w-6 h-6 text-emerald-600 opacity-60 mb-1" />
                                <p className="text-[7px] leading-tight text-gray-400 font-bold truncate w-full">{(selectedUser as PendingDriver).driverDocuments!.selfie!.split("/").pop()}</p>
                                <span className="absolute bottom-1 left-1 right-1 bg-emerald-500 text-white font-extrabold text-[6px] py-0.5 rounded leading-none">Simulado</span>
                              </div>
                            ) : (
                              <div
                                className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer"
                                onClick={() => openLightbox((selectedUser as PendingDriver).driverDocuments?.selfie ?? "", "Selfie - " + selectedUser.name)}
                              >
                                <img
                                  src={cleanDocUrl((selectedUser as PendingDriver).driverDocuments?.selfie)}
                                  alt="Selfie"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3">
                              <Camera className="w-7 h-7 opacity-40" />
                              <span className="text-[9px] leading-tight font-bold">Não enviada</span>
                            </div>
                          )}
                        </div>

                        {/* Status and Action Buttons for Selfie */}
                        <div className="space-y-1.5 pt-1.5 border-t border-gray-200/60">
                          {(() => {
                            const status = (selectedUser as PendingDriver).driverDocuments?.selfieStatus || "pending";
                            const badgeColors = {
                              approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              rejected: "bg-rose-50 text-rose-700 border-rose-200",
                              pending: "bg-amber-50 text-amber-700 border-amber-200",
                            };
                            const badgeLabels = {
                              approved: "Aprovada",
                              rejected: "Rejeitada",
                              pending: "Pendente",
                            };
                            const statusKey = (status === "approved" || status === "rejected") ? status : "pending";
                            return (
                              <div className={`px-2 py-0.5 rounded border text-[8px] font-extrabold tracking-wide uppercase inline-block ${badgeColors[statusKey]}`}>
                                {badgeLabels[statusKey]}
                              </div>
                            );
                          })()}

                          {(selectedUser as PendingDriver).driverDocuments?.selfie && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDriverVerificationUpdate(selectedUser._id, "selfieStatus", "rejected", "Selfie embaçada ou com baixa qualidade")}
                                disabled={processing}
                                className="px-1.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded text-[8px] font-extrabold transition-all shrink-0 grow"
                              >
                                Reprovar
                              </button>
                              <button
                                onClick={() => handleDriverVerificationUpdate(selectedUser._id, "selfieStatus", "approved")}
                                disabled={processing}
                                className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded text-[8px] font-extrabold transition-all shrink-0 grow"
                              >
                                Aprovar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CNH Frente */}
                      <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50 text-center flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">CNH Frente</p>
                          {(selectedUser as PendingDriver).driverDocuments?.cnhFront ? (
                            (selectedUser as PendingDriver).driverDocuments!.cnhFront!.startsWith("file://") ? (
                              <div className="relative rounded-lg aspect-square border border-gray-200 bg-white flex flex-col items-center justify-center p-2 text-center">
                                <FileText className="w-6 h-6 text-emerald-600 opacity-60 mb-1" />
                                <p className="text-[7px] leading-tight text-gray-400 font-bold truncate w-full">{(selectedUser as PendingDriver).driverDocuments!.cnhFront!.split("/").pop()}</p>
                                <span className="absolute bottom-1 left-1 right-1 bg-emerald-500 text-white font-extrabold text-[6px] py-0.5 rounded leading-none">Simulado</span>
                              </div>
                            ) : (
                              <div
                                className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer"
                                onClick={() => openLightbox((selectedUser as PendingDriver).driverDocuments?.cnhFront ?? "", "CNH Frente - " + selectedUser.name)}
                              >
                                <img
                                  src={cleanDocUrl((selectedUser as PendingDriver).driverDocuments?.cnhFront)}
                                  alt="CNH Frente"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3">
                              <FileText className="w-7 h-7 opacity-40" />
                              <span className="text-[9px] leading-tight font-bold">Ausente</span>
                            </div>
                          )}
                        </div>

                        {/* Status and Action Buttons for CNH Frente */}
                        <div className="space-y-1.5 pt-1.5 border-t border-gray-200/60">
                          {(() => {
                            const status = (selectedUser as PendingDriver).driverDocuments?.cnhFrontStatus || "pending";
                            const badgeColors = {
                              approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              rejected: "bg-rose-50 text-rose-700 border-rose-200",
                              pending: "bg-amber-50 text-amber-700 border-amber-200",
                            };
                            const badgeLabels = {
                              approved: "Aprovada",
                              rejected: "Rejeitada",
                              pending: "Pendente",
                            };
                            const statusKey = (status === "approved" || status === "rejected") ? status : "pending";
                            return (
                              <div className={`px-2 py-0.5 rounded border text-[8px] font-extrabold tracking-wide uppercase inline-block ${badgeColors[statusKey]}`}>
                                {badgeLabels[statusKey]}
                              </div>
                            );
                          })()}

                          {(selectedUser as PendingDriver).driverDocuments?.cnhFront && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDriverVerificationUpdate(selectedUser._id, "cnhFrontStatus", "rejected", "CNH Frente vencida ou com foto embaçada")}
                                disabled={processing}
                                className="px-1.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded text-[8px] font-extrabold transition-all shrink-0 grow"
                              >
                                Reprovar
                              </button>
                              <button
                                onClick={() => handleDriverVerificationUpdate(selectedUser._id, "cnhFrontStatus", "approved")}
                                disabled={processing}
                                className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded text-[8px] font-extrabold transition-all shrink-0 grow"
                              >
                                Aprovar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CNH Verso */}
                      <div className="border border-gray-200 rounded-xl p-3.5 bg-slate-50 text-center flex flex-col justify-between space-y-2">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">CNH Verso</p>
                          {(selectedUser as PendingDriver).driverDocuments?.cnhBack ? (
                            (selectedUser as PendingDriver).driverDocuments!.cnhBack!.startsWith("file://") ? (
                              <div className="relative rounded-lg aspect-square border border-gray-200 bg-white flex flex-col items-center justify-center p-2 text-center">
                                <FileText className="w-6 h-6 text-emerald-600 opacity-60 mb-1" />
                                <p className="text-[7px] leading-tight text-gray-400 font-bold truncate w-full">{(selectedUser as PendingDriver).driverDocuments!.cnhBack!.split("/").pop()}</p>
                                <span className="absolute bottom-1 left-1 right-1 bg-emerald-500 text-white font-extrabold text-[6px] py-0.5 rounded leading-none">Simulado</span>
                              </div>
                            ) : (
                              <div
                                className="relative group overflow-hidden rounded-lg aspect-square border border-gray-200 bg-white cursor-pointer"
                                onClick={() => openLightbox((selectedUser as PendingDriver).driverDocuments?.cnhBack ?? "", "CNH Verso - " + selectedUser.name)}
                              >
                                <img
                                  src={cleanDocUrl((selectedUser as PendingDriver).driverDocuments?.cnhBack)}
                                  alt="CNH Verso"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                              </div>
                            )
                          ) : (
                            <div className="aspect-square rounded-lg border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400 gap-1.5 p-3">
                              <FileText className="w-7 h-7 opacity-40" />
                              <span className="text-[9px] leading-tight font-bold">Ausente</span>
                            </div>
                          )}
                        </div>

                        {/* Status and Action Buttons for CNH Verso */}
                        <div className="space-y-1.5 pt-1.5 border-t border-gray-200/60">
                          {(() => {
                            const status = (selectedUser as PendingDriver).driverDocuments?.cnhBackStatus || "pending";
                            const badgeColors = {
                              approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
                              rejected: "bg-rose-50 text-rose-700 border-rose-200",
                              pending: "bg-amber-50 text-amber-700 border-amber-200",
                            };
                            const badgeLabels = {
                              approved: "Aprovada",
                              rejected: "Rejeitada",
                              pending: "Pendente",
                            };
                            const statusKey = (status === "approved" || status === "rejected") ? status : "pending";
                            return (
                              <div className={`px-2 py-0.5 rounded border text-[8px] font-extrabold tracking-wide uppercase inline-block ${badgeColors[statusKey]}`}>
                                {badgeLabels[statusKey]}
                              </div>
                            );
                          })()}

                          {(selectedUser as PendingDriver).driverDocuments?.cnhBack && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleDriverVerificationUpdate(selectedUser._id, "cnhBackStatus", "rejected", "CNH Verso com CPF/dados ilegíveis")}
                                disabled={processing}
                                className="px-1.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded text-[8px] font-extrabold transition-all shrink-0 grow"
                              >
                                Reprovar
                              </button>
                              <button
                                onClick={() => handleDriverVerificationUpdate(selectedUser._id, "cnhBackStatus", "approved")}
                                disabled={processing}
                                className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 rounded text-[8px] font-extrabold transition-all shrink-0 grow"
                              >
                                Aprovar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

            {/* Actions footer */}
            {selectedUser.userType === "driver" ? (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 z-10 flex gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reprovar Cadastro
                </button>

                <button
                  onClick={() => handleApproveUser(selectedUser)}
                  disabled={processing}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Aprovar & Ativar Motorista
                </button>
              </div>
            ) : (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 z-10 flex gap-3">
                {clientApprovalReady ? (
                  <>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      className="flex-1 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reprovar Cadastro
                    </button>

                    <button
                      onClick={() => handleApproveUser(selectedUser)}
                      disabled={processing}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Aprovar & Ativar Cliente
                    </button>
                  </>
                ) : (
                  <div className="w-full rounded-xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-xs font-bold">
                    Aguardando envio completo dos dados cadastrais e da selfie. Os botões de aprovação/reprovação serão liberados após o envio completo.
                  </div>
                )}
              </div>
            )}

          </div>
          </div>
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-50 transition-opacity" onClick={() => setShowRejectModal(false)} />
          
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-red-600 px-6 py-4 text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {selectedUser.userType === "driver" ? "Reprovar Cadastro de Motorista" : "Reprovar Cadastro de Cliente"}
              </h3>
              <p className="text-red-100 text-xs mt-0.5">Informe o motivo do indeferimento dos documentos.</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivos Recorrentes:</label>
                <div className="grid grid-cols-1 gap-2">
                  {commonReasons.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => { setRejectionReason(reason); setCustomReason(""); }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-xl border transition-all ${rejectionReason === reason ? "border-red-500 bg-red-50 text-red-700 font-bold" : "border-gray-200 hover:bg-slate-50 text-gray-700"}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Motivo Customizado (Opcional):</label>
                <textarea
                  value={customReason}
                  onChange={(e) => { setCustomReason(e.target.value); setRejectionReason(""); }}
                  placeholder="Escreva um motivo específico de rejeição se os acima não forem suficientes..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRejectUser}
                disabled={processing || (!rejectionReason && !customReason.trim())}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {processing ? "Reprovando..." : "Confirmar Reprovação"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Lightbox Modal - Full Screen Image Viewer */}
      {lightboxImage && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-[100] transition-opacity"
            onClick={() => setLightboxImage(null)}
          />
          <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-8" onClick={() => setLightboxImage(null)}>
            <div className="absolute top-4 right-4 z-[120]">
              <button
                onClick={() => setLightboxImage(null)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-3 py-2 text-sm font-bold transition-colors"
              >
                X Fechar
              </button>
            </div>
            <div className="absolute top-4 left-4 z-[120]">
              <p className="text-white/80 text-sm font-bold bg-black/50 px-3 py-1.5 rounded-lg">{lightboxTitle}</p>
            </div>
            <img
              src={lightboxImage}
              alt={lightboxTitle}
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </>
      )}

    </div>
  );
}
