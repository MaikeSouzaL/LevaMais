"use client";

import React from "react";
import { Search, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick: () => void;
  isSidebarCollapsed: boolean;
}

export function Topbar({ onMenuClick, isSidebarCollapsed }: TopbarProps) {
  return (
    <header 
      className={cn(
        "h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 fixed top-0 right-0 left-0 z-20 transition-all duration-300",
        isSidebarCollapsed ? "lg:left-20" : "lg:left-64"
      )}
    >
      {/* Mobile Menu Button + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Mobile Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">L+</span>
          </div>
          <h1 className="text-base font-bold text-slate-900">
            Leva<span className="text-emerald-500">+</span>
          </h1>
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg w-64 lg:w-96">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Button */}
        <button className="md:hidden p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
          <Search size={20} />
        </button>

        <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
          AD
        </div>
      </div>
    </header>
  );
}
