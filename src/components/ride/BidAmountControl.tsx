import React, { useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, PanResponder, LayoutChangeEvent } from "react-native";
import { Minus, Plus } from "lucide-react-native";

export interface BidAmountControlProps {
  /** Limite mínimo permitido (faixa do backend). */
  min: number;
  /** Limite máximo permitido (faixa do backend). */
  max: number;
  /** Preço sugerido (marcador de referência). */
  suggested: number;
  /** Valor atual do lance. */
  value: number;
  /** Callback ao alterar o lance. */
  onChange: (value: number) => void;
}

const TRACK_HEIGHT = 6;
const THUMB = 26;
const TOUCH_H = 40;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function snap(n: number, step: number) {
  return Math.round(n / step) * step;
}
function formatBRL(n: number) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

/**
 * Controle de lance: slider arrastável dentro da faixa permitida + stepper (− / +)
 * com passo proporcional, marcador do preço sugerido e feedback dinâmico.
 */
export function BidAmountControl({ min, max, suggested, value, onChange }: BidAmountControlProps) {
  const [trackW, setTrackW] = useState(0);
  const trackWRef = useRef(0);
  const minRef = useRef(min);
  const maxRef = useRef(max);
  minRef.current = min;
  maxRef.current = max;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const safeValue = clamp(value);
  const range = Math.max(0.01, max - min);

  const fillPct = Math.min(1, Math.max(0, (safeValue - min) / range));
  const suggestedPct = Math.min(1, Math.max(0, (clamp(suggested) - min) / range));

  // Passo do stepper ≈ 5% do sugerido, arredondado a R$0,50 (mín. R$0,50).
  const step = useMemo(() => Math.max(0.5, Math.round((suggested * 0.05) / 0.5) * 0.5), [suggested]);

  const setFromX = (x: number) => {
    const w = trackWRef.current;
    if (w <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    const raw = minRef.current + ratio * (maxRef.current - minRef.current);
    onChange(round2(Math.min(maxRef.current, Math.max(minRef.current, snap(raw, 0.1)))));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX),
    }),
  ).current;

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWRef.current = w;
    setTrackW(w);
  };

  const atMin = safeValue <= min + 0.001;
  const atMax = safeValue >= max - 0.001;

  // Feedback dinâmico de competitividade.
  const diff = safeValue - suggested;
  const pct = suggested > 0 ? (diff / suggested) * 100 : 0;
  const atSuggested = Math.abs(diff) < 0.01;
  const feedback = atSuggested
    ? { text: "No preço sugerido · ótima chance de aceitação", color: "#059669", bg: "#ECFDF5" }
    : diff < 0
      ? { text: `${Math.abs(pct).toFixed(0)}% abaixo do sugerido · menor chance`, color: "#B45309", bg: "#FFFBEB" }
      : { text: `${pct.toFixed(0)}% acima do sugerido · alta chance`, color: "#1D4ED8", bg: "#EFF6FF" };

  const thumbLeft = trackW > 0 ? fillPct * trackW - THUMB / 2 : 0;

  return (
    <View>
      {/* Stepper + valor central */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
        <StepperButton icon="minus" disabled={atMin} onPress={() => onChange(round2(clamp(safeValue - step)))} />

        <View style={{ marginHorizontal: 24, alignItems: "center", minWidth: 150 }}>
          <Text style={{ color: "#94A3B8", fontSize: 12, fontWeight: "700" }}>Valor da oferta</Text>
          <Text style={{ color: "#0F172A", fontSize: 42, fontWeight: "900", lineHeight: 50 }}>{formatBRL(safeValue)}</Text>
        </View>

        <StepperButton icon="plus" disabled={atMax} onPress={() => onChange(round2(clamp(safeValue + step)))} />
      </View>

      <Text style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, fontWeight: "700", marginBottom: 16 }}>
        Toque − / + para ajustar de {formatBRL(step)} em {formatBRL(step)}
      </Text>

      {/* Slider */}
      <View {...pan.panHandlers} onLayout={onTrackLayout} style={{ height: TOUCH_H, justifyContent: "center" }}>
        {/* trilho */}
        <View style={{ height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: "#E2E8F0" }} pointerEvents="none">
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${fillPct * 100}%`, backgroundColor: "#02de95", borderRadius: TRACK_HEIGHT / 2 }} />
        </View>

        {/* marcador do preço sugerido */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: `${suggestedPct * 100}%`, top: 4, alignItems: "center", marginLeft: -1 }}
        >
          <View style={{ width: 2, height: TOUCH_H - 8, backgroundColor: "#94A3B8", opacity: 0.6, borderRadius: 1 }} />
        </View>

        {/* thumb */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: thumbLeft,
            width: THUMB,
            height: THUMB,
            borderRadius: THUMB / 2,
            backgroundColor: "#fff",
            borderWidth: 3,
            borderColor: "#02de95",
            shadowColor: "#0f172a",
            shadowOpacity: 0.18,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 3,
          }}
        />
      </View>

      {/* labels min / sugerido / max */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 2, marginBottom: 14 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#94A3B8" }}>Mín {formatBRL(min)}</Text>
        <Text style={{ fontSize: 11, fontWeight: "700", color: "#94A3B8" }}>Máx {formatBRL(max)}</Text>
      </View>

      {/* Feedback dinâmico */}
      <View style={{ alignSelf: "center", flexDirection: "row", alignItems: "center", backgroundColor: feedback.bg, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 14 }}>
        <Text style={{ color: feedback.color, fontSize: 12, fontWeight: "800", textAlign: "center" }}>{feedback.text}</Text>
      </View>

      {/* Restaurar sugerido */}
      {!atSuggested && (
        <TouchableOpacity
          onPress={() => onChange(round2(clamp(suggested)))}
          activeOpacity={0.8}
          style={{ alignSelf: "center", marginTop: 12, backgroundColor: "#ECFDF5", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: "#02de95" }}
        >
          <Text style={{ color: "#059669", fontSize: 12, fontWeight: "800" }}>Usar preço sugerido ({formatBRL(suggested)})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StepperButton({ icon, disabled, onPress }: { icon: "minus" | "plus"; disabled?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: disabled ? "#F1F5F9" : "#0F172A",
        alignItems: "center",
        justifyContent: "center",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon === "minus" ? (
        <Minus size={22} color={disabled ? "#94A3B8" : "#fff"} strokeWidth={3} />
      ) : (
        <Plus size={22} color={disabled ? "#94A3B8" : "#fff"} strokeWidth={3} />
      )}
    </TouchableOpacity>
  );
}

export default BidAmountControl;
