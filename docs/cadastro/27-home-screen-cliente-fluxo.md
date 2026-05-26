# 27 - Home Screen do Cliente: Fluxo Completo e Arquitetura

**Data:** 2026-05-26  
**Escopo:** Tela Home do cliente (modo Corrida, Entrega e Pay)  
**Arquivo principal:** `src/screens/(authenticated)/Client/Home/index.tsx` (1300+ linhas)

---

## 📋 Índice

1. [Visão Geral](#visao-geral)
2. [Fluxo de Bootstrap (ClientBoot)](#fluxo-de-bootstrap)
3. [Estrutura da Home Screen](#estrutura-da-home-screen)
4. [Modos de Serviço](#modos-de-servico)
5. [Monitoramento de Corridas Ativas](#monitoramento-de-corridas)
6. [Serviços e APIs Utilizadas](#servicos-e-apis)
7. [Fluxo de Navegação](#fluxo-de-navegacao)
8. [Problemas Identificados](#problemas-identificados)
9. [Roadmap de Melhorias](#roadmap-de-melhorias)
10. [Decisões Técnicas](#decisoes-tecnicas)

---

## 1. Visão Geral <a name="visao-geral"></a>

A Home Screen do cliente é o hub central do aplicativo após autenticação. Ela gerencia três modos de serviço (Corrida, Entrega e Pay), exibe mapa em tempo real com motoristas próximos, monitora corridas ativas via WebSocket + polling, e fornece acesso rápido a todas as funcionalidades do sistema.

**Responsabilidades principais:**
- Exibir mapa com localização do usuário e motoristas disponíveis
- Gerenciar favoritos (Casa, Trabalho, customizados)
- Monitorar corridas ativas e exibir banners contextuais
- Redirecionar automaticamente para rastreamento quando motorista aceita
- Fornecer entrada para fluxos de solicitação (corrida/entrega)

---

## 2. Fluxo de Bootstrap (ClientBoot) <a name="fluxo-de-bootstrap"></a>

**Arquivo:** `src/routes/ClientBoot.tsx`

Antes de carregar a Home Screen, o `ClientBoot` executa uma sequência de validações e inicializações:

### 2.1 Sequência de Execução

```
App.tsx → Routes (src/routes/index.tsx)
  ├── Não autenticado → AuthRoutes (login/signup)
  ├── Termos não aceitos → TermsScreen
  ├── userType === "driver" → DriverBoot
  └── userType === "client" → ClientBoot
```

### 2.2 Etapas do ClientBoot

1. **Verificação de permissão de localização**
   - Se negada: exibe `LocationPermissionScreen`
   - Se concedida: continua para detecção de cidade

2. **Detecção de cidade via GPS**
   - `getCurrentLocation()` → obtém coordenadas
   - `obterEnderecoPorCoordenadas(lat, lng)` → reverse geocode
   - Converte nome do estado para sigla (ex: "São Paulo" → "SP")
   - Armazena em `clientCityStore`:
     ```typescript
     {
       cityId: "sao-paulo-sp",
       name: "São Paulo",
       state: "SP",
       source: "gps",
       updatedAt: Date.now()
     }
     ```

3. **Busca de perfil atualizado**
   - `userService.getProfile()` → busca dados do backend
   - Atualiza `authStore` com: CPF, CNPJ, telefone, foto, status de verificação

4. **Verificação de corrida ativa**
   - `rideService.getActive()` → verifica se há corrida em andamento
   - Se motorista aceitou e status é `accepted`, `driver_arriving`, `arrived` ou `in_progress`:
     - Armazena `rideId` em `initialRideId`
     - Deep-link para `RideTracking` após carregar drawer

5. **Gate de KYC (Verificação de Identidade)**
   - Condição para continuar:
     ```typescript
     const isClientCompliant = Boolean(
       (userData?.cpf || userData?.cnpj) &&
       userData?.clientVerification?.documents?.selfie &&
       userData?.clientVerification?.status === "approved"
     );
     ```
   - Se não verificado: exibe `ClientOnboardingDashboard`
   - Se verificado: renderiza `DrawerClienteRoutes` (Home Screen)

### 2.3 Estados Possíveis no ClientBoot

| Estado | Ação |
|--------|------|
| Sem permissão de localização | Mostra `LocationPermissionScreen` |
| Loading | Splash screen com logo animado |
| KYC não completo | Mostra `ClientOnboardingDashboard` |
| Tudo OK | Carrega `DrawerClienteRoutes` |

---

## 3. Estrutura da Home Screen <a name="estrutura-da-home-screen"></a>

### 3.1 Componentes Utilizados

| Componente | Fonte | Função |
|------------|-------|--------|
| `ClientRealtimeMap` | `@/components/client/home/ClientRealtimeMap` | Mapa Google com marcadores animados de motoristas |
| `LocationLoadingScreen` | `@/components/ui/LocationLoadingScreen` | Exibido enquanto GPS carrega |
| `Modal` | `@/components/Modal` | Modais de sucesso, cancelamento, sem motoristas |
| `ErrorBoundary` | `@/components/ErrorBoundary` | Proteção contra crashes |
| `MotiView` | `moti` | Animações (tab bar, banners) |
| Lucide Icons | `lucide-react-native` | Ícones (Car, Package, Wallet, etc.) |

### 3.2 Estado Local (useState hooks)

```typescript
// Modais
const [showHomeSuccessModal, setShowHomeSuccessModal] = useState(false);
const [showNoDriversModal, setShowNoDriversModal] = useState(false);
const [showCancelledModal, setShowCancelledModal] = useState(false);
const [expiredRideId, setExpiredRideId] = useState<string | null>(null);

// Favoritos
const [favorites, setFavorites] = useState<any[]>([]);

// Monitoramento de corridas
const [waitingQueueCount, setWaitingQueueCount] = useState<number>(0);
const [negotiationRideId, setNegotiationRideId] = useState<string | null>(null);
const [activeRequestingRideId, setActiveRequestingRideId] = useState<string | null>(null);

// Disponibilidade de motoristas
const [availability, setAvailability] = useState<{
  rideDrivers: number;
  deliveryDrivers: number;
  totalNearby: number;
}>({ rideDrivers: 0, deliveryDrivers: 0, totalNearby: 0 });
const [availabilityLoading, setAvailabilityLoading] = useState(false);
const [availabilityError, setAvailabilityError] = useState<string | null>(null);

// Mapa
const [useDarkMap, setUseDarkMap] = useState(true);
const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);
const [isCentering, setIsCentering] = useState(false);

// Modo de serviço
const [activeService, setActiveService] = useState<"ride" | "delivery" | "pay">("ride");
const [isTransitioning, setIsTransitioning] = useState(false);
const [deliveryMode, setDeliveryMode] = useState<"send" | "receive">("send");
const [selectedDeliveryVehicle, setSelectedDeliveryVehicle] = useState<"motorcycle" | "car" | "van" | "truck">("motorcycle");
const [pickupProfile, setPickupProfile] = useState<DeliveryAddressProfile | null>(null);
const [dropoffProfile, setDropoffProfile] = useState<DeliveryAddressProfile | null>(null);
```

### 3.3 Hooks Customizados Utilizados

| Hook | Função |
|------|--------|
| `useMapLocation()` | Gerencia localização GPS, região do mapa, endereço atual |
| `useAuthStore()` | Acesso a dados do usuário autenticado |
| `useNavigation()` | Navegação entre telas |
| `useRoute()` | Acesso a parâmetros da rota |
| `useFocusEffect()` | Executa lógica ao focar na tela |

---

## 4. Modos de Serviço <a name="modos-de-servico"></a>

A Home Screen possui três modos de serviço, alternados por uma tab bar flutuante no rodapé:

### 4.1 Modo "Corrida" (Padrão)

**Layout:**
- Header com avatar do usuário, botão Pix, botão SOS
- Mapa fullscreen com estilo escuro
- Barra de busca verde: "Para onde vamos?"
- Pills horizontais de favoritos (Casa, Trabalho, customizados)
- Cards promocionais "Destaques Leva+"
- Banners flutuantes de status (se houver corridas ativas)

**Navegações:**
- Barra de busca → `DestinationSearch`
- Pills de favoritos → `DestinationSearch` (com destino pré-preenchido)
- Botão "Adicionar Casa/Trabalho" → `FavoriteAddressFlow`
- SOS → `SafetyCenter`
- Banner "Oferta Ativa" → `ActiveOrders`
- Banner "Propostas Recebidas" → `RideOffersMarketplace`
- Banner "Pedidos em Fila" → `ActiveOrders`

**Fluxo de solicitação de corrida:**
```
HomeScreen
  → DestinationSearch (buscar endereço)
    → SelectVehicle (escolher veículo: moto, carro, van)
      → ServicePurpose (motivo: trabalho, lazer, médico, etc.)
        → RideSetup (configurações finais)
          → FinalOrderSummary (resumo)
            → Payment (método de pagamento)
              → SearchingDriver / OrderSent
                → RideOffersMarketplace (se houver ofertas)
                  → DeliveryPaymentConfirm (confirmar pagamento)
                    → RideTracking (rastreamento ao vivo)
```

### 4.2 Modo "Entrega"

**Layout:**
- Header verde curvo com saudação
- Título "O QUE VAMOS ENVIAR HOJE?" com logo Leva+
- Carrossel de veículos: Moto Entrega, Carro Entrega, Van Entrega, Baú Entrega
- Pills de favoritos (mesmo do modo Corrida)
- Card de entrega com tabs "Enviar" / "Receber":
  - Linha de origem (pickup) → navega para `DeliverySenderInfo` (modo sender)
  - Linha de destino (dropoff) → navega para `DeliverySenderInfo` (modo receiver)

**Estado de entrega:**
```typescript
const [deliveryMode, setDeliveryMode] = useState<"send" | "receive">("send");
const [selectedDeliveryVehicle, setSelectedDeliveryVehicle] = useState<"motorcycle" | "car" | "van" | "truck">("motorcycle");
const [pickupProfile, setPickupProfile] = useState<DeliveryAddressProfile | null>(null);
const [dropoffProfile, setDropoffProfile] = useState<DeliveryAddressProfile | null>(null);
```

**Navegações:**
- Linha de origem → `DeliverySenderInfo` (role: "pickup")
- Linha de destino → `DeliverySenderInfo` (role: "dropoff")
- Após preencher ambos → `DeliveryDetails` (cálculo de preço)
  - → `DeliveryPaymentConfirm`
    - → `OrderSent`
      - → `RideTracking` (rastreamento da entrega)

**Draft de entrega (retorno de `DeliverySenderInfo`):**
```typescript
useEffect(() => {
  const draft = route.params?.deliveryDraftProfile;
  if (!draft) return;

  setActiveService("delivery");
  if (draft.flow === "send" || draft.flow === "receive") {
    setDeliveryMode(draft.flow);
  }
  if (["motorcycle", "car", "van", "truck"].includes(String(draft.vehicleType))) {
    setSelectedDeliveryVehicle(draft.vehicleType);
  }
  if (draft.role === "pickup") {
    setPickupProfile(draft.profile);
  } else {
    setDropoffProfile(draft.profile);
  }

  navigation.setParams({ deliveryDraftProfile: undefined });
}, [navigation, route.params?.deliveryDraftProfile]);
```

### 4.3 Modo "Pay" (Carteira)

**Layout:**
- Card de saldo (hardcoded R$ 0,00 — **em desenvolvimento**)
- Botões "Adicionar Saldo" e "Transferir" (placeholder)
- Lista de serviços financeiros:
  - Pagamentos via Pix/Boleto
  - Gerenciamento de cartão de crédito
  - (Todos placeholder — não implementados)

**Status:** Funcionalidade incompleta, requer integração com API de pagamentos.

---

## 5. Monitoramento de Corridas Ativas <a name="monitoramento-de-corridas"></a>

A Home Screen monitora continuamente o estado das corridas do usuário através de um sistema dual: **WebSocket (tempo real)** + **Polling (fallback)**.

### 5.1 Lógica de Monitoramento (`checkActiveRide`)

```typescript
const checkActiveRide = async () => {
  try {
    const res = await rideService.getActiveList();
    const activeRides = res?.rides || [];
    
    // 1. Verifica se há ofertas de motoristas (negociação)
    const rideWithOffers = activeRides.find((ride: any) => {
      const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
      return offers.some((o: any) => o.status !== "rejected");
    });
    
    if (rideWithOffers) {
      setNegotiationRideId(rideWithOffers._id);
      setActiveRequestingRideId(null);
    } else {
      setNegotiationRideId(null);
      
      // 2. Verifica se há corrida aguardando motoristas (requesting)
      const requestingRide = activeRides.find((ride: any) =>
        ride.status === "requesting" || 
        ride.status === "payment_pending" || 
        ride.status === "driver_assigned"
      );
      setActiveRequestingRideId(requestingRide?._id || null);
    }

    // 3. Conta corridas na fila de espera
    const queuedRides = activeRides.filter((ride: any) => 
      ride.isWaitingInQueue === true && ride.status === "requesting"
    );
    setWaitingQueueCount(queuedRides.length);

    // 4. Auto-redirect para rastreamento se motorista aceitou
    const primaryRide = activeRides.find((ride: any) => !ride.isWaitingInQueue);
    if (primaryRide) {
      if (primaryRide.driverId && 
          ["accepted", "driver_arriving", "arrived", "in_progress"].includes(primaryRide.status)) {
        navigation.reset({
          index: 0,
          routes: [{ name: "RideTracking", params: { rideId: primaryRide._id } }],
        });
        return;
      }
    }
  } catch (err) {
    console.warn("[Home] checkActiveRide ERROR:", err);
  }
};
```

### 5.2 WebSocket Listeners

```typescript
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
    } else if (rId) {
      navigation.navigate("RideOffersMarketplace", { rideId: rId });
    }
  });
  
  // Mostra modal quando corrida é cancelada
  webSocketService.on("ride-cancelled", (data: any) => {
    const rId = data?.rideId || data?.ride?._id || data?._id;
    if (rId) setExpiredRideId(rId);
    if (navigation.isFocused()) { setShowCancelledModal(true); }
    setActiveRequestingRideId(null);
    setNegotiationRideId(null);
    setWaitingQueueCount(0);
  });
  
  // Mostra modal + toast quando pagamento expira
  webSocketService.on("ride-payment-expired", (data: any) => {
    const rId = data?.rideId || data?.ride?._id || data?._id;
    if (rId) setExpiredRideId(rId);
    if (navigation.isFocused()) { setShowCancelledModal(true); }
    setActiveRequestingRideId(null);
    setNegotiationRideId(null);
    setWaitingQueueCount(0);
    Toast.show({ 
      type: "error", 
      text1: "Pagamento Expirado", 
      text2: data?.reason || "Tempo de confirmação esgotado." 
    });
  });
});
```

### 5.3 Polling Fallback

```typescript
// Polling a cada 6 segundos (garante atualização mesmo se WebSocket falhar)
pollInterval = setInterval(checkActiveRide, 6000);
```

### 5.4 Re-check no Focus

```typescript
useFocusEffect(
  useCallback(() => {
    let isMounted = true;
    const recheckRides = async () => {
      try {
        const res = await rideService.getActiveList();
        if (!isMounted) return;
        // Mesma lógica do checkActiveRide...
      } catch (err) {
        console.warn("[Home:focus] error:", err);
      }
    };
    recheckRides();
    return () => { isMounted = false; };
  }, [])
);
```

### 5.5 Banners Flutuantes

| Banner | Condição | Cor | Navegação |
|--------|----------|-----|-----------|
| "Oferta Ativa" | `activeRequestingRideId` existe | Amarelo | `ActiveOrders` |
| "Propostas Recebidas" | `negotiationRideId` existe | Amarelo | `RideOffersMarketplace` |
| "Pedidos em Fila" | `waitingQueueCount > 0` | Verde | `ActiveOrders` |

---

## 6. Serviços e APIs Utilizadas <a name="servicos-e-apis"></a>

### 6.1 APIs REST

| Serviço | Endpoint | Frequência | Função |
|---------|----------|------------|--------|
| `rideService.getActiveList()` | `GET /rides/active/list` | Polling 6s + focus | Lista todas as corridas ativas com status, ofertas, posição na fila |
| `rideService.getNearbyDrivers(lat, lng, radius)` | `GET /rides/nearby-drivers` | Polling 15s | Conta motoristas próximos (corrida vs entrega) |
| `rideService.selectOffer(rideId, driverId)` | `POST /rides/:id/select-offer` | Sob demanda | Seleciona oferta de motorista específico |
| `favoriteAddressService.list()` | `GET /favorite-addresses` | No focus | Carrega endereços favoritos |
| `userService.getProfile()` | `GET /users/profile` | Boot + onboarding | Busca dados atualizados do usuário |
| `authService.updateLocation(lat, lng)` | `POST /auth/location` | A cada 2s / 3m de movimento | Envia localização GPS para backend |

### 6.2 WebSocket Events

| Evento | Ação |
|--------|------|
| `ride-status-updated` | Re-executa `checkActiveRide()` |
| `ride-offers-updated` | Re-executa `checkActiveRide()` |
| `driver-accepted-offer` | Auto-seleciona oferta, navega para pagamento |
| `ride-cancelled` | Mostra modal de corrida cancelada |
| `ride-payment-expired` | Mostra modal + toast de pagamento expirado |

### 6.3 Stores Globais (Zustand)

| Store | Função |
|-------|--------|
| `useAuthStore` | Dados do usuário autenticado (CPF, telefone, foto, etc.) |
| `useClientCityStore` | Cidade detectada via GPS |

---

## 7. Fluxo de Navegação <a name="fluxo-de-navegacao"></a>

### 7.1 Estrutura de Rotas

```
DrawerClienteRoutes (Drawer Navigator)
  └── ClientStack (Stack Navigator - 31 telas)
        ├── Home (HomeScreen)
        ├── DestinationSearch
        ├── FavoriteAddressFlow
        ├── LocationPicker
        ├── SelectVehicle
        ├── ServicePurpose
        ├── RideSetup
        ├── DeliverySetup
        ├── DeliveryDetails
        ├── DeliveryReview
        ├── DeliveryPaymentConfirm
        ├── FinalOrderSummary
        ├── Payment
        ├── SearchingDriver
        ├── OrderSent
        ├── RideTracking
        ├── Chat
        ├── ClientCancelRide
        ├── CancelFee
        ├── RideCompleted
        ├── ClientRateDriver
        ├── TipDriver
        ├── ActiveOrders
        ├── RideOffersMarketplace
        ├── OrderDetails
        ├── ConfirmPickup
        ├── AddPaymentMethod
        ├── Wallet
        ├── History
        ├── Profile
        ├── Settings
        ├── SupportCenter
        ├── SafetyCenter
        ├── Notifications
        ├── Coupons
        ├── Receipts
        ├── PrivacyData
        ├── InviteFriends
        └── ShiftOffersClient
```

### 7.2 Drawer Menu (16 itens)

1. Início (Home)
2. Histórico
3. Pedidos Ativos
4. Plantões Motoboy
5. Comprovantes
6. Carteira
7. Pagamentos
8. Cupons
9. Perfil
10. Notificações
11. Favoritos
12. Segurança
13. Suporte
14. Privacidade
15. Convidar Amigos
16. Configurações
17. Logout

### 7.3 Navegações Contextuais da Home

| Origem | Destino | Condição |
|--------|---------|----------|
| Barra "Para onde vamos?" | `DestinationSearch` | Sempre |
| Pill de favorito | `DestinationSearch` | Com destino pré-preenchido |
| Botão "Adicionar Casa" | `FavoriteAddressFlow` | Sempre |
| Banner "Oferta Ativa" | `ActiveOrders` | Se `activeRequestingRideId` existe |
| Banner "Propostas Recebidas" | `RideOffersMarketplace` | Se `negotiationRideId` existe |
| Banner "Pedidos em Fila" | `ActiveOrders` | Se `waitingQueueCount > 0` |
| Linha de origem (Entrega) | `DeliverySenderInfo` | Modo entrega, role: pickup |
| Linha de destino (Entrega) | `DeliverySenderInfo` | Modo entrega, role: dropoff |
| Botão SOS | `SafetyCenter` | Sempre |
| Promo card | `DestinationSearch` | Com parâmetros promocionais |

---

## 8. Problemas Identificados <a name="problemas-identificados"></a>

### 8.1 Alta Prioridade

**P1. Código Duplicado e Complexidade**
- HomeScreen tem **1300+ linhas** com lógica monolítica
- `checkActiveRide()` duplicado no `useEffect` (linhas 122-165) e no `useFocusEffect` (linhas 228-259)
- WebSocket cleanup duplicado: `webSocketService.off("ride-payment-expired", ...)` aparece 2x (linhas 222-223)
- **Impacto:** Dificulta manutenção, testes e evolução

**P2. Modo "Pay" Incompleto**
- Carteira hardcoded com R$ 0,00
- Botões "Adicionar Saldo" e "Transferir" com placeholder alerts
- Serviços financeiros (Pix, Boleto, Cartão) não implementados
- **Impacto:** Funcionalidade visível para o usuário mas não funcional

**P3. Modo "Entrega" Parcialmente Implementado**
- Seletor de veículos funciona
- Card de entrega com "Enviar/Receber" funciona
- Falta integração completa com fluxo de pagamento e rastreamento
- **Impacto:** Fluxo de entrega incompleto

**P4. Falta de Error Handling**
- `catch` vazios em múltiplos lugares (ex: linha 45 do `ClientBoot.tsx`)
- Logs com `console.log` em produção (linhas 128, 144, 163, 175, 192, 201, 236, 253)
- Sem feedback visual para erros de rede no `getNearbyDrivers`
- **Impacto:** Dificulta debugging e não informa usuário de falhas

### 8.2 Média Prioridade

**P5. Problemas de Performance**
- Polling de 6s + WebSocket + `getNearbyDrivers` a cada 15s = muitas requisições simultâneas
- `checkActiveRide()` chamado no mount, no focus, no WebSocket, E no polling → pode causar race conditions
- Estado local excessivo: 15+ `useState` hooks sem organização
- **Impacto:** Consumo excessivo de bateria e dados

**P6. Race Conditions no WebSocket**
- `driver-accepted-offer` faz `selectOffer()` e navega, mas não cancela se usuário já estiver em outra tela
- `ride-cancelled` e `ride-payment-expired` mostram modal só se `navigation.isFocused()`, mas não tratam o caso de usuário estar offline
- **Impacto:** Navegações inesperadas ou modais não exibidos

**P7. Estado de Disponibilidade Não Utilizado**
- `availability` é carregado mas não usado em lugar nenhum visível no código
- Sem indicador visual de "quantos motoristas há próximos"
- **Impacto:** Informação coletada mas não aproveitada

### 8.3 Baixa Prioridade

**P8. Acessibilidade**
- Sem `accessibilityLabel` em botões e ícones
- Sem suporte a screen reader no mapa
- **Impacto:** App não acessível para usuários com deficiência visual

**P9. Analytics**
- Sem tracking de cliques em "Para onde vamos?"
- Sem tracking de uso dos modos (ride vs delivery vs pay)
- **Impacto:** Falta de dados para decisões de produto

---

## 9. Roadmap de Melhorias <a name="roadmap-de-melhorias"></a>

### 9.1 Fase 1: Refatoração e Estabilidade (Alta Prioridade)

**Objetivo:** Reduzir complexidade e melhorar manutenibilidade

- [ ] **1.1 Extrair hooks customizados**
  - `useActiveRideMonitor()` → encapsula polling + WebSocket + lógica de banners
  - `useFavorites()` → carrega e gerencia favoritos
  - `useAvailability()` → monitora motoristas próximos
  - **Resultado esperado:** HomeScreen reduzido para ~400 linhas (só UI)

- [ ] **1.2 Melhorar error handling**
  - Adicionar ErrorBoundary em torno de `ClientRealtimeMap`
  - Mostrar toast para falhas de rede no `getNearbyDrivers`
  - Substituir `catch` vazios por logs estruturados (`logger.error`)
  - **Resultado esperado:** Erros visíveis e debuggáveis

- [ ] **1.3 Limpar código**
  - Remover `console.log` de produção (usar `logger.debug`)
  - Remover WebSocket cleanup duplicado
  - Tipar corretamente `favorites` (hoje é `any[]`)
  - **Resultado esperado:** Código limpo e tipado

### 9.2 Fase 2: Implementar Funcionalidades Faltantes (Média Prioridade)

**Objetivo:** Completar modos incompletos

- [ ] **2.1 Implementar Modo "Pay" completo**
  - Integrar com API de pagamentos (Pix, Boleto, Cartão)
  - Conectar com `Wallet` screen
  - Implementar fluxo de adicionar saldo
  - **Resultado esperado:** Carteira funcional

- [ ] **2.2 Finalizar Modo "Entrega"**
  - Conectar `DeliverySenderInfo` → `DeliveryDetails` → `DeliveryPaymentConfirm`
  - Implementar rastreamento de entregas (similar a `RideTracking`)
  - Adicionar banners de status para entregas ativas
  - **Resultado esperado:** Fluxo de entrega completo

- [ ] **2.3 Adicionar indicadores visuais**
  - Mostrar contador de motoristas próximos no mapa
  - Skeleton loading para favoritos
  - Empty state quando não há favoritos salvos
  - **Resultado esperado:** Melhor feedback visual

### 9.3 Fase 3: Otimização e Acessibilidade (Baixa Prioridade)

**Objetivo:** Melhorar performance e acessibilidade

- [ ] **3.1 Otimizar performance**
  - Debounce `checkActiveRide()` para evitar chamadas duplicadas
  - Usar `AbortController` para cancelar requisições ao desmontar
  - Reduzir polling de 6s para 10s (WebSocket já cobre updates em tempo real)
  - **Resultado esperado:** Menos requisições, menos bateria

- [ ] **3.2 Melhorar acessibilidade**
  - Adicionar `accessibilityLabel` em botões e ícones
  - Suporte a screen reader no mapa
  - **Resultado esperado:** App acessível

- [ ] **3.3 Adicionar analytics**
  - Trackear cliques em "Para onde vamos?"
  - Trackear uso dos modos (ride vs delivery vs pay)
  - **Resultado esperado:** Dados para decisões de produto

---

## 10. Decisões Técnicas <a name="decisoes-tecnicas"></a>

### 10.1 Por que WebSocket + Polling?

**Decisão:** Usar WebSocket para updates em tempo real + polling de 6s como fallback.

**Motivo:**
- WebSocket pode falhar (rede instável, timeout, servidor reiniciando)
- Polling garante que estado seja atualizado mesmo se WebSocket cair
- 6s é um balanço entre atualização rápida e consumo de recursos

**Alternativa considerada:**
- Só WebSocket → risco de estado desatualizado se conexão cair
- Polling mais rápido (3s) → consumo excessivo de bateria e dados

### 10.2 Por que auto-redirect para RideTracking?

**Decisão:** Quando motorista aceita e status é `accepted`/`arrived`/`in_progress`, resetar stack para `RideTracking`.

**Motivo:**
- Usuário pode estar em qualquer tela (favoritos, perfil, etc.)
- Corrida aceita é evento crítico que requer atenção imediata
- Reset de stack evita que usuário fique "preso" em telas anteriores

**Alternativa considerada:**
- Toast + navegação manual → usuário pode perder o momento
- Modal de confirmação → fricção desnecessária

### 10.3 Por que três modos (ride/delivery/pay) na mesma tela?

**Decisão:** Tab bar flutuante no rodapé para alternar entre modos.

**Motivo:**
- Unifica funcionalidades principais em um só lugar
- Usuário não precisa navegar para "tela de entregas" ou "tela de carteira"
- Mantém mapa visível em todos os modos

**Alternativa considerada:**
- Telas separadas → mais navegação, mais complexo
- Bottom sheet com tabs → menos visível, mais escondido

### 10.4 Por que estado local (useState) em vez de Zustand?

**Decisão:** Usar `useState` para estado da Home Screen em vez de store global.

**Motivo:**
- Estado é específico da Home Screen (não compartilhado com outras telas)
- Zustand seria overkill para estado tão localizado
- useState é mais simples e direto

**Problema atual:**
- 15+ `useState` hooks sem organização
- Dificulta entender quais estados são relacionados

**Melhoria proposta:**
- Extrair hooks customizados que encapsulam estados relacionados
- Exemplo: `useActiveRideMonitor()` gerencia `negotiationRideId`, `activeRequestingRideId`, `waitingQueueCount`

### 10.5 Por que `navigation.reset()` em vez de `navigation.navigate()`?

**Decisão:** Usar `navigation.reset()` para ir para `RideTracking`.

**Motivo:**
- `reset()` limpa o stack de navegação
- Usuário não pode voltar para Home com botão "voltar" (evita confusão)
- Força usuário a passar por fluxo de conclusão (rating, tip, etc.)

**Alternativa considerada:**
- `navigate()` → mantém stack, usuário pode voltar para Home
- `push()` → adiciona ao stack, mesmo problema

---

## 📚 Referências

- **Arquivo principal:** `src/screens/(authenticated)/Client/Home/index.tsx`
- **Bootstrap:** `src/routes/ClientBoot.tsx`
- **Mapa:** `src/components/client/home/ClientRealtimeMap.tsx`
- **Rotas:** `src/routes/client.stack.routes.tsx`
- **Drawer:** `src/routes/drawer.cliente.routes.tsx`
- **Hooks:** `src/screens/(authenticated)/Client/Shared/hooks/`
- **Serviços:** `src/services/ride.service.ts`, `src/services/favoriteAddress.service.ts`

---

## 📝 Changelog

| Data | Versão | Mudanças |
|------|--------|----------|
| 2026-05-26 | 1.0 | Documentação inicial |

---

**Próxima revisão:** Após conclusão da Fase 1 do Roadmap (refatoração)
