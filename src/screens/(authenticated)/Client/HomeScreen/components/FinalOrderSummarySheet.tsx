import React, { forwardRef, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type FinalOrderSummaryData = {
  pickupAddress: string;
  pickupNeighborhood?: string;
  dropoffAddress: string;
  dropoffNeighborhood?: string;
  vehicleType: "moto" | "car" | "van" | "truck";
  servicePurposeLabel: string;
  etaMinutes?: number;
  pricing: {
    base: number;
    distanceKm: number;
    distancePrice: number;
    serviceFee: number;
    total: number;
  };
  paymentSummary: string; // e.g., "Visa final 4242" / "Dinheiro" / "Pix"
  itemType?: string; // e.g., "Caixa pequena"
  helperIncluded?: boolean; // Ajudante
  insuranceLevel?: "none" | "basic" | "premium";
};

type Props = {
  data: FinalOrderSummaryData;
  onConfirm: () => void;
};

// This sheet mimics the provided HTML layout while using RN primitives
export const FinalOrderSummarySheet = forwardRef<BottomSheetModal, Props>(
  ({ data, onConfirm }, ref) => {
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ["85%"], []);

    const vehicleIconName = {
      moto: "🛵",
      car: "🚗",
      van: "🚐",
      truck: "🚚",
    }[data.vehicleType];

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        backgroundStyle={{ backgroundColor: "#0f231c" }}
        style={{ overflow: "hidden" }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.05)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
                Resumo do pedido
              </Text>
              <TouchableOpacity accessibilityRole="button">
                <Text style={{ color: "#02de95", fontWeight: "600" }}>
                  Editar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: Math.max(insets.bottom, 24) + 96,
            }}
          >
            {/* Route timeline */}
            <View
              style={{
                flexDirection: "row",
                columnGap: 16,
                marginTop: 16,
                marginBottom: 24,
              }}
            >
              <View style={{ width: 24, alignItems: "center" }}>
                <View
                  style={{
                    height: 14,
                    width: 14,
                    borderRadius: 7,
                    backgroundColor: "#02de95",
                    borderWidth: 2,
                    borderColor: "#0f231c",
                    shadowColor: "#02de95",
                    shadowOpacity: 0.8,
                    shadowRadius: 6,
                  }}
                />
                <View
                  style={{
                    width: 2,
                    flexGrow: 1,
                    borderLeftWidth: 2,
                    borderStyle: "dotted",
                    borderColor: "rgba(255,255,255,0.2)",
                    marginVertical: 4,
                    minHeight: 40,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#9abcb0",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Coleta
                </Text>
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  {data.pickupAddress}
                </Text>
                {!!data.pickupNeighborhood && (
                  <Text style={{ color: "#9abcb0", fontSize: 13 }}>
                    {data.pickupNeighborhood}
                  </Text>
                )}
              </View>
            </View>
            <View
              style={{ flexDirection: "row", columnGap: 16, marginBottom: 12 }}
            >
              <View style={{ width: 24, alignItems: "center" }}>
                <Text style={{ fontSize: 20, color: "#ff4b4b", marginTop: -4 }}>
                  📍
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: "#9abcb0",
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  Destino
                </Text>
                <Text
                  style={{ color: "white", fontSize: 16, fontWeight: "600" }}
                >
                  {data.dropoffAddress}
                </Text>
                {!!data.dropoffNeighborhood && (
                  <Text style={{ color: "#9abcb0", fontSize: 13 }}>
                    {data.dropoffNeighborhood}
                  </Text>
                )}
              </View>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                marginBottom: 16,
              }}
            />

            {/* Selected service card */}
            <View
              style={{
                backgroundColor: "#162e25",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                columnGap: 12,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 12,
                  backgroundColor: "#1e3b32",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 24 }}>{vehicleIconName}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{ color: "white", fontSize: 18, fontWeight: "700" }}
                  >
                    Entrega • {labelForVehicle(data.vehicleType)}
                  </Text>
                  {!!data.etaMinutes && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "rgba(2,222,149,0.1)",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#02de95",
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        Rápido
                      </Text>
                    </View>
                  )}
                </View>
                {!!data.etaMinutes && (
                  <Text style={{ color: "#9abcb0", fontSize: 13 }}>
                    Chegada estimada:{" "}
                    <Text style={{ color: "white", fontWeight: "600" }}>
                      {data.etaMinutes} min
                    </Text>
                  </Text>
                )}
                {!!data.servicePurposeLabel && (
                  <Text
                    style={{ color: "#9abcb0", fontSize: 12, marginTop: 2 }}
                  >
                    Finalidade:{" "}
                    <Text style={{ color: "white" }}>
                      {data.servicePurposeLabel}
                    </Text>
                  </Text>
                )}
              </View>
            </View>

            {/* Details */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "rgba(255,255,255,0.5)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Detalhes da Corrida
              </Text>
              {!!data.itemType && (
                <Row label="Tipo de item" value={data.itemType} />
              )}
              {typeof data.helperIncluded !== "undefined" && (
                <Row
                  label="Ajudante"
                  value={data.helperIncluded ? "Incluído" : "Não incluso"}
                />
              )}
              <Row
                label="Seguro"
                value={insuranceLabel(data.insuranceLevel)}
                highlight={data.insuranceLevel !== "none"}
              />
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                marginBottom: 16,
              }}
            />

            {/* Pricing */}
            <View
              style={{
                backgroundColor: "rgba(22,46,37,0.3)",
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <Row
                label="Tarifa base"
                value={formatBRL(data.pricing.base)}
                muted
              />
              <Row
                label={`Distância (${data.pricing.distanceKm.toFixed(1)} km)`}
                value={formatBRL(data.pricing.distancePrice)}
                muted
              />
              <View
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.05)",
                  paddingBottom: 8,
                  marginBottom: 8,
                }}
              >
                <Row
                  label="Taxa de serviço"
                  value={formatBRL(data.pricing.serviceFee)}
                  muted
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 18 }}
                >
                  Total
                </Text>
                <Text
                  style={{ color: "#02de95", fontWeight: "800", fontSize: 24 }}
                >
                  {formatBRL(data.pricing.total)}
                </Text>
              </View>
            </View>

            {/* Payment */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#162e25",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)",
                padding: 16,
                borderRadius: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    padding: 6,
                    borderRadius: 8,
                    marginRight: 12,
                  }}
                >
                  <Text style={{ color: "white" }}>💳</Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: "#9abcb0",
                      fontWeight: "700",
                      textTransform: "uppercase",
                    }}
                  >
                    Pagamento
                  </Text>
                  <Text
                    style={{ color: "white", fontSize: 14, fontWeight: "600" }}
                  >
                    {data.paymentSummary}
                  </Text>
                </View>
              </View>
              <Text style={{ color: "#9abcb0" }}>›</Text>
            </TouchableOpacity>
          </BottomSheetScrollView>

          {/* Footer */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: 16,
              paddingBottom: Math.max(insets.bottom, 16) + 16,
              backgroundColor: "rgba(15,35,28,0.95)",
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.05)",
            }}
          >
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.9}
              style={{
                height: 56,
                borderRadius: 12,
                backgroundColor: "#02de95",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ color: "#0f231c", fontWeight: "800", fontSize: 18 }}
                >
                  Confirmar Pedido
                </Text>
                <Text style={{ marginLeft: 8, color: "#0f231c" }}>→</Text>
              </View>
            </TouchableOpacity>
            <Text
              style={{
                textAlign: "center",
                fontSize: 11,
                color: "#9abcb0",
                marginTop: 8,
              }}
            >
              Ao confirmar, buscaremos um motorista próximo a você.
            </Text>
          </View>
        </View>
      </BottomSheetModal>
    );
  }
);

function labelForVehicle(v: FinalOrderSummaryData["vehicleType"]) {
  switch (v) {
    case "moto":
      return "Moto";
    case "car":
      return "Carro";
    case "van":
      return "Van";
    case "truck":
      return "Caminhão";
    default:
      return "Veículo";
  }
}

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}

function insuranceLabel(level: FinalOrderSummaryData["insuranceLevel"]) {
  if (level === "premium") return "Premium";
  if (level === "basic") return "Básico Ativado";
  return "Não contratado";
}

function Row({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <Text style={{ color: muted ? "#9abcb0" : "#9abcb0", fontSize: 14 }}>
        {label}
      </Text>
      <Text
        style={{
          color: highlight ? "#02de95" : "white",
          fontSize: 14,
          fontWeight: highlight ? "700" : "400",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default FinalOrderSummarySheet;
