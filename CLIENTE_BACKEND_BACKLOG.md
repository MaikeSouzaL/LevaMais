# ✅ Backlog (Cliente + Backend) — foco no Cliente

**Decisões do MAike:**
- Pagamento: **simulação** (não integra gateway agora)
- Produto: multi-serviço **delivery / ride / frete** (estilo Uber/99/iFood)
- Integração backend: vamos padronizar baseURL via `EXPO_PUBLIC_API_URL`

---

## 1) Padronização de ambiente (obrigatório antes de codar fluxo)

### 1.1 Mobile: baseURL + token automático
✅ Ajustado em `src/services/api.ts`:
- baseURL agora vem de `process.env.EXPO_PUBLIC_API_URL` + `/api`
- adiciona token automaticamente no interceptor

✅ Ajustado em `src/services/websocket.service.ts`:
- URL agora usa `process.env.EXPO_PUBLIC_API_URL` (fallback local)

**Ainda falta:**
- [ ] Criar/ajustar `.env` do Expo com `EXPO_PUBLIC_API_URL=http://SEU_IP:3000`
- [ ] Garantir que `authStore` persiste token no AsyncStorage (se não persiste)

---

## 2) Modelo mental do fluxo do Cliente (sem motorista real no MVP inicial)

Como você quer “fechar cliente”, dá pra fazer em 2 modos:

### Modo A (Demo rápida): motoristas simulados
- cliente faz tudo
- backend pode simular `driver-found` após X segundos

### Modo B (Real): precisa app do motorista (fora do escopo agora)

**Sugestão:** começar com Modo A para fechar cliente (UX + integrações) e depois plugar motorista.

---

## 3) Tarefas — Cliente (Mobile)

### 3.1 Normalizar tipos (vehicle/service)
- [ ] Criar `src/utils/mappers.ts`:
  - map `moto -> motorcycle`
  - map `serviceMode` (`delivery|ride|frete`) para `serviceType` do backend

### 3.2 Buscar purposes no backend
**Tela:** `ServicePurposeScreen.tsx`
- [ ] Trocar lista para `GET /api/purposes/:vehicleType`
- [ ] Salvar `purposeId` selecionado no fluxo

### 3.3 Calcular preço real (Offers)
**Componentes:** `OffersMotoSheet/OffersCarSheet/OffersVanSheet/OffersTruckSheet`
- [ ] Substituir mocks por `RideService.calculatePrice()`
- [ ] Exibir preço, distância e duração reais

### 3.4 Resumo do pedido → criar corrida
**Tela:** `FinalOrderSummaryScreen.tsx`
- [ ] Ao confirmar: chamar `RideService.create()`
- [ ] Navegar para Home com `rideId` e abrir `SearchingDriverModal`

### 3.5 HomeScreen: remover simulação e ouvir WebSocket
**Arquivo:** `HomeScreen/index.tsx`
- [ ] Remover `setTimeout(10s)` que simula motorista encontrado
- [ ] Conectar em `WebSocketService.onDriverFound(...)`
- [ ] Ao receber, abrir `DriverFoundSheet` e guardar driver no store

### 3.6 Nova tela: Tracking do cliente (obrigatório)
**Criar:** `src/screens/(authenticated)/Client/RideTrackingScreen.tsx`
- [ ] Map com marcador do motorista
- [ ] Listeners:
  - driver-location-updated
  - ride-status-updated
  - ride-cancelled
- [ ] Botão cancelar (chama `RideService.cancel`)

### 3.7 Histórico do cliente
**Criar:** `RideHistoryScreen.tsx`
- [ ] Lista paginada com `RideService.getHistory()`

### 3.8 Chat (pode ser pós-MVP)
- [ ] Integrar `ChatScreen` com eventos websocket (new-message)
- [ ] Persistência pode ficar para depois

---

## 4) Backend — apenas o que o cliente precisa

### 4.1 Garantir contratos (rotas)
Cliente precisa:
- [ ] `POST /api/rides/calculate-price`
- [ ] `POST /api/rides`
- [ ] `GET /api/rides/:id`
- [ ] `GET /api/rides` (history)
- [ ] `POST /api/rides/:id/cancel`

### 4.2 Modo Demo (sem app motorista) — simular driver-found
**Implementar flag no backend (dev):**
- [ ] `SIMULATE_DRIVER=true`
- [ ] Após criar corrida, backend dispara:
  - `driver-found` para o cliente em X segundos
  - `driver-location-updated` a cada 2s movendo um ponto
  - `ride-status-updated` mudando status por etapas

Isso fecha todo o client sem precisar do motorista.

---

## 5) Ordem recomendada (pra não travar)
1. Ambiente + baseURL + token
2. Purposes (backend real)
3. calculatePrice real
4. create ride real
5. WebSocket connect + driver-found
6. RideTrackingScreen
7. Histórico

---

## 6) Próximo passo
Se você quiser, eu já:
- crio os mappers + store
- ajusto `FinalOrderSummaryScreen` e `HomeScreen` para o fluxo real
- e escrevo o documento de contratos JSON (request/response) para cada endpoint.
