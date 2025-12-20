import React, { forwardRef, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type OffersMotoSheetRef = BottomSheet;

interface OfferItem {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  badge?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  selected?: boolean;
  disabled?: boolean;
}

interface OffersMotoSheetProps {
  onConfirm?: (offerId: string) => void;
  onClose?: () => void;
}

const MOCK_OFFERS: OfferItem[] = [
  {
    id: "economico",
    title: "Leva Moto Econômico",
    subtitle: "Chegada: 14:32 • 5-8 min",
    price: "R$ 9,50",
    badge: "Melhor preço",
    icon: "two-wheeler",
    selected: true,
  },
  {
    id: "rapido",
    title: "Leva Moto Rápido",
    subtitle: "Chegada: 14:28 • 2-4 min",
    price: "R$ 12,90",
    badge: "RÁPIDO",
    icon: "electric-moped",
  },
  {
    id: "seguro",
    title: "Leva Moto Seguro",
    subtitle: "Seguro incluso • 5-8 min",
    price: "R$ 15,00",
    icon: "two-wheeler",
  },
  {
    id: "vip",
    title: "Moto VIP",
    subtitle: "Indisponível no momento",
    price: "--",
    icon: "sports-motorsports",
    disabled: true,
  },
];

export const OffersMotoSheet = forwardRef<
  OffersMotoSheetRef,
  OffersMotoSheetProps
>(({ onConfirm, onClose }, ref) => {
  const snapPoints = useMemo(() => ["70%"], []);
  const insets = useSafeAreaInsets();

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: "#0f231c" }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
    >
      {/* Header */}
      <View style={{ paddingTop: 8, paddingBottom: 12, paddingHorizontal: 20 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          Moto • Opções disponíveis
        </Text>
        <Text style={{ color: "#9bbbb0", fontSize: 13, marginTop: 4 }}>
          Veículos próximos a você
        </Text>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 96,
        }}
      >
        {MOCK_OFFERS.map((offer) => {
          const borderColor = offer.selected
            ? "#06db94"
            : "rgba(255,255,255,0.08)";
          const borderWidth = offer.selected ? 2 : 1;
          return (
            <TouchableOpacity
              key={offer.id}
              disabled={offer.disabled}
              activeOpacity={0.9}
              style={{
                marginBottom: 12,
                borderRadius: 16,
                backgroundColor: offer.disabled ? "#1b2823" : "#162e26",
                borderColor,
                borderWidth,
                padding: 14,
                opacity: offer.disabled ? 0.5 : 1,
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.06)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <MaterialIcons
                    name={(offer.icon ?? "two-wheeler") as any}
                    size={32}
                    color="#9bbbb0"
                  />
                  {offer.badge === "RÁPIDO" && (
                    <View
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        backgroundColor: "#3b82f6",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        RÁPIDO
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  {offer.badge === "Melhor preço" && (
                    <View style={{ marginBottom: 4 }}>
                      <Text
                        style={{
                          color: "#06db94",
                          backgroundColor: "rgba(6,219,148,0.2)",
                          fontSize: 10,
                          fontWeight: "700",
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 9999,
                          textTransform: "uppercase",
                        }}
                      >
                        Melhor preço
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                  >
                    {offer.title}
                  </Text>
                  <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
                    {offer.subtitle}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}
                  >
                    {offer.price}
                  </Text>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 9999,
                      borderWidth: 2,
                      borderColor: offer.selected ? "#06db94" : "#6b7280",
                      marginTop: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: offer.selected
                        ? "#06db94"
                        : "transparent",
                    }}
                  >
                    {offer.selected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 9999,
                          backgroundColor: "#0f231c",
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </BottomSheetScrollView>

      {/* Sticky Footer */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 16,
          paddingBottom: insets.bottom + 16,
          backgroundColor: "#0f231c",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons name="payments" size={20} color="#9bbbb0" />
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>
              Pagamento em Dinheiro
            </Text>
            <MaterialIcons name="expand-more" size={16} color="#9bbbb0" />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <MaterialIcons
              name="confirmation-number"
              size={20}
              color="#9bbbb0"
            />
            <Text style={{ color: "#9bbbb0", fontSize: 13 }}>Cupom</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#02de95",
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
          }}
          onPress={() => onConfirm?.("economico")}
        >
          <Text style={{ color: "#0f231c", fontSize: 16, fontWeight: "700" }}>
            Confirmar entrega
          </Text>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.1)",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#0f231c", fontSize: 14, fontWeight: "700" }}>
              R$ 9,50
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
});

OffersMotoSheet.displayName = "OffersMotoSheet";
