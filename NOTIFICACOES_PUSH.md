# 🔔 Sistema de Notificações Push - Leva+

## 📋 Visão Geral

Implementação completa do sistema de notificações push usando `expo-notifications` com suporte total para:

- ✅ App fechado
- ✅ App aberto (foreground)
- ✅ Dispositivo com tela desligada
- ✅ Dispositivo em modo de proteção/bloqueio
- ✅ Popups na tela
- ✅ Badge de contagem no ícone
- ✅ Sons e vibrações customizados

---

## 🚀 Implementação Realizada

### 1. **Tela de Permissão de Notificações**

**Localização:** `src/screens/(public)/NotificationPermissionScreen/index.tsx`

**Características:**

- Interface amigável e informativa
- Explicação dos benefícios das notificações
- Opção de ativar ou pular
- Integração com o fluxo de cadastro
- Tratamento de erros e dispositivos não suportados

**Quando aparece:**

- Após o usuário completar o cadastro (Step 3)
- Antes de entrar no app pela primeira vez

---

### 2. **Serviço de Notificações**

**Localização:** `src/services/notification.service.ts`

**Funções Disponíveis:**

#### `setupNotificationHandler()`

Configura como as notificações se comportam quando o app está aberto:

```typescript
setupNotificationHandler();
```

#### `setupNotificationChannels()`

Cria canais de notificação para Android (obrigatório para Android 8.0+):

- **default**: Notificações gerais
- **urgent_delivery**: Entregas urgentes (prioridade máxima)
- **messages**: Mensagens do chat
- **status_updates**: Atualizações de status

#### `requestNotificationPermissions()`

Solicita todas as permissões necessárias:

```typescript
const granted = await requestNotificationPermissions();
```

**Permissões iOS:**

- `allowAlert`: Mostrar alertas
- `allowBadge`: Badge no ícone
- `allowSound`: Tocar sons
- `allowDisplayInCarPlay`: Mostrar no CarPlay
- `allowCriticalAlerts`: Alertas críticos (podem tocar mesmo no silencioso)
- `provideAppNotificationSettings`: Link para configurações do app

**Permissões Android:**

- `allowAlert`: Mostrar alertas
- `allowBadge`: Badge no ícone
- `allowSound`: Tocar sons

#### `getPushToken(projectId)`

Obtém o token único do dispositivo para enviar notificações:

```typescript
const token = await getPushToken("seu-project-id");
```

#### `sendLocalNotification()`

Envia notificação local para testes:

```typescript
await sendLocalNotification(
  "Novo pedido!",
  "Você tem um novo pedido de entrega",
  { orderId: "123" },
  "urgent_delivery"
);
```

#### Outras funções:

- `clearAllNotifications()`: Limpa todas as notificações
- `getBadgeCount()`: Obtém contagem do badge
- `setBadgeCount(count)`: Define contagem do badge

---

### 3. **Canais de Notificação (Android)**

Cada canal tem configurações específicas para diferentes tipos de notificações:

#### Canal: `default`

- **Nome:** Notificações Gerais
- **Importância:** MAX
- **Vibração:** [0, 250, 250, 250]
- **Luz:** Verde (#00E096)
- **Tela de bloqueio:** Pública
- **Bypass DND:** Sim

#### Canal: `urgent_delivery`

- **Nome:** Entregas Urgentes
- **Importância:** MAX
- **Vibração:** [0, 250, 250, 250]
- **Luz:** Vermelha (#FF0000)
- **Tela de bloqueio:** Pública
- **Bypass DND:** Sim
- **Som:** Padrão

#### Canal: `messages`

- **Nome:** Mensagens
- **Importância:** HIGH
- **Tela de bloqueio:** Pública
- **Som:** Padrão

#### Canal: `status_updates`

- **Nome:** Atualizações de Status
- **Importância:** DEFAULT

---

## ⚙️ Configurações Necessárias

### 1. **app.json**

O arquivo já foi configurado com:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/icon.png",
        "color": "#00E096",
        "sounds": [],
        "mode": "production"
      }
    ]
  ],
  "extra": {
    "eas": {
      "projectId": "seu-project-id-aqui"
    }
  }
}
```

### 2. **Obter Project ID**

Para usar notificações push, você precisa do Project ID do Expo:

```bash
# 1. Criar conta no Expo (se não tiver)
npx expo login

# 2. Criar projeto no Expo
npx eas init

