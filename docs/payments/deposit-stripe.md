# Deposito LevaPay (Stripe) - Contrato de API

Este documento descreve os **endpoints que o backend deve expor** para que a
tela `DepositScreen` (Pix + Cartao) funcione ponta a ponta. O cliente Expo ja
esta pronto; basta o backend responder corretamente os 3 endpoints abaixo.

## Visao geral

```
[Leva_Mais (Expo)]
  |  createStripeIntent(amount, currency)
  |    -> POST /api/payments/deposit/stripe/intent
  |       -> server: stripe.paymentIntents.create({...})
  |       -> server: salva registro pendente no DB
  |       -> responde { paymentIntentId, clientSecret, amount, currency, status, publishableKey }
  |
  |  confirmStripePayment(paymentIntentId)
  |    -> POST /api/payments/deposit/stripe/confirm
  |       -> server: stripe.paymentIntents.retrieve(id)
  |       -> se status === "succeeded": credita saldo LevaPay
  |       -> responde { paymentIntentId, status, message }
  |
  |  cancelStripeIntent(paymentIntentId)        (opcional)
  |    -> POST /api/payments/deposit/stripe/cancel
  |       -> server: stripe.paymentIntents.cancel(id)
  |
  |  getPixDepositStatus(transactionId)          (polling 4s)
  |    -> GET  /api/payments/deposit/pix/:transactionId
```

## 1. POST /api/payments/deposit/stripe/intent

Cria um PaymentIntent. O backend eh quem fala com o Stripe (chave secreta
nunca eh exposta ao app).

**Request body**
```json
{
  "amount": 5000,
  "currency": "brl",
  "purpose": "levapay_topup"
}
```
- `amount` ja vem em **centavos** (regra Stripe).
- `purpose` eh uma string livre para rastreio.

**Backend (Node)**
```js
const intent = await stripe.paymentIntents.create({
  amount: req.body.amount,
  currency: req.body.currency,
  automatic_payment_methods: { enabled: true },
  metadata: {
    userId: req.user.id,
    purpose: req.body.purpose,
  },
});

await db.deposits.insert({
  paymentIntentId: intent.id,
  userId: req.user.id,
  amount: intent.amount,
  currency: intent.currency,
  status: intent.status,
  provider: "stripe",
  createdAt: new Date(),
});

res.json({
  paymentIntentId: intent.id,
  clientSecret: intent.client_secret,
  amount: intent.amount,
  currency: intent.currency,
  status: intent.status,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  // opcionais (se quiser salvar cartao do cliente):
  // customerId: customer.id,
  // ephemeralKey: ephemeralKey.secret,
});
```

**Response 200**
```json
{
  "paymentIntentId": "pi_3Pxxx...",
  "clientSecret": "pi_3Pxxx..._secret_xxx",
  "amount": 5000,
  "currency": "brl",
  "status": "requires_payment_method",
  "publishableKey": "pk_test_..."
}
```

## 2. POST /api/payments/deposit/stripe/confirm

Confirmacao server-side apos o app detectar `succeeded`.

**Request body**
```json
{ "paymentIntentId": "pi_3Pxxx..." }
```

**Backend (Node)**
```js
const intent = await stripe.paymentIntents.retrieve(req.body.paymentIntentId);

if (intent.status !== "succeeded") {
  return res.json({ paymentIntentId: intent.id, status: intent.status });
}

// Credita saldo na conta do usuario
await db.users.update(
  { _id: intent.metadata.userId },
  { $inc: { walletBalance: intent.amount / 100 } }
);

await db.deposits.update(
  { paymentIntentId: intent.id },
  { status: "succeeded", paidAt: new Date() }
);

res.json({ paymentIntentId: intent.id, status: "succeeded" });
```

**Response 200**
```json
{ "paymentIntentId": "pi_3Pxxx...", "status": "succeeded" }
```

## 3. POST /api/payments/deposit/stripe/cancel (opcional)

Cancela o intent caso o usuario desista.
```js
await stripe.paymentIntents.cancel(req.body.paymentIntentId);
res.status(204).send();
```

## Variaveis de ambiente

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Webhook recomendado

Para confiabilidade real, o backend **deve** ouvir o webhook
`payment_intent.succeeded` e creditar o saldo independente da chamada `/confirm`
do app (o app pode cair antes de chamar). Configurar no Stripe Dashboard:

- URL: `https://api.levamais.com/api/webhooks/stripe`
- Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`,
  `payment_intent.canceled`

## Como plugar o SDK no app Expo

Hoje a tela usa um `<MockCardForm />` (cartao de teste 4242...) para validar
a UI. Quando o backend estiver pronto, basta:

1. `npx expo install @stripe/stripe-react-native`
2. Envolver o app em `<StripeProvider publishableKey="pk_..." />`
3. Em `DepositScreen`, trocar `<MockCardForm />` por:
   ```tsx
   <CardField
     postalCodeEnabled={false}
     onCardChange={(c) => setCardComplete(c.complete)}
   />
   ```
4. No `handleStripePay`:
   ```ts
   const { error, paymentIntent } = await confirmPayment(
     stripeIntent.clientSecret,
     { paymentMethodType: "Card" }
   );
   if (error) { /* step = "error" */ return; }
   // chama /confirm no backend para creditar o saldo
   ```
