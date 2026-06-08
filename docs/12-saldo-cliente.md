# 12 — Saldo do Cliente (LevaPay)

## O que é a LevaPay

Carteira digital interna do app, similar ao saldo do Uber, Mercado Pago ou PicPay. O cliente deposita créditos e os usa para pagar corridas e entregas de forma instantânea, sem precisar digitar dados de cartão a cada pedido.

---

## Estrutura no Banco

```js
user.wallet = {
  balance: 71.74,    // saldo disponível (livre)
  held: 0,           // valor retido em escrow ativo (não disponível)
  transactions: [
    {
      type: "topup",
      amount: 50.00,
      description: "Recarga via PIX",
      createdAt: Date
    },
    {
      type: "hold",
      amount: -30.00,
      description: "Reserva para entrega #xyz",
      rideId: "...",
      createdAt: Date
    }
  ]
}

user.pendingDebt = 0  // dívida pendente (taxa de cancelamento não cobrada)
```

---

## Tipos de Transações do Cliente

| Tipo | Sinal | Quando ocorre |
|------|-------|---------------|
| `topup` | ➕ | Recarga manual |
| `hold` | ➖ | Escrow reservado (corrida aceita) |
| `release` | ➖ (do held) | Escrow liberado ao motorista (conclusão) |
| `refund_hold` | ➕ | Escrow devolvido (cancelamento) |
| `refund` | ➕ | Reembolso de qualquer tipo |
| `cancellation_fee` | ➖ | Taxa de cancelamento cobrada |
| `debt_settlement` | ➖ | Quitação de dívida pendente |
| `delivery_failed_charge` | ➖ | Cobrança por entrega com falha |

---

## Tela da Carteira

### `WalletScreen`

**Exibe:**
- Saldo disponível em destaque
- Saldo retido em escrow (se houver)
- Botão **"Recarregar"** → `DepositScreen`
- Histórico de transações paginado
- Filtros: todos, entradas, saídas

---

## Recarga do Saldo

### `DepositScreen`

**Valores sugeridos:** R$ 20, R$ 50, R$ 100, R$ 200, personalizado

**Métodos de recarga:**
1. **PIX** — QR code gerado, cliente paga pelo banco, confirmação automática
2. **Cartão de crédito** — debita do cartão cadastrado

**Endpoint:**
```
POST /api/auth/wallet/topup
{ amount: 50.00, method: "pix" | "card" }
→ { pixCode, qrCodeData }  (se PIX)
```

**Confirmação do pagamento:**
- PIX: webhook da gateway confirma → credita saldo
- Cartão: aprovação instantânea
- Fallback mock: `POST /api/.../confirm-mock` (apenas desenvolvimento)

---

## Como o Saldo é Usado para Pagar

### Fluxo de pagamento com LevaPay

```
1. Cliente escolhe LevaPay no DeliveryReview / RideSetup
2. App verifica:
   - wallet.balance >= pricing.total?
   - pendingDebt === 0?
3. Cliente seleciona oferta (selectOffer)
4. Backend:
   walletEscrow.reserve(ride):
     wallet.balance -= 30.00
     wallet.held += 30.00
     ride.payment.escrow = { status: "reserved", amount: 30.00 }
5. Corrida executada
6. Backend:
   walletEscrow.release(ride):
     wallet.held -= 30.00
     driverBalance.balance += 30.00  (motorista recebe TUDO)
     driverBalance.balance -= 4.50   (plataforma desconta a taxa do motorista)
```

---

## Escrow: Por que é Necessário

O escrow garante que:
1. O cliente tem o dinheiro antes de confirmar o motorista
2. O valor fica "travado" — cliente não pode usar esse saldo para outra coisa
3. Se a corrida for cancelada, o valor é devolvido automaticamente
4. O motorista só recebe após entregar / completar

**Analogia:** como um depósito caução de aluguel. O dinheiro existe, mas não está disponível até o cumprimento do contrato.

---

## Dívida Pendente (`pendingDebt`)

### Como surge
Quando o cliente cancela uma corrida e:
- A taxa de cancelamento não pode ser cobrada da carteira (saldo insuficiente)
- O pagamento era em dinheiro/maquininha (não havia escrow)

A taxa é registrada como dívida:
```js
user.pendingDebt += 15.00
```

### Como é quitada
**Automaticamente:**
1. Na próxima seleção de oferta com LevaPay
2. Sistema tenta `walletEscrow.settlePendingDebt(user)` antes de reservar escrow
3. Se saldo suficiente: `wallet.balance -= pendingDebt`, `pendingDebt = 0`
4. Se saldo insuficiente: bloqueia o pedido com mensagem de erro

**Manualmente:**
1. Cliente acessa `WalletScreen`
2. Vê aviso "Você tem uma pendência de R$ X"
3. Recarrega a carteira
4. Dívida é quitada automaticamente na próxima tentativa

### Efeito da Dívida
- Cliente **NÃO consegue fazer novos pedidos com LevaPay** enquanto houver dívida
- Em cash/PIX: pode fazer pedidos, mas a dívida continua acumulando

---

## Reembolsos

### Quando ocorre reembolso
1. Cancelamento pelo cliente (dentro da janela grátis)
2. Cancelamento pelo motorista
3. Cancelamento sem motorista encontrado
4. Disputa resolvida a favor do cliente

### Como é processado
```
walletEscrow.refund(ride):
    ride.payment.escrow.status = "refunded"
    wallet.held -= amount
    wallet.balance += amount
    transaction: { type: "refund_hold", amount: +30.00 }
```

O reembolso aparece imediatamente no saldo disponível.

---

## Segurança da Carteira

- Saldo máximo configurável (para limitar exposição)
- Transações auditadas (não deletáveis)
- Escrow somente para corridas/entregas: o cliente não pode fazer "hold" manual
- Todas as operações são atômicas (sem double-spend)
- Alertas por e-mail/push em recargas e movimentações significativas (planejado)
