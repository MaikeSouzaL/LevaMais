export type UiVehicleType = "moto" | "car" | "van" | "truck";
export type ApiVehicleType = "motorcycle" | "car" | "van" | "truck";

export type UiServiceMode = "delivery" | "ride" | "frete";
export type ApiServiceType = "delivery" | "ride";

export function mapVehicleTypeToApi(t: UiVehicleType): ApiVehicleType {
  return t === "moto" ? "motorcycle" : t;
}

export function mapServiceModeToApi(
  t: UiServiceMode | undefined,
): ApiServiceType {
  // backend CreateRideRequest atualmente suporta apenas delivery|ride
  if (!t) return "delivery";
  if (t === "frete") return "delivery";
  return t;
}

export function formatBRL(value: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}
