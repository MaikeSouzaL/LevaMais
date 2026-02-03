/**
 * Mappers - Funções de mapeamento
 * Converte dados entre diferentes formatos (frontend <-> backend)
 */

/**
 * Mapeia modo de serviço para API
 */
export function mapServiceModeToApi(mode: string): string {
  const mapping: Record<string, string> = {
    transport: 'transport',
    delivery: 'delivery',
    moving: 'moving',
    other: 'other',
  };
  return mapping[mode] || mode;
}

/**
 * Mapeia tipo de veículo para API
 */
export function mapVehicleTypeToApi(type: string): string {
  const mapping: Record<string, string> = {
    motorcycle: 'motorcycle',
    car: 'car',
    van: 'van',
    truck: 'truck',
  };
  return mapping[type] || type;
}

/**
 * Mapeia método de pagamento para API
 */
export function mapPaymentMethodToApi(method: string): string {
  const mapping: Record<string, string> = {
    cash: 'cash',
    pix: 'pix',
    credit: 'credit_card',
    debit: 'debit_card',
    wallet: 'wallet',
  };
  return mapping[method] || method;
}

/**
 * Mapeia status da corrida para texto legível
 */
export function mapRideStatusToText(status: string): string {
  const mapping: Record<string, string> = {
    pending: 'Aguardando',
    accepted: 'Aceita',
    arriving: 'Chegando',
    in_progress: 'Em andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    cancelled_by_client: 'Cancelada',
    cancelled_by_driver: 'Cancelada',
    timeout: 'Expirada',
  };
  return mapping[status] || status;
}

/**
 * Mapeia tipo de veículo para emoji
 */
export function mapVehicleTypeToEmoji(type: string): string {
  const mapping: Record<string, string> = {
    motorcycle: '🏍️',
    car: '🚗',
    van: '🚐',
    truck: '🚚',
  };
  return mapping[type] || '🚗';
}

/**
 * Mapeia tipo de veículo para nome legível
 */
export function mapVehicleTypeToName(type: string): string {
  const mapping: Record<string, string> = {
    motorcycle: 'Moto',
    car: 'Carro',
    van: 'Van',
    truck: 'Caminhão',
  };
  return mapping[type] || type;
}

/**
 * Mapeia modo de serviço para nome legível
 */
export function mapServiceModeToName(mode: string): string {
  const mapping: Record<string, string> = {
    transport: 'Transporte de Pessoas',
    delivery: 'Entrega de Encomendas',
    moving: 'Mudança',
    other: 'Outros',
  };
  return mapping[mode] || mode;
}

/**
 * Mapeia método de pagamento para nome legível
 */
export function mapPaymentMethodToName(method: string): string {
  const mapping: Record<string, string> = {
    cash: 'Dinheiro',
    pix: 'PIX',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    wallet: 'Carteira',
  };
  return mapping[method] || method;
}

/**
 * Mapeia método de pagamento para ícone
 */
export function mapPaymentMethodToIcon(method: string): string {
  const mapping: Record<string, string> = {
    cash: 'cash',
    pix: 'pix',
    credit: 'credit-card',
    debit: 'credit-card',
    wallet: 'wallet',
  };
  return mapping[method] || 'cash';
}

/**
 * Mapeia status da corrida para cor
 */
export function mapRideStatusToColor(status: string): string {
  const mapping: Record<string, string> = {
    pending: '#f59e0b', // warning
    accepted: '#3b82f6', // info
    arriving: '#3b82f6', // info
    in_progress: '#02de95', // primary
    completed: '#10b981', // success
    cancelled: '#ef4444', // error
    cancelled_by_client: '#ef4444',
    cancelled_by_driver: '#ef4444',
    timeout: '#8D8D99',
  };
  return mapping[status] || '#8D8D99';
}

