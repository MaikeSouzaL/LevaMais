import api from "./api";
import { logger } from "@/utils/logger";

/**
 * Servico de deposito no saldo LevaPay.
 *
 * Suporta dois provedores:
 *  - Pix: ja integrado com o backend em /payments/deposit/pix
 *  - Cartao (Stripe): pre-pronto para integracao com Stripe PaymentIntents.
 *    O backend deve expor /payments/deposit/stripe/intent e /payments/deposit/stripe/confirm.
 *    Quando o backend ainda nao responde, o servico cai em modo MOCK para que
 *    a UI possa ser testada ponta-a-ponta ate a publicacao do endpoint real.
 */

export type DepositProvider = "pix" | "stripe" | "boleto";

/** Para onde o saldo vai: carteira do cliente ou saldo operacional do motorista. */
export type DepositAccount = "wallet" | "driver_balance";

export interface BoletoDepositResult {
  provider: "boleto";
  transactionId: string;
  amount: number;
  status: "pending" | "paid" | "expired";
  /** Link do PDF do boleto. */
  pdf: string | null;
  /** Linha digitável / número do boleto. */
  number: string | null;
  /** Data de expiração (timestamp). */
  expiresAt: number | null;
  /** Página hospedada do boleto (Stripe). */
  hostedVoucherUrl: string | null;
}

export interface PixDepositResult {
  provider: "pix";
  transactionId: string;
  amount: number;
  /** Codigo PIX copia-e-cola. */
  pixCode: string;
  /** Imagem do QR Code em base64 (data:image/png;base64,...) ou URL. */
  qrCodeData: string;
  /** Segundos ate o QR expirar. */
  expiresIn: number;
  status: "pending" | "paid" | "expired";
}

export interface StripeDepositIntent {
  provider: "stripe";
  /** ID do PaymentIntent no Stripe (pi_...). */
  paymentIntentId: string;
  /** Client secret usado pelo Stripe SDK no device. */
  clientSecret: string;
  /** Valor em centavos (padrao Stripe). */
  amount: number;
  currency: string;
  /** Status retornado pelo Stripe. */
  status:
    | "requires_payment_method"
    | "requires_confirmation"
    | "requires_action"
    | "processing"
    | "succeeded"
    | "canceled";
  /** Ephemeral key do customer (opcional, para salvar cartao). */
  ephemeralKey?: string;
  /** customerId no Stripe (opcional). */
  customerId?: string;
  publishableKey: string;
}

export interface StripeConfirmResult {
  provider: "stripe";
  paymentIntentId: string;
  status: "succeeded" | "processing" | "failed";
  message?: string;
  receiptUrl?: string;
}

export interface DepositStatusResult {
  transactionId: string;
  status: "pending" | "processing" | "paid" | "expired" | "failed";
  amount: number;
  provider: DepositProvider;
  paidAt?: string;
  receiptUrl?: string;
}

class DepositService {
  // ===========================================================================
  // PIX
  // ===========================================================================

  /**
   * Cria um deposito via Pix. O backend deve gerar o QR Code e devolver o
   * codigo copia-e-cola. O cliente fica em polling ate `status = paid`.
   */
  async createPixDeposit(amount: number, account: DepositAccount = "wallet"): Promise<PixDepositResult> {
    try {
      logger.info("DepositService", `Criando deposito PIX de R$ ${amount.toFixed(2)} (${account})`);
      const { data } = await api.post("/payments/deposit/pix", { amount, account });
      return {
        provider: "pix",
        transactionId: data.transactionId,
        amount: data.amount,
        pixCode: data.pixCode,
        qrCodeData: data.qrCodeData,
        expiresIn: data.expiresIn,
        status: data.status ?? "pending",
      };
    } catch (error) {
      logger.error("DepositService", "Erro ao criar deposito PIX", error as Error);
      throw error;
    }
  }

  /**
   * Cria um deposito via BOLETO (Stripe). Requer CPF do pagador.
   * account: "wallet" (cliente) ou "driver_balance" (motorista).
   */
  async createBoletoDeposit(
    amount: number,
    opts: { account?: DepositAccount; taxId?: string } = {},
  ): Promise<BoletoDepositResult> {
    try {
      const account = opts.account ?? "wallet";
      logger.info("DepositService", `Criando deposito BOLETO de R$ ${amount.toFixed(2)} (${account})`);
      const { data } = await api.post("/payments/deposit/boleto", {
        amount,
        account,
        taxId: opts.taxId,
      });
      return {
        provider: "boleto",
        transactionId: data.transactionId,
        amount: data.amount,
        status: data.status ?? "pending",
        pdf: data.boleto?.pdf ?? null,
        number: data.boleto?.number ?? null,
        expiresAt: data.boleto?.expiresAt ?? null,
        hostedVoucherUrl: data.boleto?.hostedVoucherUrl ?? null,
      };
    } catch (error) {
      logger.error("DepositService", "Erro ao criar deposito boleto", error as Error);
      throw error;
    }
  }