# 3. O projectId será adicionado automaticamente ao app.json
```

### 3. **Configurar Credenciais**

#### Para Android:

```bash
npx eas credentials
```

#### Para iOS:

```bash
npx eas credentials
```

---

## 📱 Fluxo de Usuário

```
1. Usuário completa cadastro (Step1, Step2, Step3)
   ↓
2. Backend cria usuário e retorna token
   ↓
3. App atualiza Zustand store com dados do usuário
   ↓
4. Navega para NotificationPermissionScreen
   ↓
5. Usuário vê benefícios e decide:
   │
   ├─ ATIVAR → Solicita permissões → Obtém push token → Salva no backend
   │   ↓
   │   App redireciona para tela principal
   │
   └─ PULAR → App redireciona para tela principal
       (Pode ativar depois nas configurações)
```

---

## 🔧 Próximos Passos (TODO)

### 1. **Backend - Salvar Push Token**

Criar endpoint para salvar o push token do usuário:

```typescript
// Backend endpoint
POST /api/users/:userId/push-token
Body: { pushToken: string }
```

### 2. **Backend - Enviar Notificações**

Implementar função para enviar notificações usando Expo Push API:

```javascript
const { Expo } = require("expo-server-sdk");
const expo = new Expo();

async function sendPushNotification(userPushToken, title, body, data) {
  const messages = [
    {
      to: userPushToken,
      sound: "default",
      title: title,
      body: body,
      data: data,
      channelId: "default", // Android
      priority: "high",
    },
  ];

  const chunks = expo.chunkPushNotifications(messages);
  const tickets = [];

  for (let chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }

  return tickets;
}
```

### 3. **App - Listeners de Notificações**

Adicionar listeners para quando o usuário toca na notificação:

```typescript
// No App.tsx ou componente raiz
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

useEffect(() => {
  // Listener para quando app está em foreground
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notificação recebida:", notification);
    }
  );

  // Listener para quando usuário toca na notificação
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;

      // Navegar para tela específica baseado no tipo
      if (data.type === "new_order") {
        navigation.navigate("OrderDetails", { orderId: data.orderId });
      }
    });

  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

### 4. **Eventos para Enviar Notificações**

**Cliente:**

- Entregador aceitou pedido
- Entregador está a caminho
- Entrega concluída
- Nova mensagem do entregador

**Entregador:**

- Novo pedido disponível
- Pedido cancelado
- Nova mensagem do cliente
- Pagamento recebido

---

## 🧪 Como Testar

### Teste Local (sem backend)

```typescript
import { sendLocalNotification } from "./services/notification.service";

// Enviar notificação de teste
await sendLocalNotification(
  "Teste",
  "Esta é uma notificação de teste",
  { test: true },
  "default"
);
```

### Teste com Expo Push Tool

1. Obter seu push token
2. Acessar https://expo.dev/notifications
3. Colar o token e enviar notificação de teste

---

## 📊 Tipos de Notificação Disponíveis

```typescript
enum NotificationType {
  NEW_ORDER = "new_order",
  ORDER_ACCEPTED = "order_accepted",
  ORDER_IN_PROGRESS = "order_in_progress",
  ORDER_DELIVERED = "order_delivered",
  ORDER_CANCELLED = "order_cancelled",
  NEW_MESSAGE = "new_message",
  DRIVER_NEARBY = "driver_nearby",
  PAYMENT_RECEIVED = "payment_received",
}
```

---

## 🎨 Customização

### Alterar cor da notificação (Android):

```typescript
await Notifications.setNotificationChannelAsync("custom", {
  lightColor: "#FF0000", // Sua cor
});
```

### Alterar som:

1. Adicionar arquivo de som em `assets/sounds/`
2. Configurar no app.json:

```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "sounds": ["./assets/sounds/notification.wav"]
      }
    ]
  ]
}
```

---

## 🔒 Segurança e Privacidade

- ✅ Push tokens são únicos por dispositivo
- ✅ Tokens devem ser armazenados de forma segura no backend
- ✅ Usuário pode revogar permissões a qualquer momento
- ✅ Notificações respeitam configurações do sistema
- ✅ Dados sensíveis não devem ser enviados no corpo da notificação

---

## 📚 Documentação Adicional

- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Android Notification Channels](https://developer.android.com/training/notify-user/channels)
- [iOS Notification Permissions](https://developer.apple.com/documentation/usernotifications)

---

**Data:** 19 de dezembro de 2025  
**Status:** ✅ Implementação concluída  
**Aguardando:** Configuração do Project ID e integração com backend
