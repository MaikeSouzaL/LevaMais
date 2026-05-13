import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import ActionButton from "../../../components/ui/ActionButton";
import rideService from "../../../services/ride.service";

type Params = {
  DriverRateClient: {
    rideId: string;
  };
};

const QUICK_TAGS = [
  "Educado",
  "Amigável",
  "Pontual",
  "Excelente passageiro",
  "Fácil comunicação",
];

const RATING_LABELS: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

export default function DriverRateClientScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRateClient">>();
  const rideId = route.params?.rideId;

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [loadingRide, setLoadingRide] = useState(false);

  const canSubmit = useMemo(() => {
    return !!rideId && stars >= 1 && stars <= 5;
  }, [rideId, stars]);

  useEffect(() => {
    if (!rideId) return;
    setLoadingRide(true);
    rideService.getById(rideId)
      .then((res) => {
        setRide(res);
      })
      .catch((err) => {
              })
      .finally(() => {
        setLoadingRide(false);
      });
  }, [rideId]);

  const toggleTag = (tag: string) => {
    const tags = comment
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean);

    const exists = tags.includes(tag);
    const next = exists ? tags.filter((t) => t !== tag) : [...tags, tag];
    setComment(next.join("; "));
  };

  const hasTag = (tag: string) =>
    comment
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean)
      .includes(tag);

  async function submit() {
    if (!rideId) return;
    if (!canSubmit) return;

    setLoading(true);
    try {
      await rideService.rateDriverToClient(rideId, {
        stars,
        comment: comment?.trim() || undefined,
      });

      Toast.show({ type: "success", text1: "Avaliação enviada" });
      try {
        (navigation as any).navigate("DriverHome");
      } catch {
        navigation.goBack();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <View className="px-4 py-3 border-b border-white/10">
        <Text className="text-white font-black text-lg">Corrida Concluída</Text>
        <Text className="text-white/65 mt-1">Confira seus ganhos e avalie seu cliente.</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {loadingRide ? (
          <View className="py-5 items-center">
            <ActivityIndicator size="small" color="#02de95" />
          </View>
        ) : ride ? (
          <View className="bg-[rgba(2,222,149,0.06)] rounded-3xl border border-[rgba(2,222,149,0.18)] p-4 mb-5 items-center">
            <Text className="text-white/50 text-xs font-black tracking-wider">VOCÊ FATUROU NESSA CORRIDA</Text>
            <Text className="text-[#02de95] text-4xl font-black mt-1">R$ {Number(ride.pricing?.driverValue ?? ride.pricing?.total ?? 0).toFixed(2)}</Text>
            
            <View className="w-full h-px bg-white/10 my-3.5" />
            
            <View className="flex-row w-full justify-between">
              <View>
                <Text className="text-white/40 text-xs">Distância</Text>
                <Text className="text-white text-sm font-bold mt-0.5">{ride.distance?.text || "—"}</Text>
              </View>
              <View className="items-center">
                <Text className="text-white/40 text-xs">Duração</Text>
                <Text className="text-white text-sm font-bold mt-0.5">{ride.duration?.text || "—"}</Text>
              </View>
              <View className="items-end">
                <Text className="text-white/40 text-xs">Total Pago</Text>
                <Text className="text-white text-sm font-bold mt-0.5">R$ {Number(ride.pricing?.total ?? 0).toFixed(2)}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Avaliação do Cliente */}
        <View className="bg-white/3 border border-white/6 rounded-2xl p-4 mb-4">
          <Text className="text-white text-base font-bold mb-3">Como foi sua experiência com o cliente?</Text>
          
          <View className="flex-row justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setStars(star)}>
                <MaterialIcons
                  name={star <= stars ? "star" : "star-border"}
                  size={46}
                  color="#02de95"
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-white/50 text-sm text-center mt-2.5 font-semibold">
            {stars > 0 ? RATING_LABELS[stars] : "Toque nas estrelas para avaliar"}
          </Text>
        </View>

        {/* Destaques */}
        <View className="bg-white/3 border border-white/6 rounded-2xl p-4 mb-4">
          <Text className="text-white text-base font-bold mb-3">Destaques do Cliente (opcional)</Text>
          
          <View className="flex-row flex-wrap gap-2 mb-3.5">
            {QUICK_TAGS.map((tag) => {
              const selected = hasTag(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  className={`border rounded-full px-3 py-1.5 ${selected ? 'border-[#02de95] bg-[rgba(2,222,149,0.15)]' : 'border-white/10 bg-white/2'}`}
                  activeOpacity={0.8}
                >
                  <Text className={`text-xs ${selected ? 'text-[#02de95] font-bold' : 'text-white/70'}`}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Escreva um comentário ou adicione tags acima..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            multiline
            className="min-h-[100px] bg-white/2 border border-white/6 rounded-xl p-3 text-white text-sm"
            style={{textAlignVertical: 'top'}}
          />
        </View>
      </ScrollView>

      <View className="px-4 py-4 border-t border-white/5 bg-[rgba(9,26,47,0.9)]">
        <ActionButton
          title={loading ? "Enviando..." : "Enviar avaliação"}
          variant="primary"
          onPress={submit}
          disabled={!canSubmit || loading}
        />
        <View className="h-2.5" />
        <ActionButton
          title="Pular"
          variant="secondary"
          onPress={() => {
            try {
              (navigation as any).navigate("DriverHome");
            } catch {
              navigation.goBack();
            }
          }}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}
