import apiClient from "./api";
import webSocketService from "./websocket.service";
import { useAuthStore } from "@/context/authStore";

export interface ChatMessage {
  _id: string;
  id: string;
  rideId: string;
  senderId: string;
  senderName?: string;
  senderType: "client" | "driver" | "admin";
  senderPhoto?: string | null;
  senderAvatar?: string;
  content?: string;
  message: string;
  readAt: string | null;
  timestamp: string;
  createdAt: string;
  status?: "sent" | "delivered" | "read";
  attachments?: Array<{ type: "image" | "location"; url: string; data?: any }>;
}

class ChatService {
  /**
   * Busca historico de chat de uma corrida (REST).
   */
  async getHistory(rideId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const response = await apiClient.get(`/rides/${rideId}/chat`, {
        params: { limit },
      });
      return response.data?.messages || [];
    } catch (error) {
      console.error("[ChatService] Erro ao carregar historico:", error);
      return [];
    }
  }

  /**
   * Envia mensagem via WebSocket (com persistencia no backend).
   */
  sendViaSocket(rideId: string, message: string): void {
    const token = useAuthStore.getState().token;
    if (!token) return;

    webSocketService.emit("send-message", {
      rideId,
      message,
    });
  }

  /** @deprecated Use sendViaSocket */
  sendRideMessage = this.sendViaSocket;

  /** @deprecated Use getHistory */
  listRideMessages = this.getHistory;

  /**
   * Escuta novas mensagens via WebSocket.
   * Retorna função de cleanup.
   */
  onNewMessage(callback: (msg: ChatMessage) => void): () => void {
    webSocketService.on("new-message", (data: any) => {
      callback({
        _id: data._id || "",
        id: data._id || "",
        rideId: data.rideId,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        createdAt: data.timestamp || new Date().toISOString(),
        readAt: data.readAt || null,
        senderName: data.senderName,
        senderPhoto: data.senderPhoto,
      });
    });

    return () => {
      webSocketService.off("new-message");
    };
  }
}

export default new ChatService();
