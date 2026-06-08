# 01 — Visão Geral

## O que é o Leva Mais

Leva Mais é um aplicativo de **mobilidade urbana e logística** que conecta clientes a motoristas autônomos para dois serviços:

| Serviço | `serviceType` | Veículos permitidos |
|---------|---------------|---------------------|
| **Corrida** (transporte de pessoas) | `ride` | carro (economy/comfort/luxury), moto |
| **Entrega** (encomendas e fretes) | `delivery` | moto, carro, van, caminhão |

Referências de mercado: Uber, 99, InDriver, Lalamove, iFood (logística).

---

## Stack Técnico

### Frontend
| Camada | Tecnologia |
|--------|-----------|
| Framework | React Native + Expo (SDK 52+) |
| Linguagem | TypeScript |
| Navegação | React Navigation (Stack + Drawer) |
| Estilização | NativeWind (Tailwind CSS) |
| Mapas | React Native Maps |
| Ícones | Lucide React Native (única lib de ícones) |
| WebSocket | Socket.IO Client |
| HTTP | Axios (via `src/services/api.ts`) |

### Backend
| Camada | Tecnologia |
|--------|-----------|
| Framework | Node.js + Express |
| Banco de Dados | MongoDB (Mongoose) |
| Autenticação | JWT (Bearer token) |
| WebSocket | Socket.IO |
| Pagamentos | Gateway interno + PIX mock |
| Push Notifications | Expo Push Notifications |
| Mapas/Rotas | Google Maps Distance Matrix API |

### Configuração de Rede
```
EXPO_PUBLIC_API_URL=http://192.168.1.7:3005
Backend porta: 3005
WebSocket: mesma URL base
```

---

## Modelo de Dados Principal

### Documento `Ride` (MongoDB)
Único modelo para corridas e entregas. Campos-chave:

```
Ride {
  serviceType: "ride" | "delivery"
  vehicleType: "motorcycle" | "car" | "van" | "truck"
  rideCategory: "moto" | "car_economy" | "car_comfort" | "car_luxury"  // só para corridas
  status: [ver máquina de estados abaixo]
  clientId → User
  driverId → User (null até ser atribuído)
  pickup: { address, latitude, longitude }
  dropoff: { address, latitude, longitude }
  stops: []  // paradas intermediárias
  pricing: { basePrice, distancePrice, platformFee, driverValue, total }
  payment: { method, status, escrow }
  negotiation: { enabled, clientOffer, offers[], finalAgreedPrice, selectedDriverId }
  details: { cargoSize, needsHelper, recipientName, recipientPhone, deliveryPin, ... }
  proofs: { pickupPhoto, deliveryPhoto, pickupPinValidated, deliveryPinValidated }
  rating: { clientRating, driverRating }
  cancellationFee: { amount, by, driverShare, platformShare }
}
```

### Máquina de Estados do Ride

```
                 ┌─────────────────────────────────────────────────┐
                 │                                                 │
requesting ──→ driver_assigned ──→ accepted ──→ driver_arriving   │
    │                │                │              │            │
    │                │                │          arrived          │
    │                │                │              │            │
    │                └────────────────┴──→      in_progress ──→ completed
    │                                                │
    │                                           delivery_failed
    │
    └──→ cancelled_by_client
         cancelled_by_driver
         cancelled_no_driver

Nota: "payment_pending" existe no modelo mas NÃO é usado ativamente no código.
```

### Documento `User` (MongoDB)
Único modelo para clientes, motoristas e admins (`userType`).

**Campos do cliente:**
```
wallet: { balance, held, transactions[] }
pendingDebt: Number           // taxa de cancelamento pendente
paymentMethods: []            // cartões cadastrados
favoriteAddresses: []
```

**Campos do motorista:**
```
driverBalance: { balance, transactions[] }
driverStatus: "pending" | "approved" | "rejected" | "blocked" | "suspended"
vehicles: []
driverPreferences: { serviceTypes, selectedVehicles, searchRadiusKm, autoAccept, acceptsCash, acceptsPix }
onlineStats: { isOnline, totalSecondsToday }
```

---

## Arquitetura de Comunicação

### REST API
Todas as rotas exigem JWT (`Authorization: Bearer <token>`), exceto rotas públicas de auth.

Base URL: `http://<IP>:3005/api`

Grupos de rotas:
- `/auth` — autenticação, perfil, carteira cliente, métodos de pagamento
- `/rides` — todo o ciclo de vida de corridas e entregas
- `/driver` — saldo motorista, preferências, veículos
- `/wallet` — depósitos, saques
- `/payments` — PIX
- `/cities` — cidades atendidas
- `/promotions` — cupons de desconto

### WebSocket (Socket.IO)
Conexão mantida durante uso ativo. Salas:
- `client-<userId>` — eventos para o cliente
- `driver-<userId>` — eventos para o motorista

Eventos principais: ver [15-websocket-eventos.md](./15-websocket-eventos.md)

---

## Papéis de Usuário

| Papel | `userType` | Pode fazer |
|-------|-----------|-----------|
| **Cliente** | `client` | Solicitar corridas/entregas, pagar, avaliar |
| **Motorista** | `driver` | Aceitar pedidos, executar, receber pagamento |
| **Admin** | `admin` | Gerenciar usuários, config de plataforma, saques |

---

## Serviços de Precificação

| Serviço | Arquivo |
|---------|---------|
| Entrega | `backend/src/services/delivery-pricing.service.js` |
| Corrida | `backend/src/services/ride-pricing.service.js` |
| Engine de multiplicadores | `backend/src/services/pricing-engine.js` |
| Surge pricing | `backend/src/services/surge-pricing.service.js` |
| Configuração em tempo real | `backend/src/services/platformConfig.service.js` |

---

## Diretórios Importantes

```
Leva_Mais/
├── src/                          # App React Native
│   ├── screens/
│   │   ├── (public)/             # Login, cadastro, onboarding
│   │   └── (authenticated)/
│   │       ├── Client/           # Todas as telas do cliente
│   │       └── Driver/           # Todas as telas do motorista
│   ├── routes/                   # Navegação
│   ├── services/                 # api.ts, websocket.service.ts, ride.service.ts
│   └── contexts/                 # AuthContext, etc.
├── backend/
│   ├── src/
│   │   ├── controllers/          # ride.controller.js (principal), auth, driver, chat
│   │   ├── models/               # Ride.js, User.js, etc.
│   │   ├── services/             # pricing, escrow, push notifications
│   │   └── routes/               # Express routers
│   └── server.js
└── docs/                         # Esta documentação
```
