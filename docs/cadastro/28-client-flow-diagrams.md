# 28 - Fluxograma Completo do Cliente - Leva+

**Data:** 2026-05-26  
**Escopo:** Fluxo completo do cliente desde o boot até a finalização de corridas/entregas  
**Inclui:** Diagramas de sequência, payloads de API, estados e transições

---

## 📋 Índice

1. [Visão Geral do Fluxo](#visao-geral)
2. [Diagrama de Boot e Autenticação](#boot-flow)
3. [Fluxo de Corrida (Ride)](#ride-flow)
4. [Fluxo de Entrega (Delivery)](#delivery-flow)
5. [Diagrama de Estados da Corrida](#ride-states)
6. [Payloads de API](#api-payloads)
7. [Eventos WebSocket](#websocket-events)
8. [Hooks e Monitoramento](#hooks-monitoring)

---

## 1. Visão Geral do Fluxo <a name="visao-geral"></a>

```mermaid
graph TB
    A[App Launch] --> B{Autenticado?}
    B -->|Não| C[Auth Routes<br/>Login/Signup]
    B -->|Sim| D{Termos Aceitos?}
    D -->|Não| E[Terms Screen]
    D -->|Sim| F{Tipo de Usuário}
    F -->|Driver| G[Driver Boot]
    F -->|Client| H[Client Boot]
    
    H --> I{Permissão GPS?}
    I -->|Não| J[Location Permission Screen]
    I -->|Sim| K[Detectar Cidade via GPS]
    J -->|Permitir| K
    J -->|Pular| K
    
    K --> L[Buscar Perfil]
    L --> M{KYC Completo?}
    M -->|Não| N[Onboarding Dashboard<br/>CPF + Selfie]
    M -->|Sim| O[Home Screen]
    
    O --> P{Modo Ativo}
    P -->|Corrida| Q[Fluxo de Corrida]
    P -->|Entrega| R[Fluxo de Entrega]
    P -->|Pay| S[Carteira/Pay]
    
    Q --> T[Ride Tracking]
    R --> T
    T --> U[Avaliação + Tip]
```

---

## 2. Diagrama de Boot e Autenticação <a name="boot-flow"></a>

### 2.1 Sequência de Boot do Cliente

```mermaid
sequenceDiagram
    participant App
    participant ClientBoot
    participant LocationService
    participant Backend
    participant AuthStore
    participant CityStore

    App->>ClientBoot: Inicializar
    ClientBoot->>LocationService: checkLocationPermission()
    
    alt Permissão Negada
        LocationService-->>ClientBoot: false
        ClientBoot->>App: Mostrar LocationPermissionScreen
        App->>ClientBoot: onAllow() ou onSkip()
    end
    
    ClientBoot->>LocationService: getCurrentLocation()
    LocationService-->>ClientBoot: {latitude, longitude}
    
    ClientBoot->>Backend: obterEnderecoPorCoordenadas(lat, lng)
    Backend-->>ClientBoot: {city, state, country}
    
    ClientBoot->>CityStore: setCity({cityId, name, state})
    
    ClientBoot->>Backend: GET /users/profile
    Backend-->>ClientBoot: Profile Data
    ClientBoot->>AuthStore: updateUserData(profile)
    
    ClientBoot->>Backend: GET /rides/active
    Backend-->>ClientBoot: {active: boolean, ride: Ride | null}
    
    alt Corrida Ativa com Motorista Aceito
        ClientBoot->>App: setInitialRideId(rideId)
        App->>App: Navegar para RideTracking
    else Sem Corrida Ativa
        ClientBoot->>App: Renderizar DrawerClienteRoutes
    end
```

### 2.2 Validação KYC (Know Your Customer)

```mermaid
sequenceDiagram
    participant ClientBoot
    participant AuthStore
    participant OnboardingDashboard
    participant Backend

    ClientBoot->>AuthStore: Verificar userData
    Note over AuthStore: cpf/cnpj presente?<br/>selfie aprovada?<br/>status === "approved"?
    
    alt KYC Incompleto
        ClientBoot->>OnboardingDashboard: Mostrar tela de ativação
        OnboardingDashboard->>Backend: POST /users/profile {cpf}
        Backend-->>OnboardingDashboard: Success
        OnboardingDashboard->>Backend: POST /users/upload-selfie {image}
        Backend-->>OnboardingDashboard: {status: "pending"}
        OnboardingDashboard->>ClientBoot: persistActivated()
        ClientBoot->>Backend: POST /users/profile {tourSeen: true}
        ClientBoot->>AuthStore: updateUserData({tourSeen: true})
    else KYC Completo
        ClientBoot->>App: Renderizar Home
    end
```

---

## 3. Fluxo de Corrida (Ride) <a name="ride-flow"></a>

### 3.1 Fluxo Completo de Solicitação de Corrida

```mermaid
graph TB
    A[Home Screen] --> B[Tocar em 'Para onde vamos?']
    B --> C[DestinationSearch<br/>Buscar endereço]
    
    C --> D[Selecionar Destino]
    D --> E[Confirmar Pickup/Dropoff]
    E --> F[SelectVehicle<br/>Escolher veículo]
    
    F --> G{Tipo de Veículo}
    G -->|Car/Motorcycle/Van| H[ServicePurpose<br/>Motivo da corrida]
    
    H --> I[RideSetup<br/>Configurações finais]
    I --> J[FinalOrderSummary<br/>Resumo e preço]
    
    J --> K{Método de Pagamento}
    K -->|Cartão/Pix/Wallet| L[Payment Screen]
    K -->|Dinheiro| M[Confirmar]
    
    L --> M
    M --> N[POST /rides<br/>Criar corrida]
    
    N --> O[SearchingDriver<br/>Aguardando motorista]
    
    O --> P{Motorista Aceita?}
    P -->|Sim| Q[RideTracking<br/>Acompanhamento]
    P -->|Timeout| R[Modal: Sem motoristas]
    P -->|Cancelado| S[Modal: Cancelado]
    
    Q --> T[Motorista a caminho]
    T --> U[Motorista chegou]
    U --> V[Corrida em andamento]
    V --> W[Chegou ao destino]
    
    W --> X[RideCompleted]
    X --> Y[ClientRateDriver<br/>Avaliar motorista]
    Y --> Z[TipDriver<br/>Gorjeta opcional]
    Z --> AA[Home Screen]
```

### 3.2 Fluxo com Negociação (Ofertas)

```mermaid
sequenceDiagram
    participant Client as Cliente (Home)
    participant WebSocket
    participant Backend
    participant Driver as Motorista

    Client->>Backend: POST /rides (criar corrida)
    Backend-->>Client: Ride {status: "requesting"}
    
    Note over Client: Banner "Oferta Ativa" aparece
    
    loop Polling a cada 6s
        Client->>Backend: GET /rides/active/list
        Backend-->>Client: {rides: [...]}
    end
    
    Driver->>Backend: POST /rides/:id/offers {amount: 25.00}
    Backend->>WebSocket: Emit "ride-offers-updated"
    WebSocket->>Client: ride-offers-updated
    
    Client->>Backend: GET /rides/active/list
    Backend-->>Client: Ride com negotiation.offers[0]
    
    Note over Client: Banner "Propostas Recebidas" aparece
    Client->>Client: Navegar para RideOffersMarketplace
    
    alt Cliente Aceita Oferta
        Client->>Backend: POST /rides/:id/offers/respond {action: "accept"}
        Backend-->>Client: Success
        Client->>Backend: POST /rides/:id/offers/select {driverId}
        Backend-->>Client: Ride {status: "accepted"}
        Client->>Client: Navegar para DeliveryPaymentConfirm
    else Cliente Faz Contraproposta
        Client->>Backend: POST /rides/:id/offers/respond {action: "counter", amount: 22.00}
        Backend-->>Client: Success
        Note over Client: Aguardar resposta do motorista
    else Motorista Aceita Contraproposta
        Backend->>WebSocket: Emit "driver-accepted-offer"
        WebSocket->>Client: {rideId, driverId}
        Client->>Backend: POST /rides/:id/offers/select {driverId}
        Backend-->>Client: Ride {status: "accepted"}
        Client->>Client: Navegar para DeliveryPaymentConfirm
    end
```

### 3.3 Fluxo de Cancelamento

```mermaid
graph TB
    A[RideTracking] --> B[Tocar em 'Cancelar']
    B --> C[ClientCancelRide<br/>Tela de confirmação]
    
    C --> D{Motivo do Cancelamento}
    D --> E[Selecionar motivo]
    E --> F[POST /rides/:id/cancel]
    
    F --> G{Há Taxa de Cancelamento?}
    G -->|Sim| H[Mostrar valor da taxa]
    H --> I[Confirmar cancelamento]
    G -->|Não| I
    
    I --> J[Backend cancela corrida]
    J --> K[WebSocket: ride-cancelled]
    K --> L[Home Screen<br/>Modal de cancelamento]
    L --> M[Home Screen]
```

---

## 4. Fluxo de Entrega (Delivery) <a name="delivery-flow"></a>

### 4.1 Fluxo Completo de Solicitação de Entrega

```mermaid
graph TB
    A[Home Screen<br/>Modo Entrega] --> B[Selecionar Veículo<br/>Moto/Carro/Van/Baú]
    
    B --> C{Delivery Mode}
    C -->|Enviar| D[Preencher Origem<br/>DeliverySenderInfo - Sender]
    C -->|Receber| E[Preencher Destino<br/>DeliverySenderInfo - Receiver]
    
    D --> F[Salvar pickupProfile]
    E --> G[Salvar dropoffProfile]
    
    F --> H{Ambos Preenchidos?}
    G --> H
    
    H -->|Não| D
    H -->|Não| E
    H -->|Sim| I[DeliveryDetails<br/>Detalhes da entrega]
    
    I --> J[Preencher:<br/>- Tipo de item<br/>- Tamanho<br/>- Peso<br/>- Frágil?<br/>- Instruções]
    
    J --> K[Calcular Preço<br/>GET /rides/calculate-price]
    K --> L[DeliveryPaymentConfirm<br/>Confirmar pagamento]
    
    L --> M[POST /rides<br/>Criar entrega]
    M --> N[OrderSent<br/>Pedido enviado]
    
    N --> O[Aguardando motorista]
    O --> P[Motorista aceita]
    P --> Q[RideTracking<br/>Acompanhamento]
    
    Q --> R[Motorista coleta]
    R --> S[Em trânsito]
    S --> T[Entregue]
    
    T --> U[Avaliar + Tip]
    U --> V[Home Screen]
```

### 4.2 Payload de Entrega (DeliveryAddressProfile)

```typescript
// Tipo usado em pickupProfile e dropoffProfile
interface DeliveryAddressProfile {
  address: string;           // Endereço completo formatado
  addressCoords: {           // Coordenadas do endereço
    latitude: number;
    longitude: number;
  } | null;
  details?: string;          // Complemento (apto, bloco, etc)
  contactName: string;       // Nome do contato no local
  contactPhone: string;      // Telefone do contato
}
```

### 4.3 Navegação entre Telas de Entrega

```mermaid
sequenceDiagram
    participant Home
    participant SenderInfo as DeliverySenderInfo
    participant Details as DeliveryDetails
    participant Payment as DeliveryPaymentConfirm
    participant OrderSent

    Home->>SenderInfo: navigate({mode: "sender", vehicleType: "motorcycle"})
    Note over SenderInfo: Usuário preenche:<br/>- Endereço<br/>- Nome do contato<br/>- Telefone<br/>- Complemento
    
    SenderInfo->>Home: setParams({deliveryDraftProfile})
    Note over Home: pickupProfile = {<br/>  address: "Rua X, 123",<br/>  contactName: "João",<br/>  contactPhone: "11999999999",<br/>  details: "Apto 42"<br/>}
    
    Home->>SenderInfo: navigate({mode: "receiver", vehicleType: "motorcycle"})
    Note over SenderInfo: Usuário preenche dados do destinatário
    
    SenderInfo->>Home: setParams({deliveryDraftProfile})
    Note over Home: dropoffProfile = {<br/>  address: "Av Y, 456",<br/>  contactName: "Pedro",<br/>  contactPhone: "11888888888"<br/>}
    
    Home->>Details: navigate({pickupProfile, dropoffProfile, vehicleType})
    Note over Details: Usuário preenche:<br/>- Tipo de item<br/>- Tamanho<br/>- Peso<br/>- Frágil<br/>- Instruções
    
    Details->>Backend: POST /rides/calculate-price
    Backend-->>Details: {pricing, distance, duration}
    
    Details->>Payment: navigate({pricing, pickup, dropoff, details})
    Payment->>Backend: POST /rides (create delivery)
    Backend-->>Payment: Ride {_id, status: "requesting"}
    
    Payment->>OrderSent: navigate({rideId})
    Note over OrderSent: Aguardando motorista aceitar
```

---

## 5. Diagrama de Estados da Corrida <a name="ride-states"></a>

### 5.1 Máquina de Estados da Corrida

```mermaid
stateDiagram-v2
    [*] --> requesting: POST /rides
    
    requesting --> payment_pending: Motorista pré-selecionado
    requesting --> cancelled: Timeout (10min)
    requesting --> cancelled: Cliente cancela
    
    payment_pending --> driver_assigned: Pagamento confirmado
    payment_pending --> cancelled: Pagamento expirado
    
    driver_assigned --> accepted: Motorista aceita
    driver_assigned --> cancelled: Motorista rejeita
    
    accepted --> driver_arriving: Motorista a caminho
    driver_arriving --> arrived: Motorista chegou no pickup
    arrived --> in_progress: Corrida iniciada
    in_progress --> completed: Chegou no destino
    
    completed --> rated: Cliente avaliou
    rated --> [*]
    
    cancelled --> [*]
    
    note right of requesting
        Banner: "Oferta Ativa"
        Monitorado por polling 6s
    end note
    
    note right of accepted
        Auto-redirect para
        RideTracking
    end note
```

### 5.2 Estados com Negociação

```mermaid
stateDiagram-v2
    [*] --> requesting: POST /rides
    
    requesting --> negotiation: Motorista envia oferta
    negotiation --> counter_offered: Cliente faz contraproposta
    counter_offered --> negotiation: Motorista responde
    negotiation --> accepted: Cliente aceita oferta
    negotiation --> requesting: Cliente rejeita oferta
    
    accepted --> payment_pending: Selecionar motorista
    payment_pending --> driver_assigned: Pagamento confirmado
    driver_assigned --> in_progress: Motorista inicia
    in_progress --> completed: Corrida finalizada
    completed --> [*]
    
    requesting --> cancelled: Timeout
    cancelled --> [*]
```

### 5.3 Tabela de Status e Ações

| Status | Descrição | Ação do Cliente | Banner/Monitoramento |
|--------|-----------|-----------------|----------------------|
| `requesting` | Aguardando motorista | Aguardar | Banner "Oferta Ativa" |
| `payment_pending` | Pagamento pendente | Confirmar pagamento | Auto-redirect |
| `driver_assigned` | Motorista designado | Aguardar aceite | - |
| `accepted` | Motorista aceitou | Aguardar chegada | Auto-redirect para RideTracking |
| `driver_arriving` | Motorista a caminho | Aguardar | RideTracking |
| `arrived` | Motorista chegou | Entrar no veículo | RideTracking |
| `in_progress` | Corrida em andamento | Aguardar destino | RideTracking |
| `completed` | Corrida finalizada | Avaliar motorista | Navigate para RateDriver |
| `cancelled` | Corrida cancelada | Ver modal | Modal "Pedido Expirado" |
| `negotiation` | Em negociação | Aceitar/Contrapor | Banner "Propostas Recebidas" |

---

## 6. Payloads de API <a name="api-payloads"></a>

### 6.1 Criar Corrida/Entrega

**Endpoint:** `POST /rides`

```typescript
interface CreateRideRequest {
  serviceType: "ride" | "delivery";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  
  // Localização
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
  stops?: Location[];  // Paradas intermediárias
  
  // Preços calculados
  pricing: {
    basePrice: number;
    distancePrice: number;
    serviceFee: number;
    total: number;
    subtotal?: number;
    discountAmount?: number;
    promotionCode?: string;
    currency: string;
    platformFee?: number;
    driverValue?: number;
  };
  
  // Distância e duração
  distance: {
    value: number;  // metros
    text: string;   // "5.2 km"
  };
  duration: {
    value: number;  // segundos
    text: string;   // "15 min"
  };
  
  // Rota
  routeCoordinates?: Array<{
    latitude: number;
    longitude: number;
  }>;
  
  // Detalhes específicos
  details?: {
    itemType?: string;           // "document", "package", "food"
    needsHelper?: boolean;       // Precisa de ajudante?
    insurance?: "none" | "basic" | "standard" | "premium";
    priority?: number;           // 1-5
    cargoSize?: "small" | "medium" | "large";
    approximateWeightKg?: number;
    isFragile?: boolean;
    pickupComplement?: string;   // "Apto 42, bloco B"
    dropoffComplement?: string;
    recipientName?: string;      // Para entregas
    recipientPhone?: string;     // Para entregas
    recipientInstructions?: string;
    pickupPin?: string;          // PIN de coleta
    deliveryPin?: string;        // PIN de entrega
    specialInstructions?: string;
  };
  
  // Pagamento
  payment?: {
    method?: {
      type?: "credit_card" | "pix" | "cash";
    };
  };
  
  // Agendamento
  scheduledFor?: string;  // ISO 8601: "2026-05-27T14:00:00Z"
  
  // Negociação
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number;
  };
  
  // Promoção
  promotionCode?: string;
}
```

**Resposta:** `Ride` (objeto completo da corrida)

### 6.2 Calcular Preço

**Endpoint:** `POST /rides/calculate-price`

```typescript
interface CalculatePriceRequest {
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
  stops?: Location[];
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  
  // Extensões logísticas
  serviceType?: "ride" | "delivery";
  deliveryType?: string;
  cargoSize?: string;
  priority?: number;
  needsHelper?: boolean;
  isFragile?: boolean;
  approximateWeightKg?: number;
  
  // Métricas pré-calculadas (do Google Maps)
  distance?: number;  // metros
  duration?: number;  // segundos
}
```

**Resposta:**

```typescript
interface CalculatePriceResponse {
  pricing: {
    basePrice: number;
    distancePrice: number;
    serviceFee: number;
    total: number;
    subtotal?: number;
    discountAmount?: number;
    promotionCode?: string;
    currency: string;
    platformFee?: number;
    driverValue?: number;
  };
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  smartPricing?: {
    minimumPrice: number;
    suggestedPrice: number;
    priorityPrice: number;
    distanceKm: number;
    demandLevel: string;
    deliveryScore: number;
  };
}
```

### 6.3 Buscar Motoristas Próximos

**Endpoint:** `GET /rides/nearby-drivers`

**Query Params:**
```typescript
{
  latitude: number;
  longitude: number;
  radius: number;  // metros (padrão: 5000)
}
```

**Resposta:**

```typescript
Array<{
  id: string;
  name?: string;
  profilePhoto?: string | null;
  rating?: number;
  latitude: number;
  longitude: number;
  type: "motorcycle" | "car" | "van" | "truck";
  rotation: number;
  serviceTypes?: string[];  // ["ride", "delivery"]
}>
```

### 6.4 Listar Corridas Ativas

**Endpoint:** `GET /rides/active/list`

**Resposta:**

```typescript
interface ActiveRidesResponse {
  active: boolean;
  count: number;
  rides: Ride[];
}

interface Ride {
  _id: string;
  clientId: any;
  driverId?: any;
  serviceType: string;
  vehicleType: string;
  pickup: Location;
  dropoff: Location;
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
  routeCoordinates?: RouteCoordinate[];
  details?: RideDetails;
  status: string;
  cancellationFee?: number;
  requestedAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  scheduledFor?: string;
  
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    finalAgreedPrice?: number | null;
    selectedDriverId?: string | null;
    offers?: RideOffer[];
  };
  
  promotion?: {
    promotionId?: string;
    code?: string;
    discountType?: "fixed" | "percentage";
    discountValue?: number;
    discountAmount?: number;
    appliedAt?: string;
  };
  
  payment?: {
    method?: {
      type?: string;
    };
  };
  
  isWaitingInQueue?: boolean;
  arrivedAtDropoff?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RideOffer {
  driverId: string | { _id: string; name?: string; profilePhoto?: string };
  amount: number;
  status: "accepted" | "countered" | "rejected" | "client_countered";
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### 6.5 Responder a Oferta

**Endpoint:** `POST /rides/:rideId/offers/respond`

```typescript
{
  action: "accept" | "counter" | "reject";
  amount?: number;      // Obrigatório se action === "counter"
  message?: string;     // Mensagem opcional para o motorista
}
```

### 6.6 Selecionar Motorista (Após Aceitar Oferta)

**Endpoint:** `POST /rides/:rideId/offers/select`

```typescript
{
  driverId: string;  // ID do motorista selecionado
}
```

### 6.7 Cancelar Corrida

**Endpoint:** `POST /rides/:rideId/cancel`

```typescript
{
  reason?: string;  // Motivo do cancelamento
}
```

**Resposta:**

```typescript
{
  message?: string;
  cancellationFee?: number;  // Taxa de cancelamento (se aplicável)
}
```

### 6.8 Avaliar Motorista

**Endpoint:** `POST /rides/:rideId/rate-client`

```typescript
{
  stars: number;      // 1-5
  comment?: string;   // Comentário opcional
}
```

### 6.9 Adicionar Gorjeta

**Endpoint:** `POST /rides/:rideId/tip`

```typescript
{
  amount: number;  // Valor da gorjeta
}
```

---

## 7. Eventos WebSocket <a name="websocket-events"></a>

### 7.1 Lista de Eventos

| Evento | Direção | Descrição | Payload |
|--------|---------|-----------|---------|
| `ride-status-updated` | Backend → Cliente | Status da corrida mudou | `{rideId, status, ride}` |
| `ride-offers-updated` | Backend → Cliente | Nova oferta de motorista | `{rideId, offers}` |
| `driver-accepted-offer` | Backend → Cliente | Motorista aceitou contraproposta | `{rideId, driverId}` |
| `ride-cancelled` | Backend → Cliente | Corrida cancelada | `{rideId, reason}` |
| `ride-payment-expired` | Backend → Cliente | Pagamento expirou | `{rideId, reason}` |

### 7.2 Fluxo de Eventos WebSocket

```mermaid
sequenceDiagram
    participant Client as Cliente (Home)
    participant WebSocket as WebSocket Service
    participant Backend
    participant Driver as Motorista

    Client->>WebSocket: connect()
    WebSocket->>Backend: Estabelecer conexão
    Backend-->>WebSocket: Conectado
    WebSocket-->>Client: Conectado
    
    Note over Client: Registrar listeners
    
    Client->>WebSocket: on("ride-status-updated", checkActiveRide)
    Client->>WebSocket: on("ride-offers-updated", checkActiveRide)
    Client->>WebSocket: on("driver-accepted-offer", handleDriverAccepted)
    Client->>WebSocket: on("ride-cancelled", handleCancelled)
    Client->>WebSocket: on("ride-payment-expired", handlePaymentExpired)
    
    Note over Driver: Motorista envia oferta
    Driver->>Backend: POST /rides/:id/offers
    Backend->>WebSocket: Emit "ride-offers-updated"
    WebSocket->>Client: ride-offers-updated
    Client->>Client: checkActiveRide()
    
    Note over Driver: Motorista aceita contraproposta
    Driver->>Backend: POST /rides/:id/offers/respond
    Backend->>WebSocket: Emit "driver-accepted-offer"
    WebSocket->>Client: {rideId, driverId}
    Client->>Client: handleDriverAccepted()
    Client->>Backend: POST /rides/:id/offers/select
    Client->>Client: Navegar para Payment
    
    Note over Backend: Corrida cancelada (timeout)
    Backend->>WebSocket: Emit "ride-cancelled"
    WebSocket->>Client: {rideId, reason}
    Client->>Client: handleCancelled()
    Client->>Client: Mostrar modal
```

### 7.3 Implementação do Listener

```typescript
// No hook useActiveRideMonitor
webSocketService.connect().then(() => {
  // Atualiza quando status da corrida muda
  webSocketService.on("ride-status-updated", checkActiveRide);
  
  // Atualiza quando motoristas enviam ofertas
  webSocketService.on("ride-offers-updated", checkActiveRide);
  
  // Auto-seleciona oferta quando motorista aceita
  webSocketService.on("driver-accepted-offer", async (data: any) => {
    const rId = data?.rideId;
    const dId = data?.driverId;
    if (rId && dId) {
      try {
        await rideService.selectOffer(rId, dId);
        navigation.navigate("DeliveryPaymentConfirm", { rideId: rId });
      } catch (e: any) {
        navigation.navigate("RideOffersMarketplace", { rideId: rId });
      }
    }
  });
  
  // Mostra modal quando corrida é cancelada
  webSocketService.on("ride-cancelled", (data: any) => {
    const rId = data?.rideId || data?.ride?._id || data?._id;
    if (rId) setExpiredRideId(rId);
    if (navigation.isFocused()) setShowCancelledModal(true);
    // Limpa estado
    setActiveRequestingRideId(null);
    setNegotiationRideId(null);
    setWaitingQueueCount(0);
  });
  
  // Mostra modal + toast quando pagamento expira
  webSocketService.on("ride-payment-expired", (data: any) => {
    const rId = data?.rideId || data?.ride?._id || data?._id;
    if (rId) setExpiredRideId(rId);
    if (navigation.isFocused()) setShowCancelledModal(true);
    // Limpa estado
    setActiveRequestingRideId(null);
    setNegotiationRideId(null);
    setWaitingQueueCount(0);
    // Mostra toast
    Toast.show({ 
      type: "error", 
      text1: "Pagamento Expirado", 
      text2: data?.reason || "Tempo de confirmação esgotado." 
    });
  });
});
```

---

## 8. Hooks e Monitoramento <a name="hooks-monitoring"></a>

### 8.1 useActiveRideMonitor

**Responsabilidade:** Monitorar corridas ativas em tempo real

```typescript
interface ActiveRideMonitorState {
  negotiationRideId: string | null;      // ID da corrida em negociação
  activeRequestingRideId: string | null; // ID da corrida aguardando motorista
  waitingQueueCount: number;              // Corridas na fila de espera
  expiredRideId: string | null;           // ID da corrida expirada
  showCancelledModal: boolean;            // Mostrar modal de cancelamento
}
```

**Mecanismo:**
- **Polling:** `GET /rides/active/list` a cada 6 segundos
- **WebSocket:** Listeners para eventos em tempo real
- **Auto-redirect:** Quando motorista aceita → navega para RideTracking

**Lógica de Banners:**

```typescript
// Banner "Oferta Ativa"
if (activeRequestingRideId && !negotiationRideId) {
  // Mostrar banner amarelo
}

// Banner "Propostas Recebidas"
if (negotiationRideId) {
  // Mostrar banner amarelo com botão para marketplace
}

// Banner "Pedidos em Fila"
if (waitingQueueCount > 0 && !negotiationRideId && !activeRequestingRideId) {
  // Mostrar banner verde
}
```

### 8.2 useFavorites

**Responsabilidade:** Carregar e gerenciar endereços favoritos

```typescript
interface UseFavoritesReturn {
  favorites: FavoriteAddress[];
  loading: boolean;
  refresh: () => Promise<void>;
}
```

**Comportamento:**
- Carrega favoritos no mount
- Recarrega quando tela recebe foco (`useFocusEffect`)
- Tipo forte: `FavoriteAddress[]` (não `any[]`)

### 8.3 useAvailability

**Responsabilidade:** Monitorar disponibilidade de motoristas próximos

```typescript
interface UseAvailabilityReturn {
  availability: {
    rideDrivers: number;      // Motoristas de corrida
    deliveryDrivers: number;  // Motoristas de entrega
    totalNearby: number;      // Total de motoristas próximos
  };
  loading: boolean;
  error: string | null;
}
```

**Comportamento:**
- Chama `GET /rides/nearby-drivers` a cada 15 segundos
- Filtra motoristas por tipo de serviço
- Exibe badge no mapa com contagem

---

## 9. Diagrama de Navegação Completo <a name="navigation-diagram"></a>

```mermaid
graph TB
    subgraph "Drawer Menu"
        DM1[Início]
        DM2[Histórico]
        DM3[Pedidos Ativos]
        DM4[Carteira]
        DM5[Perfil]
        DM6[Configurações]
    end
    
    subgraph "Stack Navigator"
        H[Home] --> DS[DestinationSearch]
        DS --> SV[SelectVehicle]
        SV --> SP[ServicePurpose]
        SP --> RS[RideSetup]
        RS --> FOS[FinalOrderSummary]
        FOS --> P[Payment]
        P --> SD[SearchingDriver]
        SD --> OS[OrderSent]
        
        H --> DSI[DeliverySenderInfo]
        DSI --> DD[DeliveryDetails]
        DD --> DPC[DeliveryPaymentConfirm]
        DPC --> OS
        
        OS --> RT[RideTracking]
        RT --> RC[RideCompleted]
        RC --> CRD[ClientRateDriver]
        CRD --> TD[TipDriver]
        
        H --> ROM[RideOffersMarketplace]
        ROM --> DPC
        
        H --> AO[ActiveOrders]
        H --> SC[SafetyCenter]
        H --> SU[SupportCenter]
    end
    
    DM1 --> H
    DM2 --> H[History Screen]
    DM3 --> AO
    DM4 --> W[Wallet]
    DM5 --> PR[Profile]
    DM6 --> S[Settings]
```

---

## 10. Resumo de Endpoints por Fluxo

### 10.1 Fluxo de Corrida

| Etapa | Método | Endpoint | Descrição |
|-------|--------|----------|-----------|
| Boot | GET | `/users/profile` | Buscar perfil do usuário |
| Boot | GET | `/rides/active` | Verificar corrida ativa |
| Home | GET | `/rides/active/list` | Listar corridas ativas (polling) |
| Home | GET | `/rides/nearby-drivers` | Motoristas próximos |
| Home | GET | `/favorite-addresses` | Listar favoritos |
| Criar | POST | `/rides/calculate-price` | Calcular preço |
| Criar | POST | `/rides` | Criar corrida |
| Negociar | GET | `/rides/:id/offers` | Listar ofertas |
| Negociar | POST | `/rides/:id/offers/respond` | Responder oferta |
| Negociar | POST | `/rides/:id/offers/select` | Selecionar motorista |
| Rastrear | GET | `/rides/:id` | Buscar detalhes da corrida |
| Cancelar | POST | `/rides/:id/cancel` | Cancelar corrida |
| Avaliar | POST | `/rides/:id/rate-client` | Avaliar motorista |
| Gorjeta | POST | `/rides/:id/tip` | Adicionar gorjeta |

### 10.2 Fluxo de Entrega

| Etapa | Método | Endpoint | Descrição |
|-------|--------|----------|-----------|
| Calcular | POST | `/rides/calculate-price` | Calcular preço da entrega |
| Criar | POST | `/rides` | Criar entrega (serviceType: "delivery") |
| Rastrear | GET | `/rides/:id` | Buscar detalhes da entrega |
| Status | PATCH | `/rides/:id/status` | Atualizar status (motorista) |

---

## 📚 Referências

- **Tipos de Navegação:** `src/screens/(authenticated)/Client/types/navigation.ts`
- **Serviço de Corridas:** `src/services/ride.service.ts`
- **Serviço de Favoritos:** `src/services/favoriteAddress.service.ts`
- **Hook de Monitoramento:** `src/screens/(authenticated)/Client/Shared/hooks/useActiveRideMonitor.ts`
- **Documentação da Home:** `docs/27-home-screen-client-analysis.md`

---

## 📝 Changelog

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-05-26 | 1.0 | Documentação inicial com fluxogramas completos |

---

**Próxima revisão:** Após implementação do modo Pay (carteira)
