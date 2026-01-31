import citiesService from "./cities.service";

export type ResolveCityInput = {
  cityName?: string | null;
  stateCode?: string | null; // UF
};

export async function resolveCityIdByNameAndState(
  input: ResolveCityInput,
): Promise<{ cityId: string; name: string; state: string } | null> {
  const cityName = (input.cityName || "").trim();
  const state = (input.stateCode || "").trim().toUpperCase();

  if (!cityName || !state) return null;

  const cities = await citiesService.list({ isActive: true, state });

  const normalized = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  const found = cities.find(
    (c) => normalized(c.name) === normalized(cityName) && c.state === state,
  );

  if (!found) return null;

  return { cityId: found._id, name: found.name, state: found.state };
}
