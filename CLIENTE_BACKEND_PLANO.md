# 📱 Leva Mais — Plano Cliente + Integração Backend (MVP)

**Foco:** fechar **lado do Cliente** (Mobile) + Backend **somente o que o cliente usa**.  
**Objetivo:** o cliente conseguir **pedir um serviço**, **ver preço real**, **confirmar**, **achar motorista**, **acompanhar** e **finalizar/cancelar** com histórico.

> Base existente no repo:  
> - Mobile já tem telas e componentes do fluxo do cliente (Home, seleção, resumo, modal buscar motorista, driver found, cancel fee, chat etc.).  
> - Serviços mobile prontos: `src/services/ride.service.ts` e `src/services/websocket.service.ts`.  
> - Backend (segundo FASE_6_COMPLETA.md) tem endpoints de rides + cálculo de preço + WebSocket (driver-found etc.).

---

## 0) Ponto de partida (o que o Cliente já tem no app)

### Telas públicas (onboarding/autenticação)
- `IntroScreen`
- `SignInScreen` (inclui Google)
- `SignUpScreen`
- `ForgotPasswordScreen`
- `VerifyCodeScreen`
- `NewPasswordScreen`
- `TermsScreen`
- `NotificationPermissionScreen`
- `CompleteRegistrationScreen` (steps)

### Telas do Cliente (autenticado)
Pasta: `src/screens/(authenticated)/Client/HomeScreen/`
- `HomeScreen/index.tsx` (orquestra mapa + bottom sheets)
- `LocationPickerScreen.tsx` / `MapLocationPickerScreen.tsx`
- `SelectVehicleScreen.tsx`
- `ServicePurposeScreen.tsx`
- `OrderDetailsScreen.tsx`
- `FinalOrderSummaryScreen.tsx` + `components/FinalOrderSummarySheet.tsx`
- `PaymentScreen.tsx` (hoje parece fluxo mock)
- `CancelFeeScreen.tsx`
- `ChatScreen.tsx`

### Componentes importantes no fluxo
- `components/SearchingDriverModal.tsx` (UI de “buscando motorista”)
- `components/DriverFoundSheet.tsx` (UI “motorista encontrado”)
- `components/Offers*Sheet.tsx` (preços/ofertas — hoje mistura mock)

---

## 1) Jornada completa do Cliente (MVP) — estados e telas

### Estado global do cliente
Criar/fortalecer um **RideStore** (Zustand) para o “pedido atual”, com persistência leve:
- `currentRideId`
- `pickup` / `dropoff`
- `vehicleType`
- `purposeId`
- `pricing`, `distance`, `duration`
- `status` (local)
- `driver` (quando encontrado)

> Motivo: o `HomeScreen` hoje depende de `route.params` e simulação. Para produção, a fonte deve ser store + eventos do backend.

### 1.1 Selecionar origem e destino
**Telas/Componentes:** `HomeScreen` + `LocationPickerScreen` + `MapLocationPickerScreen`
- [ ] Garantir que ao definir pickup/dropoff você guarda:
  - address, latitude, longitude
- [ ] Validar permissões de localização
- [ ] Normalizar endereços (já existem utils em `utils/location`)

**Backend:** (não necessário aqui, exceto se usar geocode server-side)

### 1.2 Selecionar veículo e finalidade do serviço
**Telas:** `SelectVehicleScreen`, `ServicePurposeScreen`
- [ ] Trocar dados de purposes para **backend real** (se ainda não estiver)
  - endpoint existente no README: `GET /api/purposes/:vehicleType`
- [ ] Guardar `vehicleType` e `purposeId`

### 1.3 Calcular preço real (antes de pagar/confirmar)
**Hoje:** Offers sheets parecem mockar.  
**Alvo:** sempre chamar `ride.service.calculatePrice()`.

**Mobile:**
- Usar `RideService.calculatePrice({ pickup, dropoff, vehicleType, purposeId })`
- Preencher:
  - `pricing.total` (R$)
  - `distance.text/value`
  - `duration.text/value`

