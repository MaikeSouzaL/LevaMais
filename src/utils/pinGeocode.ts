import { obterEnderecoPorCoordenadas, formatarEnderecoCompacto, type EnderecoReverso } from "./location";

/**
 * Resultado do geocoding do pin (formato simplificado para UI)
 */
export type PinGeocodeResult = {
  endereco: EnderecoReverso | null;
  formatted: string; // Endereço formatado pronto para exibir
};

/**
 * Helper de debounce simples
 */
function debounce<T extends (...args: any[]) => any>(fn: T, wait = 300) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Obtém endereço reverso com retry automático
 * Ideal para uso com pins arrastáveis no mapa
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Resultado com endereço e string formatada
 */
async function reverseGeocodeWithRetry(
  lat: number,
  lng: number
): Promise<PinGeocodeResult> {
  try {
    const endereco = await obterEnderecoPorCoordenadas(lat, lng);
    
    if (!endereco) {
      return {
        endereco: null,
        formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, // Fallback para coordenadas
      };
    }

    const formatted = formatarEnderecoCompacto(endereco);
    
    return {
      endereco,
      formatted: formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  } catch (e) {
    console.error("Erro no pin geocode:", e);
    return {
      endereco: null,
      formatted: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    };
  }
}

/**
 * Utilitário para geocoding de pins no mapa
 */
export const pinGeocode = {
  /**
   * Busca endereço reverso diretamente
   */
  reverse: reverseGeocodeWithRetry,

  /**
   * Versão com debounce para eventos de drag
   * Útil para evitar muitas chamadas durante o arrasto do pin
   */
  debouncedReverse: debounce(
    async (
      lat: number,
      lng: number,
      onResult: (r: PinGeocodeResult) => void
    ) => {
      const resultado = await reverseGeocodeWithRetry(lat, lng);
      onResult(resultado);
    },
    400 // 400ms de debounce
  ),
};
