import React, { useMemo, useState, forwardRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

export type OffersVanSheetRef = BottomSheet;
type Payment = "dinheiro" | "pix" | "cartao";

interface OfferItem {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  badge?: string;
  disabled?: boolean;
}

interface OffersVanSheetProps {
  onBack?: () => void;
  onConfirm?: (offerId: string) => void;
  onClose?: () => void;
  nextPriceText?: string;
  nextEtaText?: string;
  loadingQuote?: boolean;
}

const OFFERS: OfferItem[] = [
  {
    id: "van-economica",
    title: "Van Econômica",
    subtitle: "Chegada: 15-25 min",
    price: "R$ 39,90",
    badge: "MELHOR PREÇO",
  },
  {
    id: "van-rapida",
    title: "Van Rápida",
    subtitle: "Chegada: 10-18 min",
    price: "R$ 49,90",
    badge: "RÁPIDO",
  },
  {
    id: "van-bau",
    title: "Van Baú",
    subtitle: "Chegada: 20-30 min",
    price: "R$ 59,90",
  },
  {
    id: "van-vip",
    title: "Van VIP",
    subtitle: "Indisponível no momento",
    price: "--",
    disabled: true,
  },
];

export const OffersVanSheet = forwardRef<
  OffersVanSheetRef,
  OffersVanSheetProps
>(
  (
    { onBack, onConfirm, onClose, nextPriceText, nextEtaText, loadingQuote },
    ref,
  ) => {
    const snapPoints = useMemo(() => ["90%"], []);
    const [selectedOffer, setSelectedOffer] = useState<string>(OFFERS[0].id);
    const [payment, setPayment] = useState<Payment>("dinheiro");

    const offers = useMemo(() => {
      // MVP: preço/ETA reais vêm do backend via props.
      // Mantemos uma única opção ativa para não exibir tiers mock.
      const base = OFFERS[0];
      return [
        {
          ...base,
          title: "Van",
          subtitle: nextEtaText ? `Chegada: ${nextEtaText}` : base.subtitle,
          price: loadingQuote ? "..." : nextPriceText || base.price,
          disabled: false,
        },
      ];
    }, [loadingQuote, nextEtaText, nextPriceText]);

    const selected = offers.find((o) => o.id === selectedOffer) || offers[0];

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        enableHandlePanningGesture={false}
        backgroundStyle={{ backgroundColor: "#0f231c" }}
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)" }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "800",
              marginBottom: 6,
            }}
          >
            Van • Opções disponíveis
          </Text>
          <Text style={{ color: "#9bbbb0", marginBottom: 12 }}>
            Veículos próximos a você
          </Text>

          {offers.map((offer) => (
            <TouchableOpacity
              key={offer.id}
              activeOpacity={0.9}
              onPress={() => !offer.disabled && setSelectedOffer(offer.id)}
              style={{
                opacity: offer.disabled ? 0.5 : 1,
                marginBottom: 12,
                padding: 14,
                borderRadius: 16,
                backgroundColor:
                  selectedOffer === offer.id ? "#162e26" : "#11261f",
                borderWidth: 2,
                borderColor:
                  selectedOffer === offer.id
                    ? "#06db94"
                    : "rgba(255,255,255,0.08)",
              }}
            >
              {offer.badge && (
                <View
                  style={{
                    backgroundColor: "rgba(6,219,148,0.2)",
                    alignSelf: "flex-start",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: "#06db94",
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {offer.badge}
                  </Text>
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
                  >
                    {offer.title}
                  </Text>
                  <Text
                    style={{ color: "#9bbbb0", fontSize: 12, marginTop: 4 }}
                  >
                    {offer.subtitle}
                  </Text>
                </View>
                <Text style={{ color: "#fff", fontWeight: "800" }}>
                  {offer.price}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ marginTop: 8 }}>
            <Text style={{ color: "#9bbbb0", marginBottom: 8 }}>
              Forma de pagamento
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {(
                [
                  { id: "dinheiro", label: "Dinheiro" },
                  { id: "pix", label: "Pix" },
                  { id: "cartao", label: "Cartão" },
                ] as const
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => setPayment(opt.id)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor:
                      payment === opt.id ? "#06db94" : "rgba(255,255,255,0.12)",
                    backgroundColor:
                      payment === opt.id ? "rgba(6,219,148,0.15)" : "#162e26",
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: payment === opt.id ? "#06db94" : "#9bbbb0",
                      fontWeight: "700",
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={onBack}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  backgroundColor: "#162e26",
                }}
              >
                <Text style={{ color: "#9bbbb0", fontWeight: "800" }}>
                  Voltar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onConfirm?.(selectedOffer)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#02de95",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#0f231c", fontWeight: "900" }}>
                    Próximo • {selected?.price}
                  </Text>
                  {!!selected?.subtitle && (
                    <Text
                      style={{
                        color: "rgba(15,35,28,0.75)",
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      {selected.subtitle}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

OffersVanSheet.displayName = "OffersVanSheet";
