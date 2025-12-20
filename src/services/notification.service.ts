import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

/**
 * Configurar handler de notificações
 * Define como as notificações devem se comportar quando o app está em foreground
 */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true, // Mostrar alerta quando app está aberto
      shouldPlaySound: true, // Tocar som
      shouldSetBadge: true, // Atualizar badge do ícone
      shouldShowBanner: true, // Mostrar banner (iOS 14+)
      shouldShowList: true, // Mostrar na lista de notificações
    }),
  });
}

/**
 * Configurar canais de notificação para Android
 * Necessário para Android 8.0+
 */
export async function setupNotificationChannels() {
  if (Platform.OS === "android") {
    // Canal padrão
    await Notifications.setNotificationChannelAsync("default", {
      name: "Notificações Gerais",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00E096",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });

    // Canal para entregas urgentes
    await Notifications.setNotificationChannelAsync("urgent_delivery", {
      name: "Entregas Urgentes",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF0000",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: "default",
    });

    // Canal para mensagens do chat
    await Notifications.setNotificationChannelAsync("messages", {
      name: "Mensagens",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00E096",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
      sound: "default",
    });

    // Canal para atualizações de status
    await Notifications.setNotificationChannelAsync("status_updates", {
      name: "Atualizações de Status",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00E096",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }
}

/**
 * Solicitar permissões de notificação
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    // Verificar se é um dispositivo físico
    if (!Device.isDevice) {
      console.warn("Notificações push não funcionam em emulador/simulador");
      return false;
    }

    // Verificar permissão atual
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // Se não tiver permissão, solicitar
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowDisplayInCarPlay: true,
          allowCriticalAlerts: true,
          provideAppNotificationSettings: true,
        },
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Permissão de notificação negada");
      return false;
    }

    // Configurar canais se for Android
    await setupNotificationChannels();

    return true;
  } catch (error) {
    console.error("Erro ao solicitar permissões de notificação:", error);
    return false;
  }
}

/**
 * Obter token de push do dispositivo
 */
export async function getPushToken(projectId: string): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn("Não é possível obter push token em emulador/simulador");
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    return token.data;
  } catch (error) {
    console.error("Erro ao obter push token:", error);
    return null;
  }
}

/**
 * Enviar notificação local (teste)
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any,
  channelId: string = "default"
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Enviar imediatamente
    });
  } catch (error) {
    console.error("Erro ao enviar notificação local:", error);
  }
}

/**
 * Limpar todas as notificações
 */
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error("Erro ao limpar notificações:", error);
  }
}

/**
 * Obter badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error("Erro ao obter badge count:", error);
    return 0;
  }
}

/**
 * Definir badge count
 */
export async function setBadgeCount(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error("Erro ao definir badge count:", error);
  }
}

/**
 * Tipos de notificações do app
 */
export enum NotificationType {
  NEW_ORDER = "new_order",
  ORDER_ACCEPTED = "order_accepted",
  ORDER_IN_PROGRESS = "order_in_progress",
  ORDER_DELIVERED = "order_delivered",
  ORDER_CANCELLED = "order_cancelled",
  NEW_MESSAGE = "new_message",
  DRIVER_NEARBY = "driver_nearby",
  PAYMENT_RECEIVED = "payment_received",
}

/**
 * Interface para dados de notificação
 */
export interface NotificationData {
  type: NotificationType;
  orderId?: string;
  userId?: string;
  message?: string;
  [key: string]: any;
}
