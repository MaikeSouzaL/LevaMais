# Etapa 5B — Motorista Aprovado: DriverBoot → DriverHomeScreen

## O que acontece

Quando `userType === "driver"` E `driverStatus === "approved"`.

## Arquivo

`src/routes/DriverBoot.tsx`

## Passo a passo

```
1. driverStatus === "approved" → verifica ride ativa
2. rideService.getActive() → se tem corrida ativa → inicialRideId
3. <DrawerDriverRoutes initialRideId={...} />
```

## DrawerDriverRoutes

Arquivo: `src/routes/drawer.driver.routes.tsx`

- 14 itens de menu para motoristas aprovados
- Se `initialRideId` existe → inicia em "DriverRide"
- Se não → inicia em "DriverHome"
- Motoristas NÃO aprovados têm apenas 5 itens visíveis

## DriverHomeScreen — Inicialização

Arquivo: `src/screens/(authenticated)/Driver/DriverHomeScreen.tsx`

### Ordem de inicialização:

```
1. useFocusEffect → sincroniza perfil (userService.getProfile)
2. useFocusEffect → verifica corrida ativa (rideService.getActive)
3. useEffect → AppState listener (retorno do background)
4. useEffect → permissão GPS + região inicial do mapa
5. useEffect → sync status online com backend (driverLocationService.getMe)
6. useEffect → carrega saldo (driverService.getBalance)
7. useEffect → auto-ativa veículo (listVehicles + activateVehicle)
8. useEffect → tour guiado (@leva_mais:driver_tour_seen)
9. useEffect → WebSocket listeners + polling (quando online)
```

### Estados da tela:

| Estado | Condição | UI |
|---|---|---|
| **Offline** | `online === false` | Mapa + BottomSheet com "Conectar" |
| **Online** | `online === true` | Mapa + "Buscando" pulsando + localização |
| **Com chamada** | `incomingRequest !== null` | NewIncomingOfferSheet (aceitar/recusar) |
| **Com banner** | `showPendingBanner === true` | Banner "Chamado Ativo Pendente" |
| **Com fila** | `waitingQueueCount > 0` | Banner "FILA DE ESPERA" |

### Ficar Online — `toggleOnline()`

```
1. Verifica se tem ≥ 1 tipo de serviço ativo
2. Verifica saldo > 0
3. driverService.goOnline() → POST /drivers/go-online
   → Backend valida: docs, veículo, saldo, driverStatus
4. Se OK:
   a) WebSocket.connect()
   b) publishDriverLocation() a cada X segundos
   c) Escuta "new-ride-request"
   d) Polling syncAvailableRequests() a cada 6s
```

## Polling de Chamadas — `syncAvailableRequests()`

A cada 6 segundos quando online:

```
1. rideService.getActive() → se tem corrida ativa → navega DriverRide
2. rideService.getAvailableRequests() → lista de pedidos pendentes
3. Filtra:
   - Remove fila de espera (isWaitingInQueue)
   - Remove pedidos onde motorista já fez oferta
4. Se tem pedido novo → showIncomingRideRequest() → abre IncomingOfferSheet
5. Se não tem pedidos mas tem negociações → redireciona DriverRequests
```

## WebSocket Events (quando online)

| Evento | O que faz |
|---|---|
| `"new-ride-request"` | Abre IncomingOfferSheet com som/vibração |
| `"ride-taken"` | Remove chamada (outro motorista pegou) |
| `"ride-cancelled"` | Remove chamada + modal "Pedido Cancelado" |
| `"ride-status-changed"` | Atualiza status da chamada atual |
| `"client-counter-proposal"` | Som + navega para negociação |
| `"client-selected-offer-awaiting-payment"` | Toast + navega para negociação |
| `"delivery-selection-expired"` | Libera motorista, sync available |

## DriverRideScreen — Quando em Corrida

Arquivo: `src/screens/(authenticated)/Driver/DriverRideScreen.tsx`

### Fluxo de status:
```
accepted → driver_arriving (automático) → arrived (botão) → in_progress (botão) → completed (botão)
```

### O que mostra:
- Mapa com rota em tempo real
- DriverStatusCard com botões de ação
- ETA, distância, velocidade
- PIN de segurança (delivery)
- Foto de coleta/entrega (delivery)
- Chat com cliente
- Cancelamento com motivo
