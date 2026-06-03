import io, { Socket } from "socket.io-client";
import { useAuthStore } from "../context/authStore";

// Manter o WebSocket usando a MESMA base da API, para evitar divergÃªncia em emulador/dispositivo.
const RAW_BASE =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.1.7:3005";

const SOCKET_URL = RAW_BASE.replace(/\/$/, "");

class WebSocketService {
  private socket: Socket | null = null;
  private connectPromise: Promise<void> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private handledAuthFailure = false;

  private isAuthErrorMessage(message: string): boolean {
    return /token inv[aá]lido|token n[aã]o fornecido|jwt|sess[aã]o expirada/i.test(
      String(message || ""),
    );
  }

  private normalizeToken(rawToken: string | null | undefined): string {
    const value = String(rawToken || "").trim();
    if (!value) return "";
    if (/^bearer\s+/i.test(value)) {
      return value.replace(/^bearer\s+/i, "").trim();
    }
    return value;
  }

  /**
   * Conectar ao WebSocket
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      // jÃ¡ conectado
      return;
    }

    // evita mÃºltiplas conexÃµes concorrentes
    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = (async () => {
      const token = this.normalizeToken(useAuthStore.getState().token);

      if (!token) {
        this.connectPromise = null;
        throw new Error("Sessao expirada. Faca login novamente.");
      }

      // se existe socket antigo, derruba antes de criar outro
      if (this.socket) {
        try {
          this.socket.removeAllListeners();
          this.socket.disconnect();
        } catch {}
        this.socket = null;
      }

      console.log("Conectando ao WebSocket...", SOCKET_URL);

      this.socket = io(SOCKET_URL, {
        auth: { token },
        // Em redes mÃ³veis/Wiâ€‘Fi instÃ¡veis, permitir fallback ajuda a evitar perder eventos
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 8000,
        randomizationFactor: 0.5,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
      });

      this.handledAuthFailure = false;
      this.setupListeners();

      // IMPORTANTe: aguardar conexÃ£o efetiva.
      // Sem isso, a UI pode registrar listeners e o backend emitir eventos
      // antes do socket entrar na sala do usuÃ¡rio, causando "perda" do driver-found.
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) return reject(new Error("Socket nÃ£o inicializado"));
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
        console.log("WebSocket conectado:", id);
      } else {
        console.log("WebSocket conectado");
      }
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("âŒ WebSocket desconectado:", reason);
    });

    this.socket.io.on("reconnect_attempt", (attempt) => {
      console.log("ðŸ” Tentando reconectar WebSocket...", attempt);
    });

    this.socket.io.on("reconnect", (attempt) => {
      console.log("WebSocket reconectado", attempt);
    });

    this.socket.io.on("reconnect_failed", () => {
      console.log("WebSocket falhou ao reconectar");
    });

    this.socket.on("connect_error", (error) => {
      const message = String((error as any)?.message || "");
      console.error("WebSocket connect error:", message);
      this.reconnectAttempts++;

      if (this.isAuthErrorMessage(message) && !this.handledAuthFailure) {
        this.handledAuthFailure = true;
        try {
          this.disconnect();
          useAuthStore.getState().logout();
        } catch {}
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("Max reconnect attempts reached");
      }
    });

    this.socket.on("error", (error) => {
      console.error("âŒ Erro WebSocket:", error);
    });
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      console.log("Desconectando WebSocket...");
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Verificar se estÃ¡ conectado
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
      console.warn("WebSocket não inicializado");
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

  // ========== EVENTOS ESPECÃFICOS ==========

  /**
   * Escutar quando motorista Ã© encontrado
   */
  onDriverFound(callback: (data: any) => void): void {
    this.on("driver-found", callback);
  }

  /**
   * Escutar atualizaÃ§Ã£o de localizaÃ§Ã£o do motorista
   */
  onDriverLocationUpdated(callback: (data: any) => void): void {
    this.on("driver-location-updated", callback);
  }

  /**
   * Escutar quando corrida Ã© cancelada
   */
  onRideCancelled(callback: (data: any) => void): void {
    this.on("ride-cancelled", callback);
  }

  /**
   * Escutar quando status da corrida Ã© atualizado
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
   * Notificar que cliente estÃ¡ aguardando motorista
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


