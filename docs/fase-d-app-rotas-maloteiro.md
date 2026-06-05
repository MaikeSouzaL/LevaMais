# Fase D — App: Rotas Planejadas / Maloteiro

> **Projeto:** Leva+ (Leva Mais) · **Trilha:** Rotas Planejadas (D7–D9) · **Tipo:** Plano de produto + arquitetura técnica
> **Stack:** App React Native (`src/`) · Backend Node/Express/MongoDB (`backend/src/`)
> **Status:** Backend + telas do app **funcionais** (motorista e cliente); pendências de evolução listadas na §9
> **Documento irmão:** `fase-d-marketplace.md` (trilha Marketplace) · **Índice:** `fase-d-marketplace-rotas-planejadas.md`
> **Última atualização:** 2026-06-05

---

## 1. Resumo

Motoristas anunciam **viagens futuras entre cidades** (rotas planejadas); clientes **reservam espaço** para enviar/receber encomendas. O motorista atua como **maloteiro / transportadora colaborativa**, podendo levar vários pacotes no mesmo trajeto. Tudo acontece **no app** (motorista publica/executa; cliente descobre/reserva), diferente do Marketplace que é web/portal.

Exemplo: *"Motorista saindo de Cacoal para Pimenta Bueno às 15:00. Aproveite para enviar ou receber encomendas."*

## 2. Papel do app

| Superfície | Papel nesta trilha |
|---|---|
| **App motorista** (RN) | Publicar rota futura, editar/cancelar antes de aceitar reservas, ver reservas recebidas, aceitar/recusar, iniciar rota e executar coletas/entregas |
| **App cliente** (RN) | Descobrir rotas relevantes, reservar espaço (item/tamanho/peso/coleta/entrega), pagar via carteira (hold) e acompanhar a reserva |
| **Admin web** (`leva-mais-web`) | *(pendente)* auditar rotas, ocupação, cancelamentos, disputas |

> **Nota de escopo:** o app cliente **não** compra no marketplace (isso é web — ver `fase-d-marketplace.md`). O app permanece focado em corrida, entrega, frete, **reserva de rotas** e acompanhamento.

## 3. Princípio — reaproveitar a infra existente

- **Pagamento:** escrow LevaPay (`walletEscrow.service`) — hold na reserva, release na entrega (creditando o motorista), refund em recusa/cancelamento.
- **Geo/cidades:** `City` para origem/destino e proximidade; índices `2dsphere` em `DriverRoute.origin/destination.location`.
- **Evolução planejada (D9):** vincular cada reserva a um `Ride(serviceType="delivery", sourceType="planned_route")` para herdar **tracking ao vivo, PIN + foto-prova, disputas e falha de entrega** — hoje a reserva é auto-contida (motorista confirma coleta/entrega por botão).

---

## 4. Roadmap (D7–D9)

| Pacote | Nome | Valor entregue | Depende de | Risco | Status |
|---|---|---|---|---|---|
| **D7** | Publicação de Rotas (motorista) | Motorista publica rota futura | D0 (modelos) | Médio | ✅ App + backend |
| **D8** | Descoberta + Reserva (cliente) | Cliente acha rota e reserva espaço (pago) | D7 | Médio | ✅ App + backend |
| **D9** | Execução de Rota (bundling, coletas/entregas) | Motorista executa multi-pacote; reserva concluída libera pagamento | D8 | Alto | 🟡 Execução por reserva feita; bundling/Ride/tracking pendente |

### D7 — Publicação de Rotas Planejadas
- **Escopo:** API `DriverRoute` (origem/destino/waypoints, `departAt`, capacidade, tipos de item, preço base/regra por tamanho-peso); regras "não pode sair no passado" e "editar/cancelar antes de aceitar reservas"; app motorista "Minhas Rotas".
- **DoD:** motorista publica rota válida; sistema rejeita partida no passado e capacidade inválida. ✅

### D8 — Descoberta + Reserva de Rota
- **Escopo:** descoberta por cidade/origem/destino/proximidade; `RouteReservation`; regra "não aceita reserva acima da capacidade"; pagamento via escrow (hold); telas de reserva (cliente) e de reservas recebidas (motorista).
- **DoD:** cliente vê rotas relevantes; reserva acima da capacidade é bloqueada; reserva é paga (hold) e aceita pelo motorista. ✅

