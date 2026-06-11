"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = pathname === "/login";

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (active) {
          const isAuth = !!session;
          setIsAuthenticated(isAuth);
          setIsLoading(false);

          if (!isAuth && !isPublicRoute) {
            router.push("/login");
          } else if (isAuth && pathname === "/login") {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        if (active) {
          setIsLoading(false);
          if (!isPublicRoute) {
            router.push("/login");
          }
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active) {
        const isAuth = !!session;
        setIsAuthenticated(isAuth);
        if (!isAuth && !isPublicRoute) {
          router.push("/login");
        } else if (isAuth && pathname === "/login") {
          router.push("/dashboard");
        }
      }
    });

    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [pathname, router, isPublicRoute]);

  if (isLoading) {
    return (
      <html lang="pt-BR">
        <body className={`${inter.className} bg-slate-900 text-white flex items-center justify-center min-h-screen`}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">Verificando autenticação...</p>
          </div>
        </body>
      </html>
    );
  }

  if (isPublicRoute && !isAuthenticated) {
    return (
      <html lang="pt-BR">
        <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen`}>
          <main className="min-h-screen">{children}</main>
        </body>
      </html>
    );
  }

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
            <Topbar
              onMenuClick={() => setIsSidebarOpen(true)}
              isSidebarCollapsed={isSidebarCollapsed}
            />
            <main className="mt-16 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-64px)] bg-slate-50">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
