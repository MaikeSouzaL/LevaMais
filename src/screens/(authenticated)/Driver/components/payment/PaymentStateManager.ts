export type PaymentRealtimeState =
  | "processing"
  | "approved"
  | "declined"
  | "client_delayed"
  | "timeout"
  | "bank_wait";

export type PaymentUiMeta = {
  title: string;
  subtitle: string;
  message: string;
  accent: string;
  accentGlow: string;
  softAccent: string;
  gradientStart: string;
  gradientEnd: string;
  icon: "shield" | "wallet" | "warning" | "check" | "bank";
  stepIndex: number;
  showActionUnlock: boolean;
  loaderPhrase: string;
  badgeLabel: string;
};

export function getPaymentUiMeta(state: PaymentRealtimeState): PaymentUiMeta {
  switch (state) {
    case "approved":
      return {
        title: "Pagamento aprovado",
        subtitle: "Rota desbloqueada com sucesso!",
        message: "O pagamento foi confirmado pela plataforma. Você já pode iniciar a rota de entrega.",
        accent: "#02de95",
        accentGlow: "rgba(2,222,149,0.35)",
        softAccent: "rgba(2,222,149,0.14)",
        gradientStart: "rgba(2,222,149,0.12)",
        gradientEnd: "rgba(2,222,149,0.03)",
        icon: "check",
        stepIndex: 4,
        showActionUnlock: true,
        loaderPhrase: "Rota liberada!",
        badgeLabel: "APROVADO",
      };
    case "declined":
      return {
        title: "Pagamento recusado",
        subtitle: "Aguardando nova tentativa",
        message: "O pagamento do cliente não foi autorizado. Ele poderá realizar uma nova tentativa em instantes.",
        accent: "#ef4444",
        accentGlow: "rgba(239,68,68,0.3)",
        softAccent: "rgba(239,68,68,0.12)",
        gradientStart: "rgba(239,68,68,0.10)",
        gradientEnd: "rgba(239,68,68,0.02)",
        icon: "warning",
        stepIndex: 1,
        showActionUnlock: false,
        loaderPhrase: "Aguardando retentativa...",
        badgeLabel: "RECUSADO",
      };
    case "client_delayed":
      return {
        title: "Cliente finalizando",
        subtitle: "O cliente está concluindo no app",
        message: "O cliente está finalizando a confirmação do pagamento. A rota será liberada automaticamente.",
        accent: "#f59e0b",
        accentGlow: "rgba(245,158,11,0.3)",
        softAccent: "rgba(245,158,11,0.12)",
        gradientStart: "rgba(245,158,11,0.10)",
        gradientEnd: "rgba(245,158,11,0.02)",
        icon: "wallet",
        stepIndex: 1,
        showActionUnlock: false,
        loaderPhrase: "Cliente confirmando...",
        badgeLabel: "AGUARDANDO",
      };
    case "timeout":
      return {
        title: "Tempo expirando",
        subtitle: "Pagamento não confirmado a tempo",
        message: "Se o cliente não confirmar, o pedido será encerrado automaticamente pela plataforma.",
        accent: "#f97316",
        accentGlow: "rgba(249,115,22,0.3)",
        softAccent: "rgba(249,115,22,0.14)",
        gradientStart: "rgba(249,115,22,0.10)",
        gradientEnd: "rgba(249,115,22,0.02)",
        icon: "warning",
        stepIndex: 2,
        showActionUnlock: false,
        loaderPhrase: "Tempo crítico...",
        badgeLabel: "EXPIRANDO",
      };
    case "bank_wait":
      return {
        title: "Validação bancária",
        subtitle: "Transação sendo processada",
        message: "A instituição financeira está analisando a transação em tempo real. Isso pode levar alguns segundos.",
        accent: "#22d3ee",
        accentGlow: "rgba(34,211,238,0.3)",
        softAccent: "rgba(34,211,238,0.12)",
        gradientStart: "rgba(34,211,238,0.10)",
        gradientEnd: "rgba(34,211,238,0.02)",
        icon: "bank",
        stepIndex: 2,
        showActionUnlock: false,
        loaderPhrase: "Validando com banco...",
        badgeLabel: "BANCO",
      };
    default:
      return {
        title: "Pagamento em processamento",
        subtitle: "Sistema operacional ativo",
        message: "O cliente confirmou sua proposta e está finalizando o pagamento agora.",
        accent: "#fbbf24",
        accentGlow: "rgba(251,191,36,0.3)",
        softAccent: "rgba(251,191,36,0.14)",
        gradientStart: "rgba(251,191,36,0.10)",
        gradientEnd: "rgba(251,191,36,0.02)",
        icon: "shield",
        stepIndex: 1,
        showActionUnlock: false,
        loaderPhrase: "Processando pagamento...",
        badgeLabel: "PROCESSANDO",
      };
  }
}

export function deriveStateFromCountdown(secondsLeft: number): PaymentRealtimeState {
  if (secondsLeft <= 0) return "timeout";
  if (secondsLeft <= 20) return "client_delayed";
  if (secondsLeft <= 45) return "bank_wait";
  return "processing";
}
