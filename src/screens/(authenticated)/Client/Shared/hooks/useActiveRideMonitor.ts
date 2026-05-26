import { useCallback, useEffect, useState } from "react";
import { NavigationProp, useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { logger } from "@/utils/logger";
import { ClientStackParamList } from "../../types/navigation";

interface ActiveRideMonitorState {
  negotiationRideId: string | null;
  activeRequestingRideId: string | null;
  waitingQueueCount: number;
  expiredRideId: string | null;
  showCancelledModal: boolean;
}

/**
 * Hook para monitorar corridas ativas do cliente.
 * Usa WebSocket para atualizações em tempo real + polling como fallback.
 * Detecta automaticamente quando motorista aceita e redireciona para rastreamento.
 */
export function useActiveRideMonitor() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();

  const [state, setState] = useState<ActiveRideMonitorState>({
    negotiationRideId: null,
    activeRequestingRideId: null,
    waitingQueueCount: 0,
    expiredRideId: null,
    showCancelledModal: false,
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
          navigation.reset({
            index: 0,
            routes: [{ name: "RideTracking", params: { rideId: primaryRide._id } }],
          });
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
      const dId = data?.driverId;

      if (rId && dId) {
        try {
          await rideService.selectOffer(rId, dId);
          navigation.navigate("DeliveryPaymentConfirm", { rideId: rId });
        } catch (error) {
          logger.error("useActiveRideMonitor", "Erro ao selecionar oferta, indo para marketplace", error);
          navigation.navigate("RideOffersMarketplace", { rideId: rId });
        }
      } else if (rId) {
        navigation.navigate("RideOffersMarketplace", { rideId: rId });
      }
    };

    const handleRideCancelled = (data: any) => {
      logger.info("useActiveRideMonitor", "Corrida cancelada", data);
      const rId = data?.rideId || data?.ride?._id || data?._id;

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
    }).catch((error) => {
      logger.error("useActiveRideMonitor", "Erro ao conectar WebSocket", error);
    });

    // Polling como fallback a cada 6 segundos
    const pollInterval = setInterval(checkActiveRide, 6000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      webSocketService.off("ride-status-updated", checkActiveRide);
      webSocketService.off("ride-offers-updated", checkActiveRide);
      webSocketService.off("driver-accepted-offer", handleDriverAccepted);
      webSocketService.off("ride-cancelled", handleRideCancelled);
      webSocketService.off("ride-payment-expired", handlePaymentExpired);
    };
  }, [checkActiveRide, navigation]);

  // Re-check no focus da tela
  useFocusEffect(
    useCallback(() => {
      checkActiveRide();
    }, [checkActiveRide])
  );

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
        autoOpenIncrease: true,
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
    waitingQueueCount: state.waitingQueueCount,
    expiredRideId: state.expiredRideId,
    showCancelledModal: state.showCancelledModal,
    dismissCancelledModal,
    confirmExpiredAction,
    setActiveRequestingRideId,
  };
}
