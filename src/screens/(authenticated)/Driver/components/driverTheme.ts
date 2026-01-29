export const driverTheme = {
  colors: {
    screenBg: "#0f231c",
    cardBg: "rgba(17,24,22,0.96)",
    cardBgSolid: "#111816",
    border: "rgba(255,255,255,0.10)",
    borderSubtle: "rgba(255,255,255,0.08)",

    text: "#fff",
    textMuted: "rgba(255,255,255,0.65)",
    textSubtle: "rgba(255,255,255,0.70)",

    primary: "#02de95",
    danger: "#ef4444",
    info: "#3b82f6",
    onPrimary: "#0f231c",
    onDanger: "#111816",
  },
  radius: {
    sm: 12,
    md: 16,
    lg: 18,
    pill: 999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 16,
    xl: 18,
  },
  typography: {
    title: { fontSize: 18, fontWeight: "900" as const },
    sectionTitle: { fontSize: 16, fontWeight: "900" as const },
    body: { fontSize: 14, fontWeight: "700" as const },
    label: { fontSize: 12, fontWeight: "800" as const },
  },
} as const;