### D9 — Execução de Rota
- **Escopo:** motorista executa coletas/entregas; cada reserva concluída libera o pagamento (release ao motorista); **(planejado)** cada reserva gera `Ride` vinculado por `plannedRouteId` para bundling + tracking + PIN/foto.
- **DoD:** motorista executa rota com várias reservas; cada entrega conclui e libera pagamento individualmente. 🟡 (release ✅; Ride/bundling/tracking pendente)

---

## 5. Modelos de dados (Mongoose)

> Criados no pacote **D0** (fundação compartilhada). Geo em GeoJSON `Point` + `2dsphere`.

#### `DriverRoute` — rota futura publicada pelo motorista
```js
{
  driverId: { type: ObjectId, ref: "User", required: true, index: true },
  vehicleType: { type: String, enum: ["motorcycle","car","van","truck"], required: true },
  origin: { cityId, label, location: { type:"Point", coordinates:[lng,lat] } },
  destination: { cityId, label, location: { type:"Point", coordinates:[lng,lat] } },
  waypoints: [{ cityId, label, location }],                 // descoberta por proximidade
  departAt: { type: Date, required: true, index: true },    // não pode ser no passado (validado)
  arriveEstimateAt: Date,
  capacity: { maxItems: 10, maxWeightKg: 50, maxVolumeL: 100, acceptedItemTypes: [String] },
  capacityUsed: { items: 0, weightKg: 0, volumeL: 0 },
  pricing: {
    basePrice: 0, pricePerKg: 0,
    sizeMultipliers: { small: 1, medium: 1.2, large: 1.5 },
    dynamicEnabled: false,                                  // precificação por ocupação (evolução)
  },
  status: { enum: ["draft","published","in_transit","completed","cancelled"], default: "draft" },
  statusHistory: [{ status, at, note }],
}
// índices: origin.location 2dsphere; destination.location 2dsphere; {departAt,status}; {driverId,status}
```

#### `RouteReservation` — reserva de espaço por um cliente
```js
{
  routeId: { type: ObjectId, ref: "DriverRoute", required: true, index: true },
  clientId: { type: ObjectId, ref: "User", required: true, index: true },
  driverId: { type: ObjectId, ref: "User", index: true },   // denormalizado da rota
  item: { type, description, size: ["small","medium","large"], weightKg, declaredValue },
  pickup: { address, latitude, longitude, contactName, contactPhone },
  dropoff: { address, latitude, longitude, contactName, contactPhone },
  pricing: { price, commissionPct, commissionAmount, driverPayout },
  payment: { method: "wallet", escrow: { status, amount, reservedAt, releasedAt, refundedAt } },
  rideId: { type: ObjectId, ref: "Ride", default: null },   // vínculo p/ tracking (D9 avançado, pendente)
  status: { enum: ["requested","accepted","rejected","awaiting_pickup","in_transit","delivered","completed","cancelled","refunded"], default: "requested" },
  statusHistory: [{ status, at, note }],
}
```

#### Campo aditivo usado em `Ride` (para evolução D9)
```js
sourceType: { enum: ["app","marketplace","planned_route"], default: "app" },
sourceRefId: ObjectId,           // RouteReservation._id
plannedRouteId: { type: ObjectId, ref: "DriverRoute" },
```

### Máquina de estados — `RouteReservation`
`requested` (hold) → (motorista aceita, valida capacidade) `accepted` → (rota inicia) `awaiting_pickup` → (coleta) `in_transit` → (entrega) `delivered`/`completed` (**release + payout motorista**).
Ramos: `requested/accepted/awaiting_pickup → cancelled` (cliente) ou `rejected` (motorista) → **refund** + libera capacidade.

---

## 6. Fluxo financeiro da reserva (escrow LevaPay)

