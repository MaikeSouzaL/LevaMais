# Fase D — Marketplace, Parceiros e Crescimento

> **Projeto:** Leva+ (Leva Mais) · **Trilha:** Marketplace (D0–D6) + Growth (D10) · **Tipo:** Plano de produto + arquitetura técnica
> **Stack:** Backend Node/Express/MongoDB (`backend/src/`) · Dashboard admin Next.js (`leva-mais-web/`) · Front separado marketplace/parceiros (`leva-mais-partner-web`, novo)
> **Status:** D0/D1 concluídos · D2 iniciado (backend/portal funcional) · próximo D3
> **Documento irmão:** `fase-d-app-rotas-maloteiro.md` (trilha App/Maloteiro) · **Índice:** `fase-d-marketplace-rotas-planejadas.md`
> **Última atualização:** 2026-06-05

---

## 1. Sumário executivo

O Marketplace transforma o Leva+ numa plataforma estilo **iFood ampliado**: restaurantes, lanchonetes, farmácias, padarias, mercados, oficinas e serviços vendem produtos/serviços por uma loja digital. O Leva+ cobra **comissão por venda concluída**, configurável por loja/categoria.

### Princípio arquitetural mestre — *Reaproveitar, não reinventar*

> **O `Ride(serviceType="delivery")` permanece como a única unidade de execução logística.** O Marketplace é um **produtor comercial de entregas**: ao ficar pronto, o pedido emite um `Ride` e observa seu ciclo de vida. Assim, despacho a motoristas próximos, PIN + foto-prova, tracking ao vivo, ETA, falha de entrega, disputas e cancelamento funcionam **sem duplicação** e sem tocar no fluxo de corrida (`RideCategory`/`ride-pricing`).

### Decisão de superfícies — app logístico, web comercial

> **O app cliente não é o canal de compra do marketplace.** A compra em lojas parceiras acontece na **web cliente** (vitrine pública/checkout). O **portal parceiro** e a web cliente nascem em um **front separado** (`leva-mais-partner-web`), não dentro de `leva-mais-web` (que é só o dashboard admin).

---

## 2. Superfícies

| Superfície | Papel no Marketplace | Base |
|---|---|---|
| **Web cliente** (Next.js) | Vitrine pública navegável; login exigido **só no checkout** | front separado `leva-mais-partner-web` |
| **Portal parceiro** (Next.js) | Sistema das empresas: loja gerencia catálogo, horários, pedidos, repasses | front separado, autentica pelo **mesmo JWT** do `User` |
| **Painel admin** (Next.js) | Parceiros, lojas, pedidos, comissões, disputas, métricas, config | `leva-mais-web/app/` (dashboard admin apenas) |
| **App motorista** (RN) | Pedido de loja aparece como **entrega** (origem na loja) | `src/` |
| **App cliente** (RN) | **Não compra no marketplace.** No máximo acompanha entrega vinculada | `src/` |

---

## 3. Mapa de reuso da infraestrutura existente

| Infra existente | Arquivo | Reuso |
|---|---|---|
| **Escrow LevaPay** (`reserve`/`release`/`refund`/`settleFailedDelivery`) | `services/walletEscrow.service.js` | Hold no checkout; release na conclusão; estorno; falha |
| **Despacho de entrega** (`dispatchRideToNearbyDrivers` + `DriverLocation.findNearby`) | `controllers/ride.controller.js` | Pedido de loja vira `Ride` e usa o mesmo matching |
| **PIN + foto-prova** (`Ride.details.*Pin`, `Ride.proofs`) | `Ride.js` | Coleta na loja e entrega ao cliente |
| **Tracking ao vivo + ETA** (`driver-location-updated`, `RideTrackPoint`) | `driverLocation.controller.js` | Acompanhamento do pedido |
| **Falha de entrega** (`delivery_failed`, `settleFailedDelivery`) | `Ride.js` | Pedido não entregue |
| **Depósitos Stripe PIX/boleto** | `payment.controller.js` | Abastecer carteira do cliente p/ checkout |
| **Disputas** (`/api/disputes`) | `Dispute.js` | Disputa de pedido via `rideId` vinculado |
| **Cupons** (`/api/promotions/:code/validate`) | `Promotion.js` | Cupom no checkout (`serviceTypes` + `marketplace`) |
| **KYC manual via dashboard** | `User.js`, `auth.controller.js` | KYC de parceiro (mesmo padrão, sem API biométrica) |
| **Carteira/saque** (`User.wallet`, `Withdrawal.js`) | `User.js` | Repasse e saque do parceiro |
| **Auth** (`authenticateToken`, `requireAdmin`) | `auth.middleware.js` | Portal e admin sem novo auth |
| **Config** (`PlatformConfig`) | `PlatformConfig.js` | Campos `marketplace.*` |

