# 15 — WebSocket: Eventos em Tempo Real

## Conexão

```
URL: http://192.168.1.7:3005
Namespace: /  (raiz)
Auth: { token: "<JWT>" }
```

Entrar nas salas após conectar:
```js
socket.emit("join-client-room", { userId })   // cliente
socket.emit("join-driver-room", { userId })   // motorista
```

Salas:
```
client-<userId>
driver-<userId>
```

---

## Eventos do CLIENTE para o SERVIDOR

| Evento | Payload | Descrição |
|--------|---------|-----------|
| `join-client-room` | `{ userId }` | Entra na sala do cliente |
| `send-message` | `{ rideId, message, senderType }` | Envia mensagem no chat |
| `driver-location-update` | `{ latitude, longitude, rideId }` | (motorista envia) GPS |
| `heartbeat` | `{ userId }` | Mantém conexão ativa + atualiza lastSeenAt |

---

## Eventos do SERVIDOR para o CLIENTE

| Evento | Quando é emitido | Payload |
|--------|-----------------|---------|
| `driver-found` | Motorista aceitou a corrida (preço fixo) | `{ rideId, driverId, driverName, driverPhoto, vehicleInfo, eta }` |
| `delivery-accepted` | Cliente selecionou uma oferta e motorista foi confirmado | `{ rideId, driverId, ... }` |
| `ride-status-updated` | Qualquer mudança de status | `{ rideId, status, timestamp }` |
| `driver-location-updated` | GPS do motorista atualizado | `{ rideId, latitude, longitude, speed? }` |
| `new-message` | Motorista enviou mensagem no chat | `{ rideId, senderId, senderType, message, timestamp }` |
| `new-offer` | Motorista enviou oferta no marketplace | `{ rideId, offer: { driverId, amount, eta, distance, ... } }` |
| `offer-updated` | Motorista atualizou oferta | `{ rideId, offerId, amount }` |
| `balance_updated` | Saldo LevaPay mudou | `{ balance, held, lastTransaction }` |
| `ride-cancelled` | Corrida cancelada | `{ rideId, by, reason, refundAmount? }` |
| `delivery-completed` | Entrega concluída | `{ rideId }` |
| `no-driver-found` | Timeout sem motorista | `{ rideId }` |
| `driver-arrived` | Motorista chegou ao local de coleta | `{ rideId }` |

---

## Eventos do SERVIDOR para o MOTORISTA

| Evento | Quando é emitido | Payload |
|--------|-----------------|---------|
| `new-ride-request` | Novo pedido de corrida (preço fixo) disponível | `{ rideId, clientName, pickup, dropoff, total, vehicleType }` |
| `new-delivery-available` | Novo pedido de entrega disponível | `{ rideId, pickup, dropoff, vehicleType, clientOffer, cargoSize }` |
| `offer-selected` | Cliente selecionou a oferta do motorista | `{ rideId, finalPrice, clientName, clientPhone }` |
| `offer-declined` | Cliente recusou a oferta | `{ rideId }` |
| `client-counter-offer` | Cliente fez contra-oferta | `{ rideId, clientOffer }` |
| `ride-status-updated` | Status mudou (ex: cliente cancelou) | `{ rideId, status }` |
| `new-message` | Cliente enviou mensagem | `{ rideId, senderId, message, timestamp }` |
| `balance_updated` | Saldo motorista atualizado (após corrida) | `{ balance, lastTransaction }` |
| `ride-cancelled-by-client` | Cliente cancelou | `{ rideId, cancellationFee }` |

---

## Fluxo de Eventos — Corrida Completa

### Entrega com LevaPay

```
[Cliente cria pedido]
    ↓ POST /rides → Ride criado, status: "requesting"
    
[Motoristas recebem] ← server → driver: "new-delivery-available"
    
[Motorista faz oferta] → POST /rides/:id/offers/respond
    ↓ server → client: "new-offer"
    
[Cliente vê no marketplace]
    
[Cliente seleciona oferta] → POST /rides/:id/offers/select
    ↓ escrow reservado
    ↓ status: "accepted"
    ↓ server → driver: "offer-selected"
    ↓ server → client: "delivery-accepted"
    
[Motorista vai ao ponto de coleta]
    ↓ GPS atualizado a cada ~5s
    ↓ server → client: "driver-location-updated"
    
[Motorista chega] → PATCH /rides/:id/status { status: "arrived" }
    ↓ server → client: "ride-status-updated" { status: "arrived" }
    ↓ server → client: "driver-arrived"
    
[Motorista coleta + valida PIN + foto]
    ↓ POST /rides/:id/proof/pickup
    ↓ POST /rides/:id/validate-pin { phase: "pickup" }
    
[Motorista inicia entrega] → PATCH status: "in_progress"
    ↓ server → client: "ride-status-updated"
    
[Motorista chega ao destino]
    ↓ POST /rides/:id/proof/delivery
    ↓ POST /rides/:id/validate-pin { phase: "delivery" }
    
[Motorista finaliza] → PATCH status: "completed"
    ↓ escrow liberado
    ↓ taxa debitada do driverBalance
    ↓ server → client: "delivery-completed"
    ↓ server → client: "balance_updated" (se wallet)
    ↓ server → driver: "balance_updated"
    
[Avaliações] → POST /rides/:id/rate-driver
               POST /rides/:id/rate-client
```

---

## Reconexão

O cliente WebSocket tenta reconectar automaticamente com backoff exponencial:
```
1s → 2s → 4s → 8s → 16s → 30s (máximo)
```

Ao reconectar:
1. Reentra nas salas (`join-client-room` / `join-driver-room`)
2. Faz poll do estado atual via REST (`GET /rides/active`)
3. Reconcilia estado local com o servidor

---

## Heartbeat e Localização do Motorista

Motorista online envia localização periodicamente:
```js
// A cada ~5 segundos quando em corrida ativa
socket.emit("driver-location-update", {
  latitude: -23.5505,
  longitude: -46.6333,
  rideId: "...",
  speed: 42  // km/h
})
```

Sem corrida ativa (apenas online):
```js
// A cada ~30 segundos (para cálculo de ETA no marketplace)
PATCH /api/auth/location { latitude, longitude }
```

---

## Notificações Push (Fallback)

Quando o WebSocket não está conectado (app em background):
- Expo Push Notifications entrega a mensagem
- Ao reabrir o app, o evento de push abre a tela correta
- Casos cobertos:
  - Nova corrida disponível
  - Oferta selecionada pelo cliente
  - Corrida cancelada
  - Nova mensagem no chat
  - Saldo atualizado
  - Status de saque atualizado
