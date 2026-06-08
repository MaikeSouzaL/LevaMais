# 06 — Pagamentos

## Métodos Disponíveis

| Método | `payment.method` | Quem paga | Quando |
|--------|-----------------|-----------|--------|
| **LevaPay (Carteira)** | `wallet` | Cliente (débito na carteira) | No momento da seleção da oferta (escrow) |
| **PIX** | `pix` | Cliente (QR code) | Após aceite da oferta |
| **Dinheiro** | `cash` | Cliente ao motorista | Presencialmente, na entrega |
| **Maquininha** | `card` | Cliente ao motorista | Presencialmente, via cartão físico |

---

## 1. LevaPay — Carteira Digital do Cliente

### O que é
Carteira interna do app (similar ao saldo do Uber ou Mercado Pago). O cliente deposita saldo e usa para pagar corridas sem fricção — sem digitar senha ou aguardar QR code.

### Estrutura no banco
```js
user.wallet = {
  balance: 71.74,     // disponível
  held: 15.00,        // retido em escrow (não disponível)
  transactions: [...]
}
```

### Como recarregar
1. Cliente acessa `WalletScreen` (aba Carteira)
2. Escolhe valor (ex: R$50, R$100, personalizado)
3. Paga via PIX ou cartão de crédito
4. `POST /api/auth/wallet/topup`
5. Saldo é creditado após confirmação do pagamento

Tela: `DepositScreen`

### Como usar para pagar
1. Cliente seleciona "LevaPay" como método de pagamento no `DeliveryReview` / `RideSetup`
2. O app verifica se há saldo suficiente
3. No momento de selecionar a oferta (`selectOffer`), o **escrow** é reservado automaticamente
4. Após conclusão, escrow é liberado ao motorista

### Escrow (retenção)
Mecanismo de segurança equivalente ao "hold" de cartão de crédito.

**Fluxo:**
```
selectOffer chamado pelo cliente
    ↓
walletEscrow.reserve(ride)
    wallet.balance -= amount
    wallet.held += amount
    ride.payment.escrow.status = "reserved"
    ride.payment.escrow.amount = total
    ↓
Corrida executada
    ↓
status = "completed"
    ↓
walletEscrow.release(ride)
    wallet.held -= amount
    driverBalance.balance += amount  (valor TOTAL, sem desconto da taxa)
    ↓
Taxa da plataforma:
    driverBalance.balance -= platformFee  (debitado separadamente)
```

**Cancelamento:**
```
walletEscrow.refund(ride)
    wallet.held -= amount
    wallet.balance += amount
    ride.payment.escrow.status = "refunded"
```

**Dívida pendente**: se cliente tem `pendingDebt > 0`, o sistema tenta quitar antes de reservar o escrow. Se não conseguir, bloqueia a seleção da oferta.

### Verificação de Saldo
Antes do escrow:
1. Verifica se `wallet.balance >= total`
2. Verifica se cliente não tem dívida pendente
3. Se saldo insuficiente → erro 400 com `required` e `available`

---

## 2. PIX

### Fluxo
```
Cliente seleciona oferta com PIX
    ↓
Motorista aceito → POST /api/rides/:id/pix-payment
    ↓
QR code gerado (mock em desenvolvimento)
    ↓
Cliente paga via app bancário
    ↓
Webhook confirma pagamento
    ↓
ride.payment.status = "completed"
    ↓
Motorista pode iniciar execução
```

**Endpoints:**
```
POST /api/rides/:rideId/pix-payment         → cria QR code
POST /api/rides/:rideId/pix-payment/confirm-mock  → confirma pagamento (desenvolvimento)
```

**Nota:** em produção, o webhook de confirmação virá da gateway de pagamentos real.

---

## 3. Dinheiro (Cash)

- Cliente paga diretamente ao motorista ao final da corrida/entrega
- `ride.payment.status = "pending"` (aguardando pagamento físico)
- Após conclusão da corrida, status muda para `"completed"`
- **Taxa da plataforma** é debitada do `driverBalance` do motorista (ele precisa ter saldo suficiente)
- Se motorista não tiver saldo → bloqueado de receber corridas cash

---

## 4. Cartão / Maquininha

- Motorista usa maquininha física (POS)
- Fluxo similar ao dinheiro (pagamento presencial)
- Motorista precisa configurar: `driverPreferences.acceptsCardMachine: true`
- Taxa da plataforma debitada do `driverBalance`

---

## Taxa da Plataforma (Platform Fee)

### Regra fundamental
> O motorista recebe o **valor TOTAL** da corrida. A taxa da plataforma é sempre debitada do saldo pré-pago do motorista (`driverBalance`), nunca do valor da corrida.

### Cálculo
```
platformFee = pricing.total × (appFeePercentage / 100)
```
`appFeePercentage` configurado em `PlatformConfig` (banco de dados, editável pelo admin).

### Exemplo
```
Entrega: R$ 35,00
Taxa da plataforma: 15% = R$ 5,25

Crédito no driverBalance: + R$ 35,00
Débito no driverBalance: - R$ 5,25
Resultado líquido motorista: + R$ 29,75
```

### Tipos de transação no `driverBalance`
| Tipo | Descrição |
|------|-----------|
| `client_in_app_payment` | Pagamento PIX/cartão creditado |
| `app_fee_debit` | Taxa da plataforma debitada |
| `driver_topup` | Depósito operacional do motorista |
| `cancellation_fee` | Multa de cancelamento recebida |
| `delivery_failed_payout` | Pagamento por entrega com falha (devolução) |
| `withdrawal` | Saque solicitado |

---

## Split de Receita (Representantes)

Para cidades com representante comercial:
```
splitDetails = {
  platformConfigUsed: 15,    // % total
  totalAppFee: 5.25,
  platformShare: 2.625,      // 50% para a plataforma
  representativeShare: 2.625 // 50% para o representante
}
```
Configurável em `PlatformConfig.splitPercentage`.

---

## Cupons de Desconto

- Aplicados no `RideSetup` ou `DeliveryReview`
- Tipos: `fixed` (R$ X de desconto) ou `percentage` (X% de desconto)
- Validados no backend ao criar a corrida
- Limitados por uso (por usuário ou total)

Endpoint: `GET /api/promotions`
Tela: `CouponsScreen`, `PromoCode`

---

## Cartões de Crédito/Débito (via Gateway)

- Cadastrados em `AddPaymentMethodScreen`
- Armazenados como tokens (nunca dados brutos do cartão)
- `POST /api/auth/payment-methods` — adicionar
- `DELETE /api/auth/payment-methods/:id` — remover
- `PATCH /api/auth/payment-methods/:id/default` — definir padrão

---

## Comprovantes e Recibos

- Gerado após conclusão da corrida
- NFS-e simulada: `GET /api/rides/:rideId/nfse`
- Tela: `ReceiptsScreen`
- Contém: origem, destino, distância, valor, método, data, motorista

---

## Pagamento de Taxas de Cancelamento

Ver detalhes completos em [07-cancelamentos-taxas.md](./07-cancelamentos-taxas.md).

**Resumo:**
- Taxa cobrada via `wallet` (debitada da LevaPay) se disponível
- Se sem saldo → registrada como `pendingDebt`
- `pendingDebt` é quitada na próxima corrida com saldo ou depósito manual
