"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro desconhecido. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: "admin",
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.user?.identities?.length === 0) {
        setErrorMsg("Este e-mail já está em uso.");
      } else {
        setSuccessMsg("Conta de administrador criada com sucesso! Verifique seu e-mail para confirmação se necessário.");
        setIsRegisterMode(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao criar conta de administrador.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl p-8 sm:p-10 rounded-[28px] shadow-2xl relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <span className="text-white text-2xl font-black">L+</span>
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-white">
            Leva<span className="text-emerald-500">+</span> Admin
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            {isRegisterMode
              ? "Criar uma nova credencial administrativa"
              : "Faça login para gerenciar sua plataforma"}
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-semibold">{errorMsg}</p>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={isRegisterMode ? handleRegister : handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
                E-mail Administrativo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3.5 pl-11 pr-4 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm font-medium transition-all"
                  placeholder="admin@levamais.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/60 py-3.5 pl-11 pr-11 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm font-medium transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl bg-emerald-500 py-3.5 px-4 text-sm font-black text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-400/25"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
              ) : isRegisterMode ? (
                "Cadastrar Administrador"
              ) : (
                "Entrar no Painel"
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              {isRegisterMode
                ? "Já possui uma conta? Fazer Login"
                : "Criar novo Administrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
