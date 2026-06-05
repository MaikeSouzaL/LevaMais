"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, LogOut, Menu, Store, Utensils } from "lucide-react";
import { clearToken } from "@/services/apiClient";

const navItems = [
  { href: "/dashboard", label: "Operacao", icon: Store },
  { href: "/catalog", label: "Catalogo", icon: Boxes },
];

export function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#dfe4ec] bg-white lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-[#e6eaf0] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#0f766e] text-white">
            <Utensils size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold">Leva Mais</p>
            <p className="text-xs text-[#677084]">Empresas</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-[#e8f3f1] text-[#0f766e]" : "text-[#435066] hover:bg-[#f1f4f8]"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[#dfe4ec] bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Menu className="lg:hidden" size={20} />
            <div>
              <p className="text-sm font-semibold">Portal parceiro</p>
              <p className="text-xs text-[#677084]">Loja, horarios e catalogo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border border-[#d7dce5] px-3 py-2 text-sm hover:bg-[#f1f4f8]"
            title="Sair"
          >
            <LogOut size={16} />
            Sair
          </button>
        </header>
        <main className="px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
