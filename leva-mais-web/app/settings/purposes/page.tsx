"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  X,
  Truck,
  Car,
  Bike,
  Package,
} from "lucide-react";
import * as Icons from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { purposesService } from "@/services/purposesService";
import { PurposeItem, VehicleType } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { IconPicker } from "@/components/ui/IconPicker";
import { useToast } from "@/components/ui/Toast";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

// Helper to render dynamic icons
const DynamicIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const Icon = (Icons as any)[name];
  if (!Icon)
    return <span className="text-xs font-mono">{name?.substring(0, 2)}</span>;
  return <Icon className={className} />;
};

type LucideIcon = React.FC<{ size?: number; className?: string }>;

const VEHICLE_TABS: { id: VehicleType; label: string; icon: LucideIcon }[] = [
  { id: "motorcycle", label: "Moto", icon: Bike },
  { id: "car", label: "Carro", icon: Car },
  { id: "van", label: "Van", icon: Truck },
  { id: "truck", label: "Caminhão", icon: Truck },
];

function PurposesPageContent() {
  const searchParams = useSearchParams();
  const { showToast, ToastContainer } = useToast();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();

  const [activeTab, setActiveTab] = useState<VehicleType>(
    (searchParams.get("tab") as VehicleType) || "motorcycle"
  );
  const [data, setData] = useState<PurposeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PurposeItem | null>(null);

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurposeItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    subtitle: "",
    icon: "Package",
    badges: "",
    isActive: true,
  });

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const items = await purposesService.getAll(activeTab);
      setData(items);
    } catch (error) {
      console.error("Error loading data:", error);
      showToast(
        "Erro ao carregar dados. Verifique se o backend está rodando.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Filtered Data
  const filteredData = useMemo(() => {
    return data
      .filter((item) => {
        const matchesSearch =
          item.title.toLowerCase().includes(search.toLowerCase()) ||
          item.id.toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "active"
            ? item.isActive
            : !item.isActive;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [data, search, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: data.length,
      active: data.filter((i) => i.isActive).length,
      inactive: data.filter((i) => !i.isActive).length,
      lastUpdate:
        data.length > 0
          ? new Date(
              Math.max(...data.map((i) => new Date(i.updatedAt).getTime()))
            )
          : null,
    };
  }, [data]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      id: "",
      title: "",
      subtitle: "",
      icon: "Package",
      badges: "",
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PurposeItem) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      icon: item.icon || "Package",
      badges: item.badges?.join(", ") || "",
      isActive: item.isActive ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.id || !formData.title || !formData.subtitle) {
      showToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    const badgesArray = formData.badges
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingItem) {
        await purposesService.update(editingItem.id, activeTab, {
          ...formData,
          badges: badgesArray,
        });
        showToast("Serviço atualizado com sucesso!", "success");
      } else {
        await purposesService.create({
          ...formData,
          vehicleType: activeTab,
          badges: badgesArray,
        });
        showToast("Serviço cadastrado com sucesso!", "success");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      showToast(
        (error as Error).message || "Erro ao salvar tipo de serviço",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    const item = data.find((i) => i.id === id);

    showConfirm(
      "Excluir Serviço",
      `Tem certeza que deseja excluir "${
        item?.title || id
      }"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await purposesService.delete(id, activeTab);
          showToast("Serviço excluído com sucesso!", "success");
          loadData();
          if (selectedItem?.id === id) setIsDrawerOpen(false);
        } catch (error) {
          showToast(
            (error as Error).message || "Erro ao excluir serviço",
            "error"
          );
        }
      },
      "danger"
    );
  };

  const handleToggleActive = async (id: string) => {
    try {
      await purposesService.toggleActive(id, activeTab);
      const item = data.find((i) => i.id === id);
      const newStatus = item ? !item.isActive : true;
      showToast(
        `Serviço ${newStatus ? "ativado" : "desativado"} com sucesso!`,
        "success"
      );
      loadData();
    } catch (error) {
      showToast((error as Error).message || "Erro ao alterar status", "error");
    }
  };

  const handleDuplicate = async (item: PurposeItem) => {
    try {
      const newItem = {
        ...item,
        id: `${item.id}-copy-${Date.now().toString().slice(-4)}`,
        title: `${item.title} (Cópia)`,
        vehicleType: activeTab,
      };
      // Remove timestamp fields from MongoDB document

      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        _id,
        ...cleanItem
      } = newItem as any;

      await purposesService.create(cleanItem);
      showToast("Serviço duplicado com sucesso!", "success");
      loadData();
    } catch (error) {
      showToast(
        (error as Error).message || "Erro ao duplicar serviço",
        "error"
      );
    }
  };

  // Reset seed removed as we are using backend now, or could implement a backend reset endpoint
  const handleResetSeed = () => {
    showToast(
      "Esta funcionalidade precisa ser implementada no backend para resetar o banco de dados.",
      "info"
    );
  };

  return (
    <>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Tipos de Serviço
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              Gerencie as finalidades de entrega por veículo.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Novo Tipo de Serviço</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap sm:p-1 bg-slate-200/60 rounded-xl w-full sm:w-fit gap-1 sm:gap-0">
          {VEHICLE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 sm:flex-none",
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              )}
            >
              <tab.icon size={16} />
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total de Tipos"
            value={stats.total}
            icon={Package}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Ativos"
            value={stats.active}
            icon={Check}
            color="bg-emerald-50 text-emerald-600"
          />
          <StatCard
            label="Inativos"
            value={stats.inactive}
            icon={X}
            color="bg-red-50 text-red-600"
          />
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
                <RotateCcw size={18} />
              </div>
              <span className="text-sm font-medium text-slate-500">
                Última atualização
              </span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {stats.lastUpdate
                ? format(stats.lastUpdate, "HH:mm", { locale: ptBR })
                : "--"}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Buscar por título ou ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <button
              onClick={handleResetSeed}
              className="px-4 py-2 text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-lg transition-colors text-sm font-medium"
              title="Restaurar padrões"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </div>

        {/* Table - Desktop */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold w-16">Ícone</th>
                  <th className="px-6 py-3 font-semibold">Título / ID</th>
                  <th className="px-6 py-3 font-semibold">Subtítulo</th>
                  <th className="px-6 py-3 font-semibold">Badges</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Carregando dados...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Nenhum tipo de serviço encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsDrawerOpen(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <DynamicIcon name={item.icon} className="w-5 h-5" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {item.id}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                        {item.subtitle}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {item.badges?.map((badge) => (
                            <span
                              key={badge}
                              className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold border border-blue-100"
                            >
                              {badge}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-semibold border",
                            item.isActive
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          )}
                        >
                          {item.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <ActionButton
                            icon={Edit2}
                            onClick={() => handleOpenEdit(item)}
                            tooltip="Editar"
                          />
                          <ActionButton
                            icon={Copy}
                            onClick={() => handleDuplicate(item)}
                            tooltip="Duplicar"
                          />
                          <ActionButton
                            icon={item.isActive ? EyeOff : Eye}
                            onClick={() => handleToggleActive(item.id)}
                            tooltip={item.isActive ? "Desativar" : "Ativar"}
                            color={
                              item.isActive
                                ? "text-amber-500 hover:bg-amber-50"
                                : "text-emerald-500 hover:bg-emerald-50"
                            }
                          />
                          <ActionButton
                            icon={Trash2}
                            onClick={() => handleDelete(item.id)}
                            tooltip="Excluir"
                            color="text-red-500 hover:bg-red-50"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white p-8 rounded-xl text-center text-slate-500">
              Carregando dados...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center text-slate-500">
              Nenhum tipo de serviço encontrado.
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                onClick={() => {
                  setSelectedItem(item);
                  setIsDrawerOpen(true);
                }}
              >
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                      <DynamicIcon name={item.icon} className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {item.id}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0",
                        item.isActive
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      {item.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  {/* Subtitle */}
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {item.subtitle}
                  </p>

                  {/* Badges */}
                  {item.badges && item.badges.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {item.badges.map((badge) => (
                        <span
                          key={badge}
                          className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-semibold border border-blue-100"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="flex items-center gap-2 pt-2 border-t border-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                        item.isActive
                          ? "text-amber-600 hover:bg-amber-50"
                          : "text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {item.isActive ? (
                        <>
                          <EyeOff size={16} />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Eye size={16} />
                          Ativar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Create/Edit */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={
            editingItem ? "Editar Tipo de Serviço" : "Novo Tipo de Serviço"
          }
          footer={
            <>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
              >
                Salvar
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ID (Slug)
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  })
                }
                disabled={!!editingItem}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-sm disabled:opacity-50"
                placeholder="ex: delivery-express"
              />
              <p className="text-xs text-slate-500 mt-1">
                Apenas letras minúsculas, números e hífen.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                placeholder="Ex: Entrega Rápida"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Subtítulo
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                placeholder="Ex: Chegada em até 30 min"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ícone
                </label>
                <IconPicker
                  value={formData.icon}
                  onChange={(iconName) =>
                    setFormData({ ...formData, icon: iconName })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Badges
                </label>
                <input
                  type="text"
                  value={formData.badges}
                  onChange={(e) =>
                    setFormData({ ...formData, badges: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                  placeholder="Ex: RÁPIDO, NOVO (separar por vírgula)"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  formData.isActive ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm",
                    formData.isActive ? "left-7" : "left-1"
                  )}
                />
              </button>
              <span className="text-sm font-medium text-slate-700">
                {formData.isActive ? "Ativo no aplicativo" : "Inativo (oculto)"}
              </span>
            </div>
          </div>
        </Modal>

        {/* Drawer Details */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Detalhes do Serviço"
        >
          {selectedItem && (
            <div className="space-y-6">
              <div className="flex flex-col items-center p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-20 h-20 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                  <DynamicIcon
                    name={selectedItem.icon}
                    className="w-10 h-10 text-emerald-600"
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-900 text-center">
                  {selectedItem.title}
                </h2>
                <p className="text-slate-500 text-center">
                  {selectedItem.subtitle}
                </p>
                <div className="flex gap-2 mt-4">
                  {selectedItem.badges?.map((badge) => (
                    <span
                      key={badge}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <DetailRow label="ID" value={selectedItem.id} mono />
                <DetailRow
                  label="Status"
                  value={selectedItem.isActive ? "Ativo" : "Inativo"}
                  valueClass={
                    selectedItem.isActive
                      ? "text-emerald-600 font-bold"
                      : "text-slate-400"
                  }
                />
                <DetailRow
                  label="Veículo"
                  value={
                    VEHICLE_TABS.find((v) => v.id === activeTab)?.label ||
                    activeTab
                  }
                />
                <DetailRow
                  label="Criado em"
                  value={format(
                    new Date(selectedItem.createdAt),
                    "dd/MM/yyyy HH:mm"
                  )}
                />
                <DetailRow
                  label="Atualizado em"
                  value={format(
                    new Date(selectedItem.updatedAt),
                    "dd/MM/yyyy HH:mm"
                  )}
                />
              </div>

              <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    handleOpenEdit(selectedItem);
                  }}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                >
                  Editar Informações
                </button>
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
                >
                  Excluir Serviço
                </button>
              </div>
            </div>
          )}
        </Drawer>
      </div>

      {/* Toast Container */}
      {ToastContainer}

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </>
  );
}

function StatCard({
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
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  onClick,
  tooltip,
  color = "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
}: {
  icon: LucideIcon;
  onClick: () => void;
  tooltip: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn("p-2 rounded-lg transition-colors", color)}
      title={tooltip}
    >
      <Icon size={18} />
    </button>
  );
}

function DetailRow({
  label,
  value,
  mono,
  valueClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span
        className={cn(
          "text-sm font-medium text-slate-900",
          mono && "font-mono",
          valueClass
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function PurposesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <PurposesPageContent />
    </Suspense>
  );
}
