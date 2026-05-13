import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import apiClient from './api';
import { logger } from '@/utils/logger';
import webSocketService from './websocket.service';

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  async initialize() {
    try {
      logger.info('NotificationService', 'Inicializando serviço de notificações');

      // Set notification handler
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          logger.info('NotificationService', 'Notificação recebida', {
            title: notification.request.content.title,
          });
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          } as any;
        },
      });

      // Registrar para notificações push
      if (Device.isDevice) {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted') {
          const newPermission = await Notifications.requestPermissionsAsync();
          if (newPermission.status !== 'granted') {
            logger.warn('NotificationService', 'Permissão de notificação não concedida');
            return;
          }
        }

        // Obter Expo Push Token
        const projectId =
          (Constants.expoConfig as any)?.extra?.eas?.projectId ||
          (Constants.expoConfig as any)?.projectId;
        if (projectId) {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          this.expoPushToken = token.data;
          logger.info(
            'NotificationService',
            'Expo Push Token obtido',
            { token: token.data.substring(0, 20) + '...' }
          );

          // Enviar token para o backend
          await this.registerPushToken(token.data);
        }
      }

      // Listeners de notificações
      this.setupNotificationListeners();
      this.setupWebSocketListeners();

      logger.info('NotificationService', 'Serviço de notificações inicializado');
    } catch (error) {
      logger.error(
        'NotificationService',
        'Erro ao inicializar serviço de notificações',
        error as Error
      );
    }
  }

  private setupNotificationListeners() {
    // Quando notificação é recebida enquanto o app está em foreground
    this.notificationReceivedSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        logger.debug('NotificationService', 'Notificação em foreground', {
          title: notification.request.content.title,
        });
        this.emit('notification:received', notification);
      });

    // Quando usuário toca na notificação
    this.notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        logger.info('NotificationService', 'Notificação tocada', {
          title: response.notification.request.content.title,
        });
        this.emit('notification:tapped', response.notification);
      });
  }

  private setupWebSocketListeners() {
    webSocketService.on('notification:send', (data) => {
      logger.info('NotificationService', 'Notificação via WebSocket', {
        title: data.title,
      });
      this.emit('notification:received', {
        request: {
          content: {
            title: data.title,
            body: data.body,
            data: data.data,
          },
        },
      });
    });
  }

  private async registerPushToken(token: string) {
    try {
      logger.info('NotificationService', 'Registrando push token no backend');
      await apiClient.post('/notifications/register-token', {
        token,
        deviceType: Device.osName,
      });
      logger.info('NotificationService', 'Push token registrado com sucesso');
    } catch (error) {
      logger.error('NotificationService', 'Erro ao registrar push token', error as Error);
    }
  }

  async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    delay = 0
  ) {
    try {
      logger.info('NotificationService', 'Enviando notificação local', { title });
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: delay > 0 ? ({ seconds: Math.ceil(delay / 1000) } as any) : null,
      });
    } catch (error) {
      logger.error(
        'NotificationService',
        'Erro ao enviar notificação local',
        error as Error
      );
    }
  }

  async getNotifications(limit = 50, offset = 0): Promise<PushNotification[]> {
    try {
      logger.info('NotificationService', 'Buscando notificações');
      const response = await apiClient.get('/notifications', {
        params: { limit, offset },
      });
      return response.data?.notifications || [];
    } catch (error) {
      logger.error('NotificationService', 'Erro ao buscar notificações', error as Error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`);
    } catch (error) {
      logger.error('NotificationService', 'Erro ao marcar notificação como lida', error as Error);
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      logger.error('NotificationService', 'Erro ao deletar notificação', error as Error);
    }
  }

  // Event Emitter
  private notificationReceivedSubscription: any;
  private notificationResponseSubscription: any;

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  cleanup() {
    if (this.notificationReceivedSubscription) {
      this.notificationReceivedSubscription.remove();
    }
    if (this.notificationResponseSubscription) {
      this.notificationResponseSubscription.remove();
    }
    this.listeners.clear();
  }
}

// Module level function helpers for direct usage (compat layer)
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
}

export async function getPushToken(projectId: string): Promise<string | null> {
  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (e) {
    logger.error('NotificationService', 'Error getting push token:', e as Error);
    return null;
  }
}

export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    } as any),
  });
}

export default new NotificationService();
