"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { apiMessage } from "@/services/apiClient";
import { login } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(apiMessage(err, "Nao foi possivel entrar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#eef2f6] p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-md border border-[#dfe4ec] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xl font-semibold">Leva Mais Empresas</p>
          <p className="mt-1 text-sm text-[#677084]">Acesse sua loja parceira</p>
        </div>
        {error ? (
          <div className="mb-4 rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#991b1b]">
            {error}
          </div>
        ) : null}
        <label className="mb-3 block text-sm">
          <span className="mb-1 block text-[#435066]">Email</span>
          <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label className="mb-5 block text-sm">
          <span className="mb-1 block text-[#435066]">Senha</span>
          <input
            className="field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <LogIn size={17} />
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
