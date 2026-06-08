# 04 — Fluxo de Corrida (Cliente)

## Visão Geral

O cliente solicita uma corrida escolhendo categoria de veículo (moto, economy, comfort, luxury) e pode usar preço fixo (Uber-style) ou lance livre (InDriver-style). Motoristas recebem a solicitação e aceitam.

---

## Dois Modelos de Corrida

### Modelo A — Preço Fixo (Uber/99 style)
O app calcula o preço. O cliente confirma. Motoristas próximos recebem notificação e o primeiro a aceitar leva a corrida.

### Modelo B — Lance Livre (InDriver style)
O cliente define um valor. Motoristas fazem contra-ofertas. O cliente escolhe qual motorista aceitar (marketplace).

---

## Fluxo Modelo A — Preço Fixo

```
HomeScreen
    ↓ toca "Corrida"
DestinationSearch      [busca destino]
    ↓
RideCategorySelect     [escolhe categoria: moto/economy/comfort/luxury]
    ↓ preço calculado por categoria
RideSetup              [confirma pickup, método de pagamento, cupom]
    ↓ POST /api/rides
SearchingDriver        [aguardando motorista aceitar]
    ↓ evento: driver-found
RideTracking           [acompanhamento em tempo real]
    ↓
RideCompleted          [avaliação]
```

---

## Fluxo Modelo B — Lance Livre (Bid)

```
HomeScreen
    ↓ toca "Propor Valor"
RideBidSetup           [define rota + valor inicial]
    ↓
RideBiddingScreen      [ajusta lance com slider/input]
    ↓ POST /api/rides
RideOffersMarketplace  [motoristas contra-ofertam]
    ↓ POST /api/rides/:id/offers/select
RideTracking           [acompanhamento]
    ↓
RideCompleted
```

---

## Telas Detalhadas

### `DestinationSearch`
- Campo de busca com autocomplete de endereços (Google Places)
- Histórico de endereços recentes
- Endereços favoritos (casa, trabalho)
- Mapa com pin arrastável para ajuste fino
- Rotas com paradas múltiplas

### `RideCategorySelect`
Exibe cards de categoria com:
- Ícone do veículo
- Nome da categoria (Moto / Economy / Comfort / Luxury)
- Capacidade de passageiros
- ETA estimado
- **Preço calculado** (via `POST /api/rides/calculate-ride-categories`)
- Faixa de preço (se surge ativo)

Selecionando uma categoria → vai para `RideSetup`.

**Categorias disponíveis:**
| Categoria | `rideCategory` | Veículo |
|-----------|---------------|---------|
| Mototáxi | `moto` | Moto |
| Economy | `car_economy` | Carro básico |
| Confort | `car_comfort` | Carro intermediário/SUV |
| Luxury | `car_luxury` | Carro premium |

### `RideSetup`
Confirmação final antes de solicitar:
- Exibe rota no mapa
- Endereço de pickup (editável com `ConfirmPickup`)
- Endereço de destino
- Paradas (se adicionadas)
- Categoria selecionada
- Preço total
- Surge multiplier (se ativo): banner amarelo "Alta demanda: 1.5x"
- **Método de pagamento:**
  - LevaPay (carteira)
  - PIX
  - Dinheiro
  - Maquininha (se motorista aceitar)
- **Cupom de desconto** (`PromoCode`)
- Finalidade da viagem (`ServicePurpose`) — ex: "Trabalho", "Lazer", "Saúde"
- Botão **"Solicitar corrida"**

### `SearchingDriver`
- Animação de busca no mapa
- "Procurando motorista próximo…"
- Contagem regressiva (padrão 5 min)
- Botão **Cancelar** (gratuito nesta fase)
- Se timeout → sugestão de aumentar área de busca ou tentar novamente (`retryRide`)

**Comportamento esperado (Uber/99):**
- Motoristas dentro do raio recebem notificação push
- O primeiro a aceitar (`POST /api/rides/:id/accept`) leva a corrida
- Status muda para `accepted`
- Cliente é notificado via WebSocket (`driver-found`)
- Navega automaticamente para `RideTracking`

