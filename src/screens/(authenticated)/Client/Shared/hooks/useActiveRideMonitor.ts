import { useCallback, useEffect, useRef, useState } from "react";
import { NavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
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
}

/**
 * Hook para monitorar corridas ativas do cliente.
 * Usa WebSocket para atualizações em tempo real + polling como fallback.
 * Detecta automaticamente quando motorista aceita e redireciona para rastreamento.
 */
export function useActiveRideMonitor() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();

  // Deduplication: track recently processed rideIds to avoid duplicate event handling
  const processedCancellations = useRef<Set<string>>(new Set());
  const processedAcceptances = useRef<Set<string>>(new Set());
  const processedPaymentExpired = useRef<Set<string>>(new Set());

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
  });

  const checkActiveRide = useCallback(async () => {
    try {
      const res = await rideService.getActiveList();

      const activeRides = res?.rides || [];
      logger.debug("useActiveRideMonitor", "Corridas ativas recebidas", {
        count: activeRides.length,
        rides: activeRides.map((r: any) => ({ id: r._id, status: r.status, service: r.serviceType })),
      });

      // 1. Verifica se há ofertas de motoristas (negociação)
      const rideWithOffers = activeRides.find((ride: any) => {
        const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
        return offers.some((o: any) => o.status !== "rejected");
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
        // 2. Verifica se há corrida aguardando motoristas (requesting)
        const requestingRide = activeRides.find((ride: any) =>
          ride.status === "requesting" ||
          ride.status === "payment_pending" ||
          ride.status === "driver_assigned"
        );

        setState((prev) => ({
          ...prev,
          negotiationRideId: null,
          activeRequestingRideId: requestingRide?._id || null,
          activeServiceType: requestingRide ? ((requestingRide.serviceType as "ride" | "delivery") || "ride") : null,
          activeRideCreatedAt: requestingRide ? (requestingRide.createdAt || null) : null,
          activeRideSearchTimeout: requestingRide ? (requestingRide.searchTimeoutSeconds || 300) : null,
          allRejected: requestingRide ? Boolean((requestingRide as any).allRejected) : false,
        }));
      }

      // 3. Conta corridas na fila de espera
      const queuedRides = activeRides.filter(
        (ride: any) => ride.isWaitingInQueue === true && ride.status === "requesting"
      );

      setState((prev) => ({
        ...prev,
        waitingQueueCount: queuedRides.length,
      }));

      // 4. Auto-redirect para rastreamento se motorista aceitou
      const primaryRide = activeRides.find((ride: any) => !ride.isWaitingInQueue);
      if (primaryRide) {
        if (
          primaryRide.driverId &&
          ["accepted", "driver_arriving", "arrived", "in_progress"].includes(primaryRide.status)
        ) {
          const trackingScreen = primaryRide.serviceType === "delivery" ? "DeliveryTracking" : "RideTracking";
          try {
            (navigation as any).navigate(trackingScreen, { rideId: primaryRide._id });
          } catch {
            // fallback: if navigate fails (drawer nesting), try replace
            try {
              (navigation as any).replace(trackingScreen, { rideId: primaryRide._id });
            } catch {
              // ignore — let the interval re-check
            }
          }
          return;
        }
      }
    } catch (err) {
      logger.error("useActiveRideMonitor", "Erro ao verificar corridas ativas", err);
    }
  }, [navigation]);

  // WebSocket listeners para atualizações em tempo real
  useEffect(() => {
    let mounted = true;

    const handleDriverAccepted = async (data: any) => {
      logger.info("useActiveRideMonitor", "Motorista aceitou oferta", data);
      const rId = data?.rideId;

      // Deduplication: prevent duplicate handling of same ride acceptance
      if (rId && processedAcceptances.current.has(rId)) {
        logger.debug("useActiveRideMonitor", "Duplicate acceptance event ignored", { rideId: rId });
        return;
      }
      if (rId) {
        processedAcceptances.current.add(rId);
        // Clean up after 5 seconds
        setTimeout(() => processedAcceptances.current.delete(rId), 5000);
      }

      await checkActiveRide();
    };

    const handleRideCancelled = (data: any) => {
      logger.info("useActiveRideMonitor", "Corrida cancelada", data);
      const rId = data?.rideId || data?.ride?._id || data?._id;

      // Deduplication: prevent duplicate handling of same ride cancellation
      if (rId && processedCancellations.current.has(rId)) {
        logger.debug("useActiveRideMonitor", "Duplicate cancellation event ignored", { rideId: rId });
        return;
      }
      if (rId) {
        processedCancellations.current.add(rId);
        // Clean up after 5 seconds
        setTimeout(() => processedCancellations.current.delete(rId), 5000);
      }

      setState((prev) => ({
        ...prev,
        expiredRideId: rId || null,
        showCancelledModal: navigation.isFocused(),
        activeRequestingRideId: null,
        negotiationRideId: null,
        waitingQueueCount: 0,
      }));
    };

    const handlePaymentExpired = (data: any) => {
      logger.info("useActiveRideMonitor", "Pagamento expirado", data);
      const rId = data?.rideId || data?.ride?._id || data?._id;

      // Deduplication: prevent duplicate handling of same payment expiration
      if (rId && processedPaymentExpired.current.has(rId)) {
        logger.debug("useActiveRideMonitor", "Duplicate payment expired event ignored", { rideId: rId });
        return;
      }
      if (rId) {
        processedPaymentExpired.current.add(rId);
        // Clean up after 5 seconds
        setTimeout(() => processedPaymentExpired.current.delete(rId), 5000);
      }

      setState((prev) => ({
        ...prev,
        expiredRideId: rId || null,
        showCancelledModal: navigation.isFocused(),
        activeRequestingRideId: null,
        negotiationRideId: null,
        waitingQueueCount: 0,
      }));

      Toast.show({
        type: "error",
        text1: "Pagamento Expirado",
        text2: data?.reason || "Tempo de confirmação esgotado.",
      });
    };

    // Conecta WebSocket e registra listeners
    webSocketService.connect().then(() => {
      webSocketService.on("ride-status-updated", checkActiveRide);
      webSocketService.on("ride-offers-updated", checkActiveRide);
      webSocketService.on("driver-accepted-offer", handleDriverAccepted);
      webSocketService.on("ride-cancelled", handleRideCancelled);
      webSocketService.on("ride-payment-expired", handlePaymentExpired);

      // Dedicated delivery event key listeners (radios)
      webSocketService.on("delivery-accepted", handleDriverAccepted);
      webSocketService.on("delivery-cancelled", handleRideCancelled);
      webSocketService.on("delivery-negotiated", checkActiveRide);

      // Dedicated ride event key listeners (radios)
      webSocketService.on("ride-open", checkActiveRide);
      webSocketService.on("ride-accepted", handleDriverAccepted);
      webSocketService.on("ride-cancelled", handleRideCancelled);
      webSocketService.on("ride-negotiated", checkActiveRide);
    }).catch((error) => {
      logger.error("useActiveRideMonitor", "Erro ao conectar WebSocket", error);
    });

    // Polling inteligente como fallback:
    // Se o WebSocket estiver ativo e conectado, as atualizações em tempo real
    // chegam instantaneamente pelos eventos do socket, então não precisamos
    // sobrecarregar o servidor com requisições HTTP a cada 6 segundos.
    // Faremos o polling rápido (a cada 8 segundos) apenas se o WebSocket estiver offline.
    // E um polling lento (a cada 30 segundos) de segurança se o WebSocket estiver online.
    let pollCounter = 0;
    const pollInterval = setInterval(() => {
      if (webSocketService.isConnected()) {
        pollCounter += 5;
        if (pollCounter >= 60) {
          pollCounter = 0;
          checkActiveRide();
        }
      } else {
        // Se o WebSocket estiver offline/desconectado, executa o polling rápido de recuperação (a cada 5s)
        pollCounter = 0;
        checkActiveRide();
      }
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      webSocketService.off("ride-status-updated", checkActiveRide);
      webSocketService.off("ride-offers-updated", checkActiveRide);
      webSocketService.off("driver-accepted-offer", handleDriverAccepted);
      webSocketService.off("ride-cancelled", handleRideCancelled);
      webSocketService.off("ride-payment-expired", handlePaymentExpired);

      // Dedicated delivery event key listeners (radios) off
      webSocketService.off("delivery-accepted", handleDriverAccepted);
      webSocketService.off("delivery-cancelled", handleRideCancelled);
      webSocketService.off("delivery-negotiated", checkActiveRide);

      // Dedicated ride event key listeners (radios) off
      webSocketService.off("ride-open", checkActiveRide);
      webSocketService.off("ride-accepted", handleDriverAccepted);
      webSocketService.off("ride-cancelled", handleRideCancelled);
      webSocketService.off("ride-negotiated", checkActiveRide);
    };
  }, [checkActiveRide, navigation]);

  // Re-check no focus da tela
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
        const isDelivery = state.activeServiceType === "delivery";
        logger.info("useActiveRideMonitor", `Timer expired! Emitting ${isDelivery ? "delivery_expired" : "ride_expired"} via socket and calling cancel HTTP`, { rideId });
        webSocketService.emit(isDelivery ? "delivery_expired" : "ride_expired", { rideId });
        await rideService.cancel(rideId, "no_driver_found");
      } catch (err) {
        logger.warn("useActiveRideMonitor", "Already cancelled or failed to cancel", err);
      } finally {
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
    if (state.expiredRideId) {
      navigation.navigate("RideOffersMarketplace", {
        rideId: state.expiredRideId,
      });
    }
    setState((prev) => ({
      ...prev,
      showCancelledModal: false,
      expiredRideId: null,
    }));
  }, [state.expiredRideId, navigation]);

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
    dismissCancelledModal,
    confirmExpiredAction,
    setActiveRequestingRideId,
  };
}
