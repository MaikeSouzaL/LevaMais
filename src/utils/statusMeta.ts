export interface StatusMeta {
  title: string;
  subtitle: string;
  color: string;
  bg: string;
}

export function getStatusMeta(status?: string, serviceType?: string): StatusMeta {
  const isDelivery = serviceType === "delivery" || serviceType === "frete";

  const map: Record<string, StatusMeta> = {
    requesting: {
      title: "Buscando motorista",
      subtitle: "Estamos procurando o melhor motorista para voce.",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.16)",
    },
    payment_pending: {
      title: "Aguardando pagamento",
      subtitle: "Confirme o pagamento para liberar a entrega.",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.18)",
    },
    driver_assigned: {
      title: "Motorista encontrado",
      subtitle: "Aguardando confirmacao final do motorista.",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    accepted: {
      title: "Motorista aceitou",
      subtitle: "Ele ja esta indo para o ponto de coleta.",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    driver_arriving: {
      title: "Motorista a caminho",
      subtitle: "Acompanhe no mapa a chegada na coleta.",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    arrived: {
      title: "Motorista chegou",
      subtitle: isDelivery
        ? "Vá ao encontro do motorista para entregar o pacote."
        : "Dirija-se ao ponto de embarque.",
      color: "#02de95",
      bg: "rgba(2,222,149,0.18)",
    },
    in_progress: {
      title: isDelivery ? "Entrega em andamento" : "Corrida em andamento",
      subtitle: "Siga o trajeto ate o destino final.",
      color: "#02de95",
      bg: "rgba(2,222,149,0.18)",
    },
    completed: {
      title: isDelivery ? "Entrega finalizada" : "Corrida finalizada",
      subtitle: "Pedido concluido com sucesso.",
      color: "#02de95",
      bg: "rgba(2,222,149,0.18)",
    },
    cancelled: {
      title: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      subtitle: "O pedido foi cancelado.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    cancelled_by_client: {
      title: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      subtitle: "Cancelada por voce.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    cancelled_by_driver: {
      title: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      subtitle: "Cancelada pelo motorista.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    cancelled_no_driver: {
      title: "Sem motorista disponivel",
      subtitle: "Nao foi possivel encontrar motorista.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    expired: {
      title: "Busca expirada",
      subtitle: "A solicitacao expirou por falta de aceite.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
  };

  return (
    map[status || ""] || {
      title: "Acompanhando pedido",
      subtitle: "Estamos atualizando os dados do pedido.",
      color: "#ffffff",
      bg: "rgba(255,255,255,0.12)",
    }
  );
}
