import apiClient from './api';
import { logger } from '@/utils/logger';
import webSocketService from './websocket.service';

export interface ChatMessage {
  id: string;
  _id?: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content?: string;
  message?: string;
  timestamp: string;
  createdAt?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    type: 'image' | 'location';
    url: string;
    data?: any;
  }>;
}

export interface ChatRoom {
  id: string;
  rideId?: string;
  deliveryId?: string;
  participantIds: string[];
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
    isDriver?: boolean;
  }>;
  messages: ChatMessage[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

class ChatService {
  private listeners: Map<string, Set<Function>> = new Map();

  async getRideChat(rideId: string): Promise<ChatRoom> {
    try {
      logger.info('ChatService', `Carregando chat da corrida ${rideId}`);
      const response = await apiClient.get(`/chat/rides/${rideId}`);
      return response.data?.chatRoom;
    } catch (error) {
      logger.error('ChatService', 'Erro ao carregar chat da corrida', error as Error);
      throw error;
    }
  }

  async getDeliveryChat(deliveryId: string): Promise<ChatRoom> {
    try {
      logger.info('ChatService', `Carregando chat da entrega ${deliveryId}`);
      const response = await apiClient.get(`/chat/deliveries/${deliveryId}`);
      return response.data?.chatRoom;
    } catch (error) {
      logger.error('ChatService', 'Erro ao carregar chat da entrega', error as Error);
      throw error;
    }
  }

  async getChatHistory(
    rideId?: string,
    deliveryId?: string,
    limit = 50,
    offset = 0
  ): Promise<ChatMessage[]> {
    try {
      const endpoint = rideId ? `/chat/rides/${rideId}/messages` : `/chat/deliveries/${deliveryId}/messages`;
      const response = await apiClient.get(endpoint, {
        params: { limit, offset },
      });
      return response.data?.messages || [];
    } catch (error) {
      logger.error('ChatService', 'Erro ao carregar histórico de chat', error as Error);
      throw error;
    }
  }

  async sendMessage(
    roomId: string,
    content: string,
    attachments?: any[]
  ): Promise<ChatMessage> {
    try {
      logger.info('ChatService', `Enviando mensagem para sala ${roomId}`);

      const response = await apiClient.post(`/chat/messages`, {
        roomId,
        content,
        attachments,
      });

      const message = response.data?.message;

      if (message) {
        logger.info('ChatService', 'Mensagem enviada com sucesso');
        // Emit para listeners locais
        this.emit(roomId, { type: 'message:sent', message });
      }

      return message;
    } catch (error) {
      logger.error('ChatService', 'Erro ao enviar mensagem', error as Error);
      throw error;
    }
  }

  async listRideMessages(rideId: string): Promise<ChatMessage[]> {
    try {
      logger.info('ChatService', `Listando mensagens da corrida ${rideId}`);
      const response = await apiClient.get(`/chat/rides/${rideId}/messages`);
      return response.data?.messages || [];
    } catch (error) {
      logger.error('ChatService', 'Erro ao listar mensagens da corrida', error as Error);
      throw error;
    }
  }

  async sendRideMessage(rideId: string, message: string): Promise<ChatMessage> {
    try {
      logger.info('ChatService', `Enviando mensagem para corrida ${rideId}`);
      const response = await apiClient.post(`/chat/rides/${rideId}/messages`, {
        message,
      });
      return response.data?.message;
    } catch (error) {
      logger.error('ChatService', 'Erro ao enviar mensagem para corrida', error as Error);
      throw error;
    }
  }

  async markAsRead(roomId: string, messageIds: string[]): Promise<void> {
    try {
      await apiClient.post(`/chat/messages/mark-read`, {
        roomId,
        messageIds,
      });
    } catch (error) {
      logger.error('ChatService', 'Erro ao marcar como lido', error as Error);
    }
  }

  async uploadAttachment(file: any): Promise<string> {
    try {
      logger.info('ChatService', 'Enviando anexo');

      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/chat/attachments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.info('ChatService', 'Anexo enviado com sucesso');
      return response.data?.url;
    } catch (error) {
      logger.error('ChatService', 'Erro ao enviar anexo', error as Error);
      throw error;
    }
  }

  // WebSocket Integration
  setupChatListeners() {
    try {
      logger.info('ChatService', 'Configurando listeners de WebSocket');

      webSocketService.on('chat:message', (data) => {
        logger.debug('ChatService', 'Nova mensagem recebida', {
          roomId: data.roomId,
        });
        this.emit(data.roomId, { type: 'message:received', message: data.message });
      });

      webSocketService.on('chat:typing', (data) => {
        this.emit(data.roomId, { type: 'user:typing', userId: data.userId });
      });

      webSocketService.on('chat:user-joined', (data) => {
        this.emit(data.roomId, { type: 'user:joined', userId: data.userId });
      });

      webSocketService.on('chat:user-left', (data) => {
        this.emit(data.roomId, { type: 'user:left', userId: data.userId });
      });

      webSocketService.on('chat:message-read', (data) => {
        this.emit(data.roomId, {
          type: 'message:read',
          messageIds: data.messageIds,
        });
      });
    } catch (error) {
      logger.error('ChatService', 'Erro ao configurar listeners', error as Error);
    }
  }

  joinRoom(roomId: string) {
    try {
      logger.info('ChatService', `Entrando na sala ${roomId}`);
      webSocketService.emit('chat:join-room', { roomId });
    } catch (error) {
      logger.error('ChatService', 'Erro ao entrar na sala', error as Error);
    }
  }

  leaveRoom(roomId: string) {
    try {
      logger.info('ChatService', `Saindo da sala ${roomId}`);
      webSocketService.emit('chat:leave-room', { roomId });
      this.removeAllListeners(roomId);
    } catch (error) {
      logger.error('ChatService', 'Erro ao sair da sala', error as Error);
    }
  }

  setTyping(roomId: string, isTyping: boolean) {
    try {
      webSocketService.emit('chat:typing', { roomId, isTyping });
    } catch (error) {
      logger.debug('ChatService', 'Erro ao enviar status de digitação', error as Error);
    }
  }

  // Local Event Emitter
  on(roomId: string, callback: Function) {
    if (!this.listeners.has(roomId)) {
      this.listeners.set(roomId, new Set());
    }
    this.listeners.get(roomId)!.add(callback);

    return () => {
      this.listeners.get(roomId)?.delete(callback);
    };
  }

  emit(roomId: string, event: any) {
    const callbacks = this.listeners.get(roomId);
    if (callbacks) {
      callbacks.forEach((cb) => cb(event));
    }
  }

  removeAllListeners(roomId: string) {
    this.listeners.delete(roomId);
  }
}

export default new ChatService();
