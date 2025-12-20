import * as Location from "expo-location";
import { reverseGeocodeAsync, LocationObjectCoords } from "expo-location";

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
 * Obtém o endereço completo a partir das coordenadas
 */
export async function getAddressFromCoordinates(coords: {
  latitude: number;
  longitude: number;
}): Promise<UserAddress | null> {
  try {
    // Tentar algumas vezes, pois o serviço pode estar temporariamente indisponível
    const maxAttempts = 3;
    let attempt = 0;
    let addressResponse: Location.LocationGeocodedAddress[] | null = null;

    while (attempt < maxAttempts) {
      try {
        addressResponse = await reverseGeocodeAsync(coords);
        if (addressResponse && addressResponse.length > 0) break;
      } catch (e: any) {
        // Se indisponível, aguardar um pouco e tentar novamente
        const msg = String(e?.message || e);
        if (msg.includes("UNAVAILABLE") || msg.includes("ihuf")) {
          await new Promise((res) => setTimeout(res, 500 * (attempt + 1)));
          attempt++;
          continue;
        }
        // Outros erros: relatar e sair
        throw e;
      }
      attempt++;
    }

    if (!addressResponse || addressResponse.length === 0) {
      // Fallback: retornar estrutura mínima com lat/long quando geocoder não disponível
      return {
        street: "",
        city: "",
        state: "",
        latitude: coords.latitude,
        longitude: coords.longitude,
      } as UserAddress;
    }

    const address = addressResponse[0];

    // Extrair informações do endereço
    const street = address.street || address.name || address.district || "";

    // Tentar obter o número (streetNumber)
    const number = address.streetNumber || "";

    const city = address.city || address.subregion || address.region || "";

    // Para o estado, usar region (que geralmente contém a sigla do estado)
    // ou subregion se region não estiver disponível
    const state = address.region || address.subregion || "";

    const zipCode = address.postalCode || "";

    // subLocality não existe no tipo LocationGeocodedAddress, usar apenas district
    const neighborhood = address.district || "";

    return {
      street,
      number,
      city,
      state: state.substring(0, 2).toUpperCase(), // Apenas sigla do estado
      zipCode,
      neighborhood,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  } catch (error) {
    console.error("Erro ao obter endereço:", error);
    // Fallback seguro
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