---

## 4. Roadmap (D0–D6 + D10)

| Pacote | Nome | Valor entregue | Depende de | Risco | Status |
|---|---|---|---|---|---|
| **D0** | Fundação de dados + correções de contrato | Modelos/contratos prontos | — | Baixo | ✅ |
| **D1** | Onboarding de Parceiro + KYC + Comissão | Admin cadastra/aprova loja e define comissão | D0 | Médio | ✅ backend+admin |
| **D2** | Catálogo & Portal Parceiro separado | Parceiro monta cardápio/horários | D1 | Médio | 🟡 backend+portal iniciados |
| **D3** | Web Marketplace + Carrinho (sem pagar) | Cliente navega lojas na web pública | D2 | Médio | 🟡 backend público pronto; web pendente |
| **D4** | Checkout + Pagamento + Comissão (escrow) | Pedido pago; comissão retida | D3, D1 | **Alto** | 🟡 backend (`createOrder`+escrow) pronto; UI pendente |
| **D5** | Fulfillment (StoreOrder → entrega) | Pedido vira entrega; estados sincronizados | D4 | **Alto** | 🟡 backend (`ready`→Ride+despacho, sync, release/payout) pronto; UIs pendentes |
| **D6** | Pós-venda: avaliações, disputas, repasses, SLA | Confiança, liquidação, suporte | D5 | Médio | 🔴 parcial (payout/refund via hook); avaliações/relatórios pendentes |
| **D10** | Growth & Analytics (transversal) | Indicação, cupom unificado, dashboards | D4, D5 | Médio | 🔴 pendente |

**Caminho crítico:** `D0 → D1 → D2 → D3 → D4 → D5 → D6`.

### Detalhe por pacote

**D0 — Fundação** *(compartilhada com a trilha App/Maloteiro)*. Modelos Mongoose + aditivos em `Ride`/`Promotion`/`PlatformConfig`. ✅

**D1 — Onboarding de Parceiro + KYC + Comissão.** APIs admin de parceiro (CRUD, status, KYC manual), comissão por loja/categoria com auditoria. Admin: menu Parceiros + comissão. ✅

**D2 — Catálogo & Portal Parceiro separado.** APIs de produtos/adicionais/combos/horários/disponibilidade; regra "só vende se ativo e dentro do horário"; portal web próprio (`leva-mais-partner-web`, JWT + `requirePartnerOwner`). 🟡

**D3 — Web Marketplace + Carrinho.** APIs públicas (categorias, lojas geo, cardápio, busca, `cart/validate`); web cliente pública sem login até o checkout. 🟡

**D4 — Checkout + Pagamento + Comissão (escrow).** `StoreOrder`, checkout com login, **hold** via escrow, cupom, comissão (cobrada só na conclusão). 🟡

**D5 — Fulfillment.** Máquina de estados; ao `ready` cria `Ride(delivery)` (loja=coleta); captura de comissão na conclusão; fila no portal; app motorista exibe pedido de loja. 🟡

