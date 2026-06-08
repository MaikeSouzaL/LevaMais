# 11 — Saldo do Motorista (driverBalance)

## Conceito

O motorista do Leva Mais opera em modelo de **pré-pagamento operacional**:
- Ele deposita um saldo na conta para poder trabalhar
- A taxa da plataforma é debitada desse saldo a cada corrida completada
- Ao mesmo tempo, recebe os valores das corridas no mesmo saldo
- Quando quiser, solicita saque do saldo acumulado

> Diferente do modelo tradicional (onde a plataforma retém a taxa direto do pagamento do cliente), aqui o motorista recebe o valor TOTAL e a plataforma debita a taxa do saldo do motorista.

---

## Estrutura do Saldo

```js
user.driverBalance = {
  balance: 146.57,             // saldo disponível atual
  totalDeposits: 500.00,       // total depositado historicamente
  totalDeductions: 87.50,      // total deduzido historicamente
  operationalCredit: 0,        // crédito concedido pela plataforma
  pendingReceivables: 0,       // valores a receber ainda não creditados
  transactions: [...]          // histórico completo
}
```

---

## Tipos de Transações

| Tipo | Sinal | Descrição |
|------|-------|-----------|
| `driver_topup` | ➕ | Depósito do motorista |
| `client_in_app_payment` | ➕ | Recebimento de corrida (PIX/app) |
| `app_fee_debit` | ➖ | Taxa da plataforma debitada |
| `cancellation_fee` | ➕ | Multa de cancelamento recebida do cliente |
| `cancellation_penalty` | ➖ | Multa aplicada ao motorista por cancelar |
| `delivery_failed_payout` | ➕ | Pagamento por entrega com falha |
| `withdrawal` | ➖ | Saque solicitado |
| `manual_adjustment` | ±  | Ajuste manual pelo admin |

---

## Fluxo de Depósito Operacional

1. Motorista acessa `DriverEarningsScreen` ou `DriverPayoutsScreen`
2. Toca "Depositar saldo"
3. Escolhe valor e método (PIX ou cartão)
4. Paga fora do app (PIX gerado) ou dentro (cartão)
5. Backend confirma → credita `driverBalance.balance`

```
POST /api/driver/balance/deposit
{ amount: 100.00, method: "pix" }
```

**Saldo mínimo obrigatório:**
- Configurável em `PlatformConfig.minDriverBalance` (ex: R$ 10,00)
- Motorista é bloqueado de receber pedidos se saldo < mínimo
- Notificação push: "Seu saldo está baixo. Deposite para continuar trabalhando"

---

## Ganhos por Corrida Completada

Quando `status` muda para `completed`, automaticamente:

```
1. Crédito do valor da corrida:
   driverBalance.balance += pricing.total
   
   Transação: { type: "client_in_app_payment", amount: 35.00, rideId: "..." }
   (para PIX/cartão)

   OU escrow liberado:
   wallet.held -= 35.00  (cliente)
   driverBalance.balance += 35.00  (motorista)

2. Débito da taxa:
   driverBalance.balance -= platformFee
   
   Transação: { type: "app_fee_debit", amount: 5.25, rideId: "..." }

3. Evento WebSocket enviado:
   balance_updated: { balance: 146.57, lastTransaction: {...} }
```

---

## Solicitação de Saque

### Tela `DriverWithdrawScreen`

1. Motorista informa:
   - Valor desejado (mín/máx configurável)
   - Chave PIX (CPF, telefone, e-mail ou chave aleatória)
2. `POST /api/driver/balance/withdrawal-request`
3. Saldo é bloqueado (não disponível para uso)
4. Admin recebe solicitação na dashboard
5. Admin processa manualmente via PIX
6. Admin marca como pago: `POST /api/driver/admin/withdrawals/:driverId/:withdrawalId/pay`
7. Motorista recebe notificação: "Seu saque de R$ 200,00 foi processado"

**Status do saque:**
```
pending → approved (admin processou) → paid
       → rejected (admin rejeitou com motivo)
```

**Modelo:** `Withdrawal`
```js
{
  userId: ObjectId,
  amount: Number,
  pixKey: String,
  status: "pending" | "approved" | "paid" | "rejected",
  requestedAt: Date,
  processedAt: Date,
  adminNote: String
}
```

---

## Histórico de Transações

### `DriverStatementScreen`

Exibe:
- Lista cronológica de todas as transações
- Filtros: por tipo (corridas, taxas, saques, depósitos)
- Filtros: por período (hoje, semana, mês, personalizado)
- Total de ganhos no período selecionado
- Total de descontos no período

**Endpoint:** `GET /api/driver/balance/history`

---

## Ganhos e Métricas

### `DriverEarningsScreen`

Exibe:
- Ganhos do dia (corridas completadas × valor líquido)
- Meta diária (se configurada)
- Gráfico de barras: últimos 7 dias
- Total da semana / mês
- Número de corridas
- Ticket médio

**Endpoint:** `GET /api/rides/earnings-history`
**Estatísticas:** `GET /api/rides/stats`

---

## Crédito Operacional

A plataforma pode conceder crédito a motoristas novos ou de alta performance:

```js
user.driverBalance.operationalCredit = 50.00
```

- Não é saldo real (não pode ser sacado)
- Permite trabalhar mesmo com saldo zerado
- Desconta automaticamente quando há ganhos

---

## Proteções e Alertas

| Situação | Ação do sistema |
|----------|----------------|
| Saldo < mínimo | Bloqueia de receber pedidos |
| Saldo zerado | Notificação push de alerta |
| Saque solicitado > saldo | Erro 400 |
| Saque acima do máximo diário | Bloqueado até próximo dia |
| Conta suspensa | Saques bloqueados |