### `RideTracking`
Idêntico ao `DeliveryTracking` mas para corridas.

**Estados e HUD:**
| Status | HUD exibido |
|--------|-------------|
| `accepted` | "Motorista confirmado" + dados do veículo |
| `driver_arriving` | "A caminho" + ETA + mapa com localização |
| `arrived` | "Chegou! Dirija-se ao veículo" |
| `in_progress` | "Em rota" + barra de progresso |
| `completed` | "Chegamos!" → navega para RideCompleted |

Ações disponíveis:
- 💬 Chat com motorista
- ❗ SOS (emergência)
- ❌ Cancelar (com possível taxa)
- 📍 Compartilhar link público (`/rides/track/:rideId`)

### `RideCompleted`
- Valor cobrado + método de pagamento
- Mapa com rota percorrida
- Botão "Avaliar" → `ClientRateDriver`
- Botão "Ver rota auditada" → `RouteAudit`
- Botão "Comprovante" → `Receipts`

---

## Calculadora de Preço de Corrida

Endpoint: `POST /api/rides/calculate-ride-categories`

Resposta: array de categorias com:
```json
[
  {
    "category": "moto",
    "label": "Moto",
    "basePrice": 5.00,
    "distancePrice": 3.20,
    "total": 8.20,
    "surgeMultiplier": 1.0,
    "etaMinutes": 4
  }
]
```

**Fórmula básica por categoria** (dados salvos no modelo `RideCategory` no banco):
```
basePrice = minimumFee
distancePrice = max(0, distanceKm - minimumKm) × pricePerKm
timeFee = durationMin × pricePerMinute  (se configurado)
stopFee = stopsCount × feePerStop
total = (basePrice + distancePrice + timeFee + stopFee) × surgeMultiplier
```

---

## Surge Pricing

- Ativado quando demanda supera oferta em área específica
- Calculado em `backend/src/services/surge-pricing.service.js`
- Exibido como badge "Alta demanda 1.5x" na tela de seleção de categoria
- Endpoint: `GET /api/rides/surge/:lat/:lng`
- Heatmap de demanda: `GET /api/rides/heatmap/:lat/:lng`

---

## Agendamento de Corrida

- Disponível via toggle "Agendar" no `RideSetup`
- Parâmetros: data/hora futura
- Status inicial: `scheduled`
- Motoristas podem ver corridas agendadas: `GET /api/rides/scheduled/available`
- Aceitar agendamento: `POST /api/rides/:id/accept-scheduled`

---

## Fila de Espera

Quando não há motoristas disponíveis imediatamente:
- `isWaitingInQueue: true`
- Pedido é redespachado periodicamente (`redispatchInterval` segundos, padrão 60)
- Timeout total configurável (`searchTimeoutSeconds`, padrão 300)
- Cliente pode entrar na fila: `POST /api/rides/:id/queue`
- App mostra `showSuccessQueueModal` na HomeScreen

---

## Múltiplas Paradas

- O cliente pode adicionar paradas intermediárias
- `PATCH /api/rides/:id/add-stop`
- Preço recalculado automaticamente (+R$2,00 por parada padrão)

## Alterar Destino

- Durante a corrida, cliente pode mudar destino final
- `PATCH /api/rides/:id/change-dropoff`
- Preço recalculado com diferença creditada/debitada

---

## Regras de Negócio

1. **Motorista ativo** precisa ter `driverStatus: "approved"`, estar online e com `driverBalance.balance > 0` para receber corridas.

2. **Filtro por categoria**: o backend busca motoristas com `vehicleInfo.rideCategory` compatível com a categoria selecionada pelo cliente.

3. **Rejeição**: motorista pode rejeitar (`POST /api/rides/:id/reject`). O ride é ofertado ao próximo motorista elegível. Rejeições afetam métrica de cancellationRate.

4. **Auto-aceitar**: motorista com `driverPreferences.autoAccept: true` aceita automaticamente sem precisar confirmar na tela.

5. **Raio de busca**: padrão 15 km, configurável pelo motorista (1–300 km).
