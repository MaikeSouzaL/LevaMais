"use client";

import React, { useState, useMemo } from "react";
import * as Icons from "lucide-react";
import { Search, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

// List of common icons suitable for delivery/logistics to filter the huge Lucide list if needed.
// For now, we'll try to show a large set or all of them.
// Getting all icon names from the library
const ALL_ICONS = Object.keys(Icons).filter(
  (key) => key !== "icons" && key !== "createLucideIcon" && key !== "default"
);

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(() => {
    if (!search) return ALL_ICONS.slice(0, 100); // Show first 100 by default for perf
    return ALL_ICONS.filter((iconName) =>
      iconName.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 100); // Limit results
  }, [search]);

  const SelectedIcon = (Icons as any)[value] || Icons.HelpCircle;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-emerald-500 transition-all text-left"
      >
        <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
          <SelectedIcon size={18} />
        </div>
        <div className="flex-1 truncate">
          <span className="text-sm font-medium text-slate-700 block">{value}</span>
          <span className="text-xs text-slate-500">Clique para alterar</span>
        </div>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Selecionar Ícone"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar ícone (ex: package, map, truck)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[400px] overflow-y-auto p-1">
            {filteredIcons.map((iconName) => {
              const Icon = (Icons as any)[iconName];
              if (!Icon) return null;
              
              const isSelected = value === iconName;
              
              return (
                <button
                  key={iconName}
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors aspect-square hover:bg-slate-100",
                    isSelected ? "bg-emerald-50 border border-emerald-200 text-emerald-600" : "text-slate-600 border border-transparent"
                  )}
                  title={iconName}
                >
                  <Icon size={24} />
                  <span className="text-[10px] w-full truncate text-center opacity-70">
                    {iconName}
                  </span>
                </button>
              );
            })}
            
            {filteredIcons.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-500 text-sm">
                Nenhum ícone encontrado para "{search}"
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