| Evento | Ação | Mecanismo |
|---|---|---|
| Reserva (`requested`) | **Hold** de `price` na carteira do cliente | `walletEscrow.reserveReservation` |
| Motorista recusa / cliente cancela antes da entrega | **Refund** + libera capacidade | `walletEscrow.refundReservation` |
| Entrega concluída (`delivered → completed`) | **Release**: baixa held do cliente, credita o **motorista** (`driverPayout`) via `route_payout` (idempotente); `commissionAmount` = receita da plataforma | `walletEscrow.releaseReservation` |

> **Precificação:** `price = (basePrice + weightKg × pricePerKg) × sizeMultipliers[size]`. Comissão segue `PlatformConfig.plannedRoutes.defaultCommissionPct` (gate `plannedRoutesEnabled`). Seguro opcional via `insuranceFeePct` sobre `declaredValue` (estrutura pronta; UI futura).

---

## 7. APIs REST (`/api/routes`, autenticado)

| Método | Rota | Quem | Descrição |
|---|---|---|---|
| GET | `/routes/discover?cityId=&originCityId=&destinationCityId=&date=` | cliente | Rotas publicadas, futuras, com capacidade |
| GET | `/routes/:id` | cliente/motorista | Detalhe da rota |
| POST | `/routes/reservations` | cliente | Cria reserva + **hold escrow** |
| GET | `/routes/mine/reservations` | cliente | Minhas reservas |
| GET | `/routes/reservations/:reservationId` | cliente/motorista | Detalhe da reserva |
| POST | `/routes/reservations/:reservationId/cancel` | cliente | Cancela + refund |
| POST | `/routes` | motorista | Publica rota (valida `departAt` futuro) |
| GET | `/routes/mine` | motorista | "Minhas rotas" |
| PATCH | `/routes/:id` | motorista | Edita (antes de reservas aceitas) |
| POST | `/routes/:id/cancel` | motorista | Cancela rota + refunda reservas |
| POST | `/routes/:id/start` | motorista | Inicia rota (`in_transit`) |
| GET | `/routes/:id/reservations` | motorista | Reservas recebidas |
| POST | `/routes/reservations/:reservationId/accept` | motorista | Aceita (valida capacidade) |
| POST | `/routes/reservations/:reservationId/reject` | motorista | Recusa + refund |
| POST | `/routes/reservations/:reservationId/pickup` | motorista | Confirma coleta (`in_transit`) |
| POST | `/routes/reservations/:reservationId/deliver` | motorista | Confirma entrega → release |

Backend: `controllers/driverRoute.controller.js`, `routes/driverRoute.routes.js`, `services/routePricing.service.js`, escrow em `services/walletEscrow.service.js`.

---

## 8. Telas do app

**App service:** `src/services/route.service.ts` · **Tipos:** `src/types/routes.ts`

### Motorista (drawer → "Minhas Rotas")
- `DriverRoutesScreen` — lista de rotas com status e ocupação; botão publicar.
- `DriverPublishRouteScreen` — veículo, origem/destino, partida (presets + ajuste), capacidade (itens/peso), preço (base + R$/kg).
- `DriverRouteDetailScreen` — info da rota + **iniciar rota**; reservas com **Aceitar/Recusar → Confirmar coleta → Confirmar entrega**.

### Cliente (drawer → "Encomendas em rota" → stack `PlannedRoutes`/`RouteReserve`)
- `PlannedRoutesScreen` — abas **Disponíveis** (descoberta) e **Minhas reservas** (com cancelar).
- `RouteReserveScreen` — item, tamanho, peso, coleta, entrega, **estimativa de preço** e confirmação (hold LevaPay).

---

## 9. Estado e pendências

