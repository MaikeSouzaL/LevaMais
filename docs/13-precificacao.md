# 13 — Regras de Precificação

## Dois Sistemas de Preços Separados

| Serviço | Arquivo | Modelo |
|---------|---------|--------|
| Entrega | `delivery-pricing.service.js` | Por veículo + multiplicadores de carga |
| Corrida | `ride-pricing.service.js` | Por categoria (`RideCategory` no banco) |

---

## Precificação de Entrega

### Fórmula Base

```
distanceKm = Google Maps Distance Matrix (coleta → destino)

Se distanceKm <= minimumKm:
    baseTotal = minimumFee
Else:
    overflowKm = distanceKm - minimumKm
    baseTotal = minimumFee + (overflowKm × pricePerKm)

total = baseTotal × multiplicadores × (1 + stopsFee)
```

### Configuração por Veículo (`PlatformConfig.vehiclePricing`)

```json
{
  "motorcycle": { "minimumKm": 3, "minimumFee": 8.00, "pricePerKm": 2.50 },
  "car":        { "minimumKm": 3, "minimumFee": 12.00, "pricePerKm": 3.00 },
  "van":        { "minimumKm": 3, "minimumFee": 20.00, "pricePerKm": 4.00 },
  "truck":      { "minimumKm": 3, "minimumFee": 35.00, "pricePerKm": 6.00 }
}
```

### Multiplicadores de Logística (`PlatformConfig.logisticsMultipliers`)

| Multiplicador | Descrição | Valor padrão |
|--------------|-----------|--------------|
| `priorityEconomic` | Entrega econômica (sem pressa) | 0.9 |
| `priorityFast` | Entrega rápida | 1.2 |
| `priorityUrgent` | Entrega urgente | 1.5 |
| `cargoSizeSmall` | Pacote pequeno (mochila) | 1.0 |
| `cargoSizeMedium` | Caixa média | 1.15 |
| `cargoSizeLarge` | Grande (móvel, geladeira) | 1.4 |
| `fragileSurcharge` | Item frágil | 1.1 |
| `helperSurcharge` | Precisa de ajudante | 1.3 |
| `weightUpTo5kg` | Até 5 kg | 1.0 |
| `weightUpTo15kg` | 5–15 kg | 1.1 |
| `weightUpTo30kg` | 15–30 kg | 1.2 |
| `weightUpTo50kg` | 30–50 kg | 1.4 |
| `weightAbove50kg` | Acima de 50 kg | 1.6 |

### Taxa por Parada Adicional
```
total += stops.length × feePerStop  (padrão: R$ 2,00 por parada)
```

### Exemplo de Cálculo (Moto, 8 km, caixa média, urgente)
```
minimumKm = 3, minimumFee = 8.00, pricePerKm = 2.50
overflowKm = 8 - 3 = 5
baseTotal = 8.00 + (5 × 2.50) = R$ 20,50
× cargoSizeMedium (1.15) = R$ 23,58
× priorityUrgent (1.5) = R$ 35,36
total = R$ 35,36
platformFee (15%) = R$ 5,30
motorista recebe bruto: R$ 35,36 (descontado separadamente)
```

---

## Precificação de Corrida

### Fontes de Dados
Configurações salvas no banco: coleção `RideCategory`.
Gerenciadas pelo admin via dashboard.

### Campos da Categoria

```js
RideCategory {
  key: "moto" | "car_economy" | "car_comfort" | "car_luxury",
  label: "Mototáxi" | "Economy" | "Confort" | "Luxury",
  pricing: {
    minimumKm: 2,
    minimumFee: 5.00,
    pricePerKm: 1.80,
    pricePerMinute: 0,          // taxa por minuto (opcional)
    feePerStop: 2.00,
    bidRangeFactor: 0.25,       // ±25% de lance permitido
    surgeMultiplierCap: 3.0     // máximo do surge
  },
  vehicleType: "motorcycle",
  isActive: true
}
```

### Fórmula Básica

```
distanceKm = Google Maps
durationMin = Google Maps

basePrice = minimumFee
distancePrice = max(0, distanceKm - minimumKm) × pricePerKm
timeFee = durationMin × pricePerMinute
stopFee = stopsCount × feePerStop
subtotal = basePrice + distancePrice + timeFee + stopFee

total = subtotal × surgeMultiplier
```

### Estimativa InDriver (Bid Range)
```
minOffer = total × (1 - bidRangeFactor)   ex: 0.75 × total
maxOffer = total × (1 + bidRangeFactor)   ex: 1.25 × total
suggestedOffer = total
```

O cliente pode propor qualquer valor dentro dessa faixa.

---

## Surge Pricing

### Quando ativa
- Alta demanda em área específica (muitos pedidos, poucos motoristas)
- Calculado por geofence (polígono ou círculo de raio)

### Como calcula
```
GET /api/rides/surge/:lat/:lng
```
- Conta corridas ativas na área no último X minutos
- Conta motoristas online na área
- Razão demanda/oferta determina o multiplicador
- Faixas: 1.0 (normal) → 1.2 → 1.5 → 2.0 → max configurável

### Exibição no App
- Badge amarelo/laranja/vermelho: "Alta demanda: 1.5x"
- Preço já aparece com surge aplicado
- Tooltip explicativo ao tocar no badge

### Heatmap
```
GET /api/rides/heatmap/:lat/:lng
```
Retorna pontos de calor para exibição no mapa (motoristas e clientes podem ver).

---

## Preço Calculado em Tempo Real

### Endpoint de cálculo de preço
```
POST /api/rides/calculate-price
{
  serviceType: "delivery",
  vehicleType: "motorcycle",
  pickup: { latitude, longitude },
  dropoff: { latitude, longitude },
  cargoSize: "medium",
  priority: 2,
  isFragile: false,
  needsHelper: false
}
→ { pricing: { total, breakdown }, distance, duration }
```

### Endpoint de categorias de corrida
```
POST /api/rides/calculate-ride-categories
{
  pickup: { latitude, longitude },
  dropoff: { latitude, longitude },
  stops: []
}
→ [{ category, label, total, eta, surgeMultiplier }, ...]
```

### Endpoint de estimativa bid
```
POST /api/rides/calculate-ride-estimate
{
  pickup: ..., dropoff: ..., vehicleType: ..., rideCategory: ...
}
→ { suggestedPrice, minPrice, maxPrice, distanceKm, durationMin }
```

---

## Descontos e Cupons

```
discountAmount = promoCode ? calculaDesconto(promo, total) : 0
finalTotal = total - discountAmount
```

Tipos de promoção:
- `fixed`: R$ X de desconto (ex: R$ 10 de desconto)
- `percentage`: X% de desconto (ex: 20% off)

Validações:
- Código válido e ativo
- Dentro do período de validade
- Limite de uso não atingido
- Valor mínimo da corrida respeitado

---

## Configuração da Plataforma

Tudo editável via admin dashboard (`PlatformConfig`):

| Config | Descrição |
|--------|-----------|
| `vehiclePricing` | Preços por veículo (entrega) |
| `logisticsMultipliers` | Multiplicadores de carga |
| `appFeePercentage` | Taxa da plataforma (%) |
| `feePerStop` | Taxa por parada extra |
| `minDriverBalance` | Saldo mínimo do motorista |
| `splitPercentage` | Split plataforma/representante |
| `cancellationRules` | Regras de multa por cancelamento |
| `surgeEnabled` | Liga/desliga surge pricing |
| `geofencingEnabled` | Liga/desliga geofencing |
