/**
 * Utilitários de formatação para o sistema LevaMais
 * Padrão: pt-BR (Português do Brasil)
 */

/**
 * Formata um número como moeda brasileira (BRL)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada como "R$ 1.234,56"
 *
 * @example
 * formatCurrency(5) // "R$ 5,00"
 * formatCurrency(15.5) // "R$ 15,50"
 * formatCurrency(1234.56) // "R$ 1.234,56"
 */
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
};

/**
 * Converte uma string formatada como BRL para número
 * @param value - String no formato "R$ 1.234,56" ou "1.234,56" ou "1234,56"
 * @returns Número decimal
 *
 * @example
 * parseCurrency("R$ 1.234,56") // 1234.56
 * parseCurrency("1.234,56") // 1234.56
 * parseCurrency("15,50") // 15.5
 * parseCurrency("5") // 5
 */
export const parseCurrency = (value: string): number => {
  if (!value) return 0;

  // Remove R$, espaços, e converte separadores
  const cleaned = value
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "") // Remove separador de milhar
    .replace(",", ".") // Converte vírgula decimal para ponto
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formata um valor enquanto o usuário está digitando
 * Permite apenas números, vírgula e ponto
 * @param value - String sendo digitada
 * @returns String parcialmente formatada
 *
 * @example
 * formatCurrencyInput("5") // "5"
 * formatCurrencyInput("5,5") // "5,5"
 * formatCurrencyInput("5.50") // "5,50"
 */
export const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não é número, vírgula ou ponto
  let cleaned = value.replace(/[^\d,\.]/g, "");

  // Substitui ponto por vírgula (padrão BR)
  cleaned = cleaned.replace(".", ",");

  // Garante apenas uma vírgula
  const parts = cleaned.split(",");
  if (parts.length > 2) {
    cleaned = parts[0] + "," + parts.slice(1).join("");
  }

  // Limita casas decimais a 2
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + "," + parts[1].substring(0, 2);
  }

  return cleaned;
};

/**
 * Formata distância em km
 * @param km - Distância em quilômetros
 * @returns String formatada como "1,5 km" ou "10 km"
 */
export const formatDistance = (km: number): string => {
  if (km < 1) {
    return `${(km * 1000).toFixed(0)} m`;
  }

  return km % 1 === 0 ? `${km} km` : `${km.toFixed(1).replace(".", ",")} km`;
};

/**
 * Formata duração em minutos
 * @param minutes - Duração em minutos
 * @returns String formatada como "5 min" ou "1h 30min"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}min`;
};

/**
 * Formata porcentagem
 * @param value - Valor decimal (ex: 0.15 para 15%)
 * @param decimals - Número de casas decimais (padrão 0)
 * @returns String formatada como "15%" ou "15,5%"
 */
export const formatPercentage = (
  value: number,
  decimals: number = 0
): string => {
  const percent = value * 100;

  if (decimals === 0) {
    return `${Math.round(percent)}%`;
  }

  return `${percent.toFixed(decimals).replace(".", ",")}%`;
};

/**
 * Formata número com separador de milhar
 * @param value - Número a ser formatado
 * @returns String formatada como "1.234"
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Formata data no padrão brasileiro
 * @param date - Data a ser formatada
 * @param includeTime - Se deve incluir horário
 * @returns String formatada como "24/12/2025" ou "24/12/2025 14:30"
 */
export const formatDate = (
  date: Date | string,
  includeTime: boolean = false
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (includeTime) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
};

/**
 * Formata multiplicador de preço
 * @param multiplier - Multiplicador (ex: 1.3)
 * @returns String formatada como "1,3x" ou "+30%"
 */
export const formatMultiplier = (
  multiplier: number,
  asPercentage: boolean = false
): string => {
  if (asPercentage) {
    const increase = (multiplier - 1) * 100;
    return increase > 0
      ? `+${Math.round(increase)}%`
      : `${Math.round(increase)}%`;
  }

  return `${multiplier.toFixed(1).replace(".", ",")}x`;
};

/**
 * Valida se uma string é um valor BRL válido
 * @param value - String a ser validada
 * @returns true se for válido
 */
export const isValidCurrency = (value: string): boolean => {
  const parsed = parseCurrency(value);
  return !isNaN(parsed) && parsed >= 0;
};

/**
 * Formata número de telefone brasileiro
 * @param phone - Telefone (apenas números)
 * @returns String formatada como "(11) 98765-4321"
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
      7
    )}`;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(
      6
    )}`;
  }

  return phone;
};

/**
 * Formata CPF
 * @param cpf - CPF (apenas números)
 * @returns String formatada como "123.456.789-00"
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");

  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(
      6,
      9
    )}-${cleaned.slice(9)}`;
  }

  return cpf;
};

/**
 * Formata CNPJ
 * @param cnpj - CNPJ (apenas números)
 * @returns String formatada como "12.345.678/0001-00"
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, "");

  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(
      5,
      8
    )}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }

  return cnpj;
};
