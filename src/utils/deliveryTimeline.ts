export interface DeliveryTimelineStep {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
}

export function getDeliveryTimeline(status: string): DeliveryTimelineStep[] {
  const isDone = (target: string) => {
    if (target === "to_pickup") {
      return ["driver_assigned", "accepted", "driver_arriving", "arrived", "in_progress", "completed"].includes(status);
    }
    if (target === "arrived_pickup") {
      return ["arrived", "in_progress", "completed"].includes(status);
    }
    if (target === "picked_up") {
      return ["in_progress", "completed"].includes(status);
    }
    if (target === "to_dropoff") {
      return ["in_progress", "completed"].includes(status);
    }
    if (target === "arrived_dropoff") {
      return ["completed"].includes(status);
    }
    if (target === "completed") {
      return ["completed"].includes(status);
    }
    return false;
  };

  return [
    {
      key: "to_pickup",
      label: "Motorista a caminho da coleta",
      done: isDone("to_pickup"),
      active: ["driver_assigned", "accepted", "driver_arriving"].includes(status),
    },
    {
      key: "arrived_pickup",
      label: "Motorista chegou na coleta",
      done: isDone("arrived_pickup"),
      active: status === "arrived",
    },
    {
      key: "picked_up",
      label: "Pacote coletado",
      done: isDone("picked_up"),
      active: status === "in_progress",
    },
    {
      key: "to_dropoff",
      label: "A caminho da entrega",
      done: isDone("to_dropoff"),
      active: status === "in_progress",
    },
    {
      key: "arrived_dropoff",
      label: "Chegou no destino",
      done: isDone("arrived_dropoff"),
      active: false,
    },
    {
      key: "completed",
      label: "Entrega concluida",
      done: isDone("completed"),
      active: status === "completed",
    },
  ];
}
