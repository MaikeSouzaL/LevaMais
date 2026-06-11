import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/context/authStore";
import userService from "@/services/user.service";
import { REALTIME_ENABLED } from "@/config/migration";

/**
 * Saldo LevaPay em tempo real.
 *
 * Faz a carga inicial via `userService.getProfile()` e, em seguida, assina as
 * mudanças da própria linha em `public.profiles` por Realtime (postgres_changes).
 * Como o crédito do saldo acontece no servidor (trigger `on_wallet_transaction_paid`
 * quando uma `wallet_transactions` vira `paid`), o `wallet_balance` é atualizado
 * automaticamente na UI sem precisar re-buscar manualmente.
 *
 * RLS (`profiles_select_own`) garante que cada usuário só recebe eventos da própria
 * linha. Se `REALTIME_ENABLED` estiver desligado (kill-switch da migração), o hook
 * funciona apenas com a carga inicial + `refresh()` manual.
 */
export function useWalletBalance() {
  const userId = useAuthStore((s) => s.userData?.id);
  const [balance, setBalance] = useState(0);
  const [held, setHeld] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const profile = await userService.getProfile();
      if (profile && (profile as any).wallet) {
        setBalance((profile as any).wallet.balance || 0);
        setHeld((profile as any).wallet.held || 0);
      }
    } catch (err) {
      console.warn("[useWalletBalance] Erro ao buscar saldo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial (e ao trocar de usuário)
  useEffect(() => {
    refresh();
  }, [refresh, userId]);

  // Assinatura Realtime da própria linha em profiles
  useEffect(() => {
    if (!REALTIME_ENABLED || !userId) return;

    const channel: RealtimeChannel = supabase
      .channel(`wallet:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as any)?.wallet_balance;
          if (next != null) setBalance(Number(next));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { balance, held, loading, refresh };
}

export default useWalletBalance;
