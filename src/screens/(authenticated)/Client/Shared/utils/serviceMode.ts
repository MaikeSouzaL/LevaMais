type PurposeLike = {
  id?: string;
  title?: string;
  subtitle?: string;
  badges?: string[];
  serviceMode?: string;
};

export type PurposeServiceMode = "ride" | "delivery" | "frete";

const RIDE_KEYWORDS = [
  "ride",
  "taxi",
  "corrida",
  "passageiro",
  "passageiros",
  "pessoa",
  "pessoas",
  "mobilidade",
  "transporte de pessoas",
];

const FRETE_KEYWORDS = [
  "frete",
  "mudanca",
  "mudança",
  "carga",
  "palete",
  "pallet",
  "comercial",
  "moveis",
  "móveis",
  "truck",
  "caminhao",
  "caminhão",
];

const DELIVERY_KEYWORDS = [
  "delivery",
  "entrega",
  "documento",
  "farmacia",
  "farmácia",
  "mercado",
  "pet",
  "compra",
  "expresso",
];

function toSearchableText(purpose?: PurposeLike): string {
  if (!purpose) return "";
  return [
    purpose.id,
    purpose.title,
    purpose.subtitle,
    ...(purpose.badges || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((word) => text.includes(word));
}

export function inferPurposeServiceMode(
  purpose?: PurposeLike,
): PurposeServiceMode {
  const explicit = String(purpose?.serviceMode || "").toLowerCase();
  if (explicit === "ride" || explicit === "delivery" || explicit === "frete") {
    return explicit;
  }

  const text = toSearchableText(purpose);

  if (containsAny(text, RIDE_KEYWORDS)) return "ride";
  if (containsAny(text, FRETE_KEYWORDS)) return "frete";
  if (containsAny(text, DELIVERY_KEYWORDS)) return "delivery";

  return "delivery";
}

export function buildModeCounts(purposes: PurposeLike[]) {
  return purposes.reduce(
    (acc, purpose) => {
      const mode = inferPurposeServiceMode(purpose);
      acc[mode] += 1;
      acc.total += 1;
      return acc;
    },
    { ride: 0, delivery: 0, frete: 0, total: 0 },
  );
}

export function formatModeSummary(counts: {
  ride: number;
  delivery: number;
  frete: number;
}) {
  const parts: string[] = [];
  if (counts.ride > 0) parts.push(`${counts.ride} corrida`);
  if (counts.delivery > 0) parts.push(`${counts.delivery} entrega`);
  if (counts.frete > 0) parts.push(`${counts.frete} frete`);

  if (!parts.length) return "Sem servicos ativos";
  return parts.join(" | ");
}
