/**
 * Mappers usados pelo modulo Client.
 * Mantem as traducoes alinhadas com os status e tipos reais do backend.
 */

export function mapServiceModeToApi(mode: string): string {
  const mapping: Record<string, string> = {
    transport: 'ride',
    ride: 'ride',
    delivery: 'delivery',
    moving: 'delivery',
    other: 'delivery',
    frete: 'delivery',
  };

  return mapping[mode] || 'delivery';
}

export function mapVehicleTypeToApi(type: string): string {
  const mapping: Record<string, string> = {
    motorcycle: 'motorcycle',
    moto: 'motorcycle',
    car: 'car',
    van: 'van',
    truck: 'truck',
  };

  return mapping[type] || type;
}

export function mapPaymentMethodToApi(method: string): string {
  const mapping: Record<string, string> = {
    cash: 'cash',
    pix: 'pix',
    credit: 'credit_card',
    credit_card: 'credit_card',
    debit: 'debit_card',
    debit_card: 'debit_card',
    wallet: 'wallet',
  };

  return mapping[method] || method;
}

export function mapRideStatusToText(status: string): string {
  const mapping: Record<string, string> = {
    requesting: 'Procurando motorista',
    payment_pending: 'Aguardando pagamento',
    payment_failed: 'Falha no pagamento',
    driver_assigned: 'Motorista selecionado',
    accepted: 'Aceita',
    driver_arriving: 'Motorista a caminho',
    arrived: 'Motorista chegou',
    in_progress: 'Em andamento',
    completed: 'Concluida',
    cancelled: 'Cancelada',
    cancelled_by_client: 'Cancelada pelo cliente',
    cancelled_by_driver: 'Cancelada pelo motorista',
    cancelled_no_driver: 'Sem motorista disponivel',
    expired: 'Busca expirada',
    timeout: 'Tempo esgotado',
    pending: 'Pendente',
    arriving: 'Chegando',
  };

  return mapping[status] || status;
}

export function mapVehicleTypeToEmoji(type: string): string {
  const mapping: Record<string, string> = {
    motorcycle: 'MOTO',
    car: 'CAR',
    van: 'VAN',
    truck: 'TRUCK',
  };

  return mapping[type] || 'CAR';
}

export function mapVehicleTypeToName(type: string): string {
  const mapping: Record<string, string> = {
    motorcycle: 'Moto',
    car: 'Carro',
    van: 'Van',
    truck: 'Caminhao',
  };

  return mapping[type] || type;
}

export function mapServiceModeToName(mode: string): string {
  const mapping: Record<string, string> = {
    ride: 'Transporte',
    transport: 'Transporte',
    delivery: 'Entrega',
    moving: 'Frete',
    other: 'Outro',
    frete: 'Frete',
  };

  return mapping[mode] || mode;
}

export function mapPaymentMethodToName(method: string): string {
  const mapping: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    card: 'Cartao',
    credit: 'Cartao de credito',
    credit_card: 'Cartao de credito',
    debit: 'Cartao de debito',
    debit_card: 'Cartao de debito',
    wallet: 'Carteira',
  };

  return mapping[method] || method;
}

export function mapPaymentMethodToIcon(method: string): string {
  const mapping: Record<string, string> = {
    cash: 'cash',
    pix: 'pix',
    card: 'credit-card',
    credit: 'credit-card',
    credit_card: 'credit-card',
    debit: 'credit-card',
    debit_card: 'credit-card',
    wallet: 'wallet',
  };

  return mapping[method] || 'cash';
}

export function mapRideStatusToColor(status: string): string {
  const mapping: Record<string, string> = {
    requesting: '#f59e0b',
    payment_pending: '#f59e0b',
    payment_failed: '#ef4444',
    driver_assigned: '#3b82f6',
    accepted: '#3b82f6',
    driver_arriving: '#3b82f6',
    arrived: '#2563eb',
    in_progress: '#02de95',
    completed: '#10b981',
    cancelled: '#ef4444',
    cancelled_by_client: '#ef4444',
    cancelled_by_driver: '#ef4444',
    cancelled_no_driver: '#ef4444',
    expired: '#ef4444',
    timeout: '#8D8D99',
    pending: '#f59e0b',
    arriving: '#3b82f6',
  };

  return mapping[status] || '#8D8D99';
}
