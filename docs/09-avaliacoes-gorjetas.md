# 09 — Avaliações e Gorjetas

## Sistema de Avaliação Bidirecional

Assim como Uber e 99, o Leva Mais tem avaliação nos dois sentidos:
- **Cliente avalia motorista** (estrelas + comentário)
- **Motorista avalia cliente** (estrelas + comentário)

---

## Avaliação do Cliente → Motorista

### Quando é feita
Após o status mudar para `completed`, o cliente é direcionado para `ClientRateDriver`.

### Tela `ClientRateDriver`
- Parâmetros: `{ rideId, driverName?, serviceType? }`
- 5 estrelas (1–5, obrigatório)
- Tags rápidas (opcionais):
  - Positivas: "Pontual", "Cuidadoso com a carga", "Comunicativo", "Veículo limpo"
  - Negativas: "Atrasou", "Veículo sujo", "Mal educado", "Dirigiu mal"
- Comentário livre (opcional, max 500 chars)
- Botão **"Dar gorjeta"** → `TipDriver`

**Endpoint:**
```
POST /api/rides/:rideId/rate-driver
{
  stars: 5,
  comment: "Excelente, muito cuidadoso!",
  tags: ["Cuidadoso com a carga", "Pontual"]
}
```

### Nota: avaliação pode ser pulada
- Cliente pode tocar "Pular" e ir para home
- Avaliação pode ser feita depois pelo histórico (`OrderDetails`)

---

## Avaliação do Motorista → Cliente

### Quando é feita
Após completar a corrida, motorista pode avaliar na `RideCompletedDriverScreen` ou `DriverRateClientScreen`.

### Campos
- 1–5 estrelas
- Tags: "Pontual", "Educado", "Fácil de localizar", "Pacote bem embalado"
- Comentário opcional

**Endpoint:**
```
POST /api/rides/:rideId/rate-client
{
  stars: 4,
  comment: "Cliente aguardou bem"
}
```

---

## Persistência das Avaliações

Salvas diretamente no documento `Ride`:
```js
ride.rating = {
  clientRating: {        // avaliação do cliente pelo motorista
    stars: 4,
    comment: "...",
    tips: 5.00,
    createdAt: Date
  },
  driverRating: {        // avaliação do motorista pelo cliente
    stars: 5,
    comment: "...",
    createdAt: Date
  }
}
```

E acumuladas no perfil do usuário avaliado:
```js
user.ratingStats = {
  averageStars: 4.87,
  totalRatings: 234,
  starDistribution: { "1": 2, "2": 5, "3": 20, "4": 80, "5": 127 }
}
```

**Rating inicial:** 5.0 (virtual, até ter avaliações reais)

---

## Gorjeta (Tip)

### Tela `TipDriver`
- Parâmetros: `{ rideId, driverName?, serviceType? }`
- Valores sugeridos: R$ 2, R$ 5, R$ 10, personalizado
- Pago via LevaPay (desconta da carteira do cliente)
- Creditado diretamente no `driverBalance` do motorista

**Endpoint:**
```
POST /api/rides/:rideId/tip
{ amount: 5.00 }
```

**O que acontece:**
1. `wallet.balance -= amount` (cliente)
2. `driverBalance.balance += amount` (motorista)
3. Evento WebSocket `balance_updated` enviado ao motorista
4. Registro na transação com tipo `"tip"` em ambos

---

## Exibição de Avaliação

### Para o Cliente
- No `RideOffersMarketplace`: estrelas do motorista ao lado do nome
- No `OrderDetails`: avaliação que ele deu e a que recebeu

### Para o Motorista
- `DriverRatingsScreen`: gráfico de distribuição + lista de comentários
- `DriverRideDetailsScreen`: avaliação de cada corrida
- No HUD: média atual exibida discretamente

---

## Efeitos das Avaliações

### Para o Motorista
- Clientes com má avaliação podem aparecer com ranking menor no marketplace
- Motoristas com rating abaixo de limiar mínimo (ex: < 4.0) podem ser suspensos temporariamente
- Rating exibido nos cards de oferta — influencia escolha do cliente

### Para o Cliente
- Motoristas podem recusar clientes com rating muito baixo (futuro)
- Histórico de avaliações acessível para moderação

---

## Fluxo Completo Pós-Corrida

```
status: completed
    ↓
[Motorista] RideCompletedDriverScreen
    → ganhos dessa corrida
    → [Avaliar cliente] → DriverRateClientScreen

[Cliente] RideCompleted
    → resumo da viagem
    → [Avaliar motorista] → ClientRateDriver
        → [Dar gorjeta] → TipDriver
    → [Ver comprovante] → Receipts
    → [Nova corrida]
```

---

## Janela de Avaliação

- Avaliações podem ser feitas até **72 horas** após a conclusão
- Após esse prazo, a opção de avaliar some do histórico
- Uma vez enviada, a avaliação **não pode ser editada** (integridade do sistema)
