/**
 * Estimativa da taxa de cancelamento no cliente — espelha
 * `Ride.computeBidCancellationFee` do backend (janela grátis 2 min, 20% do lance).
 *
 * Usado apenas para PREVIEW na UI. O valor cobrado de fato vem da resposta do
 * endpoint de cancelamento (`response.cancellationFee`).
 */

export interface CancellationFeeRide {
  status?: string;
  serviceType?: string;
  pricing?: { total?: number };
  acceptedAt?: string | Date | null;
  payment?: { escrow?: { reservedAt?: string | Date | null } };
  negotiation?: { selectedAt?: string | Date | null };
}

export interface CancellationFeeOpts {
  freeWindowSec?: number;
  feePct?: number;
  collectedFeePct?: number;
}

const COMMITTED = ["driver_assigned", "accepted", "driver_arriving", "arrived", "in_progress"];

/** Indica se é uma entrega com o pacote já coletado (status in_progress). */
export function isDeliveryCollected(ride: CancellationFeeRide | null | undefined): boolean {
  const isDelivery = ride?.serviceType === "delivery" || ride?.serviceType === "frete";
  return Boolean(isDelivery && String(ride?.status || "") === "in_progress");
}

/** Retorna a taxa estimada (R$). 0 quando o cancelamento é gratuito. */
export function estimateCancellationFee(
  ride: CancellationFeeRide | null | undefined,
  opts: CancellationFeeOpts = {},
): number {
  const freeWindowSec = opts.freeWindowSec ?? 120;
  const feePct = opts.feePct ?? 20;
  const collectedFeePct = opts.collectedFeePct ?? 50;

  const total = Number(ride?.pricing?.total || 0);
  const status = String(ride?.status || "");
  if (!ride || total <= 0 || !COMMITTED.includes(status)) return 0;

  // Entrega pós-coleta: sem janela grátis, taxa de retorno (50%).
  if (isDeliveryCollected(ride)) {
    return Math.round(total * (collectedFeePct / 100) * 100) / 100;
  }

  const ref =
    ride.acceptedAt ||
    ride.payment?.escrow?.reservedAt ||
    ride.negotiation?.selectedAt ||
    null;
  const elapsedSec = ref ? (Date.now() - new Date(ref).getTime()) / 1000 : Infinity;
  if (elapsedSec <= freeWindowSec) return 0;

  return Math.round(total * (feePct / 100) * 100) / 100;
}
