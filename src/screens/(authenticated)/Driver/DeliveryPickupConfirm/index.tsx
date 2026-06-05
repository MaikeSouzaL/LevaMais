import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, StyleSheet, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CheckCircle, Package, Phone, MapPin, ChevronRight, Copy, Hash } from "lucide-react-native";

import { MotiView } from "moti";

import { DriverStackParamList } from "../types/navigation";
import rideService from "@/services/ride.service";
import Toast from "react-native-toast-message";

type DeliveryPickupConfirmRouteProp = RouteProp<DriverStackParamList, "DeliveryPickupConfirm">;

export default function DeliveryPickupConfirm() {
  const navigation = useNavigation<NativeStackNavigationProp<DriverStackParamList>>();
  const route = useRoute<DeliveryPickupConfirmRouteProp>();
  const { rideId } = route.params;

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [pinCopied, setPinCopied] = useState(false);

  useEffect(() => {
    const loadRide = async () => {
      try {
        const data = await rideService.getById(rideId);
        setRide(data);
      } catch {
        Toast.show({ type: "error", text1: "Erro ao carregar entrega" });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadRide();
  }, [rideId]);

  const hasPin = Boolean(ride?.details?.pickupPin);
  const canConfirm = !uploading;

  const copyPin = async () => {
    if (!ride?.details?.pickupPin) return;
    try {
      Clipboard.setString(String(ride.details.pickupPin));
      setPinCopied(true);
      Toast.show({ type: "success", text1: "PIN copiado!" });
      setTimeout(() => setPinCopied(false), 2000);
    } catch {}
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setUploading(true);
    try {
      // Valida PIN via backend (envia automaticamente, motorista já viu o PIN)
      if (ride?.details?.pickupPin) {
        const pinResult = await rideService.validatePin(rideId, "pickup", ride.details.pickupPin);
        if (!pinResult?.valid) {
          Toast.show({ type: "error", text1: "Erro ao validar PIN" });
          setUploading(false);
          return;
        }
      }

      // Avanca para in_progress
      await rideService.updateStatus(rideId, "in_progress");

      Toast.show({ type: "success", text1: "Coleta confirmada!" });

      // Volta pra tela do mapa (DriverRide) — motorista verá rota até o destino + botão "CHEGUEI NO DESTINO"
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao confirmar coleta:", error);
      Toast.show({ type: "error", text1: "Erro ao confirmar coleta" });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#02de95" />
      </SafeAreaView>
    );
  }

  if (confirmed) {
    return (
      <SafeAreaView style={s.container}>
        <MotiView
          from={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 12 }}
          style={{ alignItems: "center" }}
        >
          <View style={s.successCircle}>
            <CheckCircle size={48} color="#02de95" />
          </View>
          <Text style={s.successTitle}>Coleta Confirmada!</Text>
          <Text style={s.successSub}>Redirecionando para a entrega...</Text>
        </MotiView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header */}
        <View style={s.header}>
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400 }}
          >
            <Text style={s.headerTitle}>Confirmação de Coleta</Text>
            <Text style={s.headerSub}>Verifique os dados e retire o pacote</Text>
          </MotiView>
        </View>

        {/* PIN de Coleta — Hero Card */}
        {hasPin && (
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14, delay: 100 }}
            style={s.pinCard}
          >
            {/* Glow border animation */}
            <MotiView
              animate={{
                borderColor: ["rgba(2, 222, 149, 0.3)", "rgba(2, 222, 149, 0.7)", "rgba(2, 222, 149, 0.3)"],
              }}
              transition={{ type: "timing", duration: 2500, loop: true }}
              style={s.pinCardInner}
            >
              <View style={s.pinLabelRow}>
                <Hash size={14} color="#02de95" />
                <Text style={s.pinLabel}>CÓDIGO DO PEDIDO</Text>
              </View>

              <Text style={s.pinValue}>{ride.details.pickupPin}</Text>

              <TouchableOpacity onPress={copyPin} activeOpacity={0.7} style={s.copyBtn}>
                <Copy size={14} color={pinCopied ? "#02de95" : "rgba(255,255,255,0.5)"} />
                <Text style={[s.copyText, pinCopied && { color: "#02de95" }]}>
                  {pinCopied ? "Copiado!" : "Copiar"}
                </Text>
              </TouchableOpacity>
            </MotiView>

            <View style={s.pinHintContainer}>
              <Text style={s.pinHint}>
                Diga no estabelecimento:{" "}
                <Text style={s.pinHintBold}>"Vim buscar o pedido {ride.details.pickupPin}"</Text>
              </Text>
            </View>
          </MotiView>
        )}

        {/* Remetente Info */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          style={s.senderCard}
        >
          <Text style={s.sectionLabel}>REMETENTE</Text>

          <View style={s.infoRow}>
            <View style={s.iconBubble}>
              <MapPin size={16} color="#02de95" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Endereço</Text>
              <Text style={s.infoValue}>{ride?.pickup?.address}</Text>
            </View>
          </View>

          {ride?.dropoff?.address && (
            <View style={s.infoRow}>
              <View style={[s.iconBubble, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <MapPin size={16} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Destino</Text>
                <Text style={s.infoValue}>{ride.dropoff.address}</Text>
              </View>
            </View>
          )}

          {ride?.details?.recipientName && (
            <View style={s.infoRow}>
              <View style={s.iconBubble}>
                <Package size={16} color="#02de95" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Contato</Text>
                <Text style={s.infoValue}>{ride.details.recipientName}</Text>
              </View>
            </View>
          )}

          {ride?.details?.recipientPhone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${ride.details.recipientPhone}`)}
              activeOpacity={0.7}
              style={s.phoneRow}
            >
              <View style={[s.iconBubble, { backgroundColor: "rgba(59, 130, 246, 0.1)" }]}>
                <Phone size={16} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.infoLabel}>Telefone</Text>
                <Text style={[s.infoValue, { color: "#3B82F6" }]}>{ride.details.recipientPhone}</Text>
              </View>
              <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          )}
        </MotiView>
      </ScrollView>

      {/* CTA Button */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 14, delay: 350 }}
        style={s.ctaContainer}
      >
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!canConfirm}
          activeOpacity={0.9}
          style={[s.ctaButton, !canConfirm && { opacity: 0.5 }]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#091A2F" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={s.ctaText}>Próximo</Text>
              <ChevronRight size={20} color="#091A2F" style={{ marginLeft: 4 }} />
            </View>
          )}
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#091A2F",
    alignItems: "center",
    justifyContent: "center",
  },

  // Success state
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(2, 222, 149, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(2, 222, 149, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  successTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },
  successSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },

  // PIN Card
  pinCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  pinCardInner: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(2, 222, 149, 0.4)",
    backgroundColor: "rgba(2, 222, 149, 0.06)",
    padding: 24,
    alignItems: "center",
  },
  pinLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  pinLabel: {
    color: "#02de95",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
  },
  pinValue: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 16,
    marginBottom: 16,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  copyText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
  },
  pinHintContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  pinHint: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
  pinHintBold: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "800",
    fontStyle: "italic",
  },

  // Sender Card
  senderCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 20,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoValue: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 19,
  },

  // CTA
  ctaContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    backgroundColor: "#091A2F",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  ctaButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#091A2F",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