**D6 — Pós-venda.** Avaliações de loja/pedido; disputa de `StoreOrder`; relatório de repasses; SLA. 🔴

**D10 — Growth & Analytics.** Indicação (`Referral`) com recompensa em carteira após 1ª conclusão paga; cupom unificado; agendamento real; analytics por cidade/categoria/parceiro. 🔴

---

## 5. Modelos de dados (Mongoose)

> Criados no **D0**. Geo em GeoJSON `Point` + `2dsphere`; monetário via `toMoney`.

#### `Category`
```js
{ slug (unique, lowercase), name, kind: ["store","product"], parentId: ref Category,
  icon (Lucide), order, defaultCommissionPct: Number|null, active }
```

#### `Partner`
```js
{ ownerUserId: ref User (login do portal), legalName, tradeName, document, documentHash,
  contact: { email, phone, whatsapp },
  kyc: { status: ["none","pending","approved","rejected","suspended"], documents{...}, rejectionReason, reviewHistory[] },
  payout: { method: ["wallet","pix"], pixKey, holdDays },
  status: ["active","paused","under_review","blocked"], statusReason }
```

#### `Store`
```js
{ partnerId: ref Partner, name, slug (unique), categoryId: ref Category, description, logo, cover,
  address{...}, location: { type:"Point", coordinates:[lng,lat] } (2dsphere), cityId: ref City,
  commissionPct: Number|null, hours:[{weekday,open,close}], isOpenManualOverride,
  prepTimeMinutes, minOrderValue, deliveryMode: ["platform","pickup","both"],
  rating: { average, count }, tags, status: ["active","paused","under_review","blocked"] }
```

#### `StoreProduct`
```js
{ storeId: ref Store, categoryId: ref Category, name, description, photo, basePrice,
  unit: ["unit","kg","g","l","ml","service"], sku,
  modifierGroups: [{ name, min, max, options:[{name,priceDelta,available}] }],  // genérico p/ 4 categorias
  combo: { isCombo, items:[{productId,quantity}] }, requiresConfirmation, available, stock, order }
// índices: {storeId,available,order}; text(name,description)
```

#### `StoreOrder`
```js
{ orderNumber (unique), clientId, storeId, partnerId,
  items: [{ productId, name, quantity, basePrice, modifiers:[{groupName,optionName,priceDelta}], lineTotal, notes }],
  pricing: { subtotal, deliveryFee, serviceFee, discountAmount, promotionCode, total, currency,
             commissionPct, commissionAmount, partnerPayout },
  payment: { method, escrow:{ status, amount, reservedAt, releasedAt, refundedAt }, payoutStatus, payoutAt },
  rideId: ref Ride, deliveryMode: ["platform","takeaway"], address{...}, scheduledFor,
  status: ["pending_payment","placed","accepted","preparing","ready","awaiting_courier","in_delivery","delivered","completed","rejected","cancelled","refunded"],
  statusHistory[], sla{...}, rating{ stars, comment, createdAt } }
```

#### `Referral` (D10)
```js
{ code (unique), referrerId, refereeId, status: ["pending","qualified","rewarded","expired"],
  rewardAmount, qualifyingRefId, qualifyingRefType, rewardedAt }
```

### Máquina de estados — `StoreOrder`
`pending_payment` → (hold OK) `placed` → (parceiro aceita) `accepted` → `preparing` → (pronto, **cria `Ride(delivery)`**) `ready` → `awaiting_courier` → (coleta) `in_delivery` → (entrega) `delivered` → (**release + payout parceiro**) `completed`.
Ramos: `placed → rejected` (refund); `in_delivery → refunded` (`settleFailedDelivery`); `accepted/preparing → cancelled`.

---

## 6. Fluxo financeiro

### Resolução da comissão (Store > Category > Config)
```
commissionPct = Store.commissionPct
             ?? Category.defaultCommissionPct
             ?? PlatformConfig.marketplace.defaultCommissionPct   // default 12%
```
`PlatformConfig.marketplace`: `{ defaultCommissionPct, commissionBase: "subtotal", payoutHoldDays, minOrderGlobal, marketplaceEnabled (gate, default false) }`.

