import { useEffect, useRef } from "react";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { useAuthStore } from "@/context/authStore";
import {
  requestNotificationPermissions,
  getPushToken,
  setupNotificationHandler,
} from "@/services/notification.service";
import { savePushToken } from "@/services/auth.service";

/**
 * Hook que solicita permissão e registra o Expo Push Token silenciosamente.
 * Deve ser chamado na montagem das telas Home do cliente e do motorista.
 *
 * - Só executa uma vez por sessão (ref guard).
 * - Não bloqueia nem exibe telas intermediárias.
 * - Em emuladores, skipa silenciosamente.
 * - Se o token já estava salvo, não repete o processo.
 */
export function useRegisterPushToken() {
  const hasRun = useRef(false);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (hasRun.current || !token) return;
    hasRun.current = true;

    async function registerToken() {
      try {
        // Emuladores não suportam push tokens reais
        if (!Device.isDevice) return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ||
          (Constants as any).easConfig?.projectId;

        if (!projectId || projectId === "seu-project-id-aqui") return;

        setupNotificationHandler();

        const permissionGranted = await requestNotificationPermissions();
        if (!permissionGranted) return;

        const pushToken = await getPushToken(projectId);
        if (!pushToken) return;

        await savePushToken(pushToken, token!);
        console.log("[PushToken] Token registrado com sucesso.");
      } catch (err: any) {
        // Falha silenciosa — não afeta a experiência do usuário
        console.warn("[PushToken] Falha ao registrar token:", err?.message);
      }
    }

    registerToken();
  }, [token]);
}
