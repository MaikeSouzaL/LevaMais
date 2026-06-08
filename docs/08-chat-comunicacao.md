# 08 — Chat e Comunicação em Tempo Real

## Visão Geral

Cliente e motorista podem trocar mensagens de texto durante a execução da corrida/entrega. O chat é bidirecional, em tempo real via WebSocket, com histórico persistido no banco.

---

## Telas

| Papel | Tela |
|-------|------|
| Cliente | `ChatScreen` (`src/screens/(authenticated)/Client/Ride/Tracking/Chat/`) |
| Motorista | `DriverChatScreen` (`src/screens/(authenticated)/Driver/DriverChatScreen.tsx`) |

Ambas são praticamente idênticas em funcionalidade.

---

## Como Acessar

### Cliente
- Botão **"Chat"** na tela `DeliveryTracking` ou `RideTracking`
- Badge com contador de mensagens não lidas
- Parâmetros de navegação: `{ rideId, driverName? }`

### Motorista
- Ícone de chat no HUD durante execução
- Notificação push quando cliente envia mensagem

---

## Arquitetura WebSocket

### Salas (Rooms)
```
client-<userId>   → eventos para o cliente
driver-<userId>   → eventos para o motorista
```

### Evento: enviar mensagem
```json
// Cliente envia via socket
{
  "event": "send-message",
  "data": {
    "rideId": "...",
    "message": "Estou na portaria, pode subir",
    "senderType": "client"
  }
}
```

### Evento: receber mensagem
```json
// Ambos recebem via socket
{
  "event": "new-message",
  "data": {
    "rideId": "...",
    "senderId": "...",
    "senderType": "client" | "driver",
    "message": "Ok, já estou descendo",
    "timestamp": "2026-06-08T10:15:00Z"
  }
}
```

---

## Persistência das Mensagens

### Modelo `ChatMessage`
```js
{
  rideId: ObjectId,
  senderId: ObjectId,
  senderType: "client" | "driver",
  message: String,
  createdAt: Date,
  readAt: Date  // quando lida pelo destinatário
}
```

### Buscar histórico
```
GET /api/rides/:rideId/chat
```
Retorna todas as mensagens em ordem cronológica.

Carregado quando o usuário abre a tela de chat (histórico pré-carregado).

---

## Funcionalidades do Chat

### Implementadas
- ✅ Mensagens de texto
- ✅ Indicador de mensagem entregue
- ✅ Histórico completo da sessão
- ✅ Badge de não lidas
- ✅ Notificação push para mensagem recebida

### Planejadas
- ⏳ Mensagens de voz (áudio)
- ⏳ Fotos (câmera ou galeria)
- ⏳ Mensagens pré-definidas (respostas rápidas)
- ⏳ Indicador "digitando..."
- ⏳ Confirmação de leitura (✓✓ azul)

---

## Mensagens Rápidas (Respostas Pré-definidas)

**Comportamento esperado (referência Uber):**

O app deve oferecer botões de resposta rápida para as situações mais comuns:

**Para o cliente:**
- "Vou descer em 2 minutos"
- "Estou na entrada principal"
- "Pode aguardar um momento"
- "Número do apartamento é X"

**Para o motorista:**
- "Chegando em X minutos"
- "Estou no local, não te vejo"
- "Liguei e não atendeu"
- "Pacote coletado com sucesso"

---

## Privacidade e Segurança

- Mensagens só são visíveis durante a corrida/entrega ativa
- Histórico fica disponível por até 30 dias para consulta em disputas
- Após 30 dias → arquivado / anonimizado
- Números de telefone reais não são trocados via chat (prevenção de extorsão)

---

## Notificações Push para Chat

Quando uma mensagem é recebida e o app está em background:
```
Push notification: "João: Estou na portaria"
Ao tocar → abre diretamente o ChatScreen com rideId correto
```

Implementado via `push-notification.service.js` + Expo Push Notifications.