**Concluído:**
- Backend `/api/routes` completo (publicação, descoberta, reserva, execução) + escrow de reserva.
- App motorista (publicar/gerir/executar) e app cliente (descobrir/reservar/acompanhar).
- **(2026-06-05) Vínculo ao `Ride` (execução completa):** ao aceitar, a reserva cria um `Ride(sourceType="planned_route", plannedRouteId, sourceRefId)` atribuído ao motorista, com `pickupPin`/`deliveryPin`. Coletar/entregar **dirigem o status do Ride** (`in_progress`/`completed`); um **hook `post-save` no `Ride`** sincroniza a reserva e dispara `releaseReservation` (pagamento ao motorista) na conclusão ou `refundReservation` em cancelamento/falha. Recusa/cancelamento (cliente e motorista) e cancelamento de rota também passam pelo Ride (sem duplo estorno).
- **(2026-06-05) Tracking ao vivo + disputa (cliente):** reserva com `rideId` mostra **Acompanhar** (`DeliveryTracking`) e **Relatar problema** (`/api/disputes`, categoria `route`).
- **(2026-06-05) Seguro de encomenda (UI):** toggle + valor declarado na reserva; envia `withInsurance`/`declaredValue`; backend calcula `insuranceFeePct`.
- **(2026-06-05) Push "rota útil":** ao publicar, notifica clientes nas cidades de origem/destino/waypoints (best-effort por `city`).
- Validação: `node --check` + smoke do backend OK; `npx tsc --noEmit` do app exit 0.

**Pendente / evolução:**
1. **PIN + foto-prova na execução do motorista:** o `Ride` já tem `pickupPin`/`deliveryPin`; falta a UI do motorista pedir o PIN do cliente e a foto na coleta/entrega (reusar `validate-pin` + `proof/*`). Hoje os botões coletar/entregar avançam o Ride sem exigir PIN.
2. **Bundling**: ordenar coletas/entregas de várias reservas da mesma rota (agrupadas por `plannedRouteId`).
3. **Mapa na publicação/reserva:** selecionar origem/destino e coleta/entrega no mapa (hoje texto). Habilita melhor matching geográfico e o push "rota útil" por proximidade real.
4. **Admin web de rotas** em `leva-mais-web` (auditoria/ocupação/cancelamentos) — fora do app.
5. **Precificação dinâmica** por ocupação (`DriverRoute.pricing.dynamicEnabled`).

---

## 9b. Modo Transportadora (autonomia financeira do motorista)

O motorista pode operar como uma **mini-transportadora** — mais liberdade financeira. **Ativação por cadastro/KYC** (upgrade de conta aprovado no dashboard). Pacotes:

| Pacote | Escopo | Status |
|---|---|---|
| **T1 — Cadastro/KYC** | Perfil `Carrier` (marca/slug/documento/áreas/tabela de preço) + KYC manual; admin aprova; gate `isActiveCarrier`. App: "Modo Transportadora" (onboarding + status). | ✅ |
| **T2 — Rotas recorrentes** | `RouteSchedule` (dias+horário) gera `DriverRoute` automaticamente; tela Agenda. | ✅ |
| **T3 — Frete sob demanda + cotação** | `FreightRequest`: cliente pede frete direto → motorista cotiza → cliente paga (hold) → execução via Ride → release. | ✅ |
| **T4 — Perfil público** | `/api/carrier/public/:slug` (marca, avaliações, rotas, áreas) + tela de perfil + link compartilhável. | ✅ |

**T1 implementado (2026-06-05):**
- Backend: `models/Carrier.js` (KYC espelha Partner; `pricing`, `serviceAreas`, `rating`, `stats`, `slug` público); `controllers/carrier.controller.js` (`onboarding`/`getMe`/`updateMe` + admin `listCarriers`/`getCarrier`/`reviewKyc`/`updateStatus` + helper **`isActiveCarrier`** para gate de T2–T4); `routes/carrier.routes.js` → `/api/carrier` (motorista) e `/api/carrier/admin/*` (`requireAdmin`).
- App motorista: `services/carrier.service.ts`, `types/carrier.ts`, `screens/.../Driver/CarrierScreen.tsx` (onboarding quando não existe; status/KYC + features quando existe), item **"Modo Transportadora"** no drawer.
- Validação: `node --check` + smoke backend OK; `npx tsc --noEmit` do app exit 0.
- Gate: rotas recorrentes/frete/perfil público (T2–T4) exigem `carrier.status==="active"` + `kyc.status==="approved"`.