**Backend (cliente usa):**
- `POST /api/rides/calculate-price`
  - Body:
    ```json
    {
      "pickup": {"address":"...","latitude":0,"longitude":0},
      "dropoff": {"address":"...","latitude":0,"longitude":0},
      "vehicleType": "car",
      "purposeId": "..." 
    }
    ```
  - Response:
    ```json
    {
      "pricing": {"basePrice":0,"distancePrice":0,"serviceFee":0,"total":0,"currency":"BRL"},
      "distance": {"value":0,"text":"..."},
      "duration": {"value":0,"text":"..."}
    }
    ```

### 1.4 Resumo do pedido
**Tela:** `FinalOrderSummaryScreen` e/ou `FinalOrderSummarySheet`
- [ ] Garantir que o resumo usa dados reais (pricing/distance/duration)
- [ ] Ao confirmar, **não ir direto para Payment mock**: precisa criar ride no backend.

### 1.5 Criar corrida (solicitação)
**Ação:** botão “confirmar” no resumo.

**Mobile:**
- Chamar `RideService.create(data)` com:
  - `serviceType` (ride/delivery)
  - `vehicleType` (motorcycle/car/van/truck)
  - `purposeId`
  - pickup/dropoff
  - pricing/distance/duration
  - details (opcional)
- Receber `rideId` e salvar no RideStore

**Backend (cliente usa):**
- `POST /api/rides`
  - Retorna `{ ride: Ride }`

**Depois de criar:**
- Abrir `SearchingDriverModal` (visível = true)
- Chamar `WebSocketService.waitingDriver(rideId)` (se for necessário no seu backend)  
- Iniciar timer de timeout (ex.: 30s/60s) para “nenhum motorista encontrado”.

### 1.6 Encontrar motorista (real-time)
**Mobile:**
- Garantir que o app conecta WebSocket após login.
  - ponto ideal: `App.tsx` ou auth flow (hook: `useAppWebSocketIntegration` citado na Fase 6)
- Listener:
  - `WebSocketService.onDriverFound((payload) => {...})`

**Ações quando driver-found chega:**
- Fechar `SearchingDriverModal`
- Abrir `DriverFoundSheet` com dados do motorista
- Salvar driver no RideStore

**Backend (cliente recebe por WS):**
- Evento `driver-found`
  - Deve trazer pelo menos:
    - driverId
    - nome/foto
    - veículo
    - estimativa
    - rideId

### 1.7 Tracking da corrida (mapa em tempo real)
**Falta no app:** não existe uma `RideTrackingScreen` dedicada (na lista, não vi).

**Criar:** `src/screens/(authenticated)/Client/RideTrackingScreen.tsx`
- UI:
  - mapa
  - marker do motorista (animado)
  - status da corrida
  - botões: cancelar, chat, suporte

**WebSocket:**
- `driver-location-updated`
- `ride-status-updated`
- `driver-arrived`
- `ride-started`
- `ride-cancelled`

**Backend:**
- Deve emitir `driver-location-updated` para o cliente (room `client-{id}`)

### 1.8 Cancelamento
**Telas:** `CancelFeeScreen` + botões em Tracking/DriverFound

**Regra documentada:** taxa de cancelamento de 30% quando motorista já aceitou.

**Mobile:**
- `RideService.cancel(rideId, reason)`
- Se houver taxa, o backend deve retornar informações (ideal: valor da taxa)

**Backend:**
- `POST /api/rides/:id/cancel`

### 1.9 Finalização e Histórico
**Falta:** tela de histórico do cliente.

**Criar:** `RideHistoryScreen` (lista)
- `RideService.getHistory({ status, page, limit })`

**Backend:**
- `GET /api/rides` (history/paginação) — documentado na Fase 6

---

## 2) Contratos de integração (Cliente ↔ Backend)

## 2.1 Autenticação
O cliente depende do token JWT para:
- chamar API (`api.ts` deve setar Authorization)
- autenticar no WebSocket (`websocket.service.ts` usa token)

**Checklist Mobile:**
- [ ] garantir que `src/services/api.ts` injeta `Authorization: Bearer <token>`
- [ ] no login, salvar token no `authStore` e persistir (AsyncStorage)

