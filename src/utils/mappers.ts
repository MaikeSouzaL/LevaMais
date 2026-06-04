export type UiVehicleType = "motorcycle" | "car" | "van" | "truck";
export type ApiVehicleType = "motorcycle" | "car" | "van" | "truck";

export type UiServiceMode = "delivery" | "ride" | "frete";
export type ApiServiceType = "delivery" | "ride";

export function mapVehicleTypeToApi(t: UiVehicleType): ApiVehicleType {
  return t;
}

export function mapServiceModeToApi(
  t: UiServiceMode | undefined,
): ApiServiceType {
  // backend CreateRideRequest atualmente suporta apenas delivery|ride
  if (!t) return "delivery";
  if (t === "frete") return "delivery";
  return t;
}

import { getBaseURL } from "../services/api";

export function resolveAssetURL(url?: string): string | undefined {
  if (!url) return undefined;
  
  // Se for um caminho relativo, anexa a URL base do servidor (removendo o sufixo /api se houver)
  if (url.startsWith("/")) {
    const apiBase = getBaseURL();
    const serverBase = apiBase.replace(/\/api$/, "");
    return `${serverBase}${url}`;
  }

  // Se a URL contiver a pasta /uploads/, reescreve a origem dinamicamente para apontar para o servidor atual
  if (url.includes("/uploads/")) {
    const apiBase = getBaseURL();
    const serverBase = apiBase.replace(/\/api$/, "");
    const parts = url.split("/uploads/");
    return `${serverBase}/uploads/${parts[1]}`;
  }

  return url;
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
