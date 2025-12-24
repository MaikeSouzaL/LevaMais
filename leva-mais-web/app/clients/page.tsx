"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Shield,
  XIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clientsService, Client } from "@/services/clientsService";
import { useToast } from "@/components/ui/Toast";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { showToast, ToastContainer } = useToast();

  // Carregar clientes
  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error) {
      showToast("Erro ao buscar clientes", "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Filtrar clientes
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Filtro de status
      if (statusFilter === "active" && !client.isActive) return false;
      if (statusFilter === "inactive" && client.isActive) return false;

      // Filtro de busca
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          client.name.toLowerCase().includes(search) ||
          client.email.toLowerCase().includes(search) ||
          client.phone?.toLowerCase().includes(search) ||
          client.city?.toLowerCase().includes(search)
        );
      }

      return true;
    });
  }, [clients, searchTerm, statusFilter]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    return clientsService.calculateStats(clients);
  }, [clients]);

  // Abrir drawer de detalhes
  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setDrawerOpen(true);
  };

  // Fechar drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedClient(null), 300);
  };

  // Deletar cliente
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await clientsService.delete(id);
      showToast("Cliente excluído com sucesso", "success");
      loadClients();
      if (selectedClient?._id === id) {
        handleCloseDrawer();
      }
    } catch (error) {
      showToast("Erro ao excluir cliente", "error");
      console.error(error);
    }
  };

  // Alternar status
  const handleToggleStatus = async (client: Client) => {
    try {
      await clientsService.updateStatus(client._id, !client.isActive);
      showToast(
        `Cliente ${!client.isActive ? "ativado" : "desativado"} com sucesso`,
        "success"
      );
      loadClients();
      if (selectedClient?._id === client._id) {
        setSelectedClient({ ...client, isActive: !client.isActive });
      }
    } catch (error) {
      showToast("Erro ao atualizar status", "error");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {ToastContainer}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Clientes</h1>
        <p className="text-gray-600">
          Gerencie os clientes cadastrados na plataforma
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Users}
          label="Total de Clientes"
          value={stats.total}
          color="blue"
        />
        <StatsCard
          icon={UserCheck}
          label="Clientes Ativos"
          value={stats.active}
          color="green"
        />
        <StatsCard
          icon={Shield}
          label="Verificados"
          value={stats.verified}
          color="purple"
        />
        <StatsCard
          icon={Calendar}
          label="Novos este Mês"
          value={stats.newThisMonth}
          color="orange"
        />
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filtro de Status */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredClients.length} de {clients.length} clientes
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Carregando clientes...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <ClientRow
                    key={client._id}
                    client={client}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer de Detalhes */}
      {drawerOpen && selectedClient && (
        <ClientDetailsDrawer
          client={selectedClient}
          onClose={handleCloseDrawer}
          onDelete={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}

// Componente de Card de Estatísticas
interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "green" | "purple" | "orange";
}

function StatsCard({ icon: Icon, label, value, color }: StatsCardProps) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Componente de Linha da Tabela
interface ClientRowProps {
  client: Client;
  onViewDetails: (client: Client) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (client: Client) => void;
}

function ClientRow({
  client,
  onViewDetails,
  onDelete,
  onToggleStatus,
}: ClientRowProps) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {client.name}
            </div>
            <div className="text-sm text-gray-500">{client.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {client.phone || "Não informado"}
        </div>
        <div className="text-sm text-gray-500">
          {client.cpf || "CPF não cadastrado"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center text-sm text-gray-900">
          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
          {client.city || "Não informado"}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              client.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {client.isActive ? "Ativa" : "Inativa"}
          </span>
          {client.emailVerified && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Email ✓
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(client)}
            className="text-green-600 hover:text-green-900 transition-colors"
            title="Ver detalhes"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleStatus(client)}
            className={`${
              client.isActive
                ? "text-orange-600 hover:text-orange-900"
                : "text-green-600 hover:text-green-900"
            } transition-colors`}
            title={client.isActive ? "Desativar" : "Ativar"}
          >
            {client.isActive ? (
              <UserX className="w-5 h-5" />
            ) : (
              <UserCheck className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => onDelete(client._id)}
            className="text-red-600 hover:text-red-900 transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Componente do Drawer de Detalhes
interface ClientDetailsDrawerProps {
  client: Client;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleStatus: (client: Client) => void;
}

function ClientDetailsDrawer({
  client,
  onClose,
  onDelete,
  onToggleStatus,
}: ClientDetailsDrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Detalhes do Cliente
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar e Nome */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
            <p className="text-gray-500">{client.email}</p>
          </div>

          {/* Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Status da Conta
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  client.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {client.isActive ? "Ativa" : "Inativa"}
              </span>
            </div>
          </div>

          {/* Informações Pessoais */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Informações Pessoais
            </h4>
            <div className="space-y-3">
              <DetailItem icon={Mail} label="Email" value={client.email} />
              <DetailItem
                icon={Phone}
                label="Telefone"
                value={client.phone || "Não informado"}
              />
              <DetailItem
                icon={MapPin}
                label="Cidade"
                value={client.city || "Não informado"}
              />
              <DetailItem
                icon={Shield}
                label="CPF"
                value={client.cpf || "Não cadastrado"}
              />
            </div>
          </div>

          {/* Verificações */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Verificações
            </h4>
            <div className="space-y-2">
              <VerificationItem
                label="Email Verificado"
                verified={client.emailVerified}
              />
              <VerificationItem
                label="Telefone Verificado"
                verified={client.phoneVerified}
              />
              <VerificationItem
                label="Termos Aceitos"
                verified={client.acceptedTerms}
              />
            </div>
          </div>

          {/* Datas */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Informações do Cadastro
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Cadastrado em:</span>
                <span className="font-medium text-gray-900">
                  {format(new Date(client.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Última atualização:</span>
                <span className="font-medium text-gray-900">
                  {format(new Date(client.updatedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <button
              onClick={() => onToggleStatus(client)}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                client.isActive
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "bg-green-100 text-green-700 hover:bg-green-200"
              }`}
            >
              {client.isActive ? "Desativar Conta" : "Ativar Conta"}
            </button>
            <button
              onClick={() => {
                onDelete(client._id);
                onClose();
              }}
              className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              Excluir Cliente
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Componente auxiliar para itens de detalhe
interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// Componente auxiliar para itens de verificação
interface VerificationItemProps {
  label: string;
  verified: boolean;
}

function VerificationItem({ label, verified }: VerificationItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
        }`}
      >
        {verified ? "Sim" : "Não"}
      </span>
    </div>
  );
}
