import api from "./api";

export interface ChatMessage {
  id: string;
  _id?: string;
  rideId: string;
  senderId: string;
  receiverId?: string;
  senderType?: "client" | "driver" | "admin";
  message: string;
  createdAt: string;
  timestamp?: string;
  readAt?: string | null;
}

class ChatService {
  async listRideMessages(rideId: string): Promise<ChatMessage[]> {
    const response = await api.get(`/chat/rides/${rideId}/messages`);
    return response.data?.messages || [];
  }

  async sendRideMessage(rideId: string, message: string): Promise<ChatMessage> {
    const response = await api.post(`/chat/rides/${rideId}/messages`, {
      message,
    });
    return response.data?.message;
  }
}

export default new ChatService();
