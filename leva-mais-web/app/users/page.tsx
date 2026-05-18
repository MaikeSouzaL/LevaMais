"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Eye,
  X,
  UserPlus,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clientsService, Client } from "@/services/clientsService";
import { driversService, Driver } from "@/services/driversService";
import { useToast } from "@/components/ui/Toast";

interface UnifiedUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  userType: "admin" | "client" | "driver";
  isActive: boolean;
  createdAt: string;
  city?: string;
  emailVerified?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { showToast, ToastContainer } = useToast();

  const loadData = useCallback(async () => {
    try {
      const [clientsData, driversData] = await Promise.all([
        clientsService.getAll(),
        driversService.getAll()
      ]);

      const formattedClients: UnifiedUser[] = clientsData.map((c) => ({
        _id: c._id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        cpf: c.cpf,
        userType: c.userType || "client",
        isActive: c.isActive,
        createdAt: c.createdAt,
        city: c.city,
        emailVerified: c.emailVerified
      }));

      const formattedDrivers: UnifiedUser[] = driversData.map((d) => ({
        _id: d._id,
        name: d.name,
        email: d.email,
        phone: d.phone,
        cpf: d.cpf,
        userType: "driver",
        isActive: d.isActive,
        createdAt: d.createdAt,
        city: d.city
      }));

      // Merge and sort by creation date
      const merged = [...formattedClients, ...formattedDrivers].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setUsers(merged);
    } catch {
      showToast("Erro ao carregar lista unificada de usuários", "error");
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
    showToast("Banco de dados unificado sincronizado", "success");
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.userType === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.isActive) ||
        (statusFilter === "inactive" && !u.isActive);

      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.city || "").toLowerCase().includes(searchQuery.toLowerCase());

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  const handleToggleStatus = async (user: UnifiedUser) => {
    try {
      if (user.userType === "driver") {
        await driversService.updateStatus(user._id, !user.isActive);
      } else {
        await clientsService.updateStatus(user._id, !user.isActive);
      }

      showToast(
        `Usuário ${!user.isActive ? "desbloqueado" : "bloqueado"} com sucesso`,
        "success"
      );
      loadData();
      if (selectedUser?._id === user._id) {
        setSelectedUser({ ...user, isActive: !user.isActive });
      }
    } catch {
      showToast("Erro ao alternar status do usuário", "error");
    }
  };

  const handleDeleteUser = async (user: UnifiedUser) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente ${user.name}?`)) return;

    try {
      if (user.userType === "driver") {
        await driversService.delete(user._id);
      } else {
        await clientsService.delete(user._id);
      }

      showToast("Usuário deletado da base", "success");
      setIsDrawerOpen(false);
      loadData();
    } catch {
      showToast("Erro ao deletar usuário", "error");
    }
  };

  const handleViewUser = (user: UnifiedUser) => {
    setSelectedUser(user);
    setIsDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-semibold">Carregando lista unificada de usuários Leva+...</p>
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
            <Users className="w-9 h-9 text-emerald-600 animate-pulse" />
            Central de Usuários Unificada
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestão global de acessos, bloqueio e auditoria de Administradores, Clientes e Condutores.
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

      {/* Filters & Unified Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          {/* Role selection */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-semibold text-gray-700"
          >
            <option value="all">Todos os Cargos</option>
            <option value="client">Clientes</option>
            <option value="driver">Motoristas</option>
            <option value="admin">Administradores</option>
          </select>

          {/* Status Selection */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white font-semibold text-gray-700"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Contas Ativas</option>
            <option value="inactive">Contas Bloqueadas</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 font-semibold border-t border-gray-100 pt-3">
          <Filter className="w-3.5 h-3.5" />
          <span>
            Exibindo <strong>{filteredUsers.length}</strong> de <strong>{users.length}</strong> cadastros no sistema.
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/70 border-b border-gray-200">
              <tr className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4 text-left">Usuário</th>
                <th className="px-6 py-4 text-left">Contato / Identificação</th>
                <th className="px-6 py-4 text-left">Tipo</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Cadastro</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="text-gray-400 space-y-2.5">
                      <Users className="w-12 h-12 mx-auto text-gray-300" />
                      <p className="font-extrabold text-gray-600 text-sm">Nenhum usuário encontrado</p>
                      <p className="text-xs">Tente ajustar seus termos de busca ou filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleColors = {
                    admin: "bg-purple-100 text-purple-800 border-purple-200",
                    client: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    driver: "bg-blue-100 text-blue-800 border-blue-200"
                  };

                  const roleLabels = {
                    admin: "Administrador",
                    client: "Cliente",
                    driver: "Motorista"
                  };

                  return (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 truncate max-w-[150px]">{user.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate max-w-[150px]">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{user.phone || "Não informado"}</span>
                          </div>
                          {user.cpf && (
                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold">
                              <span>CPF: {user.cpf}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${roleColors[user.userType]}`}>
                          {roleLabels[user.userType]}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {user.isActive ? "Ativo" : "Bloqueado"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{format(new Date(user.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewUser(user)}
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${user.isActive ? "hover:bg-rose-50 text-rose-600" : "hover:bg-emerald-50 text-emerald-600"}`}
                            title={user.isActive ? "Bloquear usuário" : "Desbloquear usuário"}
                          >
                            {user.isActive ? <UserX className="w-4.5 h-4.5" /> : <UserCheck className="w-4.5 h-4.5" />}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title="Excluir da base"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Drawer */}
      {isDrawerOpen && selectedUser && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity" onClick={() => setIsDrawerOpen(false)} />

          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto flex flex-col justify-between">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-950">Ficha Cadastral Unificada</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 space-y-6">
              
              {/* Profile Card */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl mx-auto shadow-md">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-extrabold text-gray-950 text-base">{selectedUser.name}</h3>
                <p className="text-xs text-gray-400 font-semibold">{selectedUser.email}</p>
                
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${selectedUser.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}>
                    {selectedUser.isActive ? "ATIVO" : "BLOQUEADO"}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase">
                    {selectedUser.userType}
                  </span>
                </div>
              </div>

              {/* Informações Cadastrais */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Informações de Contato & Doc</h4>
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-3.5 text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold">Endereço de E-mail</p>
                      <p className="text-gray-950 mt-0.5">{selectedUser.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold">Telefone Principal</p>
                      <p className="text-gray-950 mt-0.5">{selectedUser.phone || "Não informado"}</p>
                    </div>
                  </div>

                  {selectedUser.cpf && (
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">Documento CPF</p>
                        <p className="text-gray-950 mt-0.5">{selectedUser.cpf}</p>
                      </div>
                    </div>
                  )}

                  {selectedUser.city && (
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">Cidade Cadastrada</p>
                        <p className="text-gray-950 mt-0.5">{selectedUser.city}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Datas de Controle */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Linha do Tempo Cadastral</h4>
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-xs font-semibold space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Data de Cadastro:</span>
                    <span className="text-gray-950">{format(new Date(selectedUser.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                  </div>
                  {selectedUser.emailVerified !== undefined && (
                    <div className="flex justify-between">
                      <span>E-mail Confirmado:</span>
                      <span className={selectedUser.emailVerified ? "text-emerald-600" : "text-rose-600"}>{selectedUser.emailVerified ? "Sim ✓" : "Não ✗"}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-150 p-4 z-10 space-y-2">
              <button
                onClick={() => handleToggleStatus(selectedUser)}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors border ${selectedUser.isActive ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
              >
                {selectedUser.isActive ? "Bloquear Conta" : "Desbloquear Conta"}
              </button>
              <button
                onClick={() => handleDeleteUser(selectedUser)}
                className="w-full py-2.5 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors"
              >
                Deletar Usuário da Base
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