## 2.2 Endpoints mínimos para Cliente (backend)
Cliente precisa (mínimo):
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/google`
  - `GET /api/auth/me`/profile
  - reset senha (3 endpoints)
- Purposes:
  - `GET /api/purposes/:vehicleType`
- Favorites:
  - CRUD (se usado na UI)
- Rides (cliente):
  - `POST /api/rides/calculate-price`
  - `POST /api/rides` (create)
  - `GET /api/rides/:id`
  - `GET /api/rides` (history)
  - `POST /api/rides/:id/cancel`

## 2.3 Eventos WebSocket mínimos
Cliente deve tratar:
- `driver-found`
- `driver-location-updated`
- `ride-status-updated`
- `ride-cancelled`
- `driver-arrived`
- `ride-started`

---

## 3) O que ajustar no código existente (tarefas por arquivo)

### 3.1 `HomeScreen/index.tsx`
Hoje o fluxo de busca de motorista é **simulado** com `setTimeout(10s)`.

**Trocar por backend real:**
- [ ] Remover a simulação (timeout que seta `isDriverFound=true`)
- [ ] Ao voltar do Payment, em vez de “startSearch mock”, usar:
  - `rideId` já criado
  - exibir SearchingDriverModal
  - escutar websocket `driver-found`

### 3.2 `FinalOrderSummaryScreen.tsx`
Hoje `handleConfirm()` navega para Payment apenas com amount.

**MVP correto:**
- [ ] `handleConfirm` deve:
  1. chamar `RideService.create()`
  2. navegar para Home com `{ startSearch: true, rideId, searchData }`
  3. ou navegar direto para Tracking (e abrir modal de busca por cima)

### 3.3 Offers Sheets (`OffersMotoSheet`, `OffersCarSheet`, etc.)
- [ ] substituir preços mock por `RideService.calculatePrice()`
- [ ] padronizar vehicleType enums:
  - UI usa `moto` / backend usa `motorcycle`
  - criar mapper único

### 3.4 `websocket.service.ts`
- [ ] garantir URL única do socket alinhada com `api.ts`
- [ ] conectar automaticamente após login e desconectar no logout
- [ ] reconexão robusta (já existe tentativa)

### 3.5 Nova tela: `RideTrackingScreen.tsx`
- [ ] implementar mapa + driver marker
- [ ] listeners websocket
- [ ] botão cancelar -> `RideService.cancel`

### 3.6 Histórico: `RideHistoryScreen.tsx`
- [ ] listar corridas com paginação

---

## 4) Normalização de enums e dados (evitar bugs)

### VehicleType
No app aparecem dois padrões:
- UI: `moto | car | van | truck`
- Backend: `motorcycle | car | van | truck`

Criar util:
```ts
export function mapVehicleTypeToApi(t: 'moto'|'car'|'van'|'truck') {
  return t === 'moto' ? 'motorcycle' : t;
}
```
E o inverso para exibição.

### Ride Status
Definir enum compartilhado (types) no mobile para os status do backend (documentado como 11 status).

---

## 5) Testes (cliente) — checklist de QA

### Fluxo feliz
- [ ] login
- [ ] pickup/dropoff
- [ ] veículo + purpose
- [ ] calcular preço real
- [ ] criar ride
- [ ] receber driver-found
- [ ] tracking recebendo driver-location-updated
- [ ] finalizar corrida (quando driver mudar status)

### Erros
- [ ] sem internet
- [ ] sem permissões de localização
- [ ] backend offline
- [ ] timeout sem motorista (30s)
- [ ] cancelamento antes/depois de aceitar

---

## 6) Próximo passo: o que eu preciso de você

Para fechar 100% o lado do cliente, eu preciso que você confirme:
1) O **Payment** entra no MVP agora ou vamos só simular pagamento (Pix/dinheiro) e criar ride imediatamente?
2) O serviço principal é **delivery** ou **ride** no MVP? (o código mistura “Entrega • …”)
3) Onde está o arquivo `src/services/api.ts` e como está o baseURL hoje? (pra alinhar com o socket)

Se você responder isso, eu gero um **backlog detalhado em tarefas pequenas** (com pseudo‑código) e a ordem exata pra implementar sem retrabalho.
