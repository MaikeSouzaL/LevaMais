import axios from "axios";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";
const GEOCODE_API_BASE = "https://maps.googleapis.com/maps/api/geocode";

export interface PlaceAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  street?: string;
  streetNumber?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

/**
 * Busca endereços usando Google Places Autocomplete
 * Retorna sugestões em tempo real conforme o usuário digita
 */
export async function searchPlaces(
  query: string,
  sessionToken?: string
): Promise<PlaceAutocompleteResult[]> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("❌ Google Maps API Key não configurada");
      return [];
    }

    if (!query || query.trim().length < 3) {
      return [];
    }

    console.log("🔍 Google Places Autocomplete:", query);

    const response = await axios.get(
      `${PLACES_API_BASE}/autocomplete/json`,
      {
        params: {
          input: query,
          key: GOOGLE_MAPS_API_KEY,
          language: "pt-BR",
          components: "country:br", // Apenas Brasil
          sessiontoken: sessionToken || Date.now().toString(),
        },
      }
    );

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      console.error("❌ Google Places API Error:", response.data.status);
      return [];
    }

    const predictions = response.data.predictions || [];
    console.log(`✅ ${predictions.length} sugestões encontradas`);

    return predictions.map((prediction: any) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting.main_text,
      secondaryText: prediction.structured_formatting.secondary_text,
    }));
  } catch (error) {
    console.error("❌ Erro ao buscar lugares:", error);
    return [];
  }
}

/**
 * Obtém detalhes completos de um lugar usando Place ID
 * Retorna endereço completo, coordenadas e componentes
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceDetails | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("❌ Google Maps API Key não configurada");
      return null;
    }

    console.log("📍 Buscando detalhes do lugar:", placeId);

    const response = await axios.get(`${PLACES_API_BASE}/details/json`, {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        language: "pt-BR",
        fields: "address_components,formatted_address,geometry",
      },
    });

    if (response.data.status !== "OK") {
      console.error("❌ Google Places Details Error:", response.data.status);
      return null;
    }

    const result = response.data.result;
    const components = result.address_components || [];

    // Extrair componentes do endereço
    const getComponent = (type: string) => {
      const component = components.find((c: any) => c.types.includes(type));
      return component?.long_name || component?.short_name;
    };

    const placeDetails: PlaceDetails = {
      placeId,
      formattedAddress: result.formatted_address,
      street: getComponent("route"),
      streetNumber: getComponent("street_number"),
      neighborhood:
        getComponent("sublocality_level_1") ||
        getComponent("sublocality") ||
        getComponent("neighborhood"),
      city:
        getComponent("administrative_area_level_2") ||
        getComponent("locality"),
      state: getComponent("administrative_area_level_1"),
      stateCode: components.find((c: any) =>
        c.types.includes("administrative_area_level_1")
      )?.short_name,
      postalCode: getComponent("postal_code"),
      country: getComponent("country"),
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };

    console.log("✅ Detalhes obtidos:", placeDetails);
    return placeDetails;
  } catch (error) {
    console.error("❌ Erro ao obter detalhes do lugar:", error);
    return null;
  }
}

/**
 * Geocoding reverso usando Google Geocoding API
 * Converte coordenadas em endereço
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<PlaceDetails | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error("❌ Google Maps API Key não configurada");
      return null;
    }

    console.log(`🗺️ Reverse Geocoding: ${latitude}, ${longitude}`);

    const response = await axios.get(`${GEOCODE_API_BASE}/json`, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
        language: "pt-BR",
      },
    });

    if (response.data.status !== "OK") {
      console.error("❌ Google Geocoding Error:", response.data.status);
      return null;
    }

    const result = response.data.results[0];
    const components = result.address_components || [];

    const getComponent = (type: string) => {
      const component = components.find((c: any) => c.types.includes(type));
      return component?.long_name || component?.short_name;
    };

    const placeDetails: PlaceDetails = {
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      street: getComponent("route"),
      streetNumber: getComponent("street_number"),
      neighborhood:
        getComponent("sublocality_level_1") ||
        getComponent("sublocality") ||
        getComponent("neighborhood"),
      city:
        getComponent("administrative_area_level_2") ||
        getComponent("locality"),
      state: getComponent("administrative_area_level_1"),
      stateCode: components.find((c: any) =>
        c.types.includes("administrative_area_level_1")
      )?.short_name,
      postalCode: getComponent("postal_code"),
      country: getComponent("country"),
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };

    console.log("✅ Endereço obtido:", placeDetails);
    return placeDetails;
  } catch (error) {
    console.error("❌ Erro no reverse geocoding:", error);
    return null;
  }
}

export default {
  searchPlaces,
  getPlaceDetails,
  reverseGeocode,
};