  /** Consulta o status atual de um deposito Pix. */
  async getPixDepositStatus(transactionId: string): Promise<DepositStatusResult> {
    try {
      const { data } = await api.get(`/payments/deposit/pix/${transactionId}`);
      return {
        transactionId: data.transactionId ?? transactionId,
        status: data.status,
        amount: data.amount,
        provider: "pix",
        paidAt: data.paidAt,
        receiptUrl: data.receiptUrl,
      };
    } catch (error) {
      logger.error("DepositService", "Erro ao consultar status PIX", error as Error);
      throw error;
    }
  }

  // ===========================================================================
  // STRIPE (CARTAO)
  // ===========================================================================

  /**
   * Cria um PaymentIntent no Stripe. O backend deve chamar
   * `stripe.paymentIntents.create({ amount, currency, automatic_payment_methods: { enabled: true } })`
   * e devolver o `client_secret` + `publishable_key` (ou o `customer` se quiser
   * reutilizar cartoes salvos).
   *
   * Em modo MOCK (backend nao implementado), devolve um intent fake com
   * clientSecret deterministico para que a UI ja seja testavel.
   */
  async createStripeIntent(
    amount: number,
    currency = "brl",
  ): Promise<StripeDepositIntent> {
    try {
      logger.info("DepositService", `Criando PaymentIntent Stripe de R$ ${amount.toFixed(2)}`);
      const { data } = await api.post("/payments/deposit/stripe/intent", {
        amount: Math.round(amount * 100), // Stripe trabalha em centavos
        currency,
        purpose: "levapay_topup",
      });
      return this.normalizeStripeIntent(data);
    } catch (error: any) {
      // 404 => endpoint ainda nao publicado no backend. Cai em MOCK.
      const status = error?.response?.status;
      if (status === 404 || status === 501) {
        logger.warn("DepositService", "Endpoint Stripe nao disponivel, usando MOCK");
        return this.mockStripeIntent(amount, currency);
      }
      logger.error("DepositService", "Erro ao criar PaymentIntent Stripe", error as Error);
      throw error;
    }
  }

  /**
   * Confirma o pagamento no backend apos o Stripe SDK retornar sucesso no device.
   * O backend valida o status do PaymentIntent com a API do Stripe (server-side)
   * e credita o saldo LevaPay.
   */
  async confirmStripePayment(paymentIntentId: string): Promise<StripeConfirmResult> {
    try {
      const { data } = await api.post("/payments/deposit/stripe/confirm", {
        paymentIntentId,
      });
      return {
        provider: "stripe",
        paymentIntentId: data.paymentIntentId ?? paymentIntentId,
        status: data.status,
        message: data.message,
        receiptUrl: data.receiptUrl,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 501) {
        logger.warn("DepositService", "Endpoint Stripe confirm nao disponivel, usando MOCK");
        return { provider: "stripe", paymentIntentId, status: "succeeded", message: "MOCK OK" };
      }
      logger.error("DepositService", "Erro ao confirmar pagamento Stripe", error as Error);
      throw error;
    }
  }

  /** Cancela um PaymentIntent (ex.: usuario desistiu). */
  async cancelStripeIntent(paymentIntentId: string): Promise<void> {
    try {
      await api.post("/payments/deposit/stripe/cancel", { paymentIntentId });
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404 || status === 501) return; // MOCK: no-op
      logger.error("DepositService", "Erro ao cancelar PaymentIntent", error as Error);
      throw error;
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private normalizeStripeIntent(data: any): StripeDepositIntent {
    return {
      provider: "stripe",
      paymentIntentId: data.paymentIntentId,
      clientSecret: data.clientSecret,
      amount: data.amount,
      currency: data.currency ?? "brl",
      status: data.status ?? "requires_payment_method",
      ephemeralKey: data.ephemeralKey,
      customerId: data.customerId,
      publishableKey: data.publishableKey,
    };
  }

  private mockStripeIntent(amount: number, currency: string): StripeDepositIntent {
    const id = `pi_mock_${Date.now()}`;
    return {
      provider: "stripe",
      paymentIntentId: id,
      clientSecret: `${id}_secret_mock`,
      amount: Math.round(amount * 100),
      currency,
      status: "requires_payment_method",
      publishableKey: "pk_test_MOCK",
    };
  }
}

export default new DepositService();
