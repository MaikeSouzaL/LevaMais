import { supabase } from "../lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useAuthStore } from "../context/authStore";
import { REALTIME_ENABLED } from "../config/migration";

class WebSocketService {
  private channels = new Map<string, RealtimeChannel>();
  private listeners = new Map<string, Set<(data: any) => void>>();
  private isConnectedState = false;
  private userChannelName: string | null = null;
  private currentUserId: string | null = null;

  /**
   * Conectar ao Supabase Realtime Channels
   */
  async connect(): Promise<void> {
    if (!REALTIME_ENABLED) {
      return;
    }

    const token = useAuthStore.getState().token;
    const userId = useAuthStore.getState().userData?.id;

    if (!token || !userId) {
      throw new Error("Sessao expirada. Faca login novamente.");
    }

    if (this.isConnectedState && this.currentUserId === userId) {
      return;
    }

    console.log("Conectando ao Supabase Realtime...", userId);

    if (this.currentUserId && this.currentUserId !== userId) {
      this.disconnect();
    }

    this.currentUserId = userId;
    this.isConnectedState = true;

    // Subscreve no canal privado do usuário
    this.userChannelName = `user:${userId}`;
    this.getOrCreateChannel(this.userChannelName);

    // Subscreve no canal global de lobby (chamadas/corridas disponíveis)
    this.getOrCreateChannel("lobby");

    // Aciona callback de conexão
    this.trigger("connect", null);
  }

  /**
   * Desconectar de todos os canais do Supabase Realtime
   */
  disconnect(): void {
    console.log("Desconectando canais do Supabase Realtime...");
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.isConnectedState = false;
    this.currentUserId = null;
    this.userChannelName = null;
    this.trigger("disconnect", null);
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.isConnectedState;
  }

  /**
   * Emitir evento (Broadcast)
   */
  emit(event: string, data?: any): void {
    if (!REALTIME_ENABLED) return;

    if (!this.isConnectedState) {
      this.connect().catch(() => {});
      return;
    }

    // Normaliza nomes de eventos legado para nova estrutura
    let targetEvent = event;
    if (event === "update-location") {
      targetEvent = "driver-location-updated";
    } else if (event === "send-message") {
      targetEvent = "new-message";
    }

    const rideId = data?.rideId;
    if (rideId) {
      const channel = this.getOrCreateChannel(`ride:${rideId}`);
      channel.send({
        type: "broadcast",
        event: targetEvent,
        payload: data,
      });
    } else {
      const channel = this.getOrCreateChannel("lobby");
      channel.send({
        type: "broadcast",
        event: targetEvent,
        payload: data,
      });
    }
  }

  /**
   * Enviar evento broadcast diretamente para um usuário específico
   */
  emitToUser(userId: string, event: string, data?: any): void {
    if (!REALTIME_ENABLED) return;
    const channel = this.getOrCreateChannel(`user:${userId}`);
    channel.send({
      type: "broadcast",
      event: event,
      payload: data,
    });
  }

  /**
   * Escutar evento genérico
   */
  on(event: string, callback: (data: any) => void): void {
    let callbacks = this.listeners.get(event);
    if (!callbacks) {
      callbacks = new Set();
      this.listeners.set(event, callbacks);
    }
    callbacks.add(callback);
  }

  /**
   * Remover listener de evento genérico
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(event);
        }
      }
    }
  }

  /**
   * Deixar canal de uma corrida específica
   */
  leaveRide(rideId: string): void {
    const channelName = `ride:${rideId}`;
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      console.log(`Desconectado do canal da corrida: ${channelName}`);
    }
  }

  private trigger(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Erro no callback do evento ${event}:`, err);
        }
      });
    }
  }

  private getOrCreateChannel(channelName: string): RealtimeChannel {
    let channel = this.channels.get(channelName);
    if (!channel) {
      console.log(`Assinando canal Realtime: ${channelName}`);
      channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false },
        },
      });

      channel
        .on("broadcast", { event: "*" }, (payload) => {
          const eventName = payload.event;
          const data = payload.payload;
          console.log(`[Realtime - ${channelName}] Broadcast recebido: ${eventName}`, data);

          this.trigger(eventName, data);

          // Compatibilidade legado para escutas bidirecionais
          if (eventName === "driver-location-updated") {
            this.trigger("update-location", data);
          } else if (eventName === "new-message") {
            this.trigger("send-message", data);
          }
        })
        .subscribe((status) => {
          console.log(`[Realtime - ${channelName}] Status da subscrição: ${status}`);
        });

      this.channels.set(channelName, channel);
    }
    return channel;
  }

  // ========== EVENTOS ESPECÍFICOS COMPATIBILIDADE ==========

  onDriverFound(callback: (data: any) => void): void {
    this.on("driver-found", callback);
  }

  onDriverLocationUpdated(callback: (data: any) => void): void {
    this.on("driver-location-updated", callback);
  }

  onRideCancelled(callback: (data: any) => void): void {
    this.on("ride-cancelled", callback);
  }

  onRideStatusUpdated(callback: (data: any) => void): void {
    this.on("ride-status-updated", callback);
  }

  onDriverArrived(callback: (data: any) => void): void {
    this.on("driver-arrived", callback);
  }

  onRideStarted(callback: (data: any) => void): void {
    this.on("ride-started", callback);
  }

  onRideExpired(callback: (data: any) => void): void {
    this.on("ride-expired", callback);
  }

  onNewMessage(callback: (data: any) => void): void {
    this.on("new-message", callback);
  }

  waitingDriver(rideId: string): void {
    this.getOrCreateChannel(`ride:${rideId}`);
    this.emit("waiting-driver", { rideId });
  }

  sendMessage(rideId: string, message: string, receiverId: string): void {
    this.emit("send-message", {
      rideId,
      message,
      receiverId,
    });
  }
}

export default new WebSocketService();


