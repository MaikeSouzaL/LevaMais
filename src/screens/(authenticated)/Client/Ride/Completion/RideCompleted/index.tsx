import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import {
  CheckCircle,
  Star,
  MapPin,
  User,
  Package,
  Car,
  DollarSign,
  Home,
  MessageSquare,
  Heart,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../../types/navigation";
import { formatBRL } from "@/utils/mappers";

const QUICK_TAGS = [
  "Educado",
  "Chegou rápido",
  "Boa comunicação",
  "Dirigiu com cuidado",
  "Atendimento excelente",
  "Entrega cuidadosa",
];

const ratingLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Muito ruim", color: "#ef4444" },
  2: { label: "Ruim", color: "#f97316" },
  3: { label: "Regular", color: "#fbbf24" },
  4: { label: "Bom", color: "#34d399" },
  5: { label: "Excelente!", color: "#02de95" },
};

export default function RideCompletedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "RideCompleted">>();
  const route = useRoute<RouteProp<ClientStackParamList, "RideCompleted">>();
  const insets = useSafeAreaInsets();

  const rideId = route.params?.rideId;
  const total = route.params?.total;
  const pickupAddress = route.params?.pickupAddress;
  const dropoffAddress = route.params?.dropoffAddress;
  const driverName = route.params?.driverName;
  const driverId = route.params?.driverId;
  const driverRatingParam = route.params?.driverRating;
  const serviceType = route.params?.serviceType;
  const isDelivery = serviceType === "delivery" || serviceType === "frete";

  const existingRating = route.params?.existingRating;
  const hasExistingRating = Boolean(existingRating?.stars);

  const [rating, setRating] = useState(existingRating?.stars || 0);
  const [currentDriverRating, setCurrentDriverRating] = useState(driverRatingParam || null);
  const [comment, setComment] = useState(existingRating?.comment || "");
  const [sendingRating, setSendingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(hasExistingRating);

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [sendingTip, setSendingTip] = useState(false);

  const canSubmitRating = useMemo(
    () => Boolean(rideId && rating >= 1 && rating <= 5),
    [rideId, rating],
  );

  const toggleTag = (tag: string) => {
    const tags = comment.split(";").map((t) => t.trim()).filter(Boolean);
    const exists = tags.includes(tag);
    const next = exists ? tags.filter((t) => t !== tag) : [...tags, tag];
    setComment(next.join("; "));
  };

  const hasTag = (tag: string) =>
    comment.split(";").map((t) => t.trim()).filter(Boolean).includes(tag);

  const handleSubmitRating = async () => {
    if (!canSubmitRating || !rideId) return;
    setSendingRating(true);
    try {
      await rideService.rateClientToDriver(rideId, {
        stars: rating,
        comment: comment.trim() || undefined,
      });
      setRatingDone(true);
      Toast.show({ type: "success", text1: "Avaliação enviada!", text2: "Obrigado pelo seu feedback." });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setSendingRating(false);
    }
  };

  const handleQuickTip = async (amount: number) => {
    if (!rideId || sendingTip || selectedTip !== null) return;
    setSendingTip(true);
    try {
      await rideService.addTip(rideId, amount);
      setSelectedTip(amount);
      Toast.show({
        type: "success",
        text1: "Gorjeta enviada! ❤️",
        text2: `Você enviou R$ ${amount.toFixed(2)} ao motorista. Obrigado!`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar gorjeta",
        text2: err?.message || "Tente novamente",
      });
    } finally {
      setSendingTip(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: insets.top + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero de conclusão */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 14, stiffness: 120 }}
          style={{ alignItems: "center", paddingHorizontal: 24, paddingBottom: 32 }}
        >
          <View
            style={{
              width: 100, height: 100, borderRadius: 50,
              backgroundColor: "rgba(2,222,149,0.1)",
              borderWidth: 2, borderColor: "rgba(2,222,149,0.35)",
              alignItems: "center", justifyContent: "center",
              marginBottom: 22,
            }}
          >
            {isDelivery ? (
              <Package size={46} color="#02de95" />
            ) : (
              <Car size={46} color="#02de95" />
            )}
          </View>

          <Text style={{ color: "#02de95", fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
            {isDelivery ? "Entrega Concluída" : "Corrida Concluída"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", textAlign: "center", letterSpacing: -0.5 }}>
            Tudo certo! 🎉
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 21 }}>
            Seu pedido foi concluído e registrado no histórico.
          </Text>
        </MotiView>

        {/* Card resumo */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150, type: "timing", duration: 400 }}
          style={{
            marginHorizontal: 20, borderRadius: 24, overflow: "hidden",
            backgroundColor: "#11253E", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
            marginBottom: 16,
          }}
        >
          {/* Motorista */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
            <View
              style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: "rgba(255,255,255,0.07)",
                alignItems: "center", justifyContent: "center", marginRight: 14,
              }}
            >
              <User size={22} color="#02de95" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 }}>
                {isDelivery ? "Entregador" : "Motorista"}
              </Text>
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", marginTop: 2 }}>
                {driverName || "Leva Mais"}
              </Text>
              {currentDriverRating && (currentDriverRating.totalRatings ?? 0) > 0 && (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 }}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text style={{ color: "#fbbf24", fontSize: 12, fontWeight: "700" }}>
                    {(currentDriverRating.averageStars ?? 0).toFixed(1)}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                    ({currentDriverRating.totalRatings ?? 0} {(currentDriverRating.totalRatings ?? 0) === 1 ? "avalia??o" : "avalia??es"})
                  </Text>
                </View>
              )}
            </View>
            <CheckCircle size={20} color="#02de95" />
          </View>

          {/* Rota */}
          {(pickupAddress || dropoffAddress) && (
            <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
              {pickupAddress && (
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginTop: 4 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>Coleta</Text>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }} numberOfLines={2}>{pickupAddress}</Text>
                  </View>
                </View>
              )}
              {dropoffAddress && (
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginTop: 4 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 2 }}>Entrega</Text>
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }} numberOfLines={2}>{dropoffAddress}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Total pago */}
          {total !== undefined && total !== null && (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <DollarSign size={16} color="rgba(255,255,255,0.4)" />
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" }}>Total pago</Text>
              </View>
              <Text style={{ color: "#02de95", fontSize: 22, fontWeight: "900" }}>
                {formatBRL(Number(total))}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Gorjeta */}
        {selectedTip === null && (
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 250, type: "timing", duration: 400 }}
            style={{
              marginHorizontal: 20, borderRadius: 20, padding: 20,
              backgroundColor: "#11253E", borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)", marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 }}>
              <Heart size={16} color="#f43f5e" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>Enviar Gorjeta</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
              Reconheça um serviço excelente com uma gorjeta para o {isDelivery ? "entregador" : "motorista"}.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[2, 5, 10].map((val) => (
                <TouchableOpacity
                  key={val}
                  onPress={() => handleQuickTip(val)}
                  disabled={sendingTip}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, height: 52, borderRadius: 14,
                    alignItems: "center", justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: "rgba(244,63,94,0.4)",
                    backgroundColor: "rgba(244,63,94,0.08)",
                  }}
                >
                  {sendingTip ? (
                    <ActivityIndicator size="small" color="#f43f5e" />
                  ) : (
                    <>
                      <Text style={{ color: "#f43f5e", fontSize: 15, fontWeight: "900" }}>R$ {val}</Text>
                      <Text style={{ color: "rgba(244,63,94,0.6)", fontSize: 10, fontWeight: "600" }}>gorjeta</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </MotiView>
        )}

        {selectedTip !== null && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              marginHorizontal: 20, borderRadius: 20, padding: 18,
              backgroundColor: "rgba(244,63,94,0.08)", borderWidth: 1,
              borderColor: "rgba(244,63,94,0.25)", marginBottom: 16,
              flexDirection: "row", alignItems: "center", gap: 12,
            }}
          >
            <Heart size={20} color="#f43f5e" fill="#f43f5e" />
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", flex: 1 }}>
              Gorjeta de R$ {selectedTip},00 enviada! ❤️
            </Text>
          </MotiView>
        )}

        {/* Avaliação */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 350, type: "timing", duration: 400 }}
          style={{
            marginHorizontal: 20, borderRadius: 20, padding: 20,
            backgroundColor: "#11253E", borderWidth: 1,
            borderColor: "rgba(255,255,255,0.06)", marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 8 }}>
            <Star size={16} color="#fbbf24" fill={rating >= 1 ? "#fbbf24" : "none"} />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>
              Avaliar {isDelivery ? "Entregador" : "Motorista"}
            </Text>
          </View>

          {ratingDone ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <CheckCircle size={32} color="#02de95" />
              <Text style={{ color: "#02de95", fontSize: 15, fontWeight: "700", marginTop: 10 }}>Avaliação enviada!</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 4 }}>Obrigado pelo seu feedback.</Text>
            </View>
          ) : (
            <>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 20, lineHeight: 18 }}>
                Como foi sua experiência? Sua avaliação ajuda a melhorar o serviço.
              </Text>

              {/* Estrelas */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                    <MotiView
                      animate={{ scale: rating >= star ? 1.15 : 1 }}
                      transition={{ type: "spring", damping: 10 }}
                    >
                      <Star
                        size={38}
                        color="#fbbf24"
                        fill={rating >= star ? "#fbbf24" : "none"}
                        strokeWidth={1.5}
                      />
                    </MotiView>
                  </TouchableOpacity>
                ))}
              </View>

              {rating > 0 && (
                <Text style={{
                  textAlign: "center", fontSize: 13, fontWeight: "700", marginBottom: 20,
                  color: ratingLabels[rating]?.color || "#02de95"
                }}>
                  {ratingLabels[rating]?.label}
                </Text>
              )}

              {/* Tags rápidas */}
              {rating >= 4 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {QUICK_TAGS.map((tag) => {
                    const active = hasTag(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        activeOpacity={0.8}
                        style={{
                          borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
                          borderWidth: 1.5,
                          borderColor: active ? "#02de95" : "rgba(255,255,255,0.12)",
                          backgroundColor: active ? "rgba(2,222,149,0.12)" : "rgba(255,255,255,0.03)",
                        }}
                      >
                        <Text style={{
                          color: active ? "#02de95" : "rgba(255,255,255,0.55)",
                          fontSize: 12, fontWeight: "700"
                        }}>
                          {active ? "✓ " : ""}{tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Comentário */}
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder="Deixe um comentário (opcional)..."
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: "rgba(255,255,255,0.04)",
                  borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                  borderRadius: 14, padding: 14,
                  color: "#fff", fontSize: 13, textAlignVertical: "top",
                  minHeight: 80, marginBottom: 16,
                }}
              />

              {/* Botão de avaliação */}
              {canSubmitRating && (
                <TouchableOpacity
                  onPress={handleSubmitRating}
                  disabled={sendingRating}
                  activeOpacity={0.85}
                  style={{
                    height: 52, borderRadius: 16,
                    backgroundColor: sendingRating ? "rgba(2,222,149,0.5)" : "#02de95",
                    alignItems: "center", justifyContent: "center",
                    flexDirection: "row", gap: 8,
                  }}
                >
                  {sendingRating ? (
                    <ActivityIndicator color="#091A2F" />
                  ) : (
                    <>
                      <Star size={18} color="#091A2F" fill="#091A2F" />
                      <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                        Enviar Avaliação
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </MotiView>

      </ScrollView>

      {/* Botão fixo de voltar ao início */}
      <View
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          paddingTop: 12,
          backgroundColor: "rgba(9,26,47,0.97)",
          borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.85}
          style={{
            height: 56, borderRadius: 18,
            borderWidth: 1.5, borderColor: "rgba(2,222,149,0.3)",
            backgroundColor: "rgba(2,222,149,0.08)",
            alignItems: "center", justifyContent: "center",
            flexDirection: "row", gap: 10,
          }}
        >
          <Home size={20} color="#02de95" />
          <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Voltar ao Início
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
