import * as Location from "expo-location";
import { reverseGeocodeAsync, LocationObjectCoords } from "expo-location";

/**
 * Tipo completo do endereço reverso (baseado em expo-location)
 */
export type EnderecoReverso = {
  street?: string;
  streetNumber?: string;
  district?: string; // bairro
  city?: string;
  region?: string; // estado/UF
  postalCode?: string;
  country?: string;
  isoCountryCode?: string;

  // campos extras (varia por plataforma)
  name?: string;
  subregion?: string;
  timezone?: string;
};

/**
 * Tipo legado mantido para compatibilidade
 * @deprecated Use EnderecoReverso + formatarEndereco()
 */
export interface UserAddress {
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode?: string;
  referencePoint?: string;
  latitude: number;
  longitude: number;
}

/**
 * Solicita permissão de localização e retorna o status
 */
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Erro ao solicitar permissão de localização:", error);
    return false;
  }
}

/**
 * Verifica se a permissão de localização já foi concedida
 */
export async function checkLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Erro ao verificar permissão de localização:", error);
    return false;
  }
}

/**
 * Obtém a localização atual do usuário
 */
export async function getCurrentLocation(): Promise<LocationObjectCoords | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location.coords;
  } catch (error) {
    console.error("Erro ao obter localização:", error);
    return null;
  }
}

/**
 * Obtém o endereço completo a partir das coordenadas usando reverse geocoding
 * 
 * @param latitude - Latitude da coordenada
 * @param longitude - Longitude da coordenada
 * @returns EnderecoReverso completo ou null se falhar
 * 
 * Importante: O que vem preenchido varia entre Android e iOS
 * (às vezes streetNumber pode vir vazio, ou district mudar).
 * Para 100% de consistência, considere serviços externos (Google/Mapbox).
 */
export async function obterEnderecoPorCoordenadas(
  latitude: number,
  longitude: number
): Promise<EnderecoReverso | null> {
  try {
    // Tentar algumas vezes com retry e backoff
    const maxAttempts = 3;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
      try {
        const res = await reverseGeocodeAsync({ latitude, longitude });

        if (!res?.length) {
          attempt++;
          continue;
        }

        const a = res[0];

        return {
          name: a.name ?? undefined,
          street: a.street ?? undefined,
          streetNumber: a.streetNumber ?? undefined,
          district: a.district ?? undefined,
          city: a.city ?? undefined,
          subregion: a.subregion ?? undefined,
          region: a.region ?? undefined,
          postalCode: a.postalCode ?? undefined,
          country: a.country ?? undefined,
          isoCountryCode: a.isoCountryCode ?? undefined,
          timezone: a.timezone ?? undefined,
        };
      } catch (e: any) {
        const msg = String(e?.message || e);
        
        // Se serviço indisponível, aguardar e tentar novamente
        if (msg.includes("UNAVAILABLE") || msg.toUpperCase().includes("UNAVAILABLE")) {
          await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
          attempt++;
          continue;
        }
        
        // Outros erros: relançar
        throw e;
      }
    }

    // Todas as tentativas falharam
    return null;
  } catch (err) {
    console.error("Erro no reverse geocode:", err);
    return null;
  }
}

/**
 * Formata o endereço reverso em uma string legível
 * Formato: "Rua X, 123 - Bairro - Cidade/UF"
 * 
 * @param e - EnderecoReverso obtido de obterEnderecoPorCoordenadas
 * @returns String formatada ou vazia se endereço for null
 */
export function formatarEndereco(e: EnderecoReverso | null): string {
  if (!e) return "";

  // Linha 1: Rua + número
  const linha1 = [e.street || e.name, e.streetNumber].filter(Boolean).join(", ");
  
  // Linha 2: Bairro
  const linha2 = e.district || "";
  
  // Linha 3: Cidade/Estado
  const estado = e.region ? e.region.substring(0, 2).toUpperCase() : "";
  const linha3 = [e.city, estado].filter(Boolean).join("/");

  return [linha1, linha2, linha3].filter(Boolean).join(" - ");
}

/**
 * Formata endereço de forma compacta (sem bairro)
 * Formato: "Rua X, 123 - Cidade/UF"
 */
export function formatarEnderecoCompacto(e: EnderecoReverso | null): string {
  if (!e) return "";

  const linha1 = [e.street || e.name, e.streetNumber].filter(Boolean).join(", ");
  const estado = e.region ? e.region.substring(0, 2).toUpperCase() : "";
  const linha2 = [e.city, estado].filter(Boolean).join("/");

  return [linha1, linha2].filter(Boolean).join(" - ");
}

/**
 * Função legada mantida para compatibilidade com código existente
 * @deprecated Use obterEnderecoPorCoordenadas() + formatarEndereco()
 * 
 * Converte EnderecoReverso para o formato UserAddress legado
 */
export async function getAddressFromCoordinates(coords: {
  latitude: number;
  longitude: number;
}): Promise<UserAddress | null> {
  try {
    const endereco = await obterEnderecoPorCoordenadas(coords.latitude, coords.longitude);
    
    if (!endereco) {
      // Fallback: retornar estrutura mínima com lat/long
      return {
        street: "",
        city: "",
        state: "",
        latitude: coords.latitude,
        longitude: coords.longitude,
      } as UserAddress;
    }

    return {
      street: endereco.street || endereco.name || "",
      number: endereco.streetNumber || "",
      neighborhood: endereco.district || "",
      city: endereco.city || "",
      state: endereco.region ? endereco.region.substring(0, 2).toUpperCase() : "",
      zipCode: endereco.postalCode || "",
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  } catch (error) {
    console.error("Erro ao obter endereço (legado):", error);
    return {
      street: "",
      city: "",
      state: "",
      latitude: coords.latitude,
      longitude: coords.longitude,
    } as UserAddress;
  }
}

/**
 * Obtém a localização atual e o endereço completo do usuário
 */
export async function getCurrentLocationAndAddress(): Promise<{
  location: LocationObjectCoords;
  address: UserAddress;
} | null> {
  try {
    const location = await getCurrentLocation();
    if (!location) {
      return null;
    }

    const address = await getAddressFromCoordinates(location);
    if (!address) {
      return null;
    }

    return { location, address };
  } catch (error) {
    console.error("Erro ao obter localização e endereço:", error);
    return null;
  }
}
