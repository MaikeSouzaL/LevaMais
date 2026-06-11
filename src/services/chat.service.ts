import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";

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
  /** Histórico de chat da corrida via Supabase. */
  async getHistory(rideId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((msg) => this.mapMsg(msg));
    } catch (error) {
      console.error("[ChatService] Erro ao carregar histórico:", error);
      return [];
    }
  }

  /**
   * Envia mensagem: persiste em chat_messages + emite broadcast realtime.
   * Descobre o receiver_id buscando a corrida para respeitar a RLS de SELECT.
   */
  async sendMessage(rideId: string, message: string): Promise<ChatMessage> {
    const userId = await requireUserId();
    const trimmed = message.trim();
    if (!trimmed) throw new Error("Mensagem vazia");

    // Descobre o outro participante (cliente ou motorista da corrida)
    const { data: ride } = await supabase
      .from("rides")
      .select("client_id, driver_id")
      .eq("id", rideId)
      .maybeSingle();

    const receiverId =
      ride?.client_id === userId ? ride?.driver_id : ride?.client_id;

    const { data: msg, error } = await supabase
      .from("chat_messages")
      .insert({
        ride_id: rideId,
        sender_id: userId,
        receiver_id: receiverId ?? null,
        message: trimmed,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapMsg(msg);
  }

  /** @deprecated Use sendMessage() */
  sendViaSocket(rideId: string, message: string): void {
    this.sendMessage(rideId, message).catch((e) =>
      console.error("[ChatService] sendViaSocket failed:", e),
    );
  }

  /** @deprecated */
  sendRideMessage = this.sendViaSocket;

  /** @deprecated Use getHistory() */
  listRideMessages = this.getHistory;

  /** Marca mensagem como lida. */
  async markAsRead(messageId: string): Promise<void> {
    await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId);
  }

  /**
   * Escuta novas mensagens em tempo real via Supabase Realtime.
   * Retorna função de cleanup.
   */
  onNewMessage(rideId: string, callback: (msg: ChatMessage) => void): () => void {
    const channel = supabase
      .channel(`chat:${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          callback(this.mapMsg(payload.new));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  private mapMsg(msg: any): ChatMessage {
    return {
      _id: msg.id,
      id: msg.id,
      rideId: msg.ride_id,
      senderId: msg.sender_id,
      senderType: "client",
      message: msg.message,
      timestamp: msg.created_at,
      createdAt: msg.created_at,
      readAt: msg.read_at ?? null,
      status: msg.read_at ? "read" : "delivered",
    };
  }
}

export default new ChatService();