### Fluxo do `StoreOrder`
| Evento | Ação | Mecanismo |
|---|---|---|
| Checkout (`pending_payment`) | **Hold** do `total` | `walletEscrow.reserveOrder(order)` |
| Cupom | Valida em `/api/promotions/:code/validate`; abate `discountAmount` | `Promotion` |
| Parceiro recusa / cancela | **Refund** | `walletEscrow.refundOrder(order)` |
| `ready` → `Ride(delivery)` | Frete pelo motor de entrega; sem novo hold | `Ride` |
| `delivered → completed` | **Release**: baixa held; credita parceiro (`partnerPayout = subtotal − commissionAmount`); `commissionAmount` = receita | `walletEscrow.releaseOrder` |
| Falha de entrega | Cliente paga, plataforma absorve | `walletEscrow.settleFailedDelivery` |

> **Repasse ao parceiro:** crédito em `User.wallet` do `Partner.ownerUserId` com `type="marketplace_payout"`, **idempotente por `orderId`**. Implementado no hook `post-save` do `Ride` (`releaseOrder`/`refundOrder` na sincronização Ride→StoreOrder). Saque reusa `Withdrawal`.

---

## 7. APIs REST por superfície

### 7.1 Web Cliente — Marketplace (`/api/marketplace`)
| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/categories` · `/stores` · `/stores/:slug` · `/stores/:id/products` · `/products/:id` | público | Vitrine/catálogo (geo + texto) |
| POST | `/cart/validate` | público | Recalcula carrinho |
| POST | `/orders` | token | Cria pedido + **hold escrow** |
| GET | `/orders` · `/orders/:id` | token | Lista / acompanhamento |

### 7.2 Portal Parceiro separado (`/api/partner`, JWT + `requirePartnerOwner`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/onboarding` | Cria `Partner` (envia KYC) |
| GET | `/me` | Dados + KYC + lojas |
| GET/PUT | `/stores/:storeId` · PATCH `/stores/:storeId/availability` | Edita loja/disponibilidade |
| GET/POST/PUT/DELETE | `/stores/:storeId/products` · `/products/:productId` | CRUD catálogo |
| GET | `/orders?status=` | Fila de pedidos |
| POST | `/orders/:id/{accept,reject,preparing,ready}` | Transições; `ready` **dispara o `Ride(delivery)`** |

