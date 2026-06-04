"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { platformConfigService } from "@/services/platformConfigService";
import { verificationAdminService } from "@/services/verificationAdminService";
import { disputeAdminService } from "@/services/disputeAdminService";
import {
  LayoutDashboard,
  Users,
  Truck,
  ChevronRight,
  X,
  ChevronLeft,
  UserCheck,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    href: "/dashboard",
    active: true,
  },
  { label: "Usuários", icon: Users, href: "/users", active: true },
  {
    label: "Validação de Contas",
    icon: UserCheck,
    href: "/verification/drivers",
    active: true,
  },
  {
    label: "Disputas",
    icon: ShieldAlert,
    href: "/disputes",
    active: true,
  },
  {
    label: "Configurações",
    icon: Settings,
    href: "/settings/platform",
    active: true,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

type ApprovalDriver = {
  driverStatus?: string;
};

type ApprovalClient = {
  isActive?: boolean;
  clientVerification?: {
    status?: string;
    cpfStatus?: string;
    selfieStatus?: string;
  };
};

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [isDevMode, setIsDevMode] = useState(true);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [openDisputeCount, setOpenDisputeCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    platformConfigService.get()
      .then((data) => {
        if (mounted) {
          setIsDevMode(!!data.isDevelopmentMode);
        }
      })
      .catch(() => {});

    const handleExternalUpdate = () => {
      platformConfigService.get()
        .then((data) => {
          if (mounted) {
            setIsDevMode(!!data.isDevelopmentMode);
          }
        })
        .catch(() => {});
    };

    window.addEventListener("platform-config-updated", handleExternalUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("platform-config-updated", handleExternalUpdate);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPendingApprovalCount = async () => {
      try {
        const [drivers, clients, disputes] = await Promise.all([
          verificationAdminService.listUsers("driver"),
          verificationAdminService.listUsers("client"),
          disputeAdminService.list("open"),
        ]);

        const driversPending = ((drivers || []) as ApprovalDriver[]).filter((d) => {
          const status = String(d?.driverStatus || "none");
          return status === "pending" || status === "none";
        }).length;

        const clientsPending = ((clients || []) as ApprovalClient[]).filter((c) => {
          const status = String(c?.clientVerification?.status || "none");
          const cpfStatus = String(c?.clientVerification?.cpfStatus || "unchecked");
          const selfieStatus = String(c?.clientVerification?.selfieStatus || "none");
          if (status === "approved" || c?.isActive === true) return false;
          return (
            status === "none" ||
            status === "pending" ||
            status === "manual_review" ||
            cpfStatus === "unchecked" ||
            cpfStatus === "pending" ||
            cpfStatus === "manual_review" ||
            selfieStatus === "none" ||
            selfieStatus === "pending"
          );
        }).length;

        if (mounted) {
          setPendingApprovalCount(driversPending + clientsPending);
          setOpenDisputeCount((disputes || []).length);
        }
      } catch {
        if (mounted) {
          setPendingApprovalCount(0);
          setOpenDisputeCount(0);
        }
      }
    };

    loadPendingApprovalCount();
    const timer = setInterval(loadPendingApprovalCount, 20000);
    const refreshHandler = () => loadPendingApprovalCount();
    window.addEventListener("verification-updated", refreshHandler);

    return () => {
      mounted = false;
      clearInterval(timer);
      window.removeEventListener("verification-updated", refreshHandler);
    };
  }, []);

  const handleToggleDevMode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextVal = !isDevMode;
    setIsDevMode(nextVal);
    try {
      await platformConfigService.update({ isDevelopmentMode: nextVal });
      window.dispatchEvent(new Event("platform-config-updated"));
    } catch {
      setIsDevMode(!nextVal);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "h-screen bg-white text-slate-700 flex flex-col border-r border-slate-200 fixed left-0 top-0 z-50 shadow-sm transition-all duration-300",
          "lg:translate-x-0", // Desktop: sempre visÃ­vel
          isOpen ? "translate-x-0" : "-translate-x-full", // Mobile: controle via state
          isCollapsed ? "w-20" : "w-64" // Largura dinÃ¢mica
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between border-b border-slate-100 px-4">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Truck className="text-white w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Leva<span className="text-emerald-500">+</span>
                </h1>
              </div>

              {/* Close button (mobile only) */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                <Truck className="text-white w-5 h-5" />
              </div>
            </div>
          )}
        </div>

        {/* Toggle Collapse Button (desktop only) - Positioned on the right */}
        <div className="hidden lg:flex justify-end border-b border-slate-100 px-2 py-2">
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-emerald-50 rounded-lg transition-all text-slate-500 hover:text-emerald-600"
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <ChevronLeft
              size={18}
              className={cn(
                "transition-transform duration-300",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div>
            {!isCollapsed && (
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
                Principal
              </h3>
            )}
            <nav className="space-y-1.5">
              {MENU_ITEMS.map((item) => (
                <NavItem
                  key={item.label}
                  item={
                    item.href === "/verification/drivers"
                      ? { ...item, badge: pendingApprovalCount > 0 ? pendingApprovalCount : undefined }
                      : item.href === "/disputes"
                      ? { ...item, badge: openDisputeCount > 0 ? openDisputeCount : undefined }
                      : item
                  }
                  currentPath={pathname}
                  onClick={onClose}
                  isCollapsed={isCollapsed}
                />
              ))}
            </nav>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white group-hover:ring-emerald-100 transition-all">
                AD
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  Admin User
                </p>
                <p className="text-xs text-slate-500 truncate group-hover:text-slate-600 transition-colors">
                  admin@levamais.com
                </p>
              </div>
              <div 
                className="flex items-center gap-1.5 cursor-pointer z-10" 
                onClick={handleToggleDevMode}
                title={isDevMode ? "Modo de Desenvolvimento Ativo (Ignorar validaÃ§Ãµes)" : "Modo de ProduÃ§Ã£o Ativo (ValidaÃ§Ã£o Estrita)"}
              >
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md transition-all select-none ${
                  isDevMode ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                }`}>
                  {isDevMode ? "DEV" : "PROD"}
                </span>
                <button
                  type="button"
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    isDevMode ? "bg-amber-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isDevMode ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ) : (
            <button 
              className="w-full flex flex-col items-center justify-center p-2 rounded-xl hover:bg-slate-50 transition-colors group relative"
              onClick={handleToggleDevMode}
              title={isDevMode ? "Modo de Desenvolvimento Ativo" : "Modo de ProduÃ§Ã£o Ativo"}
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white group-hover:ring-emerald-100 transition-all relative">
                AD
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white flex items-center justify-center ${
                  isDevMode ? "bg-amber-500" : "bg-slate-400"
                }`} />
              </div>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

interface NavItemProps {
  item: {
    label: string;
    icon: React.ComponentType<{
      size?: number;
      strokeWidth?: number;
      className?: string;
    }>;
    href: string;
    disabled?: boolean;
    active?: boolean;
    badge?: number;
  };
  currentPath: string;
  onClick: () => void;
  isCollapsed: boolean;
}

function NavItem({ item, currentPath, onClick, isCollapsed }: NavItemProps) {
  const isActive = item.active || currentPath === item.href;
  const hasBadge = Boolean(item.badge && item.badge > 0);

  if (item.disabled) {
    return (
      <div
        className={cn(
          "flex items-center px-3 py-2.5 text-slate-400 cursor-not-allowed opacity-60 select-none rounded-xl",
          isCollapsed ? "justify-center" : "justify-between"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            isCollapsed && "justify-center"
          )}
        >
          <item.icon size={18} strokeWidth={2} />
          {!isCollapsed && (
            <span className="text-sm font-medium">{item.label}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center rounded-xl transition-all duration-200 group relative overflow-hidden px-3 py-2.5",
        isActive
          ? "bg-emerald-50 text-emerald-600 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        isCollapsed ? "justify-center" : "justify-between"
      )}
      title={isCollapsed ? item.label : undefined}
    >
      {isCollapsed && hasBadge && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border border-white">
          {item.badge}
        </span>
      )}
      {isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
      )}
      <div
        className={cn(
          "flex items-center gap-3",
          isCollapsed && "justify-center"
        )}
      >
        <item.icon
          size={18}
          strokeWidth={isActive ? 2.5 : 2}
          className={cn(
            "transition-colors duration-200",
            isActive
              ? "text-emerald-600"
              : "text-slate-500 group-hover:text-slate-700"
          )}
        />
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{item.label}</span>
            {hasBadge && (
              <span
                className={cn(
                  "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center",
                  isActive ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                )}
              >
                {item.badge}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isActive && !isCollapsed && (
          <ChevronRight size={14} className="text-emerald-400" />
        )}
      </div>
    </Link>
  );
}



