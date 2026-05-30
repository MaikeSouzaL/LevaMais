/**
 * Payment Gateway Service — Abstraction layer for payment providers.
 *
 * Supported providers via env PAYMENT_GATEWAY_PROVIDER:
 *  - "mercadopago" (PIX + credit card)
 *  - "internal-mvp" (wallet-only, dev/testing)
 *
 * Adicionar novo provider: criar um handler neste arquivo
 * e registrá-lo em PROVIDERS.
 */

const crypto = require("crypto");

// ─── MercadoPago ────────────────────────────────────────────────
let mercadoPagoClient = null;

function ensureMercadoPago() {
  if (mercadoPagoClient) return mercadoPagoClient;
  try {
    const { MercadoPagoConfig, Payment } = require("mercadopago");
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN not configured");
    }
    const client = new MercadoPagoConfig({
      accessToken,
      options: { timeout: 15000 },
    });
    mercadoPagoClient = { client, Payment };
    return mercadoPagoClient;
  } catch (e) {
    console.error("[PaymentGateway] MercadoPago init failed:", e.message);
    return null;
  }
}

// ─── Internal MVP (wallet-only) ─────────────────────────────────
async function internalProcess({ method, amount, description, user }) {
  const transactionId = `pay_${crypto.randomBytes(10).toString("hex")}`;

  if (method === "wallet") {
    user.wallet = user.wallet || { balance: 0, transactions: [] };
    const currentBalance = (user.wallet.balance || 0);
    if (currentBalance < amount) {
      throw Object.assign(new Error("Saldo insuficiente"), { statusCode: 400, available: currentBalance });
    }
    user.wallet.balance = currentBalance - amount;
    user.wallet.transactions = user.wallet.transactions || [];
    user.wallet.transactions.push({
      type: "ride_payment",
      amount,
      description: description || "Pagamento via carteira",
      referenceId: transactionId,
      createdAt: new Date(),
    });
    await user.save();
  }

  return {
    transactionId,
    status: method === "wallet" ? "completed" : "pending",
    gatewayResponse: {
      provider: "internal-mvp",
      settlement: method === "wallet" ? "captured" : "authorized",
    },
  };
}

// ─── MercadoPago Handler ────────────────────────────────────────
async function mercadoPagoProcess({ method, amount, description, user, cardId, pixKey }) {
  const mp = ensureMercadoPago();
  if (!mp) throw Object.assign(new Error("Payment gateway indisponivel"), { statusCode: 503 });

  const { Payment } = mp;
  const payment = new Payment(mp.client);

  const body = {
    transaction_amount: amount,
    description: description || "Leva+ corrida/entrega",
    payment_method_id: method === "credit_card" ? "mastercard" : "pix",
    payer: {
      email: user.email,
      first_name: (user.name || "Cliente").split(" ")[0],
    },
  };

  if (method === "pix") {
    body.payment_method_id = "pix";
  }

  const result = await payment.create({ body });

  return {
    transactionId: String(result.id),
    status: result.status === "approved" ? "completed" : "pending",
    gatewayResponse: {
      provider: "mercadopago",
      settlement: result.status === "approved" ? "captured" : "pending",
      detail: result.status_detail || result.status,
      pixQrCode: result.point_of_interaction?.transaction_data?.qr_code || null,
      pixCopyPaste: result.point_of_interaction?.transaction_data?.qr_code_base64 || null,
    },
  };
}

// ─── Provider Router ────────────────────────────────────────────
const PROVIDERS = {
  "internal-mvp": internalProcess,
  mercadopago: mercadoPagoProcess,
};

function getProvider() {
  const configured = (process.env.PAYMENT_GATEWAY_PROVIDER || "internal-mvp").toLowerCase();
  const handler = PROVIDERS[configured];
  if (!handler) {
    console.warn(`[PaymentGateway] Unknown provider "${configured}", falling back to internal-mvp`);
    return internalProcess;
  }
  return handler;
}

/**
 * Process a payment through the configured gateway.
 * @param {Object} opts
 * @param {string} opts.method — "wallet" | "credit_card" | "pix"
 * @param {number} opts.amount
 * @param {string} opts.description
 * @param {Object} opts.user — Mongoose user document (with wallet)
 * @param {string} [opts.cardId]
 * @param {string} [opts.pixKey]
 * @returns {Promise<{transactionId: string, status: string, gatewayResponse: object}>}
 */
async function processPayment(opts) {
  const provider = getProvider();
  return provider(opts);
}

module.exports = { processPayment, getProvider };