**T2 implementado (2026-06-05):**
- Backend: `models/RouteSchedule.js` (dias da semana + `departTime` + origem/destino/capacidade/preço); `DriverRoute.scheduleId` (aditivo); `controllers/routeSchedule.controller.js` com **`generateUpcomingRoutes`** (materializa `DriverRoute` publicadas nos próximos 14 dias, idempotente por dia) + CRUD (`create`/`list`/`update`/`toggle`/`delete`), gated por `isActiveCarrier`; rotas em `/api/routes/schedules` (top-up de ocorrências no `GET`).
- App motorista: `route.service` (listSchedules/createSchedule/toggleSchedule/deleteSchedule) + tela **`CarrierSchedulesScreen`** (criar agenda: dias chips, horário, origem/destino, preço; pausar/ativar/remover); acessível pela `CarrierScreen` (feature "Rotas recorrentes") e drawer.
- Validação: `node --check` + smoke backend OK; `npx tsc --noEmit` do app exit 0.

**T3 implementado (2026-06-05):**
- **Correção crítica:** `User.wallet.transactions.type` ganhou `route_payout` e `freight_payout` (faltavam — o release de reserva/frete falharia ao creditar o motorista em runtime).
- Backend: `models/FreightRequest.js`; escrow **generalizado** (`reserveReservation`/`releaseReservation`/`refundReservation` aceitam `opts {label, payoutType}`; aliases `reserveFreight`/`releaseFreight`/`refundFreight`); `controllers/freight.controller.js` (cliente: criar/listar/aceitar/cancelar; transportadora: incoming/cotar/recusar/coletar/entregar) + `routes/freight.routes.js` em `/api/freight`; hook `post-save` no `Ride` para `sourceType="freight"` (sync + release/refund); `carrier.listPublic` + `GET /api/carrier/public` (descoberta).
- Fluxo: cliente escolhe transportadora → solicita → transportadora **cotiza** → cliente **aceita e paga (hold)** → cria `Ride(freight)` → transportadora coleta/entrega → **release ao motorista** (`freight_payout`).
- App cliente: `FreightScreen` (abas Transportadoras/Meus fretes; solicitar; aceitar cotação; acompanhar/disputa/cancelar) no stack + drawer "Fretes / Transportadoras".
- App motorista: `CarrierFreightScreen` (fretes recebidos: cotar/recusar/coletar/entregar) via feature da `CarrierScreen` e drawer.
- Validação: `node --check` + smoke backend OK; `npx tsc --noEmit` do app exit 0.

**T4 implementado (2026-06-05):**
- Backend: `carrier.getPublicProfile` + `GET /api/carrier/public/:slug` (marca, bio, avaliações, áreas, stats e **rotas publicadas futuras** da transportadora; telefone omitido do perfil público). Lista pública já existia (`GET /api/carrier/public`).
- App cliente: `CarrierProfileScreen` (cabeçalho com marca/avaliação/áreas/bio, **compartilhar** via `Share` com link `levamais.app/t/{slug}`, **Solicitar frete** → pré-preenche a transportadora no `FreightScreen`, e **rotas disponíveis** → `RouteReserve`). A lista de transportadoras agora abre o **perfil** (profile-first).
- Validação: `node --check` + smoke backend OK; `npx tsc --noEmit` do app exit 0.

### Resumo — Modo Transportadora COMPLETO no app (T1–T4)
Motorista vira mini-transportadora: cadastra (KYC) → publica rotas avulsas e **recorrentes** → recebe **fretes sob demanda** com cotação → tem **perfil público** com link. Tudo reusa escrow/Ride/disputas. **Pendência transversal:** UI de aprovação de transportadoras no dashboard (`leva-mais-web`) — endpoints `/api/carrier/admin/*` prontos; sem a tela, a aprovação só acontece via banco (bloqueia teste real ponta a ponta).

## 10. Progresso de Implementação
- **2026-06-05 — D7/D8 concluídos e D9 parcial no app (foco "app primeiro"):** backend `/api/routes` + `routePricing.service` + escrow de reserva (`reserveReservation`/`releaseReservation`/`refundReservation`); telas motorista (Minhas Rotas/Publicar/Detalhe) e cliente (Encomendas em rota/Reservar) ligadas aos drawers. Backend `node --check`/smoke OK; app `tsc` exit 0.
