# 07 — Cancelamentos e Taxas

## Quando é Possível Cancelar

O pedido pode ser cancelado enquanto o status for:

```
scheduled | requesting | payment_pending |
driver_assigned | accepted | driver_arriving | arrived | in_progress
```

Após `completed` ou `delivery_failed`, o cancelamento não é mais possível.

---

## Fases de Cancelamento

O valor da multa depende de **quando** o cliente cancela:

| Fase | Status que a caracteriza | Multa padrão |
|------|--------------------------|--------------|
| **Antes da coleta** | `requesting` até `accepted` | 10% do total (mín R$5, máx R$50) |
| **Depois que motorista está a caminho** | `driver_arriving`, `arrived` | 50% do total (mín R$20, máx R$200) |
| **Em andamento** | `in_progress` | Configurável (padrão desabilitado) |

> Todas as regras são configuráveis em `PlatformConfig.cancellationRules` pelo admin.

---

## Janela Grátis (Free Window)

**Modelo InDriver:** após o motorista aceitar, o cliente tem **2 minutos** para cancelar sem multa.

Regra implementada em `computeBidCancellationFee`:
```
if (elapsedSec <= freeWindowSec)  → sem taxa
```
`freeWindowSec` padrão = 120 segundos (configurável).

**Exceção:** entrega pós-coleta (`in_progress`) **não tem janela grátis** — o motorista já coletou o pacote e precisará devolver.

---

## Cancelamento pelo Cliente

### Tela `ClientCancelRide`
1. Cliente toca "Cancelar" no tracking
2. App exibe motivo de cancelamento
3. Se há taxa: navega para `CancelFee`

### Tela `CancelFee`
Exibe:
- Valor da taxa de cancelamento
- Detalhamento (% do total)
- Como será cobrada (carteira ou dívida pendente)
- Botão **"Confirmar cancelamento e pagar taxa"**
- Botão **"Voltar"** (desiste de cancelar)

Endpoint:
```
POST /api/rides/:rideId/cancel
{ reason: "mudei_de_ideia" }
```

---

## Como a Taxa é Cobrada do Cliente

```
Se payment.method === "wallet" && wallet.held > 0:
    → desconta do escrow (wallet.held)
    → parte vai para driverBalance (driverShare)
    → parte vai para a plataforma (platformShare)

Else:
    → registra como pendingDebt no usuário
    → na próxima corrida, sistema tenta quitar automaticamente
    → se tiver saldo LevaPay, desconta automaticamente
```

**Split da taxa de cancelamento:**
- 80% para o motorista (compensação pelo tempo perdido)
- 20% para a plataforma

---

## Cancelamento pelo Motorista

O motorista também pode cancelar. Regras:

```
POST /api/rides/:rideId/cancel
{ by: "driver", reason: "..." }
```

| Situação | Conseqüência |
|----------|-------------|
| Antes de aceitar | Sem multa — simplesmente rejeita |
| Após aceitar (dentro da janela grátis) | Sem multa |
| Após aceitar (fora da janela) | Multa debitada do `driverBalance` do motorista |
| Cancelamento excessivo | Afeta `cancellationRate`, pode suspender conta |

---

## Cancelamento por Entrega com Falha (`delivery_failed`)

Diferente de um cancelamento comum. Ocorre quando:
- Destinatário ausente (`recipient_absent`)
- Endereço errado (`wrong_address`)
- Destinatário recusou (`refused`)
- Local inacessível (`inaccessible`)

**O que acontece:**
```
POST /api/rides/:rideId/delivery-problem
    ↓
ride.status = "delivery_failed"
ride.deliveryFailure = { reason, reportedAt, photoUrl, note }
    ↓
Cliente é cobrado pelo percurso completo
    deliveryFailure.clientCharged = pricing.total × (1 + returnBonus)
    deliveryFailure.chargedVia = "wallet_hold" | "pending_debt"
    ↓
Motorista recebe pagamento total + bônus de devolução
    deliveryFailure.driverPaid = total × (1 + bonus)
```

---

## Cancelamento sem Motorista (`cancelled_no_driver`)

Quando o timeout de busca expira sem motorista disponível:
- Status → `cancelled_no_driver`
- **Sem taxa** para o cliente (não é culpa dele)
- Escrow estornado automaticamente
- Notificação push: "Não encontramos um motorista. Tente novamente."

---

## Histórico de Status

Cada mudança de status é registrada automaticamente:
```js
ride.statusHistory = [
  { status: "requesting", timestamp: "2026-06-08T10:00:00" },
  { status: "accepted",   timestamp: "2026-06-08T10:02:30" },
  { status: "cancelled_by_client", timestamp: "2026-06-08T10:04:00" }
]
```

---

## Configuração das Regras de Cancelamento

Editável pelo admin via dashboard:

```json
{
  "cancellationRules": {
    "beforePickup": {
      "enabled": true,
      "feePercentage": 10,
      "minFee": 5,
      "maxFee": 50,
      "requireSupport": false
    },
    "afterPickup": {
      "enabled": true,
      "feePercentage": 50,
      "minFee": 20,
      "maxFee": 200,
      "requireSupport": true
    },
    "duringDelivery": {
      "enabled": false,
      "feePercentage": 80,
      "minFee": 30,
      "maxFee": 500
    }
  },
  "freeWindowSec": 120
}
```

---

## Disputa / Contestação

Modelo `Dispute` disponível para situações em que cliente ou motorista contestam uma cobrança.

Endpoint: `POST /api/disputes`

Fluxo:
1. Usuário abre disputa com evidências
2. Admin analisa
3. Reembolso parcial/total ou manutenção da cobrança
