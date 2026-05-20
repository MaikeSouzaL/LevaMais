import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { ArrowLeft, Banknote, QrCode, CreditCard, CheckCircle, Shield } from "lucide-react-native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";

type PaymentMethod = "cash" | "pix" | "card";

const METHODS: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
  { id: "cash", label: "Dinheiro", icon: Banknote, color: "#02de95" },
  { id: "pix", label: "Pix", icon: QrCode, color: "#32BCAD" },
  { id: "card", label: "Cartao", icon: CreditCard, color: "#3b82f6" },
];

export default function DeliveryPaymentConfirmScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = String(route.params?.rideId || "");
  const insets = useSafeAreaInsets();

  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [rideData, setRideData] = useState<any>(null);

  useEffect(() => {
    if (!rideId) return;
    (async () => {
      try {
        const res = await rideService.getActiveList();
        const ride = (res?.rides || []).find((r: any) => r._id === rideId);
        if (ride) setRideData(ride);
      } catch {}
      setLoading(false);
    })();
  }, [rideId]);

  const selectedDriver = rideData?.negotiation?.offers?.find(
    (o: any) => String(o.driverId?._id || o.driverId) === String(rideData?.negotiation?.selectedDriverId)
  );

  const driverName =
    typeof selectedDriver?.driverId === "object"
      ? selectedDriver.driverId?.name || "Entregador"
      : "Entregador";

  const agreedPrice = rideData?.negotiation?.finalAgreedPrice || rideData?.pricing?.total || 0;

  const handleConfirm = async () => {
    if (confirming) return;
    setConfirming(true);
    try {
      await rideService.confirmNegotiationPayment(rideId, { method });
      Toast.show({ type: "success", text1: "Pagamento confirmado!", text2: "O entregador foi notificado." });
      navigation.reset({
        index: 0,
        routes: [{ name: "Home", params: { activeRideId: rideId } }],
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao confirmar",
        text2: e?.message || "Tente novamente.",
      });
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#091A2F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#02de95" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontSize: 19, fontWeight: "800" }}>
          Confirmar Pagamento
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Driver + Price Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            backgroundColor: "#11253E",
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 18 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "rgba(2,222,149,0.12)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <CheckCircle size={26} color="#02de95" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                {driverName}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                Entregador selecionado
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: "rgba(2,222,149,0.06)",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600" }}>
              Valor acordado
            </Text>
            <Text style={{ color: "#02de95", fontSize: 26, fontWeight: "900" }}>
              {formatBRL(Number(agreedPrice))}
            </Text>
          </View>
        </MotiView>

        {/* Route Summary */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80 }}
          style={{
            backgroundColor: "#11253E",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)",
            marginBottom: 24,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 }}>
            Resumo da Rota
          </Text>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", marginBottom: 4 }} numberOfLines={1}>
            Coleta: {rideData?.pickup?.address || "-"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }} numberOfLines={1}>
            Entrega: {rideData?.dropoff?.address || "-"}
          </Text>
        </MotiView>

        {/* Payment Method Selection */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 160 }}
          style={{ marginBottom: 32 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 14, paddingHorizontal: 4 }}>
            Forma de Pagamento
          </Text>

          <View style={{ flexDirection: "row", gap: 10 }}>
            {METHODS.map((item) => {
              const isActive = method === item.id;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => setMethod(item.id)}
                  style={{ flex: 1 }}
                >
                  <MotiView
                    animate={{
                      backgroundColor: isActive ? item.color + "20" : "rgba(255,255,255,0.03)",
                      borderColor: isActive ? item.color : "rgba(255,255,255,0.06)",
                      scale: isActive ? 1.02 : 1,
                    }}
                    style={{
                      height: 80,
                      borderRadius: 20,
                      borderWidth: 1,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isActive && (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: item.color,
                        }}
                      />
                    )}
                    <Icon size={24} color={isActive ? item.color : "#fff"} style={{ opacity: isActive ? 1 : 0.5 }} />
                    <Text
                      style={{
                        color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                        fontWeight: "700",
                        fontSize: 12,
                        marginTop: 6,
                      }}
                    >
                      {item.label}
                    </Text>
                  </MotiView>
                </TouchableOpacity>
              );
            })}
          </View>
        </MotiView>

        {/* Security notice */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(251,191,36,0.06)",
            borderRadius: 14,
            padding: 14,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "rgba(251,191,36,0.12)",
          }}
        >
          <Shield size={16} color="#F59E0B" style={{ marginRight: 10 }} />
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, flex: 1 }}>
            Seu pagamento e processado com seguranca. O entregador so podera iniciar apos a confirmacao.
          </Text>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 8,
        }}
      >
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={confirming}
          activeOpacity={0.85}
          style={{
            height: 56,
            borderRadius: 18,
            backgroundColor: confirming ? "rgba(2,222,149,0.5)" : "#02de95",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {confirming ? (
            <ActivityIndicator color="#091A2F" />
          ) : (
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase" }}>
              Confirmar Pagamento
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