### 7.3 Admin — Marketplace (`/api/admin/marketplace`, `requireAdmin`)
| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/partners` · GET `/partners/:id` | Lista/cria/detalha parceiro |
| PATCH | `/partners/:id/kyc` · `/partners/:id/status` | Aprovar/rejeitar/suspender; pausar/bloquear |
| GET/POST/PATCH | `/categories` · `/categories/:id` | Categorias + comissão padrão |
| GET/POST | `/stores` · PATCH `/stores/:id/status` · `/stores/:id/commission` | Lojas + status + comissão |
| GET | `/commission/resolve?storeId=` | Preview da comissão efetiva |

---

## 8. Vínculo Pedido → Entrega e tempo real

Disparado em **`preparing → ready`**: cria `Ride` com **loja como ponto de coleta**, `sourceType="marketplace"`, `sourceRefId=order._id`, entra no despacho normal. O escrow já está no pedido — o Ride não re-holda. Hook `post-save` do `Ride` sincroniza Ride→StoreOrder e dispara release/refund na conclusão:

| Ride status | StoreOrder status |
|---|---|
| `accepted`/`driver_arriving` | `awaiting_courier` |
| `in_progress` (pós-coleta) | `in_delivery` |
| `completed` | `delivered → completed` (release + payout) |
| `delivery_failed` | `refunded` (`settleFailedDelivery`) |

**Tempo real:** cliente recebe stream do Ride vinculado. **Descoberta geo:** `$near` em `Store.location` + `cityId` + `status:"active"`; busca textual via índice `text`. **Notificações:** `order.placed/status_changed/courier_assigned`, `partner.kyc_reviewed`, `payout.released`.

---

## 9. Novas funcionalidades (competir com iFood / Lalamove)

| Funcionalidade | Apoio | Pacote |
|---|---|---|
| Onboarding/KYC de parceiro (manual via dashboard) | espelha `driverDocuments`/`reviewHistory` | D1 |
| Comissão por categoria com override por loja | precedência Store > Category > Config | D1 |
| Avaliações + SLA de loja | `StoreOrder.rating` → `Store.rating` | D6 |
| Promoções por loja | `Promotion` + vínculo `storeId`/`categoryId` | D6/D10 |
| Pedidos agendados | `StoreOrder.scheduledFor` + job | D10 |
| Substituição de itens em mercado | estado intermediário no `StoreOrder` | D5 |
| Liquidação & notas (extrato de repasse) | `marketplace_payout` + relatório admin | D6 |
| Indicação + cashback em carteira | `Referral` + `wallet.transactions` | D10 |
| Analytics por cidade/categoria/parceiro | endpoint `/metrics?by=` | D10 |

---

## 10. Estado de implementação

**Backend (forte):** `marketplace.controller` (público + `createOrder` com escrow + comissão), `partner.controller` + `partnerOrder.controller` (portal + fulfillment `accept/reject/preparing/ready`→Ride+despacho), `marketplaceAdmin.controller` (D1), `commission.service`. Hook `post-save` do `Ride` sincroniza StoreOrder + release/refund.

**Frontend (gaps):**
- Admin web: só `app/marketplace/partners` existe; **faltam** Comissões, Pedidos, Repasses.
- Portal parceiro (`leva-mais-partner-web`): iniciado; **falta** completar fila de pedidos/operação.
- Web cliente pública (D3/D4): **vitrine + carrinho + checkout pendentes**.

**Dívidas técnicas:**
- `partnerOrder.readyOrder` usa `platformFee` fixo **0.15 hardcoded** — deve ler `PlatformConfig.appFeePercentage`.
- D6: avaliações de loja, relatório de repasses e SLA ainda não implementados (release/refund já saem do hook).

---

## 11. Riscos e premissas
- **Pagamento/liquidação (D4–D6):** maior risco — reusar escrow/Stripe validados; idempotência em checkout/captura; testes de falha.
- **Concorrência de estados (D5):** máquina de estados idempotente; fonte única no backend.
- Comissão por venda concluída; **só capturada na conclusão**.
- Parceiros usam portal web próprio separado de `leva-mais-web`; cliente compra pela web pública.
- Rollout gated por `PlatformConfig.marketplace.marketplaceEnabled` (default false).

---

## 12. Progresso de Implementação
- **2026-06-04 — D0** (fundação): modelos + aditivos + `PlatformConfig.marketplace.*`. ✅
- **2026-06-04 — D1**: `/api/admin/marketplace` (parceiros/KYC/status/categorias/lojas/comissão); `POST /stores`, `PATCH /stores/:id/status`; loja só ativa com parceiro `active` + KYC `approved`; `documentHash` anti-duplicidade; painel `/marketplace/partners` + menu Parceiros na Sidebar. Validação `node --check`/`tsc`/`npm run build`/smoke OK. ✅
- **2026-06-04 — D2** (iniciado): `/api/partner` (JWT comum), onboarding + `resolvePartner` + catálogo operacional; front separado `leva-mais-partner-web` (login JWT, operação da loja, catálogo). 🟡
- **2026-06-05 — auditoria:** backend D3/D4/D5 também presentes (público/checkout-escrow/fulfillment-Ride). Gaps concentrados no frontend (admin, portal, web cliente) + dívida do `platformFee` hardcoded.
