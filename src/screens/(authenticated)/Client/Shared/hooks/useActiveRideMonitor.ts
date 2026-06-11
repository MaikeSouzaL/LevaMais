import { useCallback, useEffect, useRef, useState } from "react";
import { NavigationProp, useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";
import { ClientStackParamList } from "../../types/navigation";

interface ActiveRideMonitorState {
  negotiationRideId: string | null;
  activeRequestingRideId: string | null;
  activeServiceType: "ride" | "delivery" | null;
  activeRideCreatedAt: string | null;
  activeRideSearchTimeout: number | null;
  waitingQueueCount: number;
  expiredRideId: string | null;
  showCancelledModal: boolean;
  allRejected: boolean;
  /** Corrida/entrega já com motorista comprometido (pós-aceite).
   *  Alimenta o banner "Em andamento" na Home quando o usuário volta do tracking. */
  activeTrackingRideId: string | null;
  activeTrackingServiceType: "ride" | "delivery" | null;
  activeTrackingStatus: string | null;
}

/**
 * Hook para monitorar corridas ativas do cliente.
 * Usa WebSocket para atualizações em tempo real + polling como fallback.
 * Detecta automaticamente quando motorista aceita e redireciona para rastreamento.
 */
export function useActiveRideMonitor() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<any>();

  // Deduplication: track recently processed rideIds to avoid duplicate event handling
  const processedCancellations = useRef<Set<string>>(new Set());
  const processedAcceptances = useRef<Set<string>>(new Set());
  const processedPaymentExpired = useRef<Set<string>>(new Set());
  // Corridas que já foram redirecionadas automaticamente para o rastreamento.
  // Evita "prender" o cliente: depois do 1º redirect ele pode voltar para a Home livremente.
  const autoRedirectedRides = useRef<Set<string>>(new Set());
  // Corridas que JÁ sabemos estar comprometidas (com motorista atrelado).
  // Protege contra race conditions: chamadas antigas de checkActiveRide ("em voo")
  // que leram a corrida quando a oferta ainda estava pendente NÃO podem reabrir o
  // marketplace para uma corrida já atrelada.
  const committedRideIds = useRef<Set<string>>(new Set());

  const [state, setState] = useState<ActiveRideMonitorState>({
    negotiationRideId: null,
    activeRequestingRideId: null,
    activeServiceType: null,
    activeRideCreatedAt: null,
    activeRideSearchTimeout: null,
    waitingQueueCount: 0,
    expiredRideId: null,
    showCancelledModal: false,
    allRejected: false,
    activeTrackingRideId: null,
    activeTrackingServiceType: null,
    activeTrackingStatus: null,
  });

  // checkActiveRide é PURO sincronizador de estado: atualiza banner/negociação/
  // requesting e RETORNA a corrida comprometida (se houver), mas NUNCA navega.
  // Pode ser chamado livremente por focus, polling e eventos de socket sem risco
  // de "arrastar" o cliente. O ÚNICO ponto que redireciona é o handler de aceite
  // (handleRideAccepted), acionado apenas pelos eventos de aceite do WebSocket.
  const checkActiveRide = useCallback(async () => {
    try {
      const res = await rideService.getActiveList();

      const activeRides = res?.rides || [];
      logger.debug("useActiveRideMonitor", "Corridas ativas recebidas", {
        count: activeRides.length,
        rides: activeRides.map((r: any) => ({ id: r._id, status: r.status, service: r.serviceType })),
      });

      // Status em que a corrida JÁ tem um motorista comprometido (pós-aceite).
      // Nesses estados a corrida NÃO é mais uma negociação — ela já pertence
      // a um motorista e deve abrir o rastreamento, nunca o "Escolher Entregador".
      const ACTIVE_TRACKING_STATUSES = ["accepted", "driver_arriving", "arrived", "in_progress"];

      // ─── PRIORIDADE 0: Corrida/entrega já comprometida (com motorista) ────────
      // Tem que ser avaliada ANTES da negociação, porque uma oferta aceita continua
      // no array `negotiation.offers` com status "accepted" (≠ "rejected"). Sem este
      // curto-circuito, a corrida já atrelada era erroneamente tratada como
      // negociação e a Home reabria a tela "Escolher Entregador".
      // Uma corrida é considerada comprometida se:
      //  (a) tem driverId + status pós-aceite na resposta atual, OU
      //  (b) já foi marcada como comprometida numa chamada anterior (ref) e ainda
      //      aparece na lista de ativas — protege contra respostas atrasadas que
      //      ainda mostram um status antigo (ex: "driver_assigned").
      const committedRide = activeRides.find((ride: any) => {
        if (ride.isWaitingInQueue) return false;
        if (ride.driverId && ACTIVE_TRACKING_STATUSES.includes(ride.status)) return true;
        if (committedRideIds.current.has(String(ride._id))) return true;
        return false;
      });

      // Registra a corrida comprometida no ref — qualquer chamada futura (mesmo
      // uma resposta HTTP antiga que chegue atrasada) saberá que ela já tem motorista.
      if (committedRide) {
        committedRideIds.current.add(String(committedRide._id));
      }

      if (committedRide) {
        // Corrida comprometida → alimenta o banner "Em andamento" e LIMPA qualquer
        // estado de negociação/requesting para não reabrir o marketplace.
        setState((prev) => ({
          ...prev,
          negotiationRideId: null,
          activeRequestingRideId: null,
          allRejected: false,
          waitingQueueCount: 0,
          activeTrackingRideId: committedRide._id,
          activeTrackingServiceType: (committedRide.serviceType as "ride" | "delivery") || "ride",
          activeTrackingStatus: committedRide.status,
        }));
        // Apenas devolve a corrida comprometida — quem decide redirecionar é o
        // handler de aceite. Aqui NÃO navegamos (banner é suficiente).
        return committedRide;
      }

      // Não há corrida comprometida → garante banner "Em andamento" limpo.
      setState((prev) => ({
        ...prev,
        activeTrackingRideId: null,
        activeTrackingServiceType: null,
        activeTrackingStatus: null,
      }));

      // 1. Verifica se há ofertas PENDENTES de motoristas (negociação real).
      // Exclui ofertas já aceitas (essas viram corrida comprometida, tratada acima)
      // e rejeitadas. Só "pending"/"countered"/"client_countered" contam como negociação.
      const NEGOTIABLE_OFFER_STATUSES = ["pending", "countered", "client_countered"];
      const rideWithOffers = activeRides.find((ride: any) => {
        // Defensivo: nunca tratar uma corrida já atrelada como negociação.
        if (ride.driverId && ACTIVE_TRACKING_STATUSES.includes(ride.status)) return false;
        // Defensivo contra race: se já marcamos esta corrida como comprometida em
        // qualquer chamada anterior, ignore — uma resposta HTTP atrasada não pode
        // reabrir o marketplace.
        if (committedRideIds.current.has(String(ride._id))) return false;
        const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
        return offers.some((o: any) => NEGOTIABLE_OFFER_STATUSES.includes(String(o.status)));
      });

      if (rideWithOffers) {
        setState((prev) => ({
          ...prev,
          negotiationRideId: rideWithOffers._id,
          activeRequestingRideId: null,
          activeServiceType: (rideWithOffers.serviceType as "ride" | "delivery") || "ride",
          activeRideCreatedAt: rideWithOffers.createdAt || null,
          activeRideSearchTimeout: rideWithOffers.searchTimeoutSeconds || 300,
          allRejected: false,
        }));
      } else {
        // 2. Verifica se há corrida buscando motoristas (sem ofertas)
        const requestingRide = activeRides.find((ride: any) =>
          ["requesting", "searching_driver", "payment_pending", "driver_assigned"].includes(String(ride.status)) &&
          !ride.driverId
        );

        if (requestingRide) {
          setState((prev) => ({
            ...prev,
            activeRequestingRideId: requestingRide._id,
            activeServiceType: (requestingRide.serviceType as "ride" | "delivery") || "ride",
            activeRideCreatedAt: requestingRide.createdAt || null,
            activeRideSearchTimeout: requestingRide.searchTimeoutSeconds || 300,
            allRejected: Boolean((requestingRide as any).allRejected),
          }));
          // Auto-redirect to SearchingDriver is intentionally OMITTED here 
          // so users aren't forcefully redirected on app reload.
        } else {
          setState((prev) => ({
            ...prev,
            activeRequestingRideId: null,
            activeServiceType: null,
            activeRideCreatedAt: null,
            activeRideSearchTimeout: null,
            allRejected: false,
          }));
        }
      }

      // 3. Conta corridas na fila de espera
      const queuedRides = activeRides.filter(
        (ride: any) => ride.isWaitingInQueue === true && ride.status === "requesting"
      );

      setState((prev) => ({
        ...prev,
        waitingQueueCount: queuedRides.length,
      }));
      return null;
    } catch (err) {
      logger.warn("useActiveRideMonitor", "Erro ao verificar corridas ativas", err);
      return null;
    }
  }, []);

  // ÚNICO ponto de redirecionamento automático para o tracking.
  // Sincroniza o estado (banner) e, se a corrida estiver comprometida (com motorista),
  // navega UMA vez por corrida. Acionado SOMENTE pelos eventos de aceite do WebSocket.
  const redirectToTrackingOnce = useCallback(async () => {
    const committedRide = await checkActiveRide();
    if (!committedRide) return;
    const id = String(committedRide._id);

    // Se o usuário voltou intencionalmente para Home (via botão "Início"),
    // o parâmetro suppressAutoRedirect impede o redirect automático de volta ao tracking.
    const suppress = (route.params as any)?.suppressAutoRedirect;
    if (suppress && String(suppress) === id) {
      logger.debug("useActiveRideMonitor", "Auto-redirect suprimido — usuário voltou à Home intencionalmente", { rideId: id });
      return;
    }

    if (autoRedirectedRides.current.has(id)) return;
    autoRedirectedRides.current.add(id);
    const trackingScreen = committedRide.serviceType === "delivery" ? "DeliveryTracking" : "RideTracking";
    try {
      (navigation as any).navigate(trackingScreen, { rideId: committedRide._id });
    } catch {
      try {
        (navigation as any).replace(trackingScreen, { rideId: committedRide._id });
      } catch {
        // ignore — banner na Home mantém o acesso ao tracking
      }
    }
  }, [checkActiveRide, navigation, route.params]);

  // Supabase Realtime + polling para atualizações em tempo real
  useEffect(() => {
    let mounted = true;
    const currentRideId = state.activeRequestingRideId || state.activeTrackingRideId;

    // Polling a cada 8 segundos como fallback
    const pollInterval = setInterval(() => {
      if (mounted) checkActiveRide();
    }, 8000);

    if (!currentRideId) {
      return () => {
        mounted = false;
        clearInterval(pollInterval);
      };
    }

    // Supabase Realtime: escuta mudanças na corrida ativa
    const channelName = `monitor-ride:${currentRideId}:${Math.random().toString(36).slice(2)}`;
    const rideChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${currentRideId}` },
        async (payload) => {
          if (!mounted) return;
          const row = payload.new as any;
          const rId = String(currentRideId);

          if (String(row?.status || "").startsWith("cancelled")) {
            // Deduplication
            if (processedCancellations.current.has(rId)) return;
            processedCancellations.current.add(rId);
            setTimeout(() => processedCancellations.current.delete(rId), 5000);
            committedRideIds.current.delete(rId);
            autoRedirectedRides.current.delete(rId);

            setState((prev) => ({
              ...prev,
              expiredRideId: rId,
              showCancelledModal: navigation.isFocused(),
              activeRequestingRideId: null,
              negotiationRideId: null,
              waitingQueueCount: 0,
              activeTrackingRideId: prev.activeTrackingRideId === rId ? null : prev.activeTrackingRideId,
              activeTrackingServiceType: prev.activeTrackingRideId === rId ? null : prev.activeTrackingServiceType,
              activeTrackingStatus: prev.activeTrackingRideId === rId ? null : prev.activeTrackingStatus,
            }));
            return;
          }

          // Motorista atribuído → verificar aceite e redirecionar se necessário
          if (row?.driver_id) {
            const ACTIVE_TRACKING_STATUSES = ["accepted", "driver_arriving", "arrived", "in_progress"];
            if (ACTIVE_TRACKING_STATUSES.includes(String(row?.status || ""))) {
              if (processedAcceptances.current.has(rId)) return;
              processedAcceptances.current.add(rId);
              setTimeout(() => processedAcceptances.current.delete(rId), 5000);
              await redirectToTrackingOnce();
              return;
            }
          }

          // Qualquer outra mudança → sincronizar estado
          checkActiveRide();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(rideChannel);
    };
  }, [
    state.activeRequestingRideId,
    state.activeTrackingRideId,
    checkActiveRide,
    redirectToTrackingOnce,
    navigation,
  ]);

  // Re-sincroniza o estado (banner) quando a Home ganha foco.
  // NÃO redireciona — checkActiveRide é puro. Logo, voltar para a Home a partir do
  // tracking sempre MANTÉM o cliente na Home (o redirect só ocorre no aceite via socket).
  useFocusEffect(
    useCallback(() => {
      checkActiveRide();
    }, [checkActiveRide])
  );

  // ⏱️ Frontend safety-net: when the search timeout expires, force an immediate re-check
  // The backend already auto-cancels via its own setTimeout, but this ensures the frontend
  // reacts immediately even if the WebSocket event is slightly delayed.
  useEffect(() => {
    const { activeRequestingRideId: rideId, activeRideCreatedAt: createdAt, activeRideSearchTimeout: timeout } = state;
    if (!rideId || !createdAt) return;

    const timeoutSecs = timeout || 300;
    const createdTime = new Date(createdAt).getTime();
    const expireTime = createdTime + timeoutSecs * 1000;
    const remainingMs = expireTime - Date.now();

    const handleTimeoutCancel = async () => {
      try {
        logger.info("useActiveRideMonitor", "Timer expired! Calling cancel HTTP", { rideId });
        await rideService.cancel(rideId, "no_driver_found");
      } catch (err) {
        logger.warn("useActiveRideMonitor", "Already cancelled or failed to cancel", err);
      } finally {
        // Exibe modal de "Oferta Expirada" para o cliente saber o que aconteceu
        setState((prev) => ({
          ...prev,
          expiredRideId: rideId,
          showCancelledModal: true,
          activeRequestingRideId: null,
          negotiationRideId: null,
          waitingQueueCount: 0,
        }));
        checkActiveRide();
      }
    };

    if (remainingMs <= 0) {
      handleTimeoutCancel();
      return;
    }

    const timer = setTimeout(() => {
      handleTimeoutCancel();
    }, remainingMs);

    return () => clearTimeout(timer);
  }, [state.activeRequestingRideId, state.activeRideCreatedAt, state.activeRideSearchTimeout, checkActiveRide]);

  const dismissCancelledModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCancelledModal: false,
    }));
  }, []);

  const confirmExpiredAction = useCallback(() => {
    // Volta pra Home — a oferta expirou, não tem marketplace pra mostrar
    navigation.navigate("Home");
    setState((prev) => ({
      ...prev,
      showCancelledModal: false,
      expiredRideId: null,
    }));
  }, [navigation]);

  const setActiveRequestingRideId = useCallback((rideId: string | null) => {
    setState((prev) => ({
      ...prev,
      activeRequestingRideId: rideId,
    }));
  }, []);

  return {
    negotiationRideId: state.negotiationRideId,
    activeRequestingRideId: state.activeRequestingRideId,
    activeServiceType: state.activeServiceType,
    activeRideCreatedAt: state.activeRideCreatedAt,
    activeRideSearchTimeout: state.activeRideSearchTimeout,
    waitingQueueCount: state.waitingQueueCount,
    expiredRideId: state.expiredRideId,
    showCancelledModal: state.showCancelledModal,
    allRejected: state.allRejected,
    /** Corrida/entrega em andamento — alimenta o banner "Em andamento" da Home */
    activeTrackingRideId: state.activeTrackingRideId,
    activeTrackingServiceType: state.activeTrackingServiceType,
    activeTrackingStatus: state.activeTrackingStatus,
    dismissCancelledModal,
    confirmExpiredAction,
    setActiveRequestingRideId,
  };
}
