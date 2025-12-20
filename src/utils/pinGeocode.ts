import { reverseGeocodeAsync } from "expo-location";

export type PinGeocodeResult = {
  street: string;
  number?: string;
  city: string;
  state: string;
  formatted: string;
};

// Simple debounce helper
function debounce<T extends (...args: any[]) => any>(fn: T, wait = 300) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

async function reverseGeocodeWithRetry(
  lat: number,
  lng: number,
  attempts = 3
): Promise<PinGeocodeResult | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (res && res.length > 0) {
        const a = res[0];
        const street = a.street || a.name || "";
        const number = (a as any).streetNumber || "";
        const city = a.city || a.subregion || a.region || "";
        const state = (a.region || a.subregion || "")
          .substring(0, 2)
          .toUpperCase();
        const formatted = `${street}${
          number ? ", " + number : ""
        } - ${city} - ${state}`;
        return { street, number, city, state, formatted };
      }
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (
        msg.includes("UNAVAILABLE") ||
        msg.toUpperCase().includes("UNAVAILABLE")
      ) {
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
        continue;
      }
      throw e;
    }
  }
  return null;
}

export const pinGeocode = {
  reverse: reverseGeocodeWithRetry,
  // Debounced resolver useful for drag events
  debouncedReverse: debounce(
    async (
      lat: number,
      lng: number,
      onResult: (r: PinGeocodeResult | null) => void
    ) => {
      try {
        const r = await reverseGeocodeWithRetry(lat, lng);
        onResult(r);
      } catch (e) {
        console.log("Pin geocode error:", e);
        onResult(null);
      }
    },
    400
  ),
};
