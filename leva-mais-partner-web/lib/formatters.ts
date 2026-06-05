export function money(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

export function statusLabel(value: string | undefined) {
  const labels: Record<string, string> = {
    active: "Ativo",
    paused: "Pausado",
    under_review: "Em analise",
    blocked: "Bloqueado",
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Reprovado",
    suspended: "Suspenso",
    none: "Nao enviado",
    auto: "Automatico",
    force_open: "Aberto manual",
    force_closed: "Fechado manual",
    platform: "Entrega Leva Mais",
    pickup: "Retirada",
    both: "Entrega e retirada",
  };
  return labels[value || ""] || value || "-";
}

export function weekdayLabel(value: number) {
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][value] || "-";
}
