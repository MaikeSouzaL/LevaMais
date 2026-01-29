import io, { Socket } from "socket.io-client";
import { useAuthStore } from "../context/authStore";

// Manter o WebSocket usando a MESMA base da API, para evitar divergência em emulador/dispositivo.
const RAW_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? "http://10.0.2.2:3001" : "http://192.168.1.8:3001");

const SOCKET_URL = RAW_BASE.replace(/\/$/, "");

class WebSocketService {
  private socket: Socket | null = null;
  private connectPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  /**
   * Conectar ao WebSocket
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      // já conectado
      return;
    }

    // evita múltiplas conexões concorrentes
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      const token = useAuthStore.getState().token;

      if (!token) {
        this.connectPromise = null;
        throw new Error("Token não encontrado");
      }

      // se existe socket antigo, derruba antes de criar outro
      if (this.socket) {
        try {
          this.socket.removeAllListeners();
          this.socket.disconnect();
        } catch {}
        this.socket = null;
      }

      console.log("🔌 Conectando ao WebSocket...", SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        // Em redes móveis/Wi‑Fi instáveis, permitir fallback ajuda a evitar perder eventos
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        randomizationFactor: 0.5,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
      });

      this.setupListeners();

      // IMPORTANTe: aguardar conexão efetiva.
      // Sem isso, a UI pode registrar listeners e o backend emitir eventos
      // antes do socket entrar na sala do usuário, causando "perda" do driver-found.
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) return reject(new Error("Socket não inicializado"));
        if (this.socket.connected) return resolve();

        const onConnect = () => {
          cleanup();
          resolve();
        };
        const onError = (err: any) => {
          cleanup();
          reject(err instanceof Error ? err : new Error(err?.message || "Falha ao conectar"));
        };
        const timer = setTimeout(() => {
          cleanup();
          reject(new Error("Timeout ao conectar WebSocket"));
        }, 20000);

        const cleanup = () => {
          clearTimeout(timer);
          try {
            this.socket?.off("connect", onConnect);
            this.socket?.off("connect_error", onError);
          } catch {}
        };

        this.socket.once("connect", onConnect);
        this.socket.once("connect_error", onError);
      });
    })();

    try {
      await this.connectPromise;
    } finally {
      this.connectPromise = null;
    }
  }

  /**
   * Configurar listeners do socket
   */
  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      const id = this.socket?.id;
      if (id) {
        console.log("✅ WebSocket conectado:", id);
      } else {
        console.log("✅ WebSocket conectado");
      }
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket desconectado:", reason);
    });

    this.socket.io.on("reconnect_attempt", (attempt) => {
      console.log("🔁 Tentando reconectar WebSocket...", attempt);
    });

    this.socket.io.on("reconnect", (attempt) => {
      console.log("✅ WebSocket reconectado", attempt);
    });

    this.socket.io.on("reconnect_failed", () => {
      console.log("❌ WebSocket falhou ao reconectar");
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Erro de conexão WebSocket:", error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("❌ Máximo de tentativas de reconexão atingido");
      }
    });

    this.socket.on("error", (error) => {
      console.error("❌ Erro WebSocket:", error);
    });
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log("👋 Desconectando WebSocket...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Verificar se está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emitir evento
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      // tenta reconectar sem spammar logs
      this.connect().catch(() => {});
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Escutar evento
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn("⚠️ WebSocket não inicializado");
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Remover listener de evento
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // ========== EVENTOS ESPECÍFICOS ==========

  /**
   * Escutar quando motorista é encontrado
   */
  onDriverFound(callback: (data: any) => void): void {
    this.on("driver-found", callback);
  }

  /**
   * Escutar atualização de localização do motorista
   */
  onDriverLocationUpdated(callback: (data: any) => void): void {
    this.on("driver-location-updated", callback);
  }

  /**
   * Escutar quando corrida é cancelada
   */
  onRideCancelled(callback: (data: any) => void): void {
    this.on("ride-cancelled", callback);
  }

  /**
   * Escutar quando status da corrida é atualizado
   */
  onRideStatusUpdated(callback: (data: any) => void): void {
    this.on("ride-status-updated", callback);
  }

  /**
   * Escutar quando motorista chegou
   */
  onDriverArrived(callback: (data: any) => void): void {
    this.on("driver-arrived", callback);
  }

  /**
   * Escutar quando corrida foi iniciada
   */
  onRideStarted(callback: (data: any) => void): void {
    this.on("ride-started", callback);
  }

  /**
   * Escutar quando a oferta expirou para este motorista
   */
  onRideExpired(callback: (data: any) => void): void {
    this.on("ride-expired", callback);
  }

  /**
   * Escutar nova mensagem de chat
   */
  onNewMessage(callback: (data: any) => void): void {
    this.on("new-message", callback);
  }

  /**
   * Notificar que cliente está aguardando motorista
   */
  waitingDriver(rideId: string): void {
    this.emit("waiting-driver", { rideId });
  }

  /**
   * Enviar mensagem de chat
   */
  sendMessage(rideId: string, message: string, receiverId: string): void {
    this.emit("send-message", {
      rideId,
      message,
      receiverId,
    });
  }
}

export default new WebSocketService();
