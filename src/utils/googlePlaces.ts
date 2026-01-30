export type PlacesPrediction = {
  placeId: string;
  description: string;
  primaryText?: string;
  secondaryText?: string;
};

type GooglePlacesAutocompleteResponse = {
  status: string;
  error_message?: string;
  predictions?: Array<{
    description: string;
    place_id: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
};

type GooglePlacesDetailsResponse = {
  status: string;
  error_message?: string;
  result?: {
    formatted_address?: string;
    geometry?: { location?: { lat: number; lng: number } };
  };
};

function getGoogleMapsApiKey(): string {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    throw new Error(
      "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY não definido. Configure no .env",
    );
  }
  return key;
}

function buildUrl(base: string, params: Record<string, string | undefined>) {
  const url = new URL(base);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  });
  return url.toString();
}

export async function buscarPredicoesEnderecoGoogle(
  input: string,
  opts?: { latitude?: number; longitude?: number; radiusMeters?: number },
): Promise<PlacesPrediction[]> {
  if (!input || input.trim().length < 3) return [];

  const key = getGoogleMapsApiKey();

  const location =
    opts?.latitude != null && opts?.longitude != null
      ? `${opts.latitude},${opts.longitude}`
      : undefined;

  const radius =
    location && opts?.radiusMeters ? String(opts.radiusMeters) : undefined;

  const url = buildUrl(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    {
      input: input.trim(),
      key,
      language: "pt-BR",
      components: "country:br",
      location,
      radius,
    },
  );

  const res = await fetch(url);
  const data = (await res.json()) as GooglePlacesAutocompleteResponse;

  if (data.status !== "OK") {
    // ZERO_RESULTS é ok, só retorna vazio
    if (data.status === "ZERO_RESULTS") return [];
    console.warn(
      "Google Places Autocomplete error:",
      data.status,
      data.error_message,
    );
    return [];
  }

  return (data.predictions || []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    primaryText: p.structured_formatting?.main_text,
    secondaryText: p.structured_formatting?.secondary_text,
  }));
}

export async function obterDetalhesEnderecoGoogle(placeId: string): Promise<{
  formattedAddress: string;
  latitude: number;
  longitude: number;
} | null> {
  if (!placeId) return null;

  const key = getGoogleMapsApiKey();
  const url = buildUrl("https://maps.googleapis.com/maps/api/place/details/json", {
    place_id: placeId,
    key,
    language: "pt-BR",
    fields: "formatted_address,geometry",
  });

  const res = await fetch(url);
  const data = (await res.json()) as GooglePlacesDetailsResponse;

  if (data.status !== "OK") {
    console.warn(
      "Google Places Details error:",
      data.status,
      data.error_message,
    );
    return null;
  }

  const lat = data.result?.geometry?.location?.lat;
  const lng = data.result?.geometry?.location?.lng;
  const formatted = data.result?.formatted_address;

  if (lat == null || lng == null || !formatted) return null;

  return { formattedAddress: formatted, latitude: lat, longitude: lng };
}
