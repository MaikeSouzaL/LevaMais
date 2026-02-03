/**
 * Formatters - Funções de formatação
 * Centraliza todas as funções de formatação usadas no app
 */

/**
 * Formata valor para moeda brasileira (BRL)
 */
export function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

/**
 * Formata data para formato brasileiro
 */
export function formatDate(value?: string): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
}

/**
 * Formata data e hora para formato brasileiro
 */
export function formatDateTime(value?: string): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return date.toLocaleString('pt-BR');
  } catch {
    return '-';
  }
}

/**
 * Formata hora para formato brasileiro
 */
export function formatTime(value?: string): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Formata distância em metros para formato legível
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Formata duração em segundos para formato legível
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

/**
 * Formata telefone para formato brasileiro
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata CPF para formato brasileiro
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}

/**
 * Formata placa de veículo
 */
export function formatPlate(plate: string): string {
  const cleaned = plate.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  if (cleaned.length === 7) {
    return cleaned.replace(/([A-Z]{3})([0-9][A-Z0-9][0-9]{2})/, '$1-$2');
  }
  return plate.toUpperCase();
}

/**
 * Formata CEP para formato brasileiro
 */
export function formatCEP(cep: string): string {
  const cleaned = cep.replace(/\D/g, '');
  
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cep;
}

/**
 * Formata informações do veículo
 */
export function formatVehicleText(driver: any): string {
  if (!driver?.vehicle) return 'Veículo não informado';
  
  const { brand, model, color, plate } = driver.vehicle;
  return `${brand} ${model} ${color} - ${formatPlate(plate)}`;
}

/**
 * Formata nome abreviado (primeira e última palavra)
 */
export function formatShortName(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Formata iniciais do nome
 */
export function formatInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
