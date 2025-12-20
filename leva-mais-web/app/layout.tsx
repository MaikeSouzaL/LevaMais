"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-white text-slate-900`}>
        <div className="flex min-h-screen bg-slate-50">
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          <div
            className={`flex-1 transition-all duration-300 ${
              isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
            }`}
          >
            <Topbar onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="mt-16 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] bg-slate-50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
