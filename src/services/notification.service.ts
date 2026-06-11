import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import apiClient from './api';
import { logger } from '@/utils/logger';

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

      // Configure Android Notification Channels
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('urgent_delivery', {
          name: 'Chamados Urgentes',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Mensagens de Chat',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('status_updates', {
          name: 'Atualizações de Status',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('default', {
          name: 'Padrão',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      // Solicitar permissão para exibir notificações locais
      try {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted') {
          const newPermission = await Notifications.requestPermissionsAsync();
          if (newPermission.status !== 'granted') {
            logger.warn('NotificationService', 'Permissão de notificação local não concedida');
          }
        }
      } catch (permErr) {
        logger.error('NotificationService', 'Erro ao solicitar permissão de notificações', permErr as Error);
      }

      // Listeners de notificações
      this.setupNotificationListeners();

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
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const token = await Notifications.getExpoPushTokenAsync({ projectId });
      return token.data;
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      const isTransient = msg.includes('FIS_AUTH_ERROR') || msg.includes('SERVICE_NOT_AVAILABLE');

      if (isTransient && attempt < MAX_RETRIES) {
        // Retry silently after a short backoff
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }

      // Only log as warning for known Firebase transient errors
      if (isTransient) {
        logger.warn('NotificationService', 'Push token indisponível (Firebase transient). Notificações push desativadas nesta sessão.');
      } else {
        logger.error('NotificationService', 'Error getting push token:', e as Error);
      }
      return null;
    }
  }
  return null;
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
