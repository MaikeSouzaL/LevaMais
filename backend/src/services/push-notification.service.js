const { Expo } = require("expo-server-sdk");

// Criar uma instância do cliente Expo
const expo = new Expo();

/**
 * Enviar notificação push para um único usuário
 * @param {string} pushToken - Token do dispositivo do usuário
 * @param {string} title - Título da notificação
 * @param {string} body - Corpo da notificação
 * @param {object} data - Dados adicionais (opcional)
 * @param {string} channelId - ID do canal (Android) - default, urgent_delivery, messages, status_updates
 * @param {string} sound - Som da notificação - 'default' ou null
 * @param {string} priority - Prioridade - 'default', 'normal', 'high'
 * @returns {Promise<object>} - Resultado do envio
 */
async function sendPushNotification(
  pushToken,
  title,
  body,
  data = {},
  channelId = "default",
  sound = "default",
  priority = "high"
) {
  try {
    // Verificar se o token é válido
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} não é um token Expo válido`);
      return {
        success: false,
        error: "Invalid push token",
      };
    }

    // Criar mensagem
    const message = {
      to: pushToken,
      sound: sound,
      title: title,
      body: body,
      data: data,
      channelId: channelId, // Android
      priority: priority,
      badge: 1, // iOS - incrementa badge
    };

    // Enviar notificação
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    const ticket = ticketChunk[0];

    // Verificar se houve erro
    if (ticket.status === "error") {
      console.error(`Erro ao enviar notificação: ${ticket.message}`);
      return {
        success: false,
        error: ticket.message,
        details: ticket.details,
      };
    }

    console.log(`Notificação enviada com sucesso para ${pushToken}`);
    return {
      success: true,
      ticketId: ticket.id,
    };
  } catch (error) {
    console.error("Erro ao enviar notificação push:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Enviar notificações push para múltiplos usuários
 * @param {Array<string>} pushTokens - Array de tokens dos dispositivos
 * @param {string} title - Título da notificação
 * @param {string} body - Corpo da notificação
 * @param {object} data - Dados adicionais (opcional)
 * @param {string} channelId - ID do canal (Android)
 * @returns {Promise<Array>} - Array com resultados dos envios
 */
async function sendPushNotifications(
  pushTokens,
  title,
  body,
  data = {},
  channelId = "default"
) {
  try {
    // Filtrar tokens válidos
    const validTokens = pushTokens.filter((token) =>
      Expo.isExpoPushToken(token)
    );

    if (validTokens.length === 0) {
      console.warn("Nenhum token válido encontrado");
      return [];
    }

    // Criar mensagens
    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title: title,
      body: body,
      data: data,
      channelId: channelId,
      priority: "high",
      badge: 1,
    }));

    // Dividir em chunks (Expo recomenda no máximo 100 por vez)
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    // Enviar cada chunk
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Erro ao enviar chunk de notificações:", error);
      }
    }

    console.log(`${tickets.length} notificações enviadas`);
    return tickets;
  } catch (error) {
    console.error("Erro ao enviar notificações push em lote:", error);
    return [];
  }
}

/**
 * Verificar status dos recibos de notificações
 * @param {Array<string>} ticketIds - IDs dos tickets de envio
 * @returns {Promise<Array>} - Array com status dos recibos
 */
async function getPushNotificationReceipts(ticketIds) {
  try {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const receipts = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receiptsChunk = await expo.getPushNotificationReceiptsAsync(
          chunk
        );
        receipts.push(receiptsChunk);
      } catch (error) {
        console.error("Erro ao obter recibos:", error);
      }
    }

    return receipts;
  } catch (error) {
    console.error("Erro ao verificar recibos de notificações:", error);
    return [];
  }
}

/**
 * Enviar notificação de novo pedido para entregador
 */
async function sendNewOrderNotification(driverPushToken, orderData) {
  return await sendPushNotification(
    driverPushToken,
    "🚀 Novo pedido disponível!",
    `Entrega de ${orderData.origin} para ${orderData.destination}`,
    {
      type: "new_order",
      orderId: orderData.orderId,
      origin: orderData.origin,
      destination: orderData.destination,
      value: orderData.value,
    },
    "urgent_delivery",
    "default",
    "high"
  );
}

/**
 * Enviar notificação de pedido aceito para cliente
 */
async function sendOrderAcceptedNotification(clientPushToken, orderData) {
  return await sendPushNotification(
    clientPushToken,
    "✅ Pedido aceito!",
    `${orderData.driverName} aceitou sua entrega`,
    {
      type: "order_accepted",
      orderId: orderData.orderId,
      driverId: orderData.driverId,
      driverName: orderData.driverName,
    },
    "status_updates"
  );
}

/**
 * Enviar notificação de pedido em andamento
 */
async function sendOrderInProgressNotification(clientPushToken, orderData) {
  return await sendPushNotification(
    clientPushToken,
    "🚗 Entregador a caminho!",
    `${orderData.driverName} está a caminho da coleta`,
    {
      type: "order_in_progress",
      orderId: orderData.orderId,
      driverId: orderData.driverId,
    },
    "status_updates"
  );
}

/**
 * Enviar notificação de entrega concluída
 */
async function sendOrderDeliveredNotification(clientPushToken, orderData) {
  return await sendPushNotification(
    clientPushToken,
    "🎉 Entrega concluída!",
    "Sua entrega foi finalizada com sucesso",
    {
      type: "order_delivered",
      orderId: orderData.orderId,
    },
    "default"
  );
}

/**
 * Enviar notificação de nova mensagem
 */
async function sendNewMessageNotification(recipientPushToken, messageData) {
  return await sendPushNotification(
    recipientPushToken,
    `💬 ${messageData.senderName}`,
    messageData.message,
    {
      type: "new_message",
      chatId: messageData.chatId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
    },
    "messages"
  );
}

/**
 * Enviar notificação de entregador próximo
 */
async function sendDriverNearbyNotification(clientPushToken, driverData) {
  return await sendPushNotification(
    clientPushToken,
    "📍 Entregador próximo!",
    `${driverData.driverName} está chegando`,
    {
      type: "driver_nearby",
      driverId: driverData.driverId,
      orderId: driverData.orderId,
    },
    "urgent_delivery"
  );
}

module.exports = {
  sendPushNotification,
  sendPushNotifications,
  getPushNotificationReceipts,
  sendNewOrderNotification,
  sendOrderAcceptedNotification,
  sendOrderInProgressNotification,
  sendOrderDeliveredNotification,
  sendNewMessageNotification,
  sendDriverNearbyNotification,
};
