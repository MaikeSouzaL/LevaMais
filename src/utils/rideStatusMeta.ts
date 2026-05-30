/**
 * Metadata compartilhada para status de corridas
 * Extraído de RideTracking para uso em todo o app
 */

export interface RideStatusMeta {
  label: string;
  subtitle: string;
  color: string;
  bgColor: string;
  icon: string;
  animation: 'pulse' | 'progress' | 'none';
}

const STATUS_META: Record<string, RideStatusMeta> = {
  requesting: {
    label: 'Buscando Motorista',
    subtitle: 'Aguardando motoristas próximos',
    color: '#60A5FA',
    bgColor: 'rgba(96,165,250,0.15)',
    icon: 'search',
    animation: 'pulse',
  },
  payment_pending: {
    label: 'Pagamento Pendente',
    subtitle: 'Aguardando confirmação de pagamento',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.15)',
    icon: 'credit-card',
    animation: 'pulse',
  },
  driver_assigned: {
    label: 'Motorista Encontrado',
    subtitle: 'Motorista está se preparando',
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.15)',
    icon: 'user-check',
    animation: 'pulse',
  },
  accepted: {
    label: 'Motorista Aceitou',
    subtitle: 'A caminho do ponto de embarque',
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.15)',
    icon: 'navigation',
    animation: 'progress',
  },
  driver_arriving: {
    label: 'Motorista Chegando',
    subtitle: 'Motorista está próximo',
    color: '#38BDF8',
    bgColor: 'rgba(56,189,248,0.15)',
    icon: 'truck',
    animation: 'progress',
  },
  arrived: {
    label: 'Motorista Chegou',
    subtitle: 'No local de embarque',
    color: '#02DE95',
    bgColor: 'rgba(2,222,149,0.15)',
    icon: 'map-pin',
    animation: 'none',
  },
  in_progress: {
    label: 'Em Viagem',
    subtitle: 'A caminho do destino',
    color: '#02DE95',
    bgColor: 'rgba(2,222,149,0.15)',
    icon: 'navigation-2',
    animation: 'progress',
  },
  completed: {
    label: 'Concluída',
    subtitle: 'Corrida finalizada',
    color: '#02DE95',
    bgColor: 'rgba(2,222,149,0.15)',
    icon: 'check-circle',
    animation: 'none',
  },
  cancelled_by_client: {
    label: 'Cancelada',
    subtitle: 'Cancelada por você',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.15)',
    icon: 'x-circle',
    animation: 'none',
  },
  cancelled_by_driver: {
    label: 'Cancelada',
    subtitle: 'Cancelada pelo motorista',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.15)',
    icon: 'x-circle',
    animation: 'none',
  },
  cancelled_no_driver: {
    label: 'Nenhum Motorista',
    subtitle: 'Nenhum motorista disponível',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.15)',
    icon: 'alert-triangle',
    animation: 'none',
  },
  expired: {
    label: 'Expirada',
    subtitle: 'Tempo de busca esgotado',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.15)',
    icon: 'clock',
    animation: 'none',
  },
};

export function getStatusMeta(status: string): RideStatusMeta {
  return STATUS_META[status] || {
    label: status,
    subtitle: '',
    color: '#9CA3AF',
    bgColor: 'rgba(156,163,175,0.15)',
    icon: 'help-circle',
    animation: 'none',
  };
}

export const TERMINAL_STATUSES = [
  'completed',
  'cancelled_by_client',
  'cancelled_by_driver',
  'cancelled_no_driver',
  'expired',
];

export const CANCELLABLE_STATUSES = [
  'requesting',
  'driver_assigned',
  'accepted',
  'driver_arriving',
  'arrived',
  'in_progress',
];
