/**
 * Helpers para ler a forma de pagamento de um pedido de forma resiliente.
 *
 * O campo `payment.method` pode vir como string ("wallet") OU como objeto
 * ({ type: "wallet" }) dependendo de onde o pedido foi criado. Estes helpers
 * normalizam para evitar erros como `payment.method.toLowerCase is not a function`.
 */

export function getPaymentMethodType(payment: any): string {
  const raw = payment?.method;
  const type = typeof raw === "string" ? raw : raw?.type;
  return String(type || "cash").toLowerCase();
}

export function getPaymentLabel(payment: any): string {
  const t = getPaymentMethodType(payment);
  if (t === "pix") return "Pix";
  if (t === "wallet" || t === "levapay") return "Saldo LevaPay";
  if (t === "credit_card" || t === "card" || t === "card_machine") return "Cartão";
  return "Dinheiro";
}
