"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  Map,
  Settings,
  DollarSign,
  Truck,
  Box,
  ChevronRight,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  {
    label: "Visão Geral",
    icon: LayoutDashboard,
    href: "/dashboard",
    disabled: true,
  },
  { label: "Usuários", icon: Users, href: "/users", disabled: true },
  { label: "Motoristas", icon: Car, href: "/drivers", disabled: true },
  { label: "Clientes", icon: Users, href: "/clients", disabled: true },
  { label: "Corridas", icon: Map, href: "/rides", disabled: true },
  { label: "Ganhos", icon: DollarSign, href: "/earnings", disabled: true },
];

const CONFIG_ITEMS = [
  {
    label: "Tipos de Serviço",
    icon: Box,
    href: "/settings/purposes",
    active: true,
  },
  {
    label: "Tipos de Veículo",
    icon: Truck,
    href: "/settings/vehicles",
    disabled: true,
  },
  {
    label: "Preços & Regras",
    icon: DollarSign,
    href: "/settings/pricing",
    disabled: true,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

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
          "lg:translate-x-0", // Desktop: sempre visível
          isOpen ? "translate-x-0" : "-translate-x-full", // Mobile: controle via state
          isCollapsed ? "w-20" : "w-64" // Largura dinâmica
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
                  item={item}
                  currentPath={pathname}
                  onClick={onClose}
                  isCollapsed={isCollapsed}
                />
              ))}
            </nav>
          </div>

          <div>
            {!isCollapsed && (
              <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 select-none">
                Configurações
              </h3>
            )}
            <nav className="space-y-1.5">
              {CONFIG_ITEMS.map((item) => (
                <NavItem
                  key={item.label}
                  item={item}
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
            <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors group">
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
              <Settings
                size={16}
                className="text-slate-400 group-hover:text-emerald-500 transition-colors"
              />
            </button>
          ) : (
            <button className="w-full flex justify-center p-2 rounded-xl hover:bg-slate-50 transition-colors group">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white group-hover:ring-emerald-100 transition-all">
                AD
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
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    href: string;
    disabled?: boolean;
    active?: boolean;
  };
  currentPath: string;
  onClick: () => void;
  isCollapsed: boolean;
}

function NavItem({ item, currentPath, onClick, isCollapsed }: NavItemProps) {
  const isActive = item.active || currentPath === item.href;

  if (item.disabled) {
    return (
      <div 
        className={cn(
          "flex items-center px-3 py-2.5 text-slate-400 cursor-not-allowed opacity-60 select-none rounded-xl",
          isCollapsed ? "justify-center" : "justify-between"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <item.icon size={18} strokeWidth={2} />
          {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
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
      {isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
      )}
      <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
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
        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
      </div>
      {isActive && !isCollapsed && <ChevronRight size={14} className="text-emerald-400" />}
    </Link>
  );
}
