import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { ArrowLeft, Banknote, QrCode, CreditCard, CheckCircle, Shield, Clock, AlertTriangle, User } from "lucide-react-native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";

type PaymentMethod = "cash" | "pix" | "card";

const METHODS: { id: PaymentMethod; label: string; icon: any; color: string }[] = [
  { id: "pix", label: "Pix", icon: QrCode, color: "#32BCAD" },
  { id: "cash", label: "Dinheiro", icon: Banknote, color: "#02de95" },
  { id: "card", label: "Cartão", icon: CreditCard, color: "#3b82f6" },
];

const TIMER_SECONDS = 5 * 60; // 5 minutos

function formatTimer(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function DeliveryPaymentConfirmScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = String(route.params?.rideId || "");
  const insets = useSafeAreaInsets();

  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [rideData, setRideData] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [expired, setExpired] = useState(false);
  const didCancelSelectionRef = useRef(false);
  const timerRef = useRef<any>(null);

  const loadRide = useCallback(async () => {
    if (!rideId) return;
    try {
      const ride = await rideService.getById(rideId);
      if (ride) {
        setRideData(ride);
        // Calcular tempo restante com base no updatedAt da ride
        if (ride.updatedAt) {
          const elapsed = Math.floor((Date.now() - new Date(ride.updatedAt).getTime()) / 1000);
          const remaining = Math.max(0, TIMER_SECONDS - elapsed);
          setSecondsLeft(remaining);
          if (remaining === 0) setExpired(true);
        }
      }
    } catch {}
    setLoading(false);
  }, [rideId]);

  const expireSelection = useCallback(async () => {
    if (!rideId || didCancelSelectionRef.current) return;
    didCancelSelectionRef.current = true;
    try {
      await rideService.cancelPaymentSelection(rideId);
    } catch {}
  }, [rideId]);

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  // Timer regressivo
  useEffect(() => {
    if (loading || expired) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setExpired(true);
          expireSelection().catch(() => {});
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, expired, expireSelection]);

  const selectedDriver = rideData?.negotiation?.offers?.find(
    (o: any) => String(o.driverId?._id || o.driverId) === String(rideData?.negotiation?.selectedDriverId)
  );

  const driverName =
    typeof selectedDriver?.driverId === "object"
      ? selectedDriver.driverId?.name || "Entregador"
      : "Entregador";

  const driverRating =
    typeof selectedDriver?.driverId === "object"
      ? selectedDriver.driverId?.averageRating || null
      : null;

  const agreedPrice = rideData?.negotiation?.finalAgreedPrice || rideData?.pricing?.total || 0;

  const handleConfirm = async () => {
    if (confirming || expired) return;
    setConfirming(true);
    try {
      await rideService.confirmNegotiationPayment(rideId, { method });
      clearInterval(timerRef.current);
      Toast.show({ type: "success", text1: "Pagamento confirmado!", text2: "O entregador foi notificado e já está a caminho." });
      navigation.replace("DeliveryTracking", { rideId });
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

  const handleExpiredBack = () => {
    navigation.navigate("Home");
  };

  // Cor e urgência do timer
  const timerColor = secondsLeft > 120 ? "#02de95" : secondsLeft > 60 ? "#fbbf24" : "#ef4444";
  const timerProgress = secondsLeft / TIMER_SECONDS;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#091A2F", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#02de95" size="large" />
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 14, fontWeight: "600" }}>
          Carregando dados...
        </Text>
      </View>
    );
  }

  if (expired) {
    return (
      <View style={{ flex: 1, backgroundColor: "#091A2F", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: "rgba(239,68,68,0.12)",
            borderWidth: 1.5, borderColor: "rgba(239,68,68,0.35)",
            alignItems: "center", justifyContent: "center", marginBottom: 28
          }}
        >
          <AlertTriangle size={40} color="#ef4444" />
        </MotiView>
        <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 12 }}>
          Tempo Expirado
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, textAlign: "center", lineHeight: 22, marginBottom: 36 }}>
          O tempo para confirmar o pagamento expirou. O entregador foi liberado e a solicitação foi cancelada automaticamente.
        </Text>
        <TouchableOpacity
          onPress={handleExpiredBack}
          activeOpacity={0.85}
          style={{
            height: 56, borderRadius: 18, backgroundColor: "#02de95",
            alignItems: "center", justifyContent: "center", width: "100%"
          }}
        >
          <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase" }}>
            Fazer Nova Solicitação
          </Text>
        </TouchableOpacity>
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
            width: 40, height: 40, borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center", justifyContent: "center", marginRight: 14,
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            Confirmar Pagamento
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            Confirme antes que o tempo expire
          </Text>
        </View>

        {/* Timer Badge no Header */}
        <MotiView
          animate={{ borderColor: timerColor, backgroundColor: timerColor + "18" }}
          style={{
            borderRadius: 12, borderWidth: 1.5,
            paddingHorizontal: 10, paddingVertical: 6,
            flexDirection: "row", alignItems: "center", gap: 5,
          }}
        >
          <Clock size={13} color={timerColor} />
          <Text style={{ color: timerColor, fontSize: 15, fontWeight: "900", letterSpacing: 0.5 }}>
            {formatTimer(secondsLeft)}
          </Text>
        </MotiView>
      </View>

      {/* Barra de progresso do timer */}
      <View style={{ height: 3, backgroundColor: "rgba(255,255,255,0.06)" }}>
        <MotiView
          animate={{ width: `${timerProgress * 100}%`, backgroundColor: timerColor } as any}
          transition={{ type: "timing", duration: 900 }}
          style={{ height: "100%", borderRadius: 2 }}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Aviso urgência quando timer está crítico */}
        <AnimatePresence>
          {secondsLeft <= 60 && (
            <MotiView
              from={{ opacity: 0, translateY: -8 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -8 }}
              style={{
                flexDirection: "row", alignItems: "center",
                backgroundColor: "rgba(239,68,68,0.1)",
                borderRadius: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
                padding: 12, marginBottom: 16, gap: 10,
              }}
            >
              <AlertTriangle size={16} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "700", flex: 1 }}>
                Atenção! Menos de 1 minuto para confirmar o pagamento.
              </Text>
            </MotiView>
          )}
        </AnimatePresence>

        {/* Driver + Price Card */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 24, padding: 24,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 16,
          }}
        >
          {/* Motorista selecionado */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <View
              style={{
                width: 54, height: 54, borderRadius: 27,
                backgroundColor: "rgba(2,222,149,0.12)",
                borderWidth: 1.5, borderColor: "rgba(2,222,149,0.25)",
                alignItems: "center", justifyContent: "center", marginRight: 14,
              }}
            >
              <User size={26} color="#02de95" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>
                Entregador Selecionado
              </Text>
              <Text style={{ color: "#fff", fontSize: 17, fontWeight: "800" }}>
                {driverName}
              </Text>
              {driverRating && (
                <Text style={{ color: "#fbbf24", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                  ⭐ {Number(driverRating).toFixed(1)}
                </Text>
              )}
            </View>
            <CheckCircle size={22} color="#02de95" />
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

          {/* Valor acordado */}
          <View style={{ alignItems: "center", paddingVertical: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Valor Acordado
            </Text>
            <Text style={{ color: "#02de95", fontSize: 38, fontWeight: "900", letterSpacing: -1 }}>
              {formatBRL(agreedPrice)}
            </Text>
          </View>
        </MotiView>

        {/* Resumo da Rota */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 20, padding: 18,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 16,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
            Resumo da Rota
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>Coleta</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }} numberOfLines={2}>
                {rideData?.pickup?.address || "-"}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>Entrega</Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }} numberOfLines={2}>
                {rideData?.dropoff?.address || "-"}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Payment Method Selection */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 160 }}
          style={{ marginBottom: 16 }}
        >
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14, paddingHorizontal: 4 }}>
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
                      scale: isActive ? 1.03 : 1,
                    }}
                    style={{
                      height: 84, borderRadius: 20, borderWidth: 1.5,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {isActive && (
                      <View
                        style={{
                          position: "absolute", top: 8, right: 8,
                          width: 10, height: 10, borderRadius: 5,
                          backgroundColor: item.color,
                        }}
                      />
                    )}
                    <Icon size={24} color={isActive ? item.color : "rgba(255,255,255,0.35)"} />
                    <Text
                      style={{
                        color: isActive ? "#fff" : "rgba(255,255,255,0.35)",
                        fontWeight: "700", fontSize: 11, marginTop: 7,
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
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 240 }}
          style={{
            flexDirection: "row", alignItems: "center",
            backgroundColor: "rgba(251,191,36,0.06)",
            borderRadius: 14, padding: 14, marginBottom: 8,
            borderWidth: 1, borderColor: "rgba(251,191,36,0.12)",
          }}
        >
          <Shield size={16} color="#F59E0B" style={{ marginRight: 10 }} />
          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, flex: 1, lineHeight: 17 }}>
            Pagamento processado com segurança. O entregador só iniciará após a confirmação.
          </Text>
        </MotiView>

      </ScrollView>

      {/* Confirm Button */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={confirming}
          activeOpacity={0.85}
          style={{
            height: 58, borderRadius: 18,
            backgroundColor: confirming ? "rgba(2,222,149,0.5)" : "#02de95",
            alignItems: "center", justifyContent: "center",
            flexDirection: "row", gap: 10,
          }}
        >
          {confirming ? (
            <ActivityIndicator color="#091A2F" />
          ) : (
            <>
              <CheckCircle size={20} color="#091A2F" />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Confirmar Pagamento
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
